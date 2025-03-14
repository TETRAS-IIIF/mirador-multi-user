import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CustomLogger } from '../../utils/Logger/CustomLogger.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Snapshot } from './entities/snapshot.entity';
import { Repository } from 'typeorm';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Injectable()
export class SnapshotService {
  private readonly logger = new CustomLogger();

  constructor(
    @InjectRepository(Snapshot)
    private snapshotRepository: Repository<Snapshot>,
  ) {}

  async createSnapshot(snapshot: CreateSnapshotDto): Promise<Snapshot> {
    try {
      return await this.snapshotRepository.save({
        ...snapshot,
        project: { id: snapshot.projectId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while creating snapshot with error',
        error,
      );
    }
  }

  async findOne(snapshotId: number): Promise<Snapshot> {
    try {
      return await this.snapshotRepository.findOne({
        where: { id: snapshotId },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while finding snapshot with id ${snapshotId} with error`,
        error,
      );
    }
  }

  async updateSnapshot(
    snapshotId: number,
    snapshot: Snapshot,
  ): Promise<Snapshot> {
    try {
      await this.snapshotRepository.update(snapshotId, snapshot);
      return this.findOne(snapshotId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while updating snapshot with id ${snapshotId} with error`,
        error,
      );
    }
  }

  async deleteSnapshot(snapshotId: number): Promise<void> {
    try {
      await this.snapshotRepository.delete(snapshotId);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while deleting snapshot with id ${snapshotId} with error`,
        error,
      );
    }
  }

  async findAllProjectSnapshot(projectId: number): Promise<Snapshot[]> {
    try {
      return await this.snapshotRepository.find({
        where: { project: { id: projectId } },
      });
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException(
        `An error occurred while finding all project snapshot with projectid ${projectId} with error`,
        error,
      );
    }
  }
}
