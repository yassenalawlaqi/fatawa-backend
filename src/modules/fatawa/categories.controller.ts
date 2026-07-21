import { Controller, Get } from '@nestjs/common';
import { FatawaService } from './fatawa.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Categories Public')
@Controller({ path: 'public/categories', version: '1' })
export class CategoriesController {
  constructor(private readonly fatawaService: FatawaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getCategories() {
    return this.fatawaService.getCategories();
  }
}
