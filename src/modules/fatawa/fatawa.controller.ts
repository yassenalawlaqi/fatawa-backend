import { Controller, Get, Param, Query } from '@nestjs/common';
import { FatawaService } from './fatawa.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Fatawa Public')
@Controller({ path: 'public/fatawa', version: '1' })
export class FatawaController {
  constructor(private readonly fatawaService: FatawaService) {}

  @Get()
  @ApiOperation({ summary: 'Get fatawa (optionally by scholar)' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getFatawa(
    @Query('scholarSlug') scholarSlug: string,
    @Query('scholarId') scholarId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 20;
    
    const result = await this.fatawaService.getFatawaByScholar(
      scholarSlug || null, 
      scholarId || null, 
      p, 
      l
    );

    return {
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single fatwa by slug' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getFatwa(@Param('slug') slug: string) {
    return this.fatawaService.getFatwaBySlug(slug);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related fatawa' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getRelated(@Param('slug') slug: string) {
    return this.fatawaService.getRelatedFatawa(slug);
  }
}
