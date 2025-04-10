import { Test, TestingModule } from '@nestjs/testing';
import { LinkGroupProjectController } from './link-group-project.controller';
import { LinkGroupProjectService } from './link-group-project.service';

describe('LinkGroupProjectController', () => {
  let controller: LinkGroupProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinkGroupProjectController],
      providers: [LinkGroupProjectService],
    }).compile();

    controller = module.get<LinkGroupProjectController>(
      LinkGroupProjectController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
