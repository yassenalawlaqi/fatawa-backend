"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const nestjs_pino_1 = require("nestjs-pino");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const compression = require('compression');
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const swagger_config_1 = require("./config/swagger.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors();
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    (0, swagger_config_1.setupSwagger)(app);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map