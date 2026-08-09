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
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const importer_service_1 = require("./modules/importer/importer.service");
const prisma_service_1 = require("./modules/prisma/prisma.service");
async function run() {
    console.log('=================================');
    console.log('   FATAWA IMPORTER RUNNER        ');
    console.log('=================================');
    const limit = process.env.IMPORT_LIMIT;
    console.log(`IMPORT_LIMIT = ${limit ? limit : 'UNLIMITED (0)'}`);
    console.log('Initializing Application Context...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const importerService = app.get(importer_service_1.ImporterService);
    const prisma = app.get(prisma_service_1.PrismaService);
    if (process.env.RESET_CHECKPOINTS === 'true') {
        console.log('RESETTING ALL IMPORT CHECKPOINTS...');
        await prisma.systemMetadata.deleteMany({
            where: { key: { startsWith: 'import_checkpoint_' } }
        });
        console.log('Checkpoints reset successfully.');
    }
    const sources = [
        { slug: 'binbaz-official', name: 'ابن باز' },
        { slug: 'uthaymeen-official', name: 'ابن عثيمين' },
        { slug: 'fawzan-official', name: 'الفوزان' },
        { slug: 'committee-official', name: 'اللجنة الدائمة' }
    ];
    const results = [];
    const startTime = Date.now();
    for (const src of sources) {
        console.log(`\n>>> بدء استيراد فتاوى: ${src.name} <<<`);
        try {
            const result = await importerService.executeImport(src.slug);
            results.push({ name: src.name, ...result });
        }
        catch (e) {
            console.error(`X فشل استيراد ${src.name}:`, e.message);
            results.push({ name: src.name, status: 'failed', imported: 0, duplicated: 0, failed: 0, details: e.message });
        }
    }
    const totalTimeMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.log('\n=========================');
    console.log('IMPORT REPORT');
    console.log('=========================');
    let totalFatwas = 0;
    for (const res of results) {
        console.log(`\n${res.name}`);
        console.log(`الجديد: ${res.imported || 0}`);
        console.log(`المكرر: ${res.duplicated || 0}`);
        console.log(`الفاشل: ${res.failed || 0}`);
        totalFatwas += (res.imported || 0);
    }
    console.log('\nالإجمالي:');
    console.log(`${totalFatwas} فتوى جديدة تم استيرادها`);
    console.log(`\nالمدة:`);
    console.log(`${totalTimeMinutes} دقيقة`);
    console.log('=========================');
    await app.close();
    process.exit(0);
}
run();
//# sourceMappingURL=import-runner.js.map