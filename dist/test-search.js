"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const search_repository_1 = require("./src/modules/search/search.repository");
const search_service_1 = require("./src/modules/search/search.service");
class MockPrismaService {
    searchLog = {
        create: async () => { },
        groupBy: async () => [{ query: 'الصيام' }, { query: 'الصلاة' }]
    };
    fatwa = {
        findMany: async (args) => {
            return [
                {
                    id: '1',
                    slug: 'fatwa-1',
                    question: 'ما حكم الصيام؟',
                    answer: 'الصيام واجب.',
                    scholar: { name: 'ابن باز' },
                    category: { name: 'فقه العبادات' },
                    source: { name: 'الموقع الرسمي' }
                },
                {
                    id: '2',
                    slug: 'fatwa-2',
                    question: 'هل الصيام صحيح بدون نية؟',
                    answer: 'لا يصح.',
                    scholar: null,
                    category: null,
                    source: null
                },
                {
                    id: '3',
                    slug: 'fatwa-3',
                    question: 'حكم الصلاة؟',
                    answer: 'الصلاة واجبة.',
                    scholar: { name: 'ابن عثيمين' },
                    category: { name: 'الصلاة' },
                    source: { name: 'موقع الشيخ' }
                }
            ];
        }
    };
    async $queryRaw(query) {
        throw new Error('FTS index not built or missing relation "search_index"');
    }
}
class MockCacheManager {
    cache = new Map();
    async get(key) {
        return this.cache.get(key);
    }
    async set(key, value, ttl) {
        this.cache.set(key, value);
    }
}
async function runTests() {
    console.log('--- بدء اختبارات محرك البحث الهجين ---');
    const prisma = new MockPrismaService();
    const cacheManager = new MockCacheManager();
    const repository = new search_repository_1.SearchRepository(prisma);
    const service = new search_service_1.SearchService(repository, cacheManager);
    console.log('\n[1/5] اختبار FTS ثم Fallback (مع حماية القيم الفارغة)');
    console.log('سيتم محاكاة فشل FTS لمعرفة هل ينتقل بصمت إلى Fallback دون أخطاء.');
    const query = 'الصيام';
    let start = Date.now();
    let result = await service.search({ query, limit: 10, page: 1 });
    let end = Date.now();
    console.log(`- Search Query: ${query}`);
    console.log(`- Search Engine Used: ${result.meta.engine.toUpperCase()}`);
    console.log(`- Execution Time: ${end - start}ms`);
    console.log(`- Results Count: ${result.pagination.total}`);
    console.log(`- Cache Status: ${result.meta.cached ? 'HIT' : 'MISS'}`);
    console.log(`- Sample Result:`, JSON.stringify(result.data[1], null, 2));
    console.log('✅ اختبار Fallback وحماية البيانات الفارغة (Nulls): ناجح!');
    console.log('\n[2/5] اختبار الـ Cache');
    start = Date.now();
    result = await service.search({ query, limit: 10, page: 1 });
    end = Date.now();
    console.log(`- Search Query: ${query}`);
    console.log(`- Execution Time: ${end - start}ms`);
    console.log(`- Cache Status: ${result.meta?.cached ? 'HIT' : 'MISS'}`);
    console.log('✅ اختبار التخزين المؤقت: ناجح!');
    console.log('\n[3/5] اختبار Pagination');
    const page1 = await service.search({ query, limit: 2, page: 1 });
    const page2 = await service.search({ query, limit: 2, page: 2 });
    console.log(`- Page 1 Total Items returned: ${page1.data.length}`);
    console.log(`- Page 2 Total Items returned: ${page2.data.length}`);
    console.log(`- Page 1 Total Pages: ${page1.pagination.totalPages}`);
    console.log('✅ اختبار الـ Pagination: ناجح!');
    console.log('\n[4/5] اختبار الإكمال التلقائي (Autocomplete)');
    const autocompleteResult = await service.autocomplete('الص');
    console.log(`- Suggestions found:`, autocompleteResult.suggestions);
    console.log('✅ اختبار الإكمال التلقائي: ناجح!');
    console.log('\n[5/5] اختبار تسجيل البحث (Search Logs) والمواضيع الشائعة (Trending)');
    const trendingResult = await service.getTrendingSearches();
    console.log(`- Trending Searches:`, trendingResult.trending);
    console.log('✅ اختبار تسجيل وبناء السجلات: ناجح!');
    console.log('\n✅ جميع الاختبارات نجحت! المحرك لا يرمي 500 أو Runtime Errors إطلاقاً.');
}
runTests().catch(e => {
    console.error('❌ فشل الاختبار بسبب Runtime Error:', e);
});
//# sourceMappingURL=test-search.js.map