import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { seedCategories } from './seeds/categories.seed';
import { seedSynonyms } from './seeds/synonyms.seed';

async function main() {
  console.log('Seeding database...');
  
  // Wipe old fatawa (Mock Data removal)
  await prisma.fatwa.deleteMany({});
  await prisma.searchLog.deleteMany({});
  await prisma.importJob.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.synonym.deleteMany({});

  // Create System Metadata
  await prisma.systemMetadata.upsert({
    where: { key: 'database_version' },
    update: {},
    create: { key: 'database_version', value: '1.0.0' },
  });

  // Create Scholars
  const scholars = [
    { slug: 'ibn-baz', name: 'عبدالعزيز بن عبدالله بن باز', description: 'مفتي عام المملكة العربية السعودية سابقاً' },
    { slug: 'ibn-uthaymeen', name: 'محمد بن صالح العثيمين', description: 'عالم وفقيه سعودي' },
    { slug: 'al-fawzan', name: 'صالح بن فوزان الفوزان', description: 'عضو هيئة كبار العلماء' },
    { slug: 'permanent-committee', name: 'اللجنة الدائمة للبحوث العلمية والإفتاء', description: 'اللجنة الدائمة للإفتاء في المملكة العربية السعودية' }
  ];

  for (const s of scholars) {
    await prisma.scholar.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  // Seed Hierarchical Categories
  await seedCategories(prisma);

  // Seed Synonyms
  await seedSynonyms(prisma);

  // Create Sources
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
