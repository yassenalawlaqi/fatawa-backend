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
exports.PermanentCommitteeImporter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const base_importer_service_1 = require("../services/base-importer.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
let PermanentCommitteeImporter = class PermanentCommitteeImporter extends base_importer_service_1.BaseImporterService {
    prisma;
    extractor;
    sourceName = 'اللجنة الدائمة للبحوث العلمية والإفتاء';
    sourceSlug = 'committee-official';
    officialUrl = 'https://alifta.gov.sa';
    constructor(prisma, extractor) {
        super(prisma);
        this.prisma = prisma;
        this.extractor = extractor;
    }
    async fetchRawItems() {
        this.logger.log(`Fetching listing pages for ${this.sourceName}...`);
        const allLinks = new Set();
        let currentPage = 1;
        let hasMorePages = true;
        while (hasMorePages) {
            this.logger.log(`Fetching ${this.sourceName} - Page ${currentPage}`);
            try {
                const html = await this.extractor.extractContent([
                    {
                        type: 'html',
                        url: `${this.officialUrl}/Ar/IftaPages/default.aspx?page=${currentPage}`,
                        extractFn: async (data) => data,
                    }
                ]);
                const cheerio = require('cheerio');
                const $ = cheerio.load(html);
                const pageLinks = [];
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href && href.includes('Fatwa')) {
                        pageLinks.push(href.startsWith('http') ? href : `${this.officialUrl}${href}`);
                    }
                });
                if (pageLinks.length === 0) {
                    hasMorePages = false;
                }
                else {
                    let addedNew = false;
                    pageLinks.forEach(link => {
                        if (!allLinks.has(link)) {
                            allLinks.add(link);
                            addedNew = true;
                        }
                    });
                    if (!addedNew) {
                        hasMorePages = false;
                    }
                    else {
                        currentPage++;
                        await new Promise(res => setTimeout(res, 500));
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
                hasMorePages = false;
            }
        }
        this.logger.log(`Found a total of ${allLinks.size} fatwa URLs from ${this.sourceName}.`);
        return Array.from(allLinks).map(url => ({ url }));
    }
    async extractFatwaData(rawItem) {
        const html = await this.extractor.extractContent([
            {
                type: 'html',
                url: rawItem.url,
                extractFn: async (d) => d
            }
        ]);
        const extracted = this.extractor.extractHtml(html, '.fatwa-title, h1, h2', '.fatwa-body, .content');
        if (!extracted.question || !extracted.answer) {
            throw new Error(`Parsing failed for question or answer at ${rawItem.url}`);
        }
        const attachments = this.extractor.extractAttachments(html, this.officialUrl);
        const urlParts = rawItem.url.split('/');
        const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();
        const scholar = await this.prisma.scholar.upsert({
            where: { slug: 'permanent-committee' },
            update: {},
            create: { name: 'اللجنة الدائمة للبحوث العلمية والإفتاء', slug: 'permanent-committee' }
        });
        const category = await this.prisma.category.upsert({
            where: { slug: 'general' },
            update: {},
            create: { name: 'فتاوى عامة', slug: 'general' }
        });
        return {
            slug: `committee-${fatwaId}`,
            question: extracted.question,
            answer: extracted.answer,
            url: rawItem.url,
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: new Date(),
            attachments: attachments,
        };
    }
};
exports.PermanentCommitteeImporter = PermanentCommitteeImporter;
exports.PermanentCommitteeImporter = PermanentCommitteeImporter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        content_extractor_service_1.ContentExtractorService])
], PermanentCommitteeImporter);
//# sourceMappingURL=committee.importer.js.map