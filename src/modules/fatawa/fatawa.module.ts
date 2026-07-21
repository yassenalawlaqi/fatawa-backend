import { Module } from '@nestjs/common';
import { FatawaController } from './fatawa.controller';
import { ScholarsController } from './scholars.controller';
import { CategoriesController } from './categories.controller';
import { FatawaService } from './fatawa.service';
import { FatawaRepository } from './fatawa.repository';

@Module({
  controllers: [FatawaController, ScholarsController, CategoriesController],
  providers: [FatawaService, FatawaRepository],
})
export class FatawaModule {}
