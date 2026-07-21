import sanitizeHtml from 'sanitize-html';
import * as cheerio from 'cheerio';

export class HtmlCleanerUtil {
  /**
   * Cleans HTML content, keeping only safe text and basic formatting if necessary.
   * For Fatawa, we strictly extract plain text but preserve line breaks.
   */
  static extractText(html: string): string {
    if (!html) return '';

    // First, use cheerio to format block elements with newlines
    const $ = cheerio.load(html);
    $('br').replaceWith('\n');
    $('p, div, h1, h2, h3, h4, h5, h6, li').each((_, el) => {
      $(el).append('\n');
    });

    const rawText = $.root().text();

    // Clean up excessive whitespace
    const cleanText = rawText
      .replace(/\n\s*\n/g, '\n\n') // Collapse multiple newlines into max 2
      .replace(/[ \t]+/g, ' ')      // Collapse multiple spaces into 1
      .trim();

    return cleanText;
  }

  /**
   * Sanitizes HTML, preventing XSS but allowing basic tags.
   */
  static sanitizeBasic(html: string): string {
    if (!html) return '';
    return sanitizeHtml(html, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      allowedAttributes: {
        'a': ['href']
      }
    });
  }

  /**
   * Normalizes Arabic text (removing tashkeel, normalizing Alef, etc.)
   * Useful for internal duplication checking and search indexing.
   */
  static normalizeArabic(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics (Tashkeel)
      .replace(/[إأآا]/g, 'ا')              // Normalize Alef
      .replace(/ة/g, 'ه')                   // Normalize Teh Marbuta to Heh
      .replace(/ى/g, 'ي')                   // Normalize Alef Maksura to Yeh
      .replace(/[^\u0621-\u064A\s0-9]/g, '') // Keep only Arabic letters, numbers, and spaces
      .replace(/\s+/g, ' ')                 // Collapse spaces
      .trim();
  }
}
