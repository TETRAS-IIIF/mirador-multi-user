import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  Annotation,
  AnnotationOrigin,
  AnnotationStatus,
} from './entities/annotation.entity';
import {
  AnnotationBatch,
  AnnotationBatchStatus,
} from './entities/annotation-batch.entity';
import { AnnotationPage } from '../annotation-page/entities/annotation-page.entity';
import {
  buildAnnotationPage,
  pageItems,
  stripMmuFields,
  toClientAnnotation,
  withAcceptProvenance,
} from './annotation.utils';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import {
  AnnotationFilterDto,
  CreateAnnotationDto,
  UpdateAnnotationDto,
} from './dto/annotation.dto';
import {
  CreateAnnotationBatchDto,
  UpdateAnnotationBatchDto,
} from './dto/annotation-batch.dto';

export interface RequestUser {
  id: number;
  name?: string;
}

/** Who is calling: the user, and whether the call comes from the assistant. */
export interface Caller extends RequestUser {
  assistant?: boolean;
}

const emptyPage = (annotationPageId: string) => ({
  id: annotationPageId,
  type: 'AnnotationPage',
  items: [],
});

@Injectable()
export class AnnotationService implements OnApplicationBootstrap {
  private readonly logger = new CustomLogger();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Annotation)
    private readonly annotations: Repository<Annotation>,
    @InjectRepository(AnnotationPage)
    private readonly pages: Repository<AnnotationPage>,
    @InjectRepository(AnnotationBatch)
    private readonly batches: Repository<AnnotationBatch>,
  ) {}

  // ─── Legacy page JSON → rows ───────────────────────────────────────────────

  /** Splits pages saved by older versions into rows once the tables exist. */
  async onApplicationBootstrap() {
    try {
      const migrated = await this.migrateLegacyPages();
      if (migrated > 0) {
        this.logger.log(`Split ${migrated} annotation page(s) into rows`);
      }
    } catch (error) {
      // Expected on the first start, before `just migration run`.
      this.logger.warn(
        `Annotation rows not migrated yet (${error.message}). Run the migrations; pages are also split on first access.`,
      );
    }
  }

  /** Splits every page not yet stored as rows. Idempotent. */
  async migrateLegacyPages(projectId?: number): Promise<number> {
    const pending = await this.pages.find({
      select: ['id', 'projectId', 'annotationPageId'],
      where: {
        migratedToRows: false,
        ...(projectId !== undefined ? { projectId } : {}),
      },
    });
    for (const page of pending) {
      await this.withPage(page.projectId, page.annotationPageId, async () => {
        return undefined;
      });
    }
    return pending.length;
  }

  private async splitLegacyPage(m: EntityManager, page: AnnotationPage) {
    const skipped: string[] = [];
    for (const item of pageItems(page.content)) {
      if (!item || typeof item !== 'object') continue;
      const annotationId = item.id
        ? String(item.id)
        : `${page.annotationPageId}/${uuidv4()}`;
      const result = await m
        .createQueryBuilder()
        .insert()
        .into(Annotation)
        .values({
          annotationId,
          projectId: page.projectId,
          annotationPageId: page.annotationPageId,
          content: { ...stripMmuFields(item), id: annotationId },
          status: AnnotationStatus.PUBLISHED,
          origin: AnnotationOrigin.HUMAN,
        })
        .orIgnore()
        .execute();
      const affected =
        result.raw?.affectedRows ?? result.raw?.[0]?.affectedRows;
      if (affected === 0) skipped.push(annotationId);
    }
    await m.update(AnnotationPage, page.id, { migratedToRows: true });
    page.migratedToRows = true;
    if (skipped.length) {
      this.logger.warn(
        `Page ${page.annotationPageId} (project ${page.projectId}): duplicate annotation ids kept once: ${skipped.join(', ')}`,
      );
    }
  }

  // ─── Page lock and cache ───────────────────────────────────────────────────

  /**
   * Runs `fn` in a transaction holding a write lock on the page row, so two
   * writers on the same canvas are serialized instead of overwriting each
   * other. Splits a legacy page first, and rewrites the page JSON cache
   * (published annotations only) at the end.
   */
  async withPage<T>(
    projectId: number,
    annotationPageId: string,
    fn: (m: EntityManager) => Promise<T>,
  ): Promise<T> {
    // Created outside the transaction: concurrent INSERT IGNOREs of the same
    // key inside transactions deadlock on MariaDB.
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(AnnotationPage)
      .values({
        projectId,
        annotationPageId,
        content: emptyPage(annotationPageId) as any,
        migratedToRows: true,
      })
      .orIgnore()
      .execute();
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.dataSource.transaction((m) =>
          this.runLocked(m, projectId, annotationPageId, fn),
        );
      } catch (error) {
        const deadlock =
          error?.code === 'ER_LOCK_DEADLOCK' ||
          error?.driverError?.code === 'ER_LOCK_DEADLOCK';
        if (!deadlock || attempt >= 3) throw error;
      }
    }
  }

  private async runLocked<T>(
    m: EntityManager,
    projectId: number,
    annotationPageId: string,
    fn: (m: EntityManager) => Promise<T>,
  ): Promise<T> {
    const page = await m
      .getRepository(AnnotationPage)
      .createQueryBuilder('page')
      .setLock('pessimistic_write')
      .where('page.projectId = :projectId', { projectId })
      .andWhere('page.annotationPageId = :annotationPageId', {
        annotationPageId,
      })
      .getOne();
    if (!page) {
      throw new NotFoundException(
        `Annotation page ${annotationPageId} vanished`,
      );
    }
    if (!page.migratedToRows) {
      await this.splitLegacyPage(m, page);
    }
    const result = await fn(m);
    const published = await m.find(Annotation, {
      where: {
        projectId,
        annotationPageId,
        status: AnnotationStatus.PUBLISHED,
      },
    });
    await m.update(AnnotationPage, page.id, {
      content: buildAnnotationPage(annotationPageId, published, {
        forExport: true,
      }) as any,
    });
    return result;
  }

  private async ensureProjectMigrated(projectId: number) {
    const pending = await this.pages.count({
      where: { projectId, migratedToRows: false },
    });
    if (pending > 0) await this.migrateLegacyPages(projectId);
  }

  // ─── Page-level API (kept for annotation-page routes) ─────────────────────

  /** Same shape as the former `find()`: [] or one AnnotationPage row. */
  async getPage(
    projectId: number,
    annotationPageId: string,
    includeDrafts = false,
  ) {
    let page = await this.pages.findOne({
      where: { projectId, annotationPageId },
    });
    if (!page) return [];
    if (!page.migratedToRows) {
      await this.withPage(projectId, annotationPageId, async () => undefined);
      page = await this.pages.findOne({ where: { id: page.id } });
    }
    const rows = await this.annotations.find({
      where: {
        projectId,
        annotationPageId,
        ...(includeDrafts ? {} : { status: AnnotationStatus.PUBLISHED }),
      },
    });
    return [
      {
        id: page.id,
        projectId,
        annotationPageId,
        content: buildAnnotationPage(annotationPageId, rows),
      },
    ];
  }

  /** All pages of a project, rebuilt from rows. */
  async getProjectPages(
    projectId: number,
    { includeDrafts = false, forExport = false } = {},
  ) {
    await this.ensureProjectMigrated(projectId);
    const pages = await this.pages.find({ where: { projectId } });
    const rows = await this.annotations.find({
      where: {
        projectId,
        ...(includeDrafts && !forExport
          ? {}
          : { status: AnnotationStatus.PUBLISHED }),
      },
    });
    const byPage = new Map<string, Annotation[]>();
    for (const row of rows) {
      const list = byPage.get(row.annotationPageId) ?? [];
      list.push(row);
      byPage.set(row.annotationPageId, list);
    }
    return pages.map((page) => ({
      id: page.id,
      projectId,
      annotationPageId: page.annotationPageId,
      content: buildAnnotationPage(
        page.annotationPageId,
        byPage.get(page.annotationPageId) ?? [],
        { forExport },
      ),
    }));
  }

  /**
   * Whole-page write from older clients. Annotations in the page are created
   * or updated, published ones missing from it are deleted. Drafts are never
   * deleted by this route.
   */
  async replacePage(
    projectId: number,
    annotationPageId: string,
    content: any,
    caller: Caller,
  ) {
    const movedFrom = new Set<string>();
    await this.withPage(projectId, annotationPageId, async (m) => {
      const onPage = await m.find(Annotation, {
        where: { projectId, annotationPageId },
      });
      const keep = new Set<string>();
      for (const item of pageItems(content)) {
        if (!item || typeof item !== 'object') continue;
        const annotationId = item.id
          ? String(item.id)
          : `${annotationPageId}/${uuidv4()}`;
        keep.add(annotationId);
        const next = { ...stripMmuFields(item), id: annotationId };
        const row =
          onPage.find((r) => r.annotationId === annotationId) ??
          (await m.findOne(Annotation, { where: { projectId, annotationId } }));
        if (!row) {
          await m.save(
            m.create(Annotation, {
              annotationId,
              projectId,
              annotationPageId,
              content: next,
              status: AnnotationStatus.PUBLISHED,
              origin: AnnotationOrigin.HUMAN,
              createdById: caller.id,
            }),
          );
          continue;
        }
        if (row.annotationPageId !== annotationPageId) {
          movedFrom.add(row.annotationPageId);
          row.annotationPageId = annotationPageId;
        }
        if (JSON.stringify(row.content) !== JSON.stringify(next)) {
          row.content = next;
          if (row.origin === AnnotationOrigin.AI) row.editedByHuman = true;
        }
        await m.save(row);
      }
      const stale = onPage.filter(
        (r) =>
          !keep.has(r.annotationId) && r.status === AnnotationStatus.PUBLISHED,
      );
      if (stale.length)
        await m.delete(
          Annotation,
          stale.map((r) => r.id),
        );
    });
    for (const other of movedFrom) {
      await this.withPage(projectId, other, async () => undefined);
    }
    return this.getPage(projectId, annotationPageId, true);
  }

  async deletePage(projectId: number, annotationPageId: string) {
    return this.dataSource.transaction(async (m) => {
      await m.delete(Annotation, { projectId, annotationPageId });
      return m.delete(AnnotationPage, { projectId, annotationPageId });
    });
  }

  // ─── One annotation at a time ─────────────────────────────────────────────

  private async findRow(projectId: number, annotationId: string) {
    const row = await this.annotations.findOne({
      where: { projectId, annotationId },
    });
    if (!row) {
      throw new NotFoundException(
        `Annotation ${annotationId} not found in project ${projectId}`,
      );
    }
    return row;
  }

  async getOne(projectId: number, annotationId: string) {
    await this.ensureProjectMigrated(projectId);
    return this.toSummary(await this.findRow(projectId, annotationId));
  }

  async create(dto: CreateAnnotationDto, caller: Caller) {
    const projectId = Number(dto.projectId);
    if (!dto.annotationPageId) {
      throw new BadRequestException('annotationPageId is required');
    }
    if (!dto.content || typeof dto.content !== 'object') {
      throw new BadRequestException('content must be a W3C annotation');
    }
    const content = stripMmuFields(dto.content);
    const annotationId = String(
      content.id ?? `${dto.annotationPageId}/${uuidv4()}`,
    );
    const origin =
      caller.assistant || dto.origin === AnnotationOrigin.AI
        ? AnnotationOrigin.AI
        : AnnotationOrigin.HUMAN;
    // Whatever the assistant writes is a draft: only a person publishes.
    const status =
      origin === AnnotationOrigin.AI
        ? AnnotationStatus.DRAFT
        : (dto.status ?? AnnotationStatus.PUBLISHED);

    let batchId: number | null = null;
    if (dto.batchId !== undefined && dto.batchId !== null) {
      const batch = await this.batches.findOne({
        where: { id: Number(dto.batchId) },
      });
      if (!batch || batch.projectId !== projectId) {
        throw new BadRequestException('Unknown batch for this project');
      }
      batchId = batch.id;
    }

    const row = await this.withPage(
      projectId,
      dto.annotationPageId,
      async (m) => {
        const existing = await m.findOne(Annotation, {
          where: { projectId, annotationId },
        });
        if (existing) {
          throw new ConflictException(
            `Annotation ${annotationId} already exists in project ${projectId}`,
          );
        }
        const saved = await m.save(
          m.create(Annotation, {
            annotationId,
            projectId,
            annotationPageId: dto.annotationPageId,
            content: { ...content, id: annotationId },
            status,
            origin,
            batchId,
            model: origin === AnnotationOrigin.AI ? (dto.model ?? null) : null,
            createdById: caller.id,
          }),
        );
        if (batchId !== null) {
          await m.increment(
            AnnotationBatch,
            { id: batchId },
            'proposedCount',
            1,
          );
        }
        return saved;
      },
    );
    return this.toSummary(row);
  }

  async update(
    projectId: number,
    annotationId: string,
    dto: UpdateAnnotationDto,
    caller: Caller,
  ) {
    const found = await this.findRow(projectId, annotationId);
    const row = await this.withPage(
      projectId,
      found.annotationPageId,
      async (m) => {
        const fresh = await m.findOne(Annotation, { where: { id: found.id } });
        if (!fresh)
          throw new NotFoundException(`Annotation ${annotationId} not found`);
        if (caller.assistant && fresh.status !== AnnotationStatus.DRAFT) {
          throw new ForbiddenException('The assistant can only change drafts');
        }
        if (dto.content !== undefined) {
          if (!dto.content || typeof dto.content !== 'object') {
            throw new BadRequestException('content must be a W3C annotation');
          }
          const next = {
            ...stripMmuFields(dto.content),
            id: fresh.annotationId,
          };
          if (JSON.stringify(next) !== JSON.stringify(fresh.content)) {
            fresh.content = next;
            if (!caller.assistant && fresh.origin === AnnotationOrigin.AI) {
              fresh.editedByHuman = true;
            }
          }
        }
        if (
          dto.status === AnnotationStatus.PUBLISHED &&
          fresh.status === AnnotationStatus.DRAFT
        ) {
          if (caller.assistant) {
            throw new ForbiddenException('Only a person can publish a draft');
          }
          this.applyAccept(fresh, caller);
        } else if (
          dto.status === AnnotationStatus.DRAFT &&
          fresh.status === AnnotationStatus.PUBLISHED
        ) {
          throw new BadRequestException(
            'A published annotation cannot go back to draft',
          );
        }
        return m.save(fresh);
      },
    );
    return this.toSummary(row);
  }

  async remove(projectId: number, annotationId: string, caller: Caller) {
    const found = await this.findRow(projectId, annotationId);
    if (caller.assistant && found.status !== AnnotationStatus.DRAFT) {
      throw new ForbiddenException('The assistant can only delete drafts');
    }
    await this.withPage(projectId, found.annotationPageId, (m) =>
      m.delete(Annotation, { id: found.id }),
    );
    return { deleted: 1 };
  }

  async accept(projectId: number, annotationId: string, caller: Caller) {
    if (caller.assistant) {
      throw new ForbiddenException('Only a person can publish a draft');
    }
    const found = await this.findRow(projectId, annotationId);
    const row = await this.withPage(
      projectId,
      found.annotationPageId,
      async (m) => {
        const fresh = await m.findOne(Annotation, { where: { id: found.id } });
        if (fresh.status === AnnotationStatus.DRAFT) {
          this.applyAccept(fresh, caller);
          await m.save(fresh);
        }
        return fresh;
      },
    );
    return this.toSummary(row);
  }

  private applyAccept(row: Annotation, caller: Caller) {
    row.status = AnnotationStatus.PUBLISHED;
    row.acceptedById = caller.id;
    if (row.origin === AnnotationOrigin.AI) {
      row.content = withAcceptProvenance(row.content, row.model, caller.name);
    }
  }

  // ─── Queries and bulk actions ─────────────────────────────────────────────

  private filterWhere(filter: AnnotationFilterDto) {
    return {
      projectId: Number(filter.projectId),
      ...(filter.annotationPageId
        ? { annotationPageId: filter.annotationPageId }
        : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.origin ? { origin: filter.origin } : {}),
      ...(filter.batchId !== undefined && filter.batchId !== null
        ? { batchId: Number(filter.batchId) }
        : {}),
    };
  }

  async list(filter: AnnotationFilterDto) {
    await this.ensureProjectMigrated(Number(filter.projectId));
    const rows = await this.annotations.find({
      where: this.filterWhere(filter),
      order: { id: 'ASC' },
    });
    return rows.map((row) => this.toSummary(row));
  }

  async count(filter: AnnotationFilterDto) {
    await this.ensureProjectMigrated(Number(filter.projectId));
    const count = await this.annotations.count({
      where: this.filterWhere(filter),
    });
    return { count };
  }

  /** Draft count per canvas page, for the window counters. */
  async countByPage(filter: AnnotationFilterDto) {
    await this.ensureProjectMigrated(Number(filter.projectId));
    const rows: { annotationPageId: string; count: string }[] =
      await this.annotations
        .createQueryBuilder('a')
        .select('a.annotationPageId', 'annotationPageId')
        .addSelect('COUNT(*)', 'count')
        .where(this.filterWhere(filter))
        .groupBy('a.annotationPageId')
        .getRawMany();
    return Object.fromEntries(
      rows.map((r) => [r.annotationPageId, Number(r.count)]),
    );
  }

  /** Runs `fn` on the matching rows, page by page, each under its lock. */
  private async forEachPage(
    rows: Annotation[],
    fn: (m: EntityManager, pageRows: Annotation[]) => Promise<void>,
  ) {
    const byPage = new Map<string, Annotation[]>();
    for (const row of rows) {
      const key = `${row.projectId}\u0000${row.annotationPageId}`;
      byPage.set(key, [...(byPage.get(key) ?? []), row]);
    }
    for (const pageRows of byPage.values()) {
      const { projectId, annotationPageId } = pageRows[0];
      await this.withPage(projectId, annotationPageId, async (m) => {
        // Re-read under the lock: rows may have changed since the query.
        const fresh = await m.find(Annotation, {
          where: { id: In(pageRows.map((r) => r.id)) },
        });
        if (fresh.length) await fn(m, fresh);
      });
    }
  }

  async bulkDelete(filter: AnnotationFilterDto, caller: Caller) {
    if (!filter.status && !filter.origin && filter.batchId === undefined) {
      throw new BadRequestException(
        'Bulk delete needs at least one of status, origin or batchId',
      );
    }
    const effective = caller.assistant
      ? { ...filter, status: AnnotationStatus.DRAFT }
      : filter;
    await this.ensureProjectMigrated(Number(filter.projectId));
    const rows = await this.annotations.find({
      where: this.filterWhere(effective),
    });
    let deleted = 0;
    await this.forEachPage(rows, async (m, pageRows) => {
      const ids = pageRows
        .filter((r) => !caller.assistant || r.status === AnnotationStatus.DRAFT)
        .map((r) => r.id);
      if (ids.length) {
        await m.delete(Annotation, ids);
        deleted += ids.length;
      }
    });
    return { deleted };
  }

  async bulkAccept(filter: AnnotationFilterDto, caller: Caller) {
    if (caller.assistant) {
      throw new ForbiddenException('Only a person can publish a draft');
    }
    await this.ensureProjectMigrated(Number(filter.projectId));
    const rows = await this.annotations.find({
      where: this.filterWhere({ ...filter, status: AnnotationStatus.DRAFT }),
    });
    let accepted = 0;
    await this.forEachPage(rows, async (m, pageRows) => {
      for (const row of pageRows) {
        if (row.status !== AnnotationStatus.DRAFT) continue;
        this.applyAccept(row, caller);
        await m.save(row);
        accepted += 1;
      }
    });
    return { accepted };
  }

  // ─── Batches ──────────────────────────────────────────────────────────────

  async createBatch(dto: CreateAnnotationBatchDto, caller: Caller) {
    const batch = this.batches.create({
      projectId: Number(dto.projectId),
      createdById: caller.id,
      kind: dto.kind,
      scope: dto.scope ?? null,
      model: dto.model,
      instructions: dto.instructions ?? null,
      status: AnnotationBatchStatus.RUNNING,
    });
    return this.batchSummary(await this.batches.save(batch));
  }

  async findBatch(id: number) {
    const batch = await this.batches.findOne({ where: { id: Number(id) } });
    if (!batch) throw new NotFoundException(`Batch ${id} not found`);
    return batch;
  }

  async getBatch(id: number) {
    return this.batchSummary(await this.findBatch(id));
  }

  async listBatches(projectId: number) {
    const batches = await this.batches.find({
      where: { projectId: Number(projectId) },
      order: { id: 'DESC' },
    });
    return Promise.all(batches.map((b) => this.batchSummary(b)));
  }

  async updateBatch(id: number, dto: UpdateAnnotationBatchDto) {
    const batch = await this.findBatch(id);
    if (dto.status !== undefined) {
      const allowed = [
        AnnotationBatchStatus.RUNNING,
        AnnotationBatchStatus.DONE,
        AnnotationBatchStatus.CANCELLED,
      ];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          'Use POST /annotation-batch/:id/revert to revert a batch',
        );
      }
      if (batch.status === AnnotationBatchStatus.REVERTED) {
        throw new BadRequestException('This batch was reverted');
      }
      batch.status = dto.status;
    }
    if (dto.inputTokens !== undefined)
      batch.inputTokens = Number(dto.inputTokens);
    if (dto.outputTokens !== undefined) {
      batch.outputTokens = Number(dto.outputTokens);
    }
    return this.batchSummary(await this.batches.save(batch));
  }

  async acceptBatch(id: number, caller: Caller) {
    const batch = await this.findBatch(id);
    const result = await this.bulkAccept(
      { projectId: batch.projectId, batchId: batch.id },
      caller,
    );
    return { ...result, batch: await this.getBatch(id) };
  }

  /**
   * Deletes what a batch wrote. Annotations a person edited are kept unless
   * `force` is set; `dryRun` only reports what would happen, so the client
   * can ask first.
   */
  async revertBatch(
    id: number,
    { force = false, dryRun = false }: { force?: boolean; dryRun?: boolean },
  ) {
    const batch = await this.findBatch(id);
    const rows = await this.annotations.find({ where: { batchId: batch.id } });
    const toDelete = rows.filter((r) => force || !r.editedByHuman);
    const kept = rows.length - toDelete.length;
    if (dryRun) {
      return {
        deleted: 0,
        wouldDelete: toDelete.length,
        keptHumanEdited: kept,
      };
    }
    let deleted = 0;
    await this.forEachPage(toDelete, async (m, pageRows) => {
      const ids = pageRows
        .filter((r) => r.batchId === batch.id && (force || !r.editedByHuman))
        .map((r) => r.id);
      if (ids.length) {
        await m.delete(Annotation, ids);
        deleted += ids.length;
      }
    });
    batch.status = AnnotationBatchStatus.REVERTED;
    await this.batches.save(batch);
    return {
      deleted,
      keptHumanEdited: kept,
      batch: await this.batchSummary(batch),
    };
  }

  private async batchSummary(batch: AnnotationBatch) {
    const rows: { status: string; editedByHuman: number; count: string }[] =
      await this.annotations
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('a.editedByHuman', 'editedByHuman')
        .addSelect('COUNT(*)', 'count')
        .where('a.batchId = :id', { id: batch.id })
        .groupBy('a.status')
        .addGroupBy('a.editedByHuman')
        .getRawMany();
    const counts = { draft: 0, published: 0, editedByHuman: 0 };
    for (const r of rows) {
      const n = Number(r.count);
      if (r.status === AnnotationStatus.DRAFT) counts.draft += n;
      else counts.published += n;
      if (Number(r.editedByHuman)) counts.editedByHuman += n;
    }
    return { ...batch, counts };
  }

  // ─── Shapes returned to clients ───────────────────────────────────────────

  toSummary(row: Annotation) {
    return {
      id: row.annotationId,
      rowId: row.id,
      projectId: row.projectId,
      annotationPageId: row.annotationPageId,
      status: row.status,
      origin: row.origin,
      batchId: row.batchId ?? null,
      model: row.model ?? null,
      editedByHuman: row.editedByHuman,
      createdById: row.createdById ?? null,
      acceptedById: row.acceptedById ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      content: toClientAnnotation(row),
    };
  }
}
