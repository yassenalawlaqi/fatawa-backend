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
exports.FawzanImporter = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const base_importer_service_1 = require("../services/base-importer.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
const keyword_extractor_service_1 = require("../../search/keyword-extractor.service");
let FawzanImporter = class FawzanImporter extends base_importer_service_1.BaseImporterService {
    prisma;
    extractor;
    keywordExtractor;
    sourceName = 'الموقع الرسمي للشيخ صالح الفوزان';
    sourceSlug = 'fawzan-official';
    officialUrl = 'https://alfawzan.af.org.sa';
    requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://alfawzan.af.org.sa/',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    };
    constructor(prisma, extractor, keywordExtractor) {
        super(prisma, keywordExtractor);
        this.prisma = prisma;
        this.extractor = extractor;
        this.keywordExtractor = keywordExtractor;
    }
    async *fetchRawItems(startIndex) {
        this.logger.log(`Fetching listing pages for ${this.sourceName}...`);
        let currentPage = 0;
        let hasMorePages = true;
        let currentItemIndex = 0;
        const seenLinks = new Set();
        const axios = require('axios');
        const https = require('https');
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const cheerio = require('cheerio');
        while (hasMorePages) {
            this.logger.log(`Fetching ${this.sourceName} - Page ${currentPage}`);
            try {
                const response = await axios.get(`${this.officialUrl}/ar/fatwas?page=${currentPage}`, {
                    headers: this.requestHeaders,
                    httpsAgent,
                    timeout: 15000,
                });
                const $ = cheerio.load(response.data);
                const pageLinks = [];
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href && href.match(/\/ar\/fatwas\/\d+/) && !href.includes('page=')) {
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
                    await new Promise(res => setTimeout(res, 800));
                }
            }
            catch (err) {
                this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
                hasMorePages = false;
            }
        }
    }
    async extractFatwaData(rawItem) {
        const axios = require('axios');
        const https = require('https');
        const cheerio = require('cheerio');
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const response = await axios.get(rawItem.url, {
            headers: this.requestHeaders,
            httpsAgent,
            timeout: 15000,
        });
        const $ = cheerio.load(response.data);
        const questionSelectors = ['h1.page-header', '.field-name-title h2', 'h1', '.view-header h2'];
        const answerSelectors = ['.field-name-body .field-item', '.field-name-body', '.content', 'article', '.node-body'];
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
        if (!question)
            question = $('title').text().trim();
        if (!question || question.length < 3)
            throw new Error(`No question found at ${rawItem.url}`);
        if (!answer || answer.length < 10)
            throw new Error(`No answer found at ${rawItem.url}`);
        const attachments = this.extractor.extractAttachments(response.data, this.officialUrl);
        const urlParts = rawItem.url.split('/');
        const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();
        const scholar = await this.prisma.scholar.upsert({
            where: { slug: 'al-fawzan' },
            update: {},
            create: { name: 'صالح بن فوزان الفوزان', slug: 'al-fawzan' }
        });
        const categoryName = $('.field-name-field-category a').first().text().trim() || 'فتاوى عامة';
        const categorySlug = categoryName === 'فتاوى عامة' ? 'general' : categoryName.replace(/\s+/g, '-').substring(0, 50);
        const category = await this.prisma.category.upsert({
            where: { slug: categorySlug },
            update: {},
            create: { name: categoryName, slug: categorySlug }
        });
        return {
            slug: `fawzan-${fatwaId}`,
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
exports.FawzanImporter = FawzanImporter;
exports.FawzanImporter = FawzanImporter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        content_extractor_service_1.ContentExtractorService,
        keyword_extractor_service_1.KeywordExtractorService])
], FawzanImporter);
//# sourceMappingURL=fawzan.importer.js.map