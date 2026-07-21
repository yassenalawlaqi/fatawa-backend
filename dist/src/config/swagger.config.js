"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_1 = require("@nestjs/swagger");
function setupSwagger(app) {
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Fatawa Search Engine API')
        .setDescription('The official API documentation for the Fatawa Search Engine.')
        .setVersion('1.0')
        .addTag('Search')
        .addTag('Fatawa')
        .addTag('Scholars')
        .addTag('Categories')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
}
//# sourceMappingURL=swagger.config.js.map