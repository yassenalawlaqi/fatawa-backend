import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';

@Injectable()
export class BinBazImporter extends BaseImporterService {
  readonly sourceName = 'الموقع الرسمي للإمام ابن باز';
  readonly sourceSlug = 'binbaz-official';
  readonly officialUrl = 'https://binbaz.org.sa';

  constructor(
    protected readonly prisma: PrismaService,
    private readonly extractor: ContentExtractorService
  ) {
    super(prisma);
  }

  async fetchRawItems(): Promise<any[]> {
    this.logger.log(`Fetching listing pages for ${this.sourceName}...`);
    const allLinks: Set<string> = new Set();
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      this.logger.log(`Fetching ${this.sourceName} - Page ${currentPage}`);
      try {
        const html = await this.extractor.extractContent([
          {
            type: 'html',
            url: `${this.officialUrl}/fatwas/kind/1?page=${currentPage}`,
            extractFn: async (data) => data,
          }
        ]);

        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        
        const pageLinks: string[] = [];
        $('article.fatwa a').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/fatwas/')) {
            pageLinks.push(href.startsWith('http') ? href : `${this.officialUrl}${href}`);
          }
        });

        if (pageLinks.length === 0) {
          hasMorePages = false;
        } else {
          pageLinks.forEach(link => allLinks.add(link));
          currentPage++;
          // Optional: slight delay to avoid hammering the server aggressively
          await new Promise(res => setTimeout(res, 500));
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
        hasMorePages = false; // Stop on error
      }
    }

    this.logger.log(`Found a total of ${allLinks.size} fatwa URLs from ${this.sourceName}.`);
    
    // Return objects with just the URL, to save memory. HTML will be fetched per item.
    return Array.from(allLinks).map(url => ({ url }));
  }

  async extractFatwaData(rawItem: { url: string }): Promise<FatwaData> {
    // 1. Fetch HTML dynamically here to avoid OOM
    const html = await this.extractor.extractContent([
      {
        type: 'html',
        url: rawItem.url,
        extractFn: async (d) => d
      }
    ]);

    // 2. Relying on ContentExtractorService utility for HTML
    const extracted = this.extractor.extractHtml(html, 'h1.article-title, h1, h2.article-title__question', '.article-content, article');
    
    // The question in binbaz is usually in h2.article-title__question, let's refine parsing:
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    const questionText = $('.article-title__question').text().trim() || extracted.question;
    const answerText = $('.article-content').text().trim() || extracted.answer;

    if (!questionText || !answerText) {
      throw new Error(`Parsing failed for question or answer at ${rawItem.url}`);
    }

    // Media extraction
    const attachments = this.extractor.extractAttachments(html, this.officialUrl);

    const urlParts = rawItem.url.split('/');
    const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();

    // Ensure Scholar exists
    const scholar = await this.prisma.scholar.upsert({
      where: { slug: 'ibn-baz' },
      update: {},
      create: { name: 'عبدالعزيز بن عبدالله بن باز', slug: 'ibn-baz' }
    });

    // Default Category (Fallback)
    const categoryName = $('.categories__item').first().text().trim() || 'فتاوى عامة';
    const categorySlug = categoryName === 'فتاوى عامة' ? 'general' : categoryName.replace(/\\s+/g, '-');
    const category = await this.prisma.category.upsert({
      where: { slug: categorySlug },
      update: {},
      create: { name: categoryName, slug: categorySlug }
    });

    const dateText = $('.article-date').text() || '';
    const publishedAt = dateText ? new Date(dateText) : new Date();

    return {
      slug: `binbaz-${fatwaId}`,
      question: questionText,
      answer: answerText,
      url: rawItem.url,
      scholarId: scholar.id,
      categoryId: category.id,
      publishedAt: publishedAt,
      attachments: attachments,
    };
  }
}
