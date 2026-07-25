import { Controller, Get, Post, Body, Query, UseInterceptors, Logger } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Search')
@Controller({ path: 'public/search', version: '1' })
@UseInterceptors(CacheInterceptor)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  private readonly logger = new Logger(SearchController.name);

  @Get()
  @ApiOperation({ summary: 'Search fatawa (GET)' })
  @ApiResponse({ status: 200, description: 'Successful search response.' })
  async searchGet(@Query() query: SearchQueryDto) {
    this.logger.log(`\n==== Search Started ====`);
    this.logger.log(`Query: ${query.query || query.q}`);
    this.logger.log(`Page: ${query.page}`);
    this.logger.log(`Limit: ${query.limit}`);
    
    console.log("REQUEST RECEIVED");
    console.time("SearchRequest");

    try {
      const result = await this.searchService.search(query);
      
      console.log("RESPONSE SENT");
      console.timeEnd("SearchRequest");
      
      this.logger.log(`==== Search Finished ====\n`);
      return result;
    } catch (error: any) {
      console.error(error);
      console.error(error.stack);
      
      this.logger.error(`Exception Name: ${error.name}`);
      this.logger.error(`Message: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      console.timeEnd("SearchRequest");
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Search fatawa (POST with advanced filters)' })
  @ApiResponse({ status: 200, description: 'Successful search response.' })
  async searchPost(@Body() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete suggestions' })
  @ApiResponse({ status: 200, description: 'Successful autocomplete response.' })
  async autocomplete(@Query('q') q: string) {
    return this.searchService.autocomplete(q);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending searches' })
  @ApiResponse({ status: 200, description: 'Successful trending response.' })
  async trending() {
    return this.searchService.getTrendingSearches();
  }
}
