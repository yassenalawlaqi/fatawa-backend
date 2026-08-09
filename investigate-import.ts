import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('==============================================');
  console.log('المرحلة الأولى: عدد الفتاوى لكل عالم من قاعدة البيانات');
  console.log('==============================================');
  const counts = await prisma.$queryRawUnsafe(`
    SELECT s.slug, s.name, COUNT(f.id)::int AS total
    FROM scholars s
    LEFT JOIN fatawa f ON f.scholar_id = s.id
    GROUP BY s.id
    ORDER BY total DESC;
  `);
  console.table(counts);

  console.log('\n==============================================');
  console.log('المرحلة الثانية: آخر 20 فتوى تم استيرادها');
  console.log('==============================================');
  const last20 = await prisma.$queryRawUnsafe(`
    SELECT f.id, substring(f.question from 1 for 40) as question_snippet, s.name, s.slug, f.created_at
    FROM fatawa f
    JOIN scholars s ON s.id = f.scholar_id
    ORDER BY f.created_at DESC
    LIMIT 20;
  `);
  console.table(last20);

  console.log('\n==============================================');
  console.log('المرحلة الثالثة: التحقق من Search Index للـ 20 فتوى الجديدة');
  console.log('==============================================');
  if (Array.isArray(last20) && last20.length > 0) {
    const ids = last20.map(f => `'${f.id}'`).join(',');
    const searchIndexes = await prisma.$queryRawUnsafe(`
      SELECT 
        fatwa_id, 
        substring(normalized_text from 1 for 20) as text_snippet, 
        CASE WHEN search_vector IS NULL THEN 'NULL' ELSE 'EXISTS' END as search_vector_status 
      FROM search_index 
      WHERE fatwa_id IN (${ids});
    `);
    console.table(searchIndexes);
    
    // Check if any search_vector is missing
    const missing = (searchIndexes as any[]).filter(s => s.search_vector_status === 'NULL');
    if (missing.length > 0 || (searchIndexes as any[]).length < last20.length) {
      console.log('⚠️ تحذير: بعض الفتاوى الجديدة ليس لها Search Index أو Search Vector مكتمل!');
    } else {
      console.log('✅ جميع الفتاوى الحديثة تمتلك Search Index صحيح.');
    }
  }

  console.log('\n==============================================');
  console.log('المرحلة الرابعة: البحث المباشر داخل PostgreSQL (عن كلمة جمعة)');
  console.log('==============================================');
  
  const scholars = ['ibn-uthaymeen', 'ibn-baz', 'al-fawzan', 'permanent-committee'];
  
  for (const slug of scholars) {
    const result = await prisma.$queryRawUnsafe(`
      SELECT count(f.id)::int as match_count
      FROM fatawa f
      WHERE f.scholar_id = (SELECT id FROM scholars WHERE slug='${slug}')
      AND (f.question ILIKE '%جمعة%' OR f.answer ILIKE '%جمعة%');
    `);
    console.log(`- بحث PostgreSQL المباشر عن (جمعة) للشيخ [${slug}]: ${(result as any)[0].match_count} نتيجة.`);
  }

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
