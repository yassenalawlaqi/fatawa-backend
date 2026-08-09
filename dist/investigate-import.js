"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
        const missing = searchIndexes.filter(s => s.search_vector_status === 'NULL');
        if (missing.length > 0 || searchIndexes.length < last20.length) {
            console.log('⚠️ تحذير: بعض الفتاوى الجديدة ليس لها Search Index أو Search Vector مكتمل!');
        }
        else {
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
        console.log(`- بحث PostgreSQL المباشر عن (جمعة) للشيخ [${slug}]: ${result[0].match_count} نتيجة.`);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=investigate-import.js.map