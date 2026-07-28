import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';
@Injectable()
export class PermanentCommitteeImporter extends BaseImporterService {
  readonly sourceName = 'اللجنة الدائمة للبحوث العلمية والإفتاء';
  readonly sourceSlug = 'committee-official';
  readonly officialUrl = 'https://alifta.gov.sa';

  constructor(
    protected readonly prisma: PrismaService,
    private readonly extractor: ContentExtractorService,
    protected readonly keywordExtractor: KeywordExtractorService
  ) {
    super(prisma, keywordExtractor);
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
            url: `${this.officialUrl}/Ar/IftaPages/default.aspx?page=${currentPage}`,
            extractFn: async (data) => data,
          }
        ]);

        const cheerio = require('cheerio');
        const $ = cheerio.load(html);
        
        const pageLinks: string[] = [];
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('Fatwa')) { 
            pageLinks.push(href.startsWith('http') ? href : `${this.officialUrl}${href}`);
          }
        });

        if (pageLinks.length === 0) {
          hasMorePages = false;
        } else {
          let addedNew = false;
          pageLinks.forEach(link => {
            if (!allLinks.has(link)) {
              allLinks.add(link);
              addedNew = true;
            }
          });
          
          if (!addedNew) {
            hasMorePages = false;
          } else {
            currentPage++;
            await new Promise(res => setTimeout(res, 500));
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
        hasMorePages = false;
      }
    }

    this.logger.log(`Found a total of ${allLinks.size} fatwa URLs from ${this.sourceName}.`);
    return Array.from(allLinks).map(url => ({ url }));
  }

  async extractFatwaData(rawItem: { url: string }): Promise<FatwaData> {
    const html = await this.extractor.extractContent([
      {
        type: 'html',
        url: rawItem.url,
        extractFn: async (d) => d
      }
    ]);

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
}
