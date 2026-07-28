import { PrismaClient } from '@prisma/client';

export class TestDbUtil {
  private static prisma = new PrismaClient();

  static async wipeDatabase() {
    // Determine the environment to ensure we don't wipe production
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('wipeDatabase must only be called in test environment');
    }

    try {
      // Delete all records in correct order to avoid foreign key constraints
      await this.prisma.importJob.deleteMany();
      await this.prisma.$executeRawUnsafe('DELETE FROM search_index');
      await this.prisma.fatwa.deleteMany();
      await this.prisma.category.deleteMany();
      await this.prisma.scholar.deleteMany();
      await this.prisma.source.deleteMany();
    } catch (e) {
      console.error('Error wiping test database:', e);
      throw e;
    }
  }

  static getPrismaClient() {
    return this.prisma;
  }
}
