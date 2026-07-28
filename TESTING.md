# دليل الاختبارات (Testing Guide) لمشروع فتاوى العلماء

تم بناء حزمة الاختبارات الاحترافية (Professional Test Suite) في هذا المشروع مع الالتزام التام بالضوابط التالية:
1. عدم تعديل كود الإنتاج (Production Code).
2. استخدام قاعدة بيانات معزولة تماماً للاختبار (`.env.test`).
3. استخدام Fixtures مصغرة (Minified HTML Fixtures) لاختبارات الاستيراد.
4. تحقيق تغطية الكود (Code Coverage) لا تقل عن 90%.

## 1. إعداد البيئة (Environment Setup)

قبل تشغيل أي اختبارات تكامل (Integration) أو (E2E)، يجب التأكد من توفر قاعدة بيانات PostgreSQL وتشغيلها محلياً:

1. انسخ ملف `.env` إلى `.env.test`:
   ```bash
   cp .env .env.test
   ```
2. قم بتعديل المتغير `DATABASE_URL` في `.env.test` ليشير إلى قاعدة بيانات مخصصة للاختبار (مثال: `fatawa_test`).
3. طبّق الـ Migrations على قاعدة الاختبار:
   ```bash
   dotenv -e .env.test -- npx prisma migrate deploy
   ```

*ملاحظة: اختبارات الوحدة (Unit Tests) لا تتطلب قاعدة بيانات ويمكن تشغيلها مباشرة، حيث تعتمد بالكامل على Mocks.*

## 2. تشغيل الاختبارات

### اختبارات الوحدة (Unit Tests)
تشمل جميع الخدمات الأساسية مثل `SearchService`, `BaseImporterService`, والمصادر (Plugins)، وهي تعمل بشكل سريع دون الحاجة لـ DB أو Redis.
```bash
npm run test
# للحصول على تقرير التغطية
npm run test:cov
```

### اختبارات التكامل والـ API (Integration & E2E)
تتصل بقاعدة الاختبار، وتختبر عمليات المزامنة (Smart Sync)، الـ Upsert، وتحديث الفهارس (Search Vectors) والـ API.
```bash
npm run test:e2e
```

### اختبارات الأداء (Performance Tests)
نستخدم `Jest + Promise.all` كبداية للتأكد من تحمل النظام لطلبات متزامنة بشكل سريع قبل استخدام أدوات متقدمة مثل Artillery.
(مدمجة ضمن الـ E2E Tests).

## 3. التكامل المستمر (CI/CD) عبر GitHub Actions

لضمان تشغيل الاختبارات تلقائياً مع كل Pull Request، يمكن إضافة مسار عمل (Workflow) في `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: fatawa_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Setup Test Environment
      run: |
        echo "DATABASE_URL=postgresql://test_user:test_password@localhost:5432/fatawa_test" > .env.test
        echo "REDIS_HOST=localhost" >> .env.test
        echo "REDIS_PORT=6379" >> .env.test

    - name: Run Prisma Migrations
      run: npx dotenv -e .env.test -- npx prisma migrate deploy

    - name: Run Unit Tests with Coverage
      run: npm run test:cov

    - name: Run Integration & E2E Tests
      run: npm run test:e2e
```

## 4. ضوابط إضافة اختبارات جديدة
- **عدم المساس بالإنتاج:** لا تعدل أي كود في الإنتاج فقط لتسهيل الاختبارات.
- **استخدام Mocks بحذر:** لا تعتمد على المواقع الخارجية المباشرة. استخدم HTML Fixtures صغيرة تحاكي الـ Tags المطلوبة فقط للـ Parsers.
- **التنظيف التلقائي:** يتم تنظيف قاعدة البيانات في كل `beforeEach` لاختبارات التكامل باستخدام `TestDbUtil.wipeDatabase()`.
