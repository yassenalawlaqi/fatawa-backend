export interface ImportResult {
  source: string;
  status: 'success' | 'failed';
  imported: number;
  updated: number;
  duplicated: number;
  skipped: number;
  failed: number;
  executionTime: number; // in MS
  details?: string;
}

export interface FatwaData {
  slug: string;
  question: string;
  answer: string;
  scholarId: string;
  categoryId: string;
  sourceBook?: string;
  volume?: string;
  page?: string;
  officialUrl?: string;
  publishedAt?: Date;
  url?: string;
  sourceId?: string;
  attachments?: { type: string, url: string, title?: string }[];
}

export interface IImporter {
  readonly sourceName: string;
  readonly sourceSlug: string;

  /**
   * Execute the full import pipeline for this source.
   */
  runImportPipeline(): Promise<ImportResult>;
}
