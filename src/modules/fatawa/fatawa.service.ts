import { Injectable, NotFoundException } from '@nestjs/common';
import { FatawaRepository } from './fatawa.repository';

@Injectable()
export class FatawaService {
  constructor(private readonly repository: FatawaRepository) {}

  async getFatwaBySlug(slug: string) {
    const fatwa = await this.repository.findBySlug(slug);
    if (!fatwa) {
      throw new NotFoundException('Fatwa not found');
    }
    return fatwa;
  }

  async getRelatedFatawa(slug: string) {
    return this.repository.findRelated(slug);
  }

  async getFatawaByScholar(scholarSlug: string | null, scholarId: string | null, page: number, limit: number) {
    return this.repository.findByScholar(scholarSlug, scholarId, page, limit);
  }

  async getScholars() {
    return this.repository.getScholars();
  }

  async getCategories() {
    return this.repository.getCategories();
  }
}
