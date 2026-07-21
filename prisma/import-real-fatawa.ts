import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Injecting real Fatawa for testing Search...');
  
  const scholar = await prisma.scholar.findFirst();
  const category = await prisma.category.findFirst();
  const source = await prisma.source.findFirst();

  if (!scholar || !category || !source) {
    console.error('Missing core data (scholar, category, or source)');
    process.exit(1);
  }

  // Real Fatwa 1: الصيام
  await prisma.fatwa.create({
    data: {
      slug: 'real-fatwa-fasting-' + Date.now(),
      scholarId: scholar.id,
      categoryId: category.id,
      sourceId: source.id,
      question: 'ما حكم نية الصيام من الليل؟',
      answer: 'النية شرط في صحة الصيام الواجب كصيام رمضان، لقول النبي صلى الله عليه وسلم: (من لم يبيت الصيام من الليل فلا صيام له).',
      officialUrl: 'https://binbaz.org.sa/test1',
      sourceFingerprint: 'test-fingerprint-1',
      syncStatus: 'active',
      verificationStatus: 'verified',
    }
  });

  // Real Fatwa 2: الصلاة
  await prisma.fatwa.create({
    data: {
      slug: 'real-fatwa-prayer-' + Date.now(),
      scholarId: scholar.id,
      categoryId: category.id,
      sourceId: source.id,
      question: 'ما حكم ترك الصلاة تهاوناً؟',
      answer: 'ترك الصلاة كفر أكبر في أصح قولي العلماء، لقول النبي صلى الله عليه وسلم: (العهد الذي بيننا وبينهم الصلاة فمن تركها فقد كفر).',
      officialUrl: 'https://binbaz.org.sa/test2',
      sourceFingerprint: 'test-fingerprint-2',
      syncStatus: 'active',
      verificationStatus: 'verified',
    }
  });

  // Real Fatwa 3: الزكاة
  await prisma.fatwa.create({
    data: {
      slug: 'real-fatwa-zakat-' + Date.now(),
      scholarId: scholar.id,
      categoryId: category.id,
      sourceId: source.id,
      question: 'متى تجب الزكاة في الذهب؟',
      answer: 'تجب الزكاة في الذهب إذا بلغ النصاب وهو خمسة وثمانون جراماً، وحال عليه الحول، ومقدار الزكاة ربع العشر.',
      officialUrl: 'https://binbaz.org.sa/test3',
      sourceFingerprint: 'test-fingerprint-3',
      syncStatus: 'active',
      verificationStatus: 'verified',
    }
  });

  // Real Fatwa 4: الحج
  await prisma.fatwa.create({
    data: {
      slug: 'real-fatwa-hajj-' + Date.now(),
      scholarId: scholar.id,
      categoryId: category.id,
      sourceId: source.id,
      question: 'هل يجوز الحج عن الميت؟',
      answer: 'نعم يجوز الحج عن الميت إذا كان قد حج عن نفسه أولاً، لحديث ابن عباس أن امرأة سألت النبي عن الحج عن أمها فقال: (نعم حجي عنها).',
      officialUrl: 'https://binbaz.org.sa/test4',
      sourceFingerprint: 'test-fingerprint-4',
      syncStatus: 'active',
      verificationStatus: 'verified',
    }
  });

  console.log('Successfully injected 4 authentic Fatawa.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
