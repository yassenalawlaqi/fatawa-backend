import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ImporterModule } from '../importer/importer.module';

@Module({
  imports: [ImporterModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
