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
var SynonymService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynonymService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SynonymService = SynonymService_1 = class SynonymService {
    prisma;
    logger = new common_1.Logger(SynonymService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async expandQuery(query) {
        const words = query.split(/\s+/).filter(w => w.length > 2);
        const expanded = new Set();
        for (const word of words) {
            expanded.add(word);
            try {
                const synonyms = await this.prisma.synonym.findMany({
                    where: {
                        OR: [
                            { word: word },
                            { synonym: word }
                        ]
                    }
                });
                synonyms.forEach(syn => {
                    expanded.add(syn.word);
                    expanded.add(syn.synonym);
                });
            }
            catch (e) {
                this.logger.warn(`Failed to fetch synonyms for ${word}: ${e.message}`);
            }
        }
        return Array.from(expanded);
    }
    async getExpandedTsQuery(query) {
        const words = query.split(/\s+/).filter(w => w.length > 2);
        if (words.length === 0)
            return '';
        const parts = [];
        for (const word of words) {
            const expandedWords = await this.expandQuery(word);
            if (expandedWords.length > 1) {
                parts.push(`(${expandedWords.join(' | ')})`);
            }
            else {
                parts.push(word);
            }
        }
        return parts.join(' & ');
    }
};
exports.SynonymService = SynonymService;
exports.SynonymService = SynonymService = SynonymService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SynonymService);
//# sourceMappingURL=synonym.service.js.map