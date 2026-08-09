import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== المرحلة الأولى: عدد الفتاوى لكل عالم ===');
  const counts = await prisma.$queryRawUnsafe(`
    SELECT
      s.slug,
      s.name,
      COUNT(f.id)::int AS total
    FROM scholars s
    LEFT JOIN fatawa f ON f.scholar_id = s.id
    GROUP BY s.id
    ORDER BY total DESC;
  `);
  console.table(counts);

  console.log('\n=== المرحلة الثانية: الـ Slugs ===');
  console.log('--- جميع العلماء ---');
  const scholars = await prisma.$queryRawUnsafe(`
    SELECT id, name, slug FROM scholars;
  `);
  console.table(scholars);

  console.log('--- Slugs الموجودة فعلاً داخل الفتاوى ---');
  const usedSlugs = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT s.slug
    FROM fatawa f
    JOIN scholars s ON s.id = f.scholar_id;
  `);
  console.table(usedSlugs);

  console.log('\n=== المرحلة الثالثة: عدد الفتاوى لكل scholar_id ===');
  const fatwaByScholarId = await prisma.$queryRawUnsafe(`
    SELECT scholar_id, COUNT(id)::int as fatwa_count
    FROM fatawa
    GROUP BY scholar_id
    ORDER BY fatwa_count DESC;
  `);
  console.table(fatwaByScholarId);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
