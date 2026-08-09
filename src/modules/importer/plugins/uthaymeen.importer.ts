import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';
@Injectable()
export class UthaymeenImporter extends BaseImporterService {
  readonly sourceName = 'موقع الشيخ محمد بن صالح العثيمين';
  readonly sourceSlug = 'uthaymeen-official';
  readonly officialUrl = 'https://old.binothaimeen.net';

  constructor(
    protected readonly prisma: PrismaService,
    private readonly extractor: ContentExtractorService,
    protected readonly keywordExtractor: KeywordExtractorService
  ) {
    super(prisma, keywordExtractor);
  }

  async *fetchRawItems(startIndex: number): AsyncGenerator<any, void, unknown> {
    this.logger.log(`Fetching listing pages for ${this.sourceName}...`);
    let currentPage = 1;
    let hasMorePages = true;
    let currentItemIndex = 0;
    const seenLinks = new Set<string>();

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
        
        const pageLinks: string[] = [];
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
        } else {
          for (const link of pageLinks) {
            if (currentItemIndex >= startIndex) {
              yield { url: link };
            }
            currentItemIndex++;
          }
          currentPage++;
          await new Promise(res => setTimeout(res, 500));
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
        hasMorePages = false;
      }
    }
  }

  async extractFatwaData(rawItem: { url: string }): Promise<FatwaData> {
    const cheerio = require('cheerio');
    const html = await this.extractor.extractContent([
      {
        type: 'html',
        url: rawItem.url,
        extractFn: async (d) => d
      }
    ]);

    const $ = cheerio.load(html);

    // old.binothaimeen.net Yii framework selectors (try multiple fallbacks)
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

    // If still no question, use the page title
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
}
