"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nestjs_pino_1 = require("nestjs-pino");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const search_module_1 = require("./modules/search/search.module");
const fatawa_module_1 = require("./modules/fatawa/fatawa.module");
const backup_module_1 = require("./modules/backup/backup.module");
const importer_module_1 = require("./modules/importer/importer.module");
const admin_module_1 = require("./modules/admin/admin.module");
const auth_module_1 = require("./modules/auth/auth.module");
const system_module_1 = require("./modules/system/system.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const appImports = [
    config_1.ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.development',
    }),
    schedule_1.ScheduleModule.forRoot(),
    nestjs_pino_1.LoggerModule.forRoot({
        pinoHttp: {
            transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        },
    }),
    throttler_1.ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
    search_module_1.SearchModule,
    fatawa_module_1.FatawaModule,
    backup_module_1.BackupModule,
    importer_module_1.ImporterModule,
    admin_module_1.AdminModule,
    auth_module_1.AuthModule,
    system_module_1.SystemModule,
    prisma_module_1.PrismaModule,
];
if (process.env.REDIS_HOST || process.env.REDIS_URL) {
    appImports.push(bullmq_1.BullModule.forRootAsync({
        inject: [config_1.ConfigService],
        useFactory: (config) => {
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
    }));
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: appImports,
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map