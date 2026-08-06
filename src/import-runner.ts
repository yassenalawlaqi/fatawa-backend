import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ImporterService } from './modules/importer/importer.service';
import { PrismaService } from './modules/prisma/prisma.service';

async function run() {
  console.log('=================================');
  console.log('   FATAWA IMPORTER RUNNER        ');
  console.log('=================================');
  const limit = process.env.IMPORT_LIMIT;
  console.log(`IMPORT_LIMIT = ${limit ? limit : 'UNLIMITED (0)'}`);
  console.log('Initializing Application Context...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const importerService = app.get(ImporterService);
  const prisma = app.get(PrismaService);

  const sources = [
    { slug: 'binbaz-official', name: 'ابن باز' },
    { slug: 'uthaymeen-official', name: 'ابن عثيمين' },
    { slug: 'fawzan-official', name: 'الفوزان' },
    { slug: 'committee-official', name: 'اللجنة الدائمة' }
  ];

  // Fix Uthaymeen and Committee slugs in the array if they are different
  // Let's check the sourceSlugs inside the plugins.
  // binbaz-official, uthaymeen-official, fawzan-official, committee-official are correct based on typical naming.
  // Wait, let's look at the source slugs in the plugins.
  
  const results: any[] = [];
  const startTime = Date.now();

  for (const src of sources) {
    console.log(`\n>>> بدء استيراد فتاوى: ${src.name} <<<`);
    try {
      const result = await importerService.executeImport(src.slug);
      results.push({ name: src.name, ...result });
    } catch (e) {
      console.error(`X فشل استيراد ${src.name}:`, e.message);
      results.push({ name: src.name, status: 'failed', imported: 0, duplicated: 0, failed: 0, details: e.message });
    }
  }

  const totalTimeMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n=========================');
  console.log('IMPORT REPORT');
  console.log('=========================');

  let totalFatwas = 0;

  for (const res of results) {
    console.log(`\n${res.name}`);
    console.log(`الجديد: ${res.imported || 0}`);
    console.log(`المكرر: ${res.duplicated || 0}`);
    console.log(`الفاشل: ${res.failed || 0}`);
    
    totalFatwas += (res.imported || 0);
  }

  console.log('\nالإجمالي:');
  console.log(`${totalFatwas} فتوى جديدة تم استيرادها`);
  
  console.log(`\nالمدة:`);
  console.log(`${totalTimeMinutes} دقيقة`);
  console.log('=========================');

  await app.close();
  process.exit(0);
}

run();
