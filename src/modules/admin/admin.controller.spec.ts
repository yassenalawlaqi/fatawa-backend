import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { ImporterService } from '../importer/importer.service';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: ImporterService,
          useValue: {
            scheduleImport: jest.fn().mockResolvedValue({ success: true }),
            getSyncStatus: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
