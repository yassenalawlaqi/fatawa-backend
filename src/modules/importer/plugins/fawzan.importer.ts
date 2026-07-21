import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';

@Injectable()
export class FawzanImporter extends BaseImporterService {
  readonly sourceName = 'الموقع الرسمي للشيخ صالح الفوزان';
  readonly sourceSlug = 'fawzan-official';
  readonly officialUrl = 'https://alfawzan.af.org.sa';

  constructor(
    protected readonly prisma: PrismaService,
    private readonly extractor: ContentExtractorService
  ) {
    super(prisma);
  }

  async fetchRawItems(): Promise<any[]> {
    this.logger.log(`Fetching listing page for ${this.sourceName}...`);
    const html = await this.extractor.extractContent([
      {
        type: 'html',
        url: `${this.officialUrl}/ar/fatwas`,
        extractFn: async (data) => data,
      }
    ]);

    const cheerio = require('cheerio');
    const $ = cheerio.load(html);
    
    const links: string[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.includes('/node/')) { // Drupal typical structure
        links.push(href.startsWith('http') ? href : `${this.officialUrl}${href}`);
      }
    });

    const uniqueLinks = [...new Set(links)];
    const targetLinks = uniqueLinks.slice(0, 5); 
    
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
    const extracted = this.extractor.extractHtml(rawItem.html, 'h1.page-header', '.field-name-body, .content');
    
    if (!extracted.question || !extracted.answer) {
      throw new Error('Parsing failed for question or answer');
    }

    const attachments = this.extractor.extractAttachments(rawItem.html, this.officialUrl);

    const urlParts = rawItem.url.split('/');
    const fatwaId = urlParts.find(part => part.trim() !== '' && !isNaN(Number(part))) || Date.now().toString();

    const scholar = await this.prisma.scholar.upsert({
      where: { slug: 'fawzan' },
      update: {},
      create: { name: 'صالح بن فوزان الفوزان', slug: 'fawzan' }
    });

    const category = await this.prisma.category.upsert({
      where: { slug: 'general' },
      update: {},
      create: { name: 'فتاوى عامة', slug: 'general' }
    });

    return {
      slug: `fawzan-${fatwaId}`,
      question: extracted.question,
      answer: extracted.answer,
      url: rawItem.url,
      scholarId: scholar.id,
      categoryId: category.id,
      publishedAt: new Date(),
      attachments: attachments,
    };
  }
}
