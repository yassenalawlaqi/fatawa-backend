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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlCleanerUtil = void 0;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const cheerio = __importStar(require("cheerio"));
class HtmlCleanerUtil {
    static extractText(html) {
        if (!html)
            return '';
        const $ = cheerio.load(html);
        $('br').replaceWith('\n');
        $('p, div, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
            $(el).append('\n');
        });
        const rawText = $.root().text();
        const cleanText = rawText
            .replace(/\n\s*\n/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .trim();
        return cleanText;
    }
    static sanitizeBasic(html) {
        if (!html)
            return '';
        return (0, sanitize_html_1.default)(html, {
            allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            allowedAttributes: {
                'a': ['href']
            }
        });
    }
    static normalizeArabic(text) {
        if (!text)
            return '';
        return text
            .replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[إأآا]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/[^\u0621-\u064A\s0-9]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
exports.HtmlCleanerUtil = HtmlCleanerUtil;
//# sourceMappingURL=html-cleaner.util.js.map