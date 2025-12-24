import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MetadataService } from './metadata.service';
import { Metadata } from './entities/metadata.entity';
import { LinkMetadataFormatGroupService } from '../../LinkModules/link-metadata-format-group/link-metadata-format-group.service';

describe('MetadataService', () => {
  let service: MetadataService;

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<Metadata>>> = {
      create: jest.fn(),
      upsert: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const linkMetadataFormatGroupMock: Partial<
      jest.Mocked<LinkMetadataFormatGroupService>
    > = {
      findMetadataFormatWithTitle: jest.fn(),
      getMetadataFormatForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataService,
        {
          provide: getRepositoryToken(Metadata),
          useValue: repoMock,
        },
        {
          provide: LinkMetadataFormatGroupService,
          useValue: linkMetadataFormatGroupMock,
        },
      ],
    }).compile();

    service = module.get<MetadataService>(MetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
