import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';
@Injectable()
export class FawzanImporter extends BaseImporterService {
  readonly sourceName = 'الموقع الرسمي للشيخ صالح الفوزان';
  readonly sourceSlug = 'fawzan-official';
  readonly officialUrl = 'https://alfawzan.af.org.sa';

  private readonly requestHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate',
    'Referer': 'https://alfawzan.af.org.sa/',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  constructor(
    protected readonly prisma: PrismaService,
    private readonly extractor: ContentExtractorService,
    protected readonly keywordExtractor: KeywordExtractorService
  ) {
    super(prisma, keywordExtractor);
  }

  async *fetchRawItems(startIndex: number): AsyncGenerator<any, void, unknown> {
    this.logger.log(`Fetching listing pages for ${this.sourceName}...`);
    let currentPage = 0;
    let hasMorePages = true;
    let currentItemIndex = 0;
    const seenLinks = new Set<string>();
    
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
        const pageLinks: string[] = [];
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
        } else {
          for (const link of pageLinks) {
            if (currentItemIndex >= startIndex) {
              yield { url: link };
            }
            currentItemIndex++;
          }
          currentPage++;
          await new Promise(res => setTimeout(res, 800));
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch page ${currentPage}: ${err.message}`);
        hasMorePages = false;
      }
    }
  }

  async extractFatwaData(rawItem: { url: string }): Promise<FatwaData> {
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
      if (text && text.length > 5) { question = text; break; }
    }

    let answer = '';
    for (const sel of answerSelectors) {
      const text = $(sel).text().trim();
      if (text && text.length > 20) { answer = text; break; }
    }

    if (!question) question = $('title').text().trim();
    if (!question || question.length < 3) throw new Error(`No question found at ${rawItem.url}`);
    if (!answer || answer.length < 10) throw new Error(`No answer found at ${rawItem.url}`);

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
}
