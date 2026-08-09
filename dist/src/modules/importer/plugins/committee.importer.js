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
const keyword_extractor_service_1 = require("../../search/keyword-extractor.service");
let PermanentCommitteeImporter = class PermanentCommitteeImporter extends base_importer_service_1.BaseImporterService {
    prisma;
    extractor;
    keywordExtractor;
    sourceName = 'اللجنة الدائمة للبحوث العلمية والإفتاء';
    sourceSlug = 'committee-official';
    officialUrl = 'https://alifta.gov.sa';
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
        const axios = require('axios');
        const https = require('https');
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
            'Referer': this.officialUrl,
            'Connection': 'keep-alive',
            'Cookie': 'ASP.NET_SessionId=abcdef1234567890abcdef12;',
            'Upgrade-Insecure-Requests': '1'
        };
        while (hasMorePages) {
            this.logger.log(`Fetching ${this.sourceName} - Page ${currentPage}`);
            try {
                const response = await axios.get(`${this.officialUrl}/Ar/IftaPages/default.aspx?page=${currentPage}`, {
                    headers,
                    httpsAgent,
                    timeout: 15000
                });
                const html = response.data;
                const cheerio = require('cheerio');
                const $ = cheerio.load(html);
                const pageLinks = [];
                $('a').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href && href.includes('Fatwa')) {
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
        const axios = require('axios');
        const https = require('https');
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
            'Referer': this.officialUrl,
            'Connection': 'keep-alive',
            'Cookie': 'ASP.NET_SessionId=abcdef1234567890abcdef12;',
            'Upgrade-Insecure-Requests': '1'
        };
        const response = await axios.get(rawItem.url, {
            headers,
            httpsAgent,
            timeout: 15000
        });
        const html = response.data;
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
        content_extractor_service_1.ContentExtractorService,
        keyword_extractor_service_1.KeywordExtractorService])
], PermanentCommitteeImporter);
//# sourceMappingURL=committee.importer.js.map