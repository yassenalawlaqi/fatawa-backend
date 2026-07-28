"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const categories_seed_1 = require("./seeds/categories.seed");
const synonyms_seed_1 = require("./seeds/synonyms.seed");
async function main() {
    console.log('Seeding database...');
    await prisma.fatwa.deleteMany({});
    await prisma.searchLog.deleteMany({});
    await prisma.importJob.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.synonym.deleteMany({});
    await prisma.systemMetadata.upsert({
        where: { key: 'database_version' },
        update: {},
        create: { key: 'database_version', value: '1.0.0' },
    });
    const scholars = [
        { slug: 'ibn-baz', name: 'عبدالعزيز بن عبدالله بن باز', description: 'مفتي عام المملكة العربية السعودية سابقاً' },
        { slug: 'ibn-uthaymeen', name: 'محمد بن صالح العثيمين', description: 'عالم وفقيه سعودي' },
        { slug: 'al-fawzan', name: 'صالح بن فوزان الفوزان', description: 'عضو هيئة كبار العلماء' },
        { slug: 'permanent-committee', name: 'اللجنة الدائمة للبحوث العلمية والإفتاء', description: 'اللجنة الدائمة للإفتاء في المملكة العربية السعودية' }
    ];
    for (const s of scholars) {
        await prisma.scholar.upsert({ where: { slug: s.slug }, update: {}, create: s });
    }
    await (0, categories_seed_1.seedCategories)(prisma);
    await (0, synonyms_seed_1.seedSynonyms)(prisma);
    const sources = [
        { slug: 'binbaz-official', name: 'الموقع الرسمي للإمام ابن باز', type: 'official_website', officialUrl: 'https://binbaz.org.sa' },
        { slug: 'uthaymeen-official', name: 'الموقع الرسمي للشيخ ابن عثيمين', type: 'official_website', officialUrl: 'https://binothaimeen.net' },
        { slug: 'fawzan-official', name: 'الموقع الرسمي للشيخ الفوزان', type: 'official_website', officialUrl: 'https://alfawzan.af.org.sa' },
        { slug: 'alifta-official', name: 'موقع الرئاسة العامة للبحوث العلمية والإفتاء', type: 'official_website', officialUrl: 'https://www.alifta.gov.sa' }
    ];
    for (const src of sources) {
        await prisma.source.upsert({ where: { slug: src.slug }, update: {}, create: src });
    }
    console.log('Database seeding completed.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map