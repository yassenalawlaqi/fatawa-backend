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
exports.UthaymeenImporter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const base_importer_service_1 = require("../services/base-importer.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
const keyword_extractor_service_1 = require("../../search/keyword-extractor.service");
let UthaymeenImporter = class UthaymeenImporter extends base_importer_service_1.BaseImporterService {
    prisma;
    extractor;
    keywordExtractor;
    sourceName = 'موقع الشيخ محمد بن صالح العثيمين';
    sourceSlug = 'uthaymeen-official';
    officialUrl = 'https://old.binothaimeen.net';
    constructor(prisma, extractor, keywordExtractor) {
        super(prisma, keywordExtractor);
        this.prisma = prisma;
        this.extractor = extractor;
        this.keywordExtractor = keywordExtractor;
    }
    async *fetchRawItems(startIndex) {
        this.logger.log(`Fetching listing pages for ${this.sourceName}...`);
        let currentPage = 1;
        let hasMorePages = true;
        let currentItemIndex = 0;
        const seenLinks = new Set();
        while (hasMorePages) {
            this.logger.log(`Fetching ${this.sourceName} - Page ${currentPage}`);
            try {
                const html = await this.extractor.extractContent([
                    {
                        type: 'html',
                        url: `${this.officialUrl}/content/Menu/ftawa?page=${currentPage}`,
                        extractFn: async (data) => data,
                    }
                ]);
                const cheerio = require('cheerio');
                const $ = cheerio.load(html);
                const pageLinks = [];
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href && (href.includes('/content/') || href.includes('fatwa'))) {
                        const fullUrl = href.startsWith('http') ? href : `${this.officialUrl}${href}`;
                        if (!seenLinks.has(fullUrl)) {
                            seenLinks.add(fullUrl);
                            pageLinks.push(fullUrl);
                        }
                    }
                });
                if (pageLinks.length === 0) {
                    hasMorePages = false;
                }
                else {
                    for (const link of pageLinks) {
                        if (currentItemIndex >= startIndex) {
                            yield { url: link };
                        }
                        currentItemIndex++;
                    }
                    currentPage++;
                    await new Promise(res => setTimeout(res, 500));
                }
            }
            catch (err) {
                this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
                hasMorePages = false;
            }
        }
    }
    async extractFatwaData(rawItem) {
        const cheerio = require('cheerio');
        const html = await this.extractor.extractContent([
            {
                type: 'html',
                url: rawItem.url,
                extractFn: async (d) => d
            }
        ]);
        const $ = cheerio.load(html);
        const questionSelectors = [
            '.portlet-title h1',
            '.portlet-title',
            '.question-title',
            '.fatwa-question',
            'h1.title',
            'h1',
            '.view-item h1',
            '.item-title',
        ];
        const answerSelectors = [
            '.portlet-content .view',
            '.portlet-content p',
            '.fatwa-answer',
            '.answer-text',
            '.view-item .content',
            '.portlet-content',
            '#content',
            'article',
            '.content',
        ];
        let question = '';
        for (const sel of questionSelectors) {
            const text = $(sel).first().text().trim();
            if (text && text.length > 5) {
                question = text;
                break;
            }
        }
        let answer = '';
        for (const sel of answerSelectors) {
            const text = $(sel).text().trim();
            if (text && text.length > 20) {
                answer = text;
                break;
            }
        }
        if (!question) {
            question = $('title').text().trim().replace(' - موقع الشيخ ابن عثيمين', '').trim();
        }
        if (!question || question.length < 3) {
            throw new Error(`No question found at ${rawItem.url}`);
        }
        if (!answer || answer.length < 10) {
            throw new Error(`No answer found at ${rawItem.url}`);
        }
        const attachments = this.extractor.extractAttachments(html, this.officialUrl);
        const urlParts = rawItem.url.split('/');
        const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();
        const scholar = await this.prisma.scholar.upsert({
            where: { slug: 'ibn-uthaymeen' },
            update: {},
            create: { name: 'محمد بن صالح العثيمين', slug: 'ibn-uthaymeen' }
        });
        const category = await this.prisma.category.upsert({
            where: { slug: 'general' },
            update: {},
            create: { name: 'فتاوى عامة', slug: 'general' }
        });
        return {
            slug: `uthaymeen-${fatwaId}`,
            question: question.substring(0, 1000),
            answer: answer.substring(0, 50000),
            url: rawItem.url,
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: new Date(),
            attachments: attachments,
        };
    }
};
exports.UthaymeenImporter = UthaymeenImporter;
exports.UthaymeenImporter = UthaymeenImporter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        content_extractor_service_1.ContentExtractorService,
        keyword_extractor_service_1.KeywordExtractorService])
], UthaymeenImporter);
//# sourceMappingURL=uthaymeen.importer.js.map