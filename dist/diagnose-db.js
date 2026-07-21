"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const search_repository_1 = require("./src/modules/search/search.repository");
const prisma_service_1 = require("./src/modules/prisma/prisma.service");
async function diagnose() {
    console.log('========================================');
    console.log('🔍 بدء التحليل الشامل للنظام وقاعدة البيانات');
    console.log('========================================\n');
    const prisma = new client_1.PrismaClient();
    const prismaService = new prisma_service_1.PrismaService();
    const searchRepo = new search_repository_1.SearchRepository(prismaService);
    searchRepo.logger = { log: () => { }, warn: console.warn, error: console.error };
    try {
        console.log('[1] جاري التحقق من الاتصال بقاعدة البيانات...');
        await prisma.$connect();
        await prismaService.$connect();
        console.log('✅ تم الاتصال بنجاح بـ PostgreSQL!');
    }
    catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات!');
        console.error(error);
        process.exit(1);
    }
    console.log('\n[2] جاري فحص الجداول وعدد السجلات...');
    const counts = {};
    try {
        counts.fatawa = await prisma.fatwa.count();
        counts.scholars = await prisma.scholar.count();
        counts.categories = await prisma.category.count();
        counts.search_index = await prisma.searchIndex.count();
        counts.sources = await prisma.source.count();
        counts.synonyms = await prisma.synonym.count();
        counts.attachments = await prisma.attachment.count();
        counts.audit_logs = await prisma.auditLog.count();
        console.log(`- Fatawa: ${counts.fatawa}`);
        console.log(`- Scholars: ${counts.scholars}`);
        console.log(`- Categories: ${counts.categories}`);
        console.log(`- Search Index: ${counts.search_index}`);
        console.log(`- Sources: ${counts.sources}`);
        console.log(`- Synonyms: ${counts.synonyms}`);
        console.log(`- Attachments: ${counts.attachments}`);
        console.log(`- Audit Logs: ${counts.audit_logs}`);
        if (counts.fatawa === 0) {
            console.log('\n❌ جدول الفتاوى (fatawa) فارغ تماماً!');
            console.log('⚠️ التوصية: يرجى التحقق من نظام المستورد (Importers) لمعرفة سبب عدم إدخال البيانات، ولا تنتقل للبحث حتى يتم الاستيراد.');
            process.exit(1);
        }
    }
    catch (error) {
        console.error('❌ حدث خطأ أثناء قراءة الجداول:', error);
        process.exit(1);
    }
    console.log('\n[3] جاري فحص حالة الفهرس (Search Index)...');
    if (counts.search_index === 0 && counts.fatawa > 0) {
        console.log('❌ فهرس البحث (search_index) فارغ برغم وجود فتاوى!');
        console.log('⚠️ التوصية: يجب إعادة بناء الفهرس (Rebuild Index) ليعمل الـ FTS.');
    }
    else {
        console.log('✅ الفهرس موجود ويحتوي على بيانات.');
    }
    console.log('\n[4] جاري اختبار محرك البحث (Full Text Search)...');
    const searchTerms = ['الصيام', 'الصلاة', 'الزكاة', 'الحج'];
    let allFtsSuccess = true;
    for (const term of searchTerms) {
        console.log(`\n--- اختبار كلمة: "${term}" ---`);
        const startTime = Date.now();
        try {
            const result = await searchRepo.search(term, 1, 20);
            const executionTime = Date.now() - startTime;
            console.log(`- زمن التنفيذ: ${executionTime}ms`);
            console.log(`- عدد النتائج: ${result.total}`);
            console.log(`- المحرك المستخدم: ${result.engine.toUpperCase()}`);
            if (result.engine === 'fallback') {
                allFtsSuccess = false;
                console.log(`❌ تم استخدام Fallback بدلاً من FTS! قد يكون الفهرس غير مكتمل أو الـ Query غير صحيحة.`);
            }
            if (typeof result.total !== 'number') {
                console.log(`❌ خطأ: إجمالي النتائج (total) من نوع ${typeof result.total} وليس رقم (Number)!`);
            }
        }
        catch (e) {
            console.error(`❌ حدث استثناء أثناء البحث عن "${term}":`);
            console.error(e);
            allFtsSuccess = false;
        }
    }
    console.log('\n========================================');
    console.log('📊 التقرير النهائي للتشخيص');
    console.log('========================================');
    console.log(`- حالة خدمة PostgreSQL: متصلة ✅`);
    console.log(`- عدد الفتاوى: ${counts.fatawa}`);
    console.log(`- عدد العلماء: ${counts.scholars}`);
    console.log(`- عدد الفئات: ${counts.categories}`);
    if (allFtsSuccess) {
        console.log('\n✅ جميع الاختبارات نجحت! محرك البحث FTS يعمل 100% بدون أي أخطاء (200 OK).');
    }
    else {
        console.log('\n❌ فشلت بعض الاختبارات (تم استخدام Fallback أو حدث خطأ). راجع التفاصيل أعلاه.');
    }
    await prisma.$disconnect();
    await prismaService.$disconnect();
}
diagnose();
//# sourceMappingURL=diagnose-db.js.map