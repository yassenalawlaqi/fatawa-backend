import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SynonymService {
  private readonly logger = new Logger(SynonymService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Expands a search query with its synonyms
   * E.g., "الصيام" -> ["الصيام", "الصوم", "رمضان"]
   */
  async expandQuery(query: string): Promise<string[]> {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    const expanded = new Set<string>();

    for (const word of words) {
      expanded.add(word);
      try {
        const synonyms = await this.prisma.synonym.findMany({
          where: {
            OR: [
              { word: word },
              { synonym: word }
            ]
          }
        });

        synonyms.forEach(syn => {
          expanded.add(syn.word);
          expanded.add(syn.synonym);
        });
      } catch (e) {
        this.logger.warn(`Failed to fetch synonyms for ${word}: ${e.message}`);
      }
    }

    return Array.from(expanded);
  }

  /**
   * Generates a PostgreSQL FTS tsquery string with synonyms (OR logic)
   * Example: "الصيام" -> "(الصيام | الصوم | رمضان)"
   */
  async getExpandedTsQuery(query: string): Promise<string> {
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return '';

    const parts: string[] = [];
    for (const word of words) {
      const expandedWords = await this.expandQuery(word);
      if (expandedWords.length > 1) {
        parts.push(`(${expandedWords.join(' | ')})`);
      } else {
        parts.push(word);
      }
    }

    // Join multiple words with AND (&) in tsquery syntax
    return parts.join(' & ');
  }
}
