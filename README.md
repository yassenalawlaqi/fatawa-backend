# محرك الفتاوى الموحد (Fatawa Engine Backend)

نظام فتاوى مؤسسي (Enterprise-Grade) مبني باستخدام `NestJS`, `PostgreSQL`, `Redis` ومعمارية موجهة للخدمات المتعددة.

## المبدأ الأساسي
**المصدر هو الحقيقة (Source of Truth):** الخادم مجرد محرك بحث وناقل للبيانات. لا يتم توليد الإجابات، ولا إعادة صياغتها بالذكاء الاصطناعي. تُعرض الفتوى كما وردت حرفياً مع الإشارة للرابط الرسمي.

## متطلبات التشغيل (Prerequisites)
- Docker & Docker Compose
- Node.js 20+

## دليل التشغيل السريع للبيئة التطويرية (Development)

1. **تشغيل قواعد البيانات عبر Docker**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **تجهيز متغيرات البيئة**:
   انسخ ملف `.env.example` وقم بتسميته `.env.development` و `.env.test`.
   ```bash
   cp .env.example .env.development
   cp .env.example .env.test
   ```

3. **تثبيت الحزم البرمجية**:
   ```bash
   npm install
   ```

4. **تشغيل المخططات (Migrations)**:
   ```bash
   npm run prisma:dev
   ```

5. **حقن البيانات التجريبية (Seeding)**:
   ```bash
   npm run prisma:seed
   ```

6. **تجهيز بحث FTS لـ PostgreSQL**:
   افتح قاعدة البيانات ونفذ سكريبت `prisma/fts-setup.sql` لربط الـ Triggers الخاصة بمحرك البحث.

7. **تشغيل الخادم**:
   ```bash
   npm run start:dev
   ```

## الاختبارات (Testing - Gate 1)

لإجراء اختبارات شاملة قبل الانتقال للمرحلة التالية:

**1. اختبارات الـ API (E2E Integration)**:
```bash
npm run test:e2e
```

**2. اختبار الأداء (Load Testing with k6)**:
يجب تثبيت `k6` أولاً (https://k6.io/docs/get-started/installation/)
```bash
k6 run test/load.js
```

## التوثيق الإضافي
- وثيقة الاستيراد: [importer-specification.md](./docs/importer-specification.md)
- Swagger UI (بعد التشغيل): `http://localhost:3000/api`
