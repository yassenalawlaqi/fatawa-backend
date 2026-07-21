import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SearchModule } from './modules/search/search.module';
import { FatawaModule } from './modules/fatawa/fatawa.module';
import { BackupModule } from './modules/backup/backup.module';
import { ImporterModule } from './modules/importer/importer.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemModule } from './modules/system/system.module';
import { PrismaModule } from './modules/prisma/prisma.module';

const appImports: any[] = [
  ConfigModule.forRoot({ 
    isGlobal: true,
    envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.development',
  }),
  ScheduleModule.forRoot(),
  LoggerModule.forRoot({
    pinoHttp: {
      transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  }),
  ThrottlerModule.forRoot([{
    ttl: 60000,
    limit: 100, // 100 requests per minute by default
  }]),
  SearchModule,
  FatawaModule,
  BackupModule,
  ImporterModule,
  AdminModule,
  AuthModule,
  SystemModule,
  PrismaModule,
];

if (process.env.REDIS_HOST || process.env.REDIS_URL) {
  appImports.push(
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        let host = config.get('REDIS_HOST') || 'localhost';
        let port = config.get('REDIS_PORT') || 6379;
        let password = config.get('REDIS_PASSWORD');
        
        const url = config.get('REDIS_URL');
        if (url) {
          const parsed = new URL(url);
          host = parsed.hostname;
          port = parsed.port || 6379;
          if (parsed.password) {
            password = parsed.password;
          }
        }
        return {
          connection: { host, port, password },
        };
      },
    })
  );
}

@Module({
  imports: appImports,
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
