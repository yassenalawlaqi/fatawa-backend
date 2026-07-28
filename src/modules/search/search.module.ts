import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { SynonymService } from './synonym.service';
import { KeywordExtractorService } from './keyword-extractor.service';

@Module({
  imports: [
    PrismaModule, 
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        if (process.env.REDIS_URL || process.env.REDIS_HOST) {
          const redisStore = require('cache-manager-redis-store');
          let host = process.env.REDIS_HOST || 'localhost';
          let port = process.env.REDIS_PORT || 6379;
          let password = process.env.REDIS_PASSWORD;
          
          if (process.env.REDIS_URL) {
            const parsed = new URL(process.env.REDIS_URL);
            host = parsed.hostname;
            port = parsed.port || 6379;
            if (parsed.password) password = parsed.password;
          }
          
          return {
            store: redisStore,
            host,
            port,
            password,
            ttl: 21600000, // 6 hours
          } as any;
        }
        return { ttl: 21600000 } as any;
      }
    })
  ],
  controllers: [SearchController],
  providers: [
    SearchRepository,
    SearchService,
    SynonymService,
    KeywordExtractorService,
    {
      provide: 'ISearchProvider',
      useExisting: SearchService,
    },
  ],
  exports: ['ISearchProvider', SearchRepository, SynonymService, KeywordExtractorService],
})
export class SearchModule {}
