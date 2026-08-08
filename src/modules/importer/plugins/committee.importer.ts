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
    // Reverse array to ensure older items are processed first for proper Checkpoint (startIndex) handling
    return Array.from(allLinks).map(url => ({ url })).reverse();
  }

  async extractFatwaData(rawItem: { url: string }): Promise<FatwaData> {
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
}
