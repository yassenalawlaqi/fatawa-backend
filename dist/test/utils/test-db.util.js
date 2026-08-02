"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDbUtil = void 0;
const client_1 = require("@prisma/client");
class TestDbUtil {
    static prisma = new client_1.PrismaClient();
    static async wipeDatabase() {
        if (process.env.NODE_ENV !== 'test') {
            throw new Error('wipeDatabase must only be called in test environment');
        }
        try {
            await this.prisma.importJob.deleteMany();
            await this.prisma.$executeRawUnsafe('DELETE FROM search_index');
            await this.prisma.fatwa.deleteMany();
            await this.prisma.category.deleteMany();
            await this.prisma.scholar.deleteMany();
            await this.prisma.source.deleteMany();
        }
        catch (e) {
            console.error('Error wiping test database:', e);
            throw e;
        }
    }
    static getPrismaClient() {
        return this.prisma;
    }
}
exports.TestDbUtil = TestDbUtil;
//# sourceMappingURL=test-db.util.js.map