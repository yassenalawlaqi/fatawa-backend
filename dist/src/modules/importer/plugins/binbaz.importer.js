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
exports.BinBazImporter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const base_importer_service_1 = require("../services/base-importer.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
let BinBazImporter = class BinBazImporter extends base_importer_service_1.BaseImporterService {
    prisma;
    extractor;
    sourceName = 'الموقع الرسمي للإمام ابن باز';
    sourceSlug = 'binbaz-official';
    officialUrl = 'https://binbaz.org.sa';
    constructor(prisma, extractor) {
        super(prisma);
        this.prisma = prisma;
        this.extractor = extractor;
    }
    async fetchRawItems() {
        this.logger.log(`Fetching listing page for ${this.sourceName}...`);
        const html = await this.extractor.extractContent([
            {
                type: 'html',
                url: `${this.officialUrl}/fatwas`,
                extractFn: async (data) => data,
            }
        ]);
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        const links = [];
        $('article a').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/fatwas/')) {
                links.push(href.startsWith('http') ? href : `${this.officialUrl}${href}`);
            }
        });
        const uniqueLinks = [...new Set(links)];
        const targetLinks = uniqueLinks.slice(0, 5);
        const rawItems = [];
        for (const link of targetLinks) {
            try {
                const itemHtml = await this.extractor.extractContent([
                    {
                        type: 'html',
                        url: link,
                        extractFn: async (d) => d
                    }
                ]);
                rawItems.push({ url: link, html: itemHtml });
            }
            catch (err) {
                this.logger.warn(`Failed to fetch detail for ${link}`);
            }
        }
        return rawItems;
    }
    async extractFatwaData(rawItem) {
        const extracted = this.extractor.extractHtml(rawItem.html, 'h1.article-title, h1', '.article-content, article');
        if (!extracted.question || !extracted.answer) {
            throw new Error('Parsing failed for question or answer');
        }
        const attachments = this.extractor.extractAttachments(rawItem.html, this.officialUrl);
        const urlParts = rawItem.url.split('/');
        const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();
        const scholar = await this.prisma.scholar.upsert({
            where: { slug: 'ibn-baz' },
            update: {},
            create: { name: 'عبدالعزيز بن عبدالله بن باز', slug: 'ibn-baz' }
        });
        const category = await this.prisma.category.upsert({
            where: { slug: 'general' },
            update: {},
            create: { name: 'فتاوى عامة', slug: 'general' }
        });
        const cheerio = require('cheerio');
        const $ = cheerio.load(rawItem.html);
        const dateText = $('.article-date').text() || '';
        const publishedAt = dateText ? new Date(dateText) : new Date();
        return {
            slug: `binbaz-${fatwaId}`,
            question: extracted.question,
            answer: extracted.answer,
            url: rawItem.url,
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: publishedAt,
            attachments: attachments,
        };
    }
};
exports.BinBazImporter = BinBazImporter;
exports.BinBazImporter = BinBazImporter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        content_extractor_service_1.ContentExtractorService])
], BinBazImporter);
//# sourceMappingURL=binbaz.importer.js.map