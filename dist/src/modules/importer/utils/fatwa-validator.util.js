"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FatwaValidator = void 0;
const common_1 = require("@nestjs/common");
class FatwaValidator {
    static logger = new common_1.Logger(FatwaValidator.name);
    static validate(data) {
        const errors = [];
        if (!data.question || data.question.trim().length === 0) {
            errors.push('Question is empty.');
        }
        if (!data.answer || data.answer.trim().length < 10) {
            errors.push('Answer is empty or less than 10 characters.');
        }
        if (!data.url || !data.url.startsWith('http')) {
            errors.push('Invalid official URL.');
        }
        if (!data.scholarId && !data.sourceId) {
        }
        if (errors.length > 0) {
            this.logger.warn(`Validation failed for ${data.url || 'Unknown'}: ${errors.join(', ')}`);
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.FatwaValidator = FatwaValidator;
//# sourceMappingURL=fatwa-validator.util.js.map