import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImporterService } from '../importer/importer.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly importerService: ImporterService) {}

  @Post(['import/run', 'import/run/:sourceSlug'])
  @ApiOperation({ summary: 'Trigger manual import for a source or all sources' })
  async runImport(@Param('sourceSlug') sourceSlug?: string) {
    const target = sourceSlug || 'all';
    return await this.importerService.scheduleImport(target);
  }

  @Get('import/status')
  @ApiOperation({ summary: 'Get current sync status' })
  async getSyncStatus() {
    return { success: true, message: 'Sync status endpoint ready.' };
  }
}
