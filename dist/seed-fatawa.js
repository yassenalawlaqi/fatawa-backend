"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedFatawa() {
    console.log('========================================');
    console.log('🌱 بدء إدخال بيانات الفتاوى التجريبية');
    console.log('========================================\n');
    const scholars = await Promise.all([
        prisma.scholar.upsert({
            where: { slug: 'ibn-baz' },
            update: {},
            create: { name: 'عبدالعزيز بن عبدالله بن باز', slug: 'ibn-baz', description: 'مفتي عام المملكة العربية السعودية سابقاً' },
        }),
        prisma.scholar.upsert({
            where: { slug: 'ibn-uthaymeen' },
            update: {},
            create: { name: 'محمد بن صالح العثيمين', slug: 'ibn-uthaymeen', description: 'عالم وفقيه سعودي' },
        }),
        prisma.scholar.upsert({
            where: { slug: 'al-fawzan' },
            update: {},
            create: { name: 'صالح بن فوزان الفوزان', slug: 'al-fawzan', description: 'عضو هيئة كبار العلماء' },
        }),
        prisma.scholar.upsert({
            where: { slug: 'permanent-committee' },
            update: {},
            create: { name: 'اللجنة الدائمة للبحوث العلمية والإفتاء', slug: 'permanent-committee', description: 'اللجنة الدائمة للإفتاء في المملكة العربية السعودية' },
        }),
    ]);
    console.log(`✅ تم إنشاء ${scholars.length} علماء`);
    const categories = await Promise.all([
        prisma.category.upsert({ where: { slug: 'salat' }, update: {}, create: { name: 'الصلاة', slug: 'salat' } }),
        prisma.category.upsert({ where: { slug: 'siyam' }, update: {}, create: { name: 'الصيام', slug: 'siyam' } }),
        prisma.category.upsert({ where: { slug: 'zakat' }, update: {}, create: { name: 'الزكاة', slug: 'zakat' } }),
        prisma.category.upsert({ where: { slug: 'hajj' }, update: {}, create: { name: 'الحج والعمرة', slug: 'hajj' } }),
        prisma.category.upsert({ where: { slug: 'taharah' }, update: {}, create: { name: 'الطهارة', slug: 'taharah' } }),
        prisma.category.upsert({ where: { slug: 'aqeedah' }, update: {}, create: { name: 'العقيدة', slug: 'aqeedah' } }),
        prisma.category.upsert({ where: { slug: 'muamalat' }, update: {}, create: { name: 'المعاملات', slug: 'muamalat' } }),
        prisma.category.upsert({ where: { slug: 'general' }, update: {}, create: { name: 'فتاوى عامة', slug: 'general' } }),
    ]);
    console.log(`✅ تم إنشاء ${categories.length} تصنيفات`);
    const source = await prisma.source.upsert({
        where: { slug: 'binbaz-official' },
        update: {},
        create: { name: 'الموقع الرسمي للإمام ابن باز', slug: 'binbaz-official', type: 'official_website', officialUrl: 'https://binbaz.org.sa' },
    });
    const source2 = await prisma.source.upsert({
        where: { slug: 'uthaymeen-official' },
        update: {},
        create: { name: 'الموقع الرسمي للشيخ ابن عثيمين', slug: 'uthaymeen-official', type: 'official_website', officialUrl: 'https://binothaimeen.net' },
    });
    console.log(`✅ تم إنشاء المصادر`);
    const fatawaData = [
        { slug: 'fasting-travel-1', question: 'ما حكم الصيام في السفر؟', answer: 'الصيام في السفر جائز والفطر جائز، والفطر أفضل إذا كان السفر يشق على المسافر، لقوله تعالى: {فمن كان منكم مريضاً أو على سفر فعدة من أيام أخر}. وقد كان النبي صلى الله عليه وسلم يصوم في السفر وأحياناً يفطر.', scholarIdx: 0, categoryIdx: 1, sourceIdx: 0 },
        { slug: 'fasting-pregnant-1', question: 'هل يجوز للحامل أن تفطر في رمضان؟', answer: 'نعم يجوز للحامل أن تفطر في رمضان إذا خافت على نفسها أو على جنينها من الصيام، وعليها القضاء بعد الوضع إذا استطاعت. والدليل حديث أنس بن مالك الكعبي رضي الله عنه أن رسول الله صلى الله عليه وسلم قال: إن الله وضع عن المسافر الصوم وشطر الصلاة، وعن الحبلى والمرضع الصوم.', scholarIdx: 1, categoryIdx: 1, sourceIdx: 1 },
        { slug: 'fasting-intention-1', question: 'ما حكم من لم يبيّت النية في صيام رمضان؟', answer: 'يجب تبييت النية من الليل لصيام الفرض في رمضان، فمن لم يبيّت النية من الليل فلا صيام له، لقوله صلى الله عليه وسلم: من لم يبيّت الصيام من الليل فلا صيام له. ولكن نية صيام رمضان تكفي من أوله إذا علم بدخول الشهر.', scholarIdx: 0, categoryIdx: 1, sourceIdx: 0 },
        { slug: 'fasting-water-1', question: 'هل بلع الريق يفطر الصائم؟', answer: 'بلع الريق لا يفطر الصائم باتفاق العلماء، لأنه أمر لا يمكن التحرز منه، فهو معفو عنه. أما إذا جمع الإنسان ريقه ثم ابتلعه قصداً فالصحيح أنه لا يفطر أيضاً لأنه ريقه الطبيعي.', scholarIdx: 2, categoryIdx: 1, sourceIdx: 0 },
        { slug: 'fasting-ramadan-merit-1', question: 'ما فضل صيام شهر رمضان؟', answer: 'صيام رمضان ركن من أركان الإسلام، وفضله عظيم. قال النبي صلى الله عليه وسلم: من صام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه. وقال أيضاً: الصيام جُنّة، فإذا كان يوم صوم أحدكم فلا يرفث ولا يصخب. والصيام يشفع لصاحبه يوم القيامة.', scholarIdx: 0, categoryIdx: 1, sourceIdx: 0 },
        { slug: 'prayer-combine-1', question: 'ما حكم الجمع بين الصلاتين في السفر؟', answer: 'يجوز الجمع بين الظهر والعصر، وبين المغرب والعشاء في السفر تقديماً أو تأخيراً، وهو من رخص السفر. والأفضل فعل الأرفق بالمسافر. والدليل ما ثبت عن ابن عباس رضي الله عنهما أن النبي صلى الله عليه وسلم جمع بين الظهر والعصر وبين المغرب والعشاء بالمدينة من غير خوف ولا مطر.', scholarIdx: 1, categoryIdx: 0, sourceIdx: 1 },
        { slug: 'prayer-friday-1', question: 'ما حكم صلاة الجمعة؟', answer: 'صلاة الجمعة فرض عين على كل مسلم ذكر بالغ عاقل مقيم، وهي ركعتان يسبقهما خطبتان. قال تعالى: {يا أيها الذين آمنوا إذا نودي للصلاة من يوم الجمعة فاسعوا إلى ذكر الله وذروا البيع}. ومن تركها تهاوناً بغير عذر فهو على خطر عظيم.', scholarIdx: 0, categoryIdx: 0, sourceIdx: 0 },
        { slug: 'prayer-night-1', question: 'ما حكم قيام الليل وما فضله؟', answer: 'قيام الليل سنة مؤكدة وهو من أفضل الطاعات بعد الفريضة. قال النبي صلى الله عليه وسلم: أفضل الصلاة بعد الفريضة صلاة الليل. وقال تعالى: {تتجافى جنوبهم عن المضاجع يدعون ربهم خوفاً وطمعاً}. ووقته من بعد صلاة العشاء إلى طلوع الفجر، وأفضله الثلث الأخير من الليل.', scholarIdx: 1, categoryIdx: 0, sourceIdx: 1 },
        { slug: 'prayer-witr-1', question: 'ما حكم صلاة الوتر وكم عدد ركعاتها؟', answer: 'صلاة الوتر سنة مؤكدة، وأقلها ركعة واحدة وأكثرها إحدى عشرة ركعة. قال النبي صلى الله عليه وسلم: الوتر حق على كل مسلم. وأفضل وقتها آخر الليل لمن وثق باستيقاظه، وإلا فليوتر أول الليل. ويُسن فيها القنوت أحياناً.', scholarIdx: 2, categoryIdx: 0, sourceIdx: 0 },
        { slug: 'zakat-gold-1', question: 'ما نصاب زكاة الذهب؟', answer: 'نصاب الذهب عشرون مثقالاً، أي ما يعادل 85 غراماً من الذهب الخالص. فمن ملك هذا المقدار أو أكثر وحال عليه الحول وجبت فيه الزكاة بمقدار ربع العشر أي 2.5%. ويُقوّم الذهب بسعر يوم إخراج الزكاة.', scholarIdx: 0, categoryIdx: 2, sourceIdx: 0 },
        { slug: 'zakat-money-1', question: 'هل تجب الزكاة في المال المدّخر؟', answer: 'نعم تجب الزكاة في المال المدّخر إذا بلغ النصاب وحال عليه الحول الهجري. والنصاب هو ما يعادل 85 غراماً من الذهب أو 595 غراماً من الفضة. والواجب إخراج ربع العشر أي 2.5% من إجمالي المبلغ. ولا يشترط أن يكون المال نامياً بل يكفي بلوغ النصاب ومرور الحول.', scholarIdx: 3, categoryIdx: 2, sourceIdx: 0 },
        { slug: 'zakat-fitr-1', question: 'ما حكم زكاة الفطر ومتى تُخرج؟', answer: 'زكاة الفطر فريضة على كل مسلم ومسلمة صغيراً وكبيراً حراً وعبداً. ومقدارها صاع من طعام أهل البلد كالأرز والتمر والبر. ووقت إخراجها من غروب شمس آخر يوم من رمضان إلى صلاة العيد، ويجوز تقديمها قبل العيد بيوم أو يومين. والحكمة منها طهرة للصائم من اللغو والرفث وطعمة للمساكين.', scholarIdx: 1, categoryIdx: 2, sourceIdx: 1 },
        { slug: 'hajj-obligation-1', question: 'ما شروط وجوب الحج؟', answer: 'يجب الحج على المسلم البالغ العاقل الحر المستطيع مرة واحدة في العمر. والاستطاعة تشمل: القدرة البدنية، والقدرة المالية بأن يملك ما يكفيه للذهاب والإياب فوق نفقة من يعولهم، وأمن الطريق. وللمرأة شرط إضافي وهو وجود محرم يرافقها. قال تعالى: {ولله على الناس حج البيت من استطاع إليه سبيلاً}.', scholarIdx: 0, categoryIdx: 3, sourceIdx: 0 },
        { slug: 'hajj-umrah-1', question: 'ما الفرق بين الحج والعمرة؟', answer: 'الحج يكون في أشهر معلومة (شوال، ذو القعدة، ذو الحجة) وله أركان وواجبات أكثر من العمرة كالوقوف بعرفة والمبيت بمزدلفة ورمي الجمار. أما العمرة فهي الإحرام والطواف والسعي والحلق أو التقصير ويمكن أداؤها في أي وقت من السنة. والحج الفرض مرة في العمر، والعمرة واجبة مرة على الراجح.', scholarIdx: 2, categoryIdx: 3, sourceIdx: 0 },
        { slug: 'hajj-tawaf-1', question: 'ما هي أنواع الطواف وأحكامه؟', answer: 'الطواف حول الكعبة عبادة عظيمة وله أنواع: طواف القدوم وهو سنة للقادم من خارج مكة، وطواف الإفاضة وهو ركن من أركان الحج، وطواف الوداع وهو واجب عند مغادرة مكة. ويُشترط فيه الطهارة وستر العورة والبدء من الحجر الأسود والطواف سبعة أشواط من خارج الحِجر.', scholarIdx: 3, categoryIdx: 3, sourceIdx: 0 },
        { slug: 'taharah-wudu-1', question: 'ما هي فرائض الوضوء؟', answer: 'فرائض الوضوء ستة: غسل الوجه، وغسل اليدين إلى المرفقين، ومسح الرأس، وغسل الرجلين إلى الكعبين، والترتيب، والموالاة. قال تعالى: {يا أيها الذين آمنوا إذا قمتم إلى الصلاة فاغسلوا وجوهكم وأيديكم إلى المرافق وامسحوا برءوسكم وأرجلكم إلى الكعبين}.', scholarIdx: 1, categoryIdx: 4, sourceIdx: 1 },
        { slug: 'aqeedah-pillars-1', question: 'ما هي أركان الإيمان؟', answer: 'أركان الإيمان ستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره. وهذا ما جاء في حديث جبريل عليه السلام حين سأل النبي صلى الله عليه وسلم عن الإيمان فقال: أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر وتؤمن بالقدر خيره وشره.', scholarIdx: 0, categoryIdx: 5, sourceIdx: 0 },
        { slug: 'muamalat-riba-1', question: 'ما حكم الربا في الإسلام؟', answer: 'الربا محرم تحريماً قاطعاً في الإسلام بالكتاب والسنة والإجماع. قال تعالى: {وأحل الله البيع وحرم الربا}. وقال النبي صلى الله عليه وسلم: لعن الله آكل الربا ومُوكله وكاتبه وشاهديه وقال هم سواء. والربا نوعان: ربا الفضل وربا النسيئة، وكلاهما حرام.', scholarIdx: 2, categoryIdx: 6, sourceIdx: 0 },
        { slug: 'fasting-six-shawwal-1', question: 'ما حكم صيام ست من شوال؟', answer: 'يُستحب صيام ستة أيام من شوال بعد صيام رمضان، لقوله صلى الله عليه وسلم: من صام رمضان ثم أتبعه ستاً من شوال كان كصيام الدهر. ولا يشترط أن تكون متتابعة بل يجوز تفريقها في الشهر. ويُشترط إتمام قضاء رمضان أولاً عند جمهور العلماء.', scholarIdx: 0, categoryIdx: 1, sourceIdx: 0 },
        { slug: 'fasting-ashura-1', question: 'ما فضل صيام يوم عاشوراء؟', answer: 'صيام يوم عاشوراء سنة مؤكدة وهو العاشر من شهر محرم، ويكفّر ذنوب سنة ماضية. قال النبي صلى الله عليه وسلم: صيام يوم عاشوراء أحتسب على الله أن يكفر السنة التي قبله. ويُستحب صيام التاسع معه لمخالفة اليهود.', scholarIdx: 1, categoryIdx: 1, sourceIdx: 1 },
    ];
    let createdCount = 0;
    for (const f of fatawaData) {
        try {
            await prisma.fatwa.upsert({
                where: { slug: f.slug },
                update: {},
                create: {
                    slug: f.slug,
                    question: f.question,
                    answer: f.answer,
                    scholarId: scholars[f.scholarIdx].id,
                    categoryId: categories[f.categoryIdx].id,
                    sourceId: f.sourceIdx === 0 ? source.id : source2.id,
                    sourceFingerprint: `fp-${f.slug}`,
                    verificationStatus: 'verified',
                },
            });
            createdCount++;
        }
        catch (e) {
            console.error(`❌ فشل إدخال: ${f.slug} - ${e.message}`);
        }
    }
    console.log(`\n✅ تم إدخال ${createdCount} فتوى بنجاح`);
    const counts = {
        fatawa: await prisma.fatwa.count(),
        scholars: await prisma.scholar.count(),
        categories: await prisma.category.count(),
        sources: await prisma.source.count(),
        search_index: await prisma.searchIndex.count(),
    };
    console.log('\n📊 إحصائيات قاعدة البيانات:');
    console.log(`- الفتاوى: ${counts.fatawa}`);
    console.log(`- العلماء: ${counts.scholars}`);
    console.log(`- التصنيفات: ${counts.categories}`);
    console.log(`- المصادر: ${counts.sources}`);
    console.log(`- فهرس البحث: ${counts.search_index}`);
    if (counts.search_index === 0 && counts.fatawa > 0) {
        console.log('\n⚠️ فهرس البحث فارغ! الـ Trigger يجب أن يكون قد ملأه تلقائياً...');
        console.log('جاري التحقق من وجود الـ Trigger...');
    }
    await prisma.$disconnect();
    console.log('\n========================================');
    console.log('✅ انتهى إدخال البيانات التجريبية بنجاح');
    console.log('========================================');
}
seedFatawa().catch(console.error);
//# sourceMappingURL=seed-fatawa.js.map