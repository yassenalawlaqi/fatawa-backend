import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KeywordExtractorService {
  private readonly logger = new Logger(KeywordExtractorService.name);
  
  // Pre-defined set of core Islamic terms for rule-based extraction
  private readonly coreTerms = new Set([
    'توحيد', 'شرك', 'بدعة', 'عقيدة', 'إيمان', 'كفر', 'نفاق',
    'وضوء', 'غسل', 'تيمم', 'طهارة', 'حيض', 'نفاس', 'جنابة',
    'صلاة', 'أذان', 'إقامة', 'جماعة', 'جمعة', 'سنن', 'وتر',
    'زكاة', 'صدقة', 'نصاب', 'حول',
    'صيام', 'صوم', 'رمضان', 'قضاء', 'كفارة', 'فدية', 'اعتكاف',
    'حج', 'عمرة', 'طواف', 'سعي', 'إحرام', 'ميقات',
    'بيع', 'ربا', 'إجارة', 'وقف', 'وصية', 'ميراث',
    'نكاح', 'طلاق', 'خلع', 'عدة', 'رضاع', 'نفقة',
    'جنائز', 'أيمان', 'نذور', 'أطعمة', 'أشربة', 'لباس'
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Rule-based extraction of keywords from fatwa content
   */
  async extractKeywords(params: { question: string, answer: string, categoryName?: string }): Promise<string[]> {
    const textToAnalyze = `${params.question} ${params.answer} ${params.categoryName || ''}`.toLowerCase();
    const extracted = new Set<string>();

    // 1. Category Name (Directly)
    if (params.categoryName) {
      extracted.add(params.categoryName.trim());
    }

    // 2. Scan for Core Terms
    for (const term of this.coreTerms) {
      if (textToAnalyze.includes(term)) {
        extracted.add(term);
      }
    }

    // 3. Scan Synonyms DB for Matches
    // We fetch all synonyms (or cache them in memory for performance)
    try {
      const allSynonyms = await this.prisma.synonym.findMany();
      for (const syn of allSynonyms) {
        if (textToAnalyze.includes(syn.synonym.toLowerCase())) {
          extracted.add(syn.word);
          extracted.add(syn.synonym); // Add the synonym itself as a keyword
        }
        if (textToAnalyze.includes(syn.word.toLowerCase())) {
          extracted.add(syn.word);
          extracted.add(syn.synonym);
        }
      }
    } catch (e) {
      this.logger.warn(`Failed to consult synonyms table: ${e.message}`);
    }

    // 4. Extract Frequent Nouns (Very basic heuristic)
    // Remove stop words and find words length > 4 that appear multiple times
    const stopWords = ['في', 'من', 'على', 'إلى', 'عن', 'هل', 'كيف', 'ما', 'متى', 'حكم', 'هذا', 'هذه', 'الذي', 'التي', 'أن', 'إن', 'ولا', 'وما'];
    const words = params.question.split(/\s+/).map(w => w.replace(/[^\w\u0600-\u06FF]/g, ''));
    
    words.forEach(word => {
      if (word.length >= 4 && !stopWords.includes(word)) {
        // Just add prominent words from the question as potential keywords
        extracted.add(word);
      }
    });

    return Array.from(extracted).slice(0, 15); // Return top ~15 keywords
  }
}
