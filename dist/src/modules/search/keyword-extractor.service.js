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
var KeywordExtractorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordExtractorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let KeywordExtractorService = KeywordExtractorService_1 = class KeywordExtractorService {
    prisma;
    logger = new common_1.Logger(KeywordExtractorService_1.name);
    coreTerms = new Set([
        'توحيد', 'شرك', 'بدعة', 'عقيدة', 'إيمان', 'كفر', 'نفاق',
        'وضوء', 'غسل', 'تيمم', 'طهارة', 'حيض', 'نفاس', 'جنابة',
        'صلاة', 'أذان', 'إقامة', 'جماعة', 'جمعة', 'سنن', 'وتر',
        'زكاة', 'صدقة', 'نصاب', 'حول',
        'صيام', 'صوم', 'رمضان', 'قضاء', 'كفارة', 'فدية', 'اعتكاف',
        'حج', 'عمرة', 'طواف', 'سعي', 'إحرام', 'ميقات',
        'بيع', 'ربا', 'إجارة', 'وقف', 'وصية', 'ميراث',
        'نكاح', 'طلاق', 'خلع', 'عدة', 'رضاع', 'نفقة',
        'جنائز', 'أيمان', 'نذور', 'أطعمة', 'أشربة', 'لباس'
    ]);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async extractKeywords(params) {
        const textToAnalyze = `${params.question} ${params.answer} ${params.categoryName || ''}`.toLowerCase();
        const extracted = new Set();
        if (params.categoryName) {
            extracted.add(params.categoryName.trim());
        }
        for (const term of this.coreTerms) {
            if (textToAnalyze.includes(term)) {
                extracted.add(term);
            }
        }
        try {
            const allSynonyms = await this.prisma.synonym.findMany();
            for (const syn of allSynonyms) {
                if (textToAnalyze.includes(syn.synonym.toLowerCase())) {
                    extracted.add(syn.word);
                    extracted.add(syn.synonym);
                }
                if (textToAnalyze.includes(syn.word.toLowerCase())) {
                    extracted.add(syn.word);
                    extracted.add(syn.synonym);
                }
            }
        }
        catch (e) {
            this.logger.warn(`Failed to consult synonyms table: ${e.message}`);
        }
        const stopWords = ['في', 'من', 'على', 'إلى', 'عن', 'هل', 'كيف', 'ما', 'متى', 'حكم', 'هذا', 'هذه', 'الذي', 'التي', 'أن', 'إن', 'ولا', 'وما'];
        const words = params.question.split(/\s+/).map(w => w.replace(/[^\w\u0600-\u06FF]/g, ''));
        words.forEach(word => {
            if (word.length >= 4 && !stopWords.includes(word)) {
                extracted.add(word);
            }
        });
        return Array.from(extracted).slice(0, 15);
    }
};
exports.KeywordExtractorService = KeywordExtractorService;
exports.KeywordExtractorService = KeywordExtractorService = KeywordExtractorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KeywordExtractorService);
//# sourceMappingURL=keyword-extractor.service.js.map