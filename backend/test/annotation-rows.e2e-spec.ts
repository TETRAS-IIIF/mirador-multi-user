import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { Annotation } from '../src/BaseEntities/annotation/entities/annotation.entity';
import { AnnotationBatch } from '../src/BaseEntities/annotation/entities/annotation-batch.entity';
import { AnnotationPage } from '../src/BaseEntities/annotation-page/entities/annotation-page.entity';
import { AnnotationService } from '../src/BaseEntities/annotation/annotation.service';
import { AnnotationController } from '../src/BaseEntities/annotation/annotation.controller';
import { AnnotationBatchController } from '../src/BaseEntities/annotation/annotation-batch.controller';
import { AnnotationPageController } from '../src/BaseEntities/annotation-page/annotation-page.controller';
import { AnnotationPageService } from '../src/BaseEntities/annotation-page/annotation-page.service';
import { LinkGroupProjectService } from '../src/LinkModules/link-group-project/link-group-project.service';
import { GroupProjectRights } from '../src/enum/rights';

/**
 * Annotation rows against a real MariaDB. Needs a throwaway database:
 *
 *   E2E_DB_DATABASE=mmu_e2e npm run test:e2e -- annotation-rows
 *
 * The schema of that database is dropped and recreated. Without the variable
 * the suite is skipped. Project rights are mocked; everything else (guard,
 * JWT, controllers, service, SQL) is real.
 */
const DATABASE = process.env.E2E_DB_DATABASE;
const describeDb = DATABASE ? describe : describe.skip;

describeDb('annotation rows (e2e, real DB)', () => {
  const SECRET = 'e2e-annotation-secret';
  const PROJECT = 1;
  const EDITOR = 10;
  const READER = 11;
  const OUTSIDER = 12;
  const PAGE = 'https://example.org/iiif/canvas/1/annotationPage';
  const PAGE2 = 'https://example.org/iiif/canvas/2/annotationPage';

  let app: INestApplication;
  let db: DataSource;
  let service: AnnotationService;
  let tokens: Record<number, string>;

  const rights: Record<number, GroupProjectRights | undefined> = {
    [EDITOR]: GroupProjectRights.EDITOR,
    [READER]: GroupProjectRights.READER,
  };

  const anno = (
    id: string,
    text = id,
    canvas = 'https://example.org/iiif/canvas/1',
  ) => ({
    id,
    type: 'Annotation',
    motivation: 'commenting',
    body: [{ type: 'TextualBody', value: text }],
    target: `${canvas}#xywh=0,0,10,10`,
  });

  const http = () => request(app.getHttpServer());
  const as = (user: number, req: request.Test, assistant = false) => {
    req.set('Authorization', `Bearer ${tokens[user]}`);
    if (assistant) req.set('x-mmu-client', 'assistant');
    return req;
  };
  const getPage = async (user: number, page = PAGE, drafts = false) => {
    const res = await as(
      user,
      http().get(
        `/annotation-page/${encodeURIComponent(page)}/${PROJECT}${drafts ? '?drafts=true' : ''}`,
      ),
    ).expect(200);
    return res.body[0]?.content;
  };
  const createDraft = (id: string, batchId?: number, page = PAGE) =>
    as(
      EDITOR,
      http()
        .post('/annotation')
        .send({
          projectId: PROJECT,
          annotationPageId: page,
          content: anno(id),
          batchId,
          model: 'claude-opus-5-5',
        }),
      true,
    ).expect(201);

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;
    const moduleRef = await Test.createTestingModule({
      imports: [
        JwtModule.register({}),
        TypeOrmModule.forRoot({
          type: 'mariadb',
          host: process.env.DB_HOST ?? 'db',
          port: Number(process.env.E2E_DB_PORT ?? 3306),
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: DATABASE,
          entities: [Annotation, AnnotationBatch, AnnotationPage],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Annotation, AnnotationBatch, AnnotationPage]),
      ],
      controllers: [
        AnnotationController,
        AnnotationBatchController,
        AnnotationPageController,
      ],
      providers: [
        AnnotationService,
        AnnotationPageService,
        {
          provide: LinkGroupProjectService,
          useValue: {
            getHighestRightForProject: async (userId: number) =>
              rights[userId] ? { rights: rights[userId] } : null,
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    db = moduleRef.get(DataSource);
    service = moduleRef.get(AnnotationService);
    const jwt = moduleRef.get(JwtService);
    tokens = {};
    for (const [id, name] of [
      [EDITOR, 'editor'],
      [READER, 'reader'],
      [OUTSIDER, 'outsider'],
    ] as const) {
      tokens[id] = await jwt.signAsync(
        { sub: id, user: name, isEmailConfirmed: true },
        { secret: SECRET },
      );
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await db.query('DELETE FROM annotation');
    await db.query('DELETE FROM annotation_batch');
    await db.query('DELETE FROM annotation_page');
  });

  it('splits a legacy page into rows and rebuilds the same page', async () => {
    const legacy = {
      id: PAGE,
      type: 'AnnotationPage',
      items: [anno('a1', 'first'), anno('a2', 'second'), anno('a3', 'third')],
    };
    await db.getRepository(AnnotationPage).save({
      projectId: PROJECT,
      annotationPageId: PAGE,
      content: legacy,
      migratedToRows: false,
    });

    expect(await service.migrateLegacyPages()).toBe(1);
    expect(await db.getRepository(Annotation).count()).toBe(3);
    // Idempotent: nothing left to split.
    expect(await service.migrateLegacyPages()).toBe(0);
    expect(await db.getRepository(Annotation).count()).toBe(3);

    expect(await getPage(READER)).toEqual(legacy);
    const stored = await db
      .getRepository(AnnotationPage)
      .findOneBy({ annotationPageId: PAGE });
    expect(stored.content).toEqual(legacy);
    expect(stored.migratedToRows).toBe(true);
  });

  it('splits a legacy page on first access too', async () => {
    await db.getRepository(AnnotationPage).save({
      projectId: PROJECT,
      annotationPageId: PAGE,
      content: { id: PAGE, type: 'AnnotationPage', items: [anno('old')] },
      migratedToRows: false,
    });
    const page = await getPage(EDITOR);
    expect(page.items.map((i) => i.id)).toEqual(['old']);
  });

  it('keeps both annotations when two writers save on the same canvas at once', async () => {
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        as(
          EDITOR,
          http()
            .post('/annotation')
            .send({
              projectId: PROJECT,
              annotationPageId: PAGE,
              content: anno(`c${i}`),
            }),
        ).expect(201),
      ),
    );
    const page = await getPage(READER);
    expect(page.items.map((i) => i.id).sort()).toEqual(
      Array.from({ length: 8 }, (_, i) => `c${i}`).sort(),
    );
    // The page JSON cache saw every write too.
    const stored = await db
      .getRepository(AnnotationPage)
      .findOneBy({ annotationPageId: PAGE });
    expect(stored.content.items).toHaveLength(8);
  });

  it('per-annotation update and delete leave the other annotations alone', async () => {
    for (const id of ['u1', 'u2']) {
      await as(
        EDITOR,
        http()
          .post('/annotation')
          .send({
            projectId: PROJECT,
            annotationPageId: PAGE,
            content: anno(id),
          }),
      ).expect(201);
    }
    await as(
      EDITOR,
      http()
        .patch(`/annotation/${PROJECT}/u1`)
        .send({ content: anno('u1', 'edited') }),
    ).expect(200);
    await as(EDITOR, http().delete(`/annotation/${PROJECT}/u2`)).expect(200);
    const page = await getPage(READER);
    expect(page.items).toEqual([anno('u1', 'edited')]);
  });

  it('serves drafts only to editors who ask, never to readers or exports', async () => {
    await as(
      EDITOR,
      http()
        .post('/annotation')
        .send({
          projectId: PROJECT,
          annotationPageId: PAGE,
          content: anno('pub'),
        }),
    ).expect(201);
    const created = await createDraft('d1');
    expect(created.body.status).toBe('draft');
    expect(created.body.origin).toBe('ai');

    expect((await getPage(EDITOR)).items.map((i) => i.id)).toEqual(['pub']);
    const withDrafts = await getPage(EDITOR, PAGE, true);
    expect(withDrafts.items.map((i) => i.id)).toEqual(['pub', 'd1']);
    expect(withDrafts.items[1]['mmu:status']).toBe('draft');
    expect(withDrafts.items[1]['mmu:model']).toBe('claude-opus-5-5');
    expect((await getPage(READER, PAGE, true)).items.map((i) => i.id)).toEqual([
      'pub',
    ]);
    await as(READER, http().get(`/annotation/${PROJECT}/d1`)).expect(404);
    await as(
      READER,
      http().get(`/annotation/count?projectId=${PROJECT}&status=draft`),
    ).expect(403);
    await as(
      OUTSIDER,
      http().get(`/annotation-page/${encodeURIComponent(PAGE)}/${PROJECT}`),
    ).expect(403);

    const exported = await service.getProjectPages(PROJECT, {
      forExport: true,
    });
    expect(exported[0].content.items.map((i) => i.id)).toEqual(['pub']);

    const count = await as(
      EDITOR,
      http().get(`/annotation/count?projectId=${PROJECT}&status=draft`),
    ).expect(200);
    expect(count.body).toEqual({ count: 1 });
  });

  it('the assistant can only write drafts and cannot publish', async () => {
    await createDraft('ai1');
    await as(
      EDITOR,
      http().post(`/annotation/${PROJECT}/ai1/accept`),
      true,
    ).expect(403);
    await as(
      EDITOR,
      http().patch(`/annotation/${PROJECT}/ai1`).send({ status: 'published' }),
      true,
    ).expect(403);
    await as(
      EDITOR,
      http()
        .post('/annotation')
        .send({
          projectId: PROJECT,
          annotationPageId: PAGE,
          content: anno('h1'),
        }),
    ).expect(201);
    await as(EDITOR, http().delete(`/annotation/${PROJECT}/h1`), true).expect(
      403,
    );
    await as(
      EDITOR,
      http()
        .patch(`/annotation/${PROJECT}/h1`)
        .send({ content: anno('h1', 'hijack') }),
      true,
    ).expect(403);
  });

  it('accepting a draft publishes it with W3C provenance', async () => {
    await createDraft('p1');
    const res = await as(
      EDITOR,
      http().post(`/annotation/${PROJECT}/p1/accept`),
    ).expect(201);
    expect(res.body.status).toBe('published');
    expect(res.body.acceptedById).toBe(EDITOR);
    const page = await getPage(READER);
    expect(page.items[0].generator).toEqual({
      type: 'Software',
      name: 'claude-opus-5-5',
    });
    expect(page.items[0].creator).toBe('editor');
    expect(page.items[0]['mmu:status']).toBeUndefined();
  });

  it('saving a draft from the editor publishes it and marks it edited by a human', async () => {
    await createDraft('e1');
    const res = await as(
      EDITOR,
      http()
        .patch(`/annotation/${PROJECT}/e1`)
        .send({
          content: anno('e1', 'fixed by a person'),
          status: 'published',
        }),
    ).expect(200);
    expect(res.body.status).toBe('published');
    expect(res.body.editedByHuman).toBe(true);
  });

  it('accepts and reverts a batch, keeping annotations a person edited', async () => {
    const batch = await as(
      EDITOR,
      http().post('/annotation-batch').send({
        projectId: PROJECT,
        kind: 'transcribe',
        model: 'claude-haiku-5-5',
      }),
      true,
    ).expect(201);
    const batchId = batch.body.id;
    await createDraft('b1', batchId);
    await createDraft('b2', batchId, PAGE2);
    await createDraft('b3', batchId, PAGE2);
    await createDraft('other');

    // A person edits b2: revert must keep it.
    await as(
      EDITOR,
      http()
        .patch(`/annotation/${PROJECT}/b2`)
        .send({ content: anno('b2', 'checked') }),
    ).expect(200);

    const info = await as(
      EDITOR,
      http().get(`/annotation-batch/${batchId}`),
    ).expect(200);
    expect(info.body.proposedCount).toBe(3);
    expect(info.body.counts).toEqual({
      draft: 3,
      published: 0,
      editedByHuman: 1,
    });

    const accepted = await as(
      EDITOR,
      http().post(`/annotation-batch/${batchId}/accept`),
    ).expect(201);
    expect(accepted.body.accepted).toBe(3);
    expect((await getPage(READER, PAGE2)).items.map((i) => i.id)).toEqual([
      'b2',
      'b3',
    ]);

    // The assistant cannot revert; dryRun only counts.
    await as(
      EDITOR,
      http().post(`/annotation-batch/${batchId}/revert`),
      true,
    ).expect(403);
    const dry = await as(
      EDITOR,
      http().post(`/annotation-batch/${batchId}/revert?dryRun=true`),
    ).expect(201);
    expect(dry.body).toEqual({
      deleted: 0,
      wouldDelete: 2,
      keptHumanEdited: 1,
    });

    const reverted = await as(
      EDITOR,
      http().delete(`/annotation-batch/${batchId}`),
    ).expect(200);
    expect(reverted.body.deleted).toBe(2);
    expect(reverted.body.keptHumanEdited).toBe(1);
    expect(reverted.body.batch.status).toBe('reverted');
    expect((await getPage(READER, PAGE2)).items.map((i) => i.id)).toEqual([
      'b2',
    ]);
    expect((await getPage(READER)).items).toEqual([]);
    // The draft outside the batch is untouched.
    expect((await getPage(EDITOR, PAGE, true)).items.map((i) => i.id)).toEqual([
      'other',
    ]);
  });

  it('bulk-deletes all AI drafts of a project', async () => {
    await createDraft('x1');
    await createDraft('x2', undefined, PAGE2);
    await as(
      EDITOR,
      http()
        .post('/annotation')
        .send({
          projectId: PROJECT,
          annotationPageId: PAGE,
          content: anno('keep'),
        }),
    ).expect(201);
    await as(EDITOR, http().delete(`/annotation?projectId=${PROJECT}`)).expect(
      400,
    );
    const res = await as(
      EDITOR,
      http().delete(`/annotation?projectId=${PROJECT}&origin=ai&status=draft`),
    ).expect(200);
    expect(res.body).toEqual({ deleted: 2 });
    expect((await getPage(EDITOR, PAGE, true)).items.map((i) => i.id)).toEqual([
      'keep',
    ]);
  });

  it('the legacy whole-page POST keeps drafts and other pages intact', async () => {
    await createDraft('draft-kept');
    await as(
      EDITOR,
      http()
        .post('/annotation-page')
        .send({
          projectId: PROJECT,
          annotationPageId: PAGE,
          content: {
            id: PAGE,
            type: 'AnnotationPage',
            items: [anno('l1'), anno('l2')],
          },
        }),
    ).expect(201);
    await as(
      EDITOR,
      http()
        .post('/annotation-page')
        .send({
          projectId: PROJECT,
          annotationPageId: PAGE,
          content: {
            id: PAGE,
            type: 'AnnotationPage',
            items: [anno('l2', 'changed')],
          },
        }),
    ).expect(201);
    const page = await getPage(EDITOR, PAGE, true);
    expect(page.items.map((i) => [i.id, i.body[0].value])).toEqual([
      ['draft-kept', 'draft-kept'],
      ['l2', 'changed'],
    ]);
  });

  it('refuses writes to readers and outsiders', async () => {
    for (const user of [READER, OUTSIDER]) {
      await as(
        user,
        http()
          .post('/annotation')
          .send({
            projectId: PROJECT,
            annotationPageId: PAGE,
            content: anno(`r${user}`),
          }),
      ).expect(403);
    }
    await http().get(`/annotation?projectId=${PROJECT}`).expect(401);
  });
});
