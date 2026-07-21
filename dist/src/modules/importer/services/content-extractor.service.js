"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ContentExtractorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentExtractorService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const cheerio = __importStar(require("cheerio"));
const html_cleaner_util_1 = require("../utils/html-cleaner.util");
let ContentExtractorService = ContentExtractorService_1 = class ContentExtractorService {
    logger = new common_1.Logger(ContentExtractorService_1.name);
    axiosClient;
    constructor() {
        this.axiosClient = axios_1.default.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });
        (0, axios_retry_1.default)(this.axiosClient, {
            retries: 3,
            retryDelay: axios_retry_1.default.exponentialDelay,
            retryCondition: (error) => {
                if (!error.response)
                    return true;
                const status = error.response.status;
                return [429, 500, 502, 503, 504].includes(status);
            },
            onRetry: (retryCount, error, requestConfig) => {
                this.logger.warn(`Retrying request (${retryCount}/3): ${requestConfig.url} - ${error.message}`);
            },
        });
    }
    async extractContent(strategies) {
        for (const strategy of strategies) {
            try {
                this.logger.log(`Attempting extraction using strategy: ${strategy.type} on ${strategy.url}`);
                const response = await this.axiosClient.get(strategy.url);
                const extractedData = await strategy.extractFn(response.data);
                if (extractedData) {
                    return extractedData;
                }
            }
            catch (error) {
                this.logger.warn(`Strategy ${strategy.type} failed for ${strategy.url}: ${error.message}`);
            }
        }
        throw new Error('All extraction strategies failed.');
    }
    extractHtml(html, questionSelector, answerSelector) {
        const $ = cheerio.load(html);
        const rawQuestion = $(questionSelector).first().text();
        const rawAnswerHtml = $(answerSelector).html() || '';
        const cleanQuestion = html_cleaner_util_1.HtmlCleanerUtil.extractText(rawQuestion);
        const cleanAnswer = html_cleaner_util_1.HtmlCleanerUtil.extractText(rawAnswerHtml);
        return { question: cleanQuestion, answer: cleanAnswer, rawAnswerHtml };
    }
    extractAttachments(html, baseUrl) {
        const $ = cheerio.load(html);
        const attachments = [];
        $('a[href$=".pdf"]').each((_, el) => {
            const url = $(el).attr('href');
            if (url) {
                attachments.push({
                    type: 'pdf',
                    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
                    title: $(el).text().trim() || 'ملف PDF',
                });
            }
        });
        $('audio source, a[href$=".mp3"], a[href$=".wav"]').each((_, el) => {
            const url = $(el).attr('src') || $(el).attr('href');
            if (url) {
                attachments.push({
                    type: 'audio',
                    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
                    title: 'ملف صوتي',
                });
            }
        });
        $('video source, a[href$=".mp4"]').each((_, el) => {
            const url = $(el).attr('src') || $(el).attr('href');
            if (url) {
                attachments.push({
                    type: 'video',
                    url: url.startsWith('http') ? url : `${baseUrl}${url}`,
                    title: 'مقطع مرئي',
                });
            }
        });
        return attachments;
    }
};
exports.ContentExtractorService = ContentExtractorService;
exports.ContentExtractorService = ContentExtractorService = ContentExtractorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ContentExtractorService);
//# sourceMappingURL=content-extractor.service.js.map