import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function verify() {
  console.log('=== 1. Database Direct Verification ===');
  
  // Directly querying the database
  const fatawa = await prisma.fatwa.findMany({
    where: {
      OR: [
        { question: { contains: 'جمعة مباركة' } },
        { answer: { contains: 'جمعة مباركة' } }
      ]
    },
    include: {
      scholar: true,
      keywords: { include: { keyword: true } }
    }
  });

  console.log(`Found ${fatawa.length} fatwas in DB matching 'جمعة مباركة':\n`);
  
  fatawa.forEach(f => {
    console.log(`- Scholar: ${f.scholar?.name}`);
    console.log(`  Slug: ${f.scholar?.slug}`);
    console.log(`  Question: ${f.question}`);
    console.log(`  Keywords: ${f.keywords.map(k => k.keyword.word).join(', ')}`);
    console.log('---');
  });

  console.log('\n=== 2. API Verification (Localhost) ===');
  try {
    // 1. General search
    const res1 = await axios.get('http://localhost:3000/public/search?q=' + encodeURIComponent('قول جمعة مباركة'));
    console.log(`\nGET /public/search?q=قول جمعة مباركة`);
    console.log(`Total Results: ${res1.data.pagination.total}`);
    if (res1.data.data.length > 0) {
      console.log(`Top Result: ${res1.data.data[0].questionTitle} (Scholar: ${res1.data.data[0].scholar}) (Score: ${res1.data.data[0].score})`);
    }

    // 2. Filtered search Ibn Baz
    const res2 = await axios.get('http://localhost:3000/public/search?q=' + encodeURIComponent('قول جمعة مباركة') + '&scholar=ibn-baz');
    console.log(`\nGET /public/search?q=قول جمعة مباركة&scholar=ibn-baz`);
    console.log(`Total Results: ${res2.data.pagination.total}`);
    if (res2.data.data.length > 0) {
      console.log(`Top Result: ${res2.data.data[0].questionTitle} (Scholar: ${res2.data.data[0].scholar})`);
    }

    // 3. Filtered search Fawzan
    const res3 = await axios.get('http://localhost:3000/public/search?q=' + encodeURIComponent('قول جمعة مباركة') + '&scholar=al-fawzan');
    console.log(`\nGET /public/search?q=قول جمعة مباركة&scholar=al-fawzan`);
    console.log(`Total Results: ${res3.data.pagination.total}`);
    if (res3.data.data.length > 0) {
      console.log(`Top Result: ${res3.data.data[0].questionTitle} (Scholar: ${res3.data.data[0].scholar})`);
    }

    // 4. Intent test 1
    const res4 = await axios.get('http://localhost:3000/public/search?q=' + encodeURIComponent('ما حكم قول جمعة مباركة'));
    console.log(`\nGET /public/search?q=ما حكم قول جمعة مباركة`);
    console.log(`Total Results: ${res4.data.pagination.total}`);
    if (res4.data.data.length > 0) {
      console.log(`Top Result: ${res4.data.data[0].questionTitle} (Score: ${res4.data.data[0].score})`);
    }

  } catch (e: any) {
    console.error('API Error:', e.message);
  }
}

verify().finally(() => prisma.$disconnect());
