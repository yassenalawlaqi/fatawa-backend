"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message =
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : exceptionResponse.message || exception.message;
            code =
                typeof exceptionResponse === 'object' && exceptionResponse.error
                    ? exceptionResponse.error.replace(/\s+/g, '_').toUpperCase()
                    : `HTTP_${status}_ERROR`;
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        this.logger.error('========================================');
        this.logger.error(`Exception Name: ${exception instanceof Error ? exception.name : 'Unknown'}`);
        this.logger.error(`Message: ${message}`);
        if (exception instanceof Error) {
            this.logger.error(`Stack Trace:\n${exception.stack}`);
            if (exception.code) {
                this.logger.error(`Prisma Code: ${exception.code}`);
            }
            if (exception.meta) {
                this.logger.error(`Prisma Meta: ${JSON.stringify(exception.meta)}`);
            }
        }
        else {
            this.logger.error(`Exception Object:\n${JSON.stringify(exception)}`);
        }
        this.logger.error('========================================');
        const errorBody = {
            success: false,
            error: {
                code,
                message: Array.isArray(message) ? message.join(', ') : message,
            },
        };
        response.status(status).json(errorBody);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map