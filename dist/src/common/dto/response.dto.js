"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseDto = exports.ErrorDetailsDto = exports.PaginationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PaginationDto {
    page;
    limit;
    total;
    totalPages;
}
exports.PaginationDto = PaginationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20 }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], PaginationDto.prototype, "totalPages", void 0);
class ErrorDetailsDto {
    code;
    message;
}
exports.ErrorDetailsDto = ErrorDetailsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'VALIDATION_ERROR' }),
    __metadata("design:type", String)
], ErrorDetailsDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Invalid input data' }),
    __metadata("design:type", String)
], ErrorDetailsDto.prototype, "message", void 0);
class ApiResponseDto {
    success;
    data;
    pagination;
    message;
    error;
}
exports.ApiResponseDto = ApiResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], ApiResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], ApiResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: PaginationDto }),
    __metadata("design:type", PaginationDto)
], ApiResponseDto.prototype, "pagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", String)
], ApiResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: ErrorDetailsDto }),
    __metadata("design:type", ErrorDetailsDto)
], ApiResponseDto.prototype, "error", void 0);
//# sourceMappingURL=response.dto.js.map