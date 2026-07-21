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
    this.logger.log(`Fetching listing page for ${this.sourceName}...`);
    // Attempting to use the extractor on the index page
    const html = await this.extractor.extractContent([
      {
        type: 'html',
        url: `${this.officialUrl}/fatwas`,
        extractFn: async (data) => data,
      }
    ]);

    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const links: string[] = [];
    $('article a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/fatwas/')) {
        links.push(href.startsWith('http') ? href : `${this.officialUrl}${href}`);
      }
    });

    const uniqueLinks = [...new Set(links)];
    const targetLinks = uniqueLinks.slice(0, 5); // PoC limit
    
    const rawItems: { url: string; html: any }[] = [];
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
      } catch (err) {
        this.logger.warn(`Failed to fetch detail for ${link}`);
      }
    }

    return rawItems;
  }

  async extractFatwaData(rawItem: { url: string; html: string }): Promise<FatwaData> {
    // Relying on ContentExtractorService utility for HTML
    const extracted = this.extractor.extractHtml(rawItem.html, 'h1.article-title, h1', '.article-content, article');
    
    if (!extracted.question || !extracted.answer) {
      throw new Error('Parsing failed for question or answer');
    }

    // Media extraction
    const attachments = this.extractor.extractAttachments(rawItem.html, this.officialUrl);

    const urlParts = rawItem.url.split('/');
    const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();

    // Ensure Scholar exists
    const scholar = await this.prisma.scholar.upsert({
      where: { slug: 'ibn-baz' },
      update: {},
      create: { name: 'عبدالعزيز بن عبدالله بن باز', slug: 'ibn-baz' }
    });

    // Default Category (Fallback)
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
}
