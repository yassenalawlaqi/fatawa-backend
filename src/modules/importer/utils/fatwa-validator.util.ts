import { Logger } from '@nestjs/common';
import { FatwaData } from '../interfaces/i-importer.interface';

export class FatwaValidator {
  private static readonly logger = new Logger(FatwaValidator.name);

  static validate(data: FatwaData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Question validation
    if (!data.question || data.question.trim().length === 0) {
      errors.push('Question is empty.');
    }

    // 2. Answer validation
    if (!data.answer || data.answer.trim().length < 10) {
      errors.push('Answer is empty or less than 10 characters.');
    }

    // 3. URL validation
    if (!data.url || !data.url.startsWith('http')) {
      errors.push('Invalid official URL.');
    }

    // 4. Source / Scholar placeholders check
    if (!data.scholarId && !data.sourceId) {
      // In this system, we usually assign scholarId inside the importer pipeline before saving,
      // but it's good to ensure that by the time it reaches the DB, it's valid.
      // This validator can be run post-mapping.
    }

    if (errors.length > 0) {
      this.logger.warn(`Validation failed for ${data.url || 'Unknown'}: ${errors.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
