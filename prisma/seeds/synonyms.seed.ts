import { PrismaClient } from '@prisma/client';

export async function seedSynonyms(prisma: PrismaClient) {
  console.log('Seeding Synonyms...');

  const synonymsList = [
    // الصيام
    { word: 'الصيام', synonym: 'الصوم' },
    { word: 'الصيام', synonym: 'رمضان' },
    { word: 'الصيام', synonym: 'الإفطار' },
    { word: 'الصيام', synonym: 'السحور' },
    { word: 'الصوم', synonym: 'الصيام' },
    { word: 'رمضان', synonym: 'الصيام' },

    // الجنابة
    { word: 'الجنابة', synonym: 'الجنب' },
    { word: 'الجنابة', synonym: 'الغسل' },
    { word: 'الجنابة', synonym: 'الاغتسال' },
    { word: 'الجنب', synonym: 'الجنابة' },
    
    // الجمعة
    { word: 'الجمعة', synonym: 'جمعة مباركة' },
    { word: 'الجمعة', synonym: 'التهنئة بالجمعة' },
    { word: 'الجمعة', synonym: 'فضل الجمعة' },
    
    // الصلاة
    { word: 'الصلاة', synonym: 'يصلي' },
    { word: 'الصلاة', synonym: 'المصلي' },
    { word: 'الصلاة', synonym: 'المصلين' },
    { word: 'الصلاة', synonym: 'صلاة الجماعة' },
    { word: 'يصلي', synonym: 'الصلاة' },

    // المولد
    { word: 'المولد', synonym: 'المولد النبوي' },
    { word: 'المولد', synonym: 'الاحتفال بالمولد' },
    { word: 'المولد النبوي', synonym: 'المولد' },

    // اللحية
    { word: 'اللحية', synonym: 'حلق اللحية' },
    { word: 'اللحية', synonym: 'إعفاء اللحية' },
    { word: 'اللحية', synonym: 'قص اللحية' },

    // الإسبال
    { word: 'الإسبال', synonym: 'تقصير الثوب' },
    { word: 'الإسبال', synonym: 'إسبال الإزار' },
    
    // التصوير
    { word: 'التصوير', synonym: 'الصور' },
    { word: 'التصوير', synonym: 'الصور الفوتوغرافية' },
    { word: 'التصوير', synonym: 'الكاميرا' },

    // الأغاني
    { word: 'الأغاني', synonym: 'الموسيقى' },
    { word: 'الأغاني', synonym: 'المعازف' },
    { word: 'الأغاني', synonym: 'الغناء' },
    
    // الربا
    { word: 'الربا', synonym: 'الفوائد الربوية' },
    { word: 'الربا', synonym: 'البنوك الربوية' },
    { word: 'الربا', synonym: 'القرض بفائدة' },

    // التأمين
    { word: 'التأمين', synonym: 'التأمين التجاري' },
    { word: 'التأمين', synonym: 'التأمين التعاوني' },
    { word: 'التأمين', synonym: 'التأمين الطبي' },

    // الكفار
    { word: 'الكفار', synonym: 'تهنئة الكفار' },
    { word: 'الكفار', synonym: 'أعياد النصارى' },
    { word: 'الكفار', synonym: 'الكريسماس' },
    { word: 'الكريسماس', synonym: 'الكفار' },

    // كشف الوجه
    { word: 'الوجه', synonym: 'كشف الوجه' },
    { word: 'الوجه', synonym: 'النقاب' },
    { word: 'الوجه', synonym: 'تغطية الوجه' },
    { word: 'النقاب', synonym: 'الوجه' },
  ];

  for (const syn of synonymsList) {
    await prisma.synonym.upsert({
      where: {
        word_synonym: {
          word: syn.word,
          synonym: syn.synonym
        }
      },
      update: {},
      create: syn
    });
  }

  console.log('Synonyms seeded.');
}
