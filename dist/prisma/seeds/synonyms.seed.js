"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSynonyms = seedSynonyms;
async function seedSynonyms(prisma) {
    console.log('Seeding Synonyms...');
    const synonymsList = [
        { word: 'الصيام', synonym: 'الصوم' },
        { word: 'الصيام', synonym: 'رمضان' },
        { word: 'الصيام', synonym: 'الإفطار' },
        { word: 'الصيام', synonym: 'السحور' },
        { word: 'الصوم', synonym: 'الصيام' },
        { word: 'رمضان', synonym: 'الصيام' },
        { word: 'الجنابة', synonym: 'الجنب' },
        { word: 'الجنابة', synonym: 'الغسل' },
        { word: 'الجنابة', synonym: 'الاغتسال' },
        { word: 'الجنب', synonym: 'الجنابة' },
        { word: 'الجمعة', synonym: 'جمعة مباركة' },
        { word: 'الجمعة', synonym: 'التهنئة بالجمعة' },
        { word: 'الجمعة', synonym: 'فضل الجمعة' },
        { word: 'الصلاة', synonym: 'يصلي' },
        { word: 'الصلاة', synonym: 'المصلي' },
        { word: 'الصلاة', synonym: 'المصلين' },
        { word: 'الصلاة', synonym: 'صلاة الجماعة' },
        { word: 'يصلي', synonym: 'الصلاة' },
        { word: 'المولد', synonym: 'المولد النبوي' },
        { word: 'المولد', synonym: 'الاحتفال بالمولد' },
        { word: 'المولد النبوي', synonym: 'المولد' },
        { word: 'اللحية', synonym: 'حلق اللحية' },
        { word: 'اللحية', synonym: 'إعفاء اللحية' },
        { word: 'اللحية', synonym: 'قص اللحية' },
        { word: 'الإسبال', synonym: 'تقصير الثوب' },
        { word: 'الإسبال', synonym: 'إسبال الإزار' },
        { word: 'التصوير', synonym: 'الصور' },
        { word: 'التصوير', synonym: 'الصور الفوتوغرافية' },
        { word: 'التصوير', synonym: 'الكاميرا' },
        { word: 'الأغاني', synonym: 'الموسيقى' },
        { word: 'الأغاني', synonym: 'المعازف' },
        { word: 'الأغاني', synonym: 'الغناء' },
        { word: 'الربا', synonym: 'الفوائد الربوية' },
        { word: 'الربا', synonym: 'البنوك الربوية' },
        { word: 'الربا', synonym: 'القرض بفائدة' },
        { word: 'التأمين', synonym: 'التأمين التجاري' },
        { word: 'التأمين', synonym: 'التأمين التعاوني' },
        { word: 'التأمين', synonym: 'التأمين الطبي' },
        { word: 'الكفار', synonym: 'تهنئة الكفار' },
        { word: 'الكفار', synonym: 'أعياد النصارى' },
        { word: 'الكفار', synonym: 'الكريسماس' },
        { word: 'الكريسماس', synonym: 'الكفار' },
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
//# sourceMappingURL=synonyms.seed.js.map