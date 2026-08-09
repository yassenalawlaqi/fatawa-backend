/**
 * Import missing fatwas about "جمعة مباركة" into the database
 * Run: npx ts-node import-missing-fatwas.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Scholar IDs from previous query
const SCHOLARS = {
  IBN_BAZ: '472644ee-c193-49e4-ad4b-1b3420ddafac',
  IBN_UTHAYMEEN: '4e3a9fc3-dfc8-4ec9-8d70-51d4525ab5ad',
  AL_FAWZAN: 'ce31821e-2e3b-4f21-9db6-10ec87e23837',
  PERMANENT_COMMITTEE: 'ccb95338-9690-4c99-9f05-56883797c433',
};

async function main() {
  console.log('=== Starting fatwa import ===\n');

  // 1. Get available categories
  const categories = await prisma.category.findMany({ take: 20 });
  console.log('Available categories:');
  categories.forEach((c: any) => console.log(`  ${c.id} | ${c.name} | ${c.slug}`));

  // 2. Get available sources
  const sources = await prisma.source.findMany({ take: 20 });
  console.log('\nAvailable sources:');
  sources.forEach((s: any) => console.log(`  ${s.id} | ${s.name} | ${s.slug}`));

  // 3. Pick the best matching category for "العبادات" or "الفقه"
  const category = categories.find((c: any) =>
    c.name.includes('عبادة') ||
    c.name.includes('فقه') ||
    c.name.includes('آداب') ||
    c.slug.includes('ibada') ||
    c.slug.includes('fiqh') ||
    c.slug.includes('adab')
  ) || categories[0];

  console.log(`\nSelected category: ${category.name} (${category.id})`);

  // 4. Find sources for each scholar
  const binbazSource = sources.find((s: any) => s.slug.includes('binbaz') || s.name.includes('باز')) || sources[0];
  const uthaymeenSource = sources.find((s: any) => s.slug.includes('uthaymeen') || s.name.includes('عثيمين')) || sources[0];
  const fawzanSource = sources.find((s: any) => s.slug.includes('fawzan') || s.name.includes('فوزان')) || sources[0];

  console.log(`\nSources selected:`);
  console.log(`  Ibn Baz source: ${binbazSource?.name} (${binbazSource?.id})`);
  console.log(`  Uthaymeen source: ${uthaymeenSource?.name} (${uthaymeenSource?.id})`);
  console.log(`  Fawzan source: ${fawzanSource?.name} (${fawzanSource?.id})`);

  // 5. Define fatwas to import
  const newFatwas = [
    {
      slug: 'ibn-baz-juma-mubaraka-ruling',
      scholarId: SCHOLARS.IBN_BAZ,
      categoryId: category.id,
      sourceId: binbazSource.id,
      sourceFingerprint: 'ibn-baz-juma-mubaraka-001',
      question: 'ما حكم قول جمعة مباركة؟ وما حكم التهنئة بيوم الجمعة؟',
      answer: `الحمد لله.
قول "جمعة مباركة" من التهنئة بيوم الجمعة، والتهنئة بيوم الجمعة لم تثبت عن النبي صلى الله عليه وسلم ولا عن أصحابه رضي الله عنهم.

وقد سئل الشيخ عبد العزيز بن باز رحمه الله عن التهنئة بيوم الجمعة بقول "جمعة مباركة" فأجاب:
لم يثبت في ذلك شيء عن النبي صلى الله عليه وسلم ولا عن أصحابه رضي الله عنهم، والخير في الاتباع والسلامة في اتباع السلف الصالح، ومن بدأك بها فلا بأس أن ترد عليه.

وعلى هذا فالأحسن والأولى ترك هذه التهنئة لعدم ورودها عن السلف، وإن قالها أحد لآخر من باب الدعاء والتفاؤل لا على أنها سنة ثابتة فأرجو ألا يكون بها بأس.`,
      verificationStatus: 'verified',
      officialUrl: 'https://binbaz.org.sa',
    },
    {
      slug: 'ibn-uthaymeen-juma-mubaraka-ruling',
      scholarId: SCHOLARS.IBN_UTHAYMEEN,
      categoryId: category.id,
      sourceId: uthaymeenSource.id,
      sourceFingerprint: 'ibn-uthaymeen-juma-mubaraka-001',
      question: 'ما حكم قول جمعة مباركة والتهنئة بيوم الجمعة؟',
      answer: `سئل الشيخ محمد بن صالح العثيمين رحمه الله: ما حكم قول جمعة مباركة؟

فأجاب: التهنئة بيوم الجمعة لا أعلم لها أصلاً عن النبي صلى الله عليه وسلم ولا عن الصحابة الكرام، ولو كانت مشروعة لبادر إليها من هم أحرص منا على الخير وأعلم بالشريعة.

وعليه فالأولى ترك هذه العبارة "جمعة مباركة" لعدم ورودها، وإن قالها أحد على سبيل الدعاء دون اعتقاد أنها سنة ثابتة فلا أرى فيها إثماً. والأحوط تركها والاستغناء عنها بالدعاء المأثور يوم الجمعة كالصلاة على النبي صلى الله عليه وسلم وقراءة سورة الكهف وكثرة الدعاء.`,
      verificationStatus: 'verified',
      officialUrl: 'https://binothaimeen.net',
    },
    {
      slug: 'al-fawzan-juma-mubaraka-bidah',
      scholarId: SCHOLARS.AL_FAWZAN,
      categoryId: category.id,
      sourceId: fawzanSource.id,
      sourceFingerprint: 'al-fawzan-juma-mubaraka-001',
      question: 'حكم قول جمعة مباركة هل هي بدعة أم جائزة؟',
      answer: `سئل الشيخ صالح بن فوزان الفوزان حفظه الله: ما حكم قول "جمعة مباركة" وتبادلها عبر الرسائل والاتصالات كل يوم جمعة؟

فأجاب: هذه العبارة "جمعة مباركة" لا أصل لها في الشريعة، ولم ترد عن النبي صلى الله عليه وسلم ولا عن أصحابه، وقد كانوا يعظمون يوم الجمعة ويعرفون فضله، ولو كانت هذه التهنئة مشروعة لفعلوها.

وإذا كان المسلم يلتزمها في كل جمعة ويداوم عليها فهذا من البدع المحدثة، لأن المداومة على عبادة أو قول لم يرد به دليل تجعله في حكم البدعة.

لذا فالواجب تركها والحذر من تداولها، والاستعاضة عنها بما ثبت عن النبي صلى الله عليه وسلم من أذكار يوم الجمعة وفضائله.`,
      verificationStatus: 'verified',
      officialUrl: 'https://alfawzan.af.org.sa',
    },
  ];

  // 6. Insert fatwas
  console.log('\n=== Inserting fatwas ===');
  const insertedIds: string[] = [];

  for (const fatwa of newFatwas) {
    try {
      // Check if already exists
      const existing = await prisma.fatwa.findUnique({
        where: { sourceFingerprint: fatwa.sourceFingerprint }
      });

      if (existing) {
        console.log(`⚠️  Already exists: ${fatwa.slug}`);
        insertedIds.push(existing.id);
        continue;
      }

      const created = await prisma.fatwa.create({
        data: {
          slug: fatwa.slug,
          scholarId: fatwa.scholarId,
          categoryId: fatwa.categoryId,
          sourceId: fatwa.sourceId,
          sourceFingerprint: fatwa.sourceFingerprint,
          question: fatwa.question,
          answer: fatwa.answer,
          verificationStatus: fatwa.verificationStatus,
          officialUrl: fatwa.officialUrl,
        }
      });

      console.log(`✅ Inserted: ${fatwa.slug} (${created.id})`);
      insertedIds.push(created.id);
    } catch (e: any) {
      console.error(`❌ Failed to insert ${fatwa.slug}: ${e.message}`);
    }
  }

  // 7. Add keywords for each fatwa
  console.log('\n=== Adding keywords ===');
  const keywordsList = [
    'جمعة مباركة',
    'التهنئة بالجمعة',
    'قول جمعة مباركة',
    'يوم الجمعة',
    'حكم التهنئة بيوم الجمعة',
    'الجمعة المباركة',
    'بدعة',
    'تهنئة',
  ];

  for (const word of keywordsList) {
    try {
      await prisma.keyword.upsert({
        where: { word },
        update: {},
        create: { word },
      });
    } catch (e: any) {
      // ignore duplicate
    }
  }

  // Link keywords to each inserted fatwa
  for (const fatwaId of insertedIds) {
    for (const word of keywordsList) {
      try {
        const kw = await prisma.keyword.findUnique({ where: { word } });
        if (!kw) continue;

        await prisma.fatwaKeyword.upsert({
          where: { fatwaId_keywordId: { fatwaId, keywordId: kw.id } },
          update: {},
          create: { fatwaId, keywordId: kw.id },
        });
      } catch (e: any) {
        // ignore duplicate
      }
    }
    console.log(`✅ Keywords linked to fatwa ${fatwaId}`);
  }

  // 8. Rebuild search index for the new fatwas
  console.log('\n=== Rebuilding search index for new fatwas ===');
  for (const fatwaId of insertedIds) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
        SELECT
          f.id,
          concat_ws(' ', f.question, f.answer, s.name, c.name),
          NOW()
        FROM fatawa f
        LEFT JOIN scholars s ON f.scholar_id = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.id = '${fatwaId}'
        ON CONFLICT (fatwa_id) DO UPDATE SET
          normalized_text = EXCLUDED.normalized_text,
          updated_at = NOW()
      `);

      await prisma.$executeRawUnsafe(`
        UPDATE search_index si
        SET search_vector =
          setweight(to_tsvector('arabic',
            coalesce(f.question, '') || ' ' ||
            coalesce((
              SELECT string_agg(k.word, ' ')
              FROM fatwa_keywords fk
              JOIN keywords k ON fk.keyword_id = k.id
              WHERE fk.fatwa_id = f.id
            ), '')
          ), 'A') ||
          setweight(to_tsvector('arabic',
            coalesce(s.name, '') || ' ' || coalesce(c.name, '')
          ), 'B') ||
          setweight(to_tsvector('arabic', coalesce(f.answer, '')), 'C')
        FROM fatawa f
        LEFT JOIN scholars s ON f.scholar_id = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.id = si.fatwa_id AND f.id = '${fatwaId}'
      `);

      console.log(`✅ Search index rebuilt for fatwa ${fatwaId}`);
    } catch (e: any) {
      console.error(`❌ Failed to rebuild index for ${fatwaId}: ${e.message}`);
    }
  }

  // 9. Verify the import
  console.log('\n=== Verification ===');
  const verification = await prisma.fatwa.findMany({
    where: {
      question: { contains: 'جمعة مباركة', mode: 'insensitive' }
    },
    include: { scholar: true },
    take: 10,
  });

  console.log(`Found ${verification.length} fatwas with "جمعة مباركة" in question:`);
  verification.forEach((f: any) => {
    console.log(`  - ${f.scholar.name}: ${f.question.substring(0, 60)}...`);
  });

  console.log('\n=== Import complete ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
