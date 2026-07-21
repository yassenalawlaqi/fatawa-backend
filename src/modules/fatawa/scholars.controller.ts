import { Controller, Get } from '@nestjs/common';
import { FatawaService } from './fatawa.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Scholars Public')
@Controller({ path: 'public/scholars', version: '1' })
export class ScholarsController {
  constructor(private readonly fatawaService: FatawaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all scholars' })
  @ApiResponse({ status: 200, description: 'Successful response' })
  async getScholars() {
    return this.fatawaService.getScholars();
  }
}
