import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import * as cheerio from 'cheerio';
import { HtmlCleanerUtil } from '../utils/html-cleaner.util';

export interface ExtractionStrategy {
  type: 'api' | 'rss' | 'html';
  url: string;
  extractFn: (data: any) => Promise<any>;
}

@Injectable()
export class ContentExtractorService {
  private readonly logger = new Logger(ContentExtractorService.name);
  private axiosClient: AxiosInstance;

  constructor() {
    this.axiosClient = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    });

    // Configure Exponential Backoff Retry Policy
    axiosRetry(this.axiosClient, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry only on specific status codes or network errors
        if (!error.response) return true; // Network error
        const status = error.response.status;
        return [429, 500, 502, 503, 504].includes(status);
      },
      onRetry: (retryCount, error, requestConfig) => {
        this.logger.warn(`Retrying request (${retryCount}/3): ${requestConfig.url} - ${error.message}`);
      },
    });
  }

  /**
   * Executes the extraction strategy in order of preference.
   */
  async extractContent(strategies: ExtractionStrategy[]): Promise<any> {
    for (const strategy of strategies) {
      try {
        this.logger.log(`Attempting extraction using strategy: ${strategy.type} on ${strategy.url}`);
        const response = await this.axiosClient.get(strategy.url);
        
        const extractedData = await strategy.extractFn(response.data);
        if (extractedData) {
          return extractedData;
        }
      } catch (error) {
        this.logger.warn(`Strategy ${strategy.type} failed for ${strategy.url}: ${error.message}`);
        // Continue to the next strategy if available
      }
    }
    throw new Error('All extraction strategies failed.');
  }

  /**
   * Utility to safely extract HTML content
   */
  extractHtml(html: string, questionSelector: string, answerSelector: string): { question: string, answer: string, rawAnswerHtml: string } {
    const $ = cheerio.load(html);
    
    const rawQuestion = $(questionSelector).first().text();
    const rawAnswerHtml = $(answerSelector).html() || '';
    
    const cleanQuestion = HtmlCleanerUtil.extractText(rawQuestion);
    const cleanAnswer = HtmlCleanerUtil.extractText(rawAnswerHtml);

    return { question: cleanQuestion, answer: cleanAnswer, rawAnswerHtml };
  }

  /**
   * Utility to extract media attachments
   */
  extractAttachments(html: string, baseUrl: string): { type: string, url: string, title: string }[] {
    const $ = cheerio.load(html);
    const attachments: { type: string, url: string, title: string }[] = [];

    // PDF Links
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

    // Audio Links
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

    // Video Links
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
}
