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
exports.BaseImporterService = void 0;
const common_1 = require("@nestjs/common");
const fatwa_validator_util_1 = require("../utils/fatwa-validator.util");
const crypto = __importStar(require("crypto"));
class BaseImporterService {
    prisma;
    logger = new common_1.Logger(this.constructor.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateFingerprint(officialUrl, question, answer) {
        const hash = crypto.createHash('sha256');
        hash.update(`${officialUrl}||${question}||${answer}`);
        return hash.digest('hex');
    }
    async runImportPipeline() {
        const startTime = Date.now();
        this.logger.log(`[START] Importing from ${this.sourceName}`);
        const metrics = {
            imported: 0,
            updated: 0,
            duplicated: 0,
            skipped: 0,
            failed: 0,
        };
        try {
            const source = await this.prisma.source.upsert({
                where: { slug: this.sourceSlug },
                update: {},
                create: {
                    name: this.sourceName,
                    slug: this.sourceSlug,
                    type: 'official_website',
                    officialUrl: this.officialUrl,
                },
            });
            const rawItems = await this.fetchRawItems();
            this.logger.log(`Found ${rawItems.length} items to process from ${this.sourceName}.`);
            for (const item of rawItems) {
                try {
                    const extractedData = await this.extractFatwaData(item);
                    extractedData.sourceId = source.id;
                    const validation = fatwa_validator_util_1.FatwaValidator.validate(extractedData);
                    if (!validation.isValid) {
                        this.logger.warn(`Skipping invalid fatwa ${extractedData.url}: ${validation.errors.join(', ')}`);
                        metrics.skipped++;
                        continue;
                    }
                    const newFingerprint = this.calculateFingerprint(extractedData.url || '', extractedData.question, extractedData.answer);
                    const existingFatwa = await this.prisma.fatwa.findUnique({
                        where: { slug: extractedData.slug },
                    });
                    if (existingFatwa) {
                        if (existingFatwa.sourceFingerprint === newFingerprint) {
                            metrics.duplicated++;
                        }
                        else {
                            await this.prisma.$transaction(async (tx) => {
                                const revisionsCount = await tx.fatwaRevision.count({
                                    where: { fatwaId: existingFatwa.id }
                                });
                                await tx.fatwaRevision.create({
                                    data: {
                                        fatwaId: existingFatwa.id,
                                        revisionNumber: revisionsCount + 1,
                                    }
                                });
                                await tx.fatwa.update({
                                    where: { id: existingFatwa.id },
                                    data: {
                                        question: extractedData.question,
                                        answer: extractedData.answer,
                                        sourceFingerprint: newFingerprint,
                                        updatedAt: new Date(),
                                    }
                                });
                            });
                            metrics.updated++;
                        }
                    }
                    else {
                        await this.prisma.fatwa.create({
                            data: {
                                slug: extractedData.slug,
                                question: extractedData.question,
                                answer: extractedData.answer,
                                sourceFingerprint: newFingerprint,
                                scholarId: extractedData.scholarId,
                                categoryId: extractedData.categoryId,
                                sourceId: source.id,
                                officialUrl: extractedData.url,
                                publishedAt: extractedData.publishedAt || new Date(),
                                verificationStatus: 'verified',
                                attachments: {
                                    create: (extractedData.attachments || []).map(a => ({ type: a.type, fileUrl: a.url, title: a.title }))
                                }
                            }
                        });
                        metrics.imported++;
                    }
                }
                catch (itemError) {
                    this.logger.error(`Error processing item in ${this.sourceSlug}`, itemError.stack);
                    metrics.failed++;
                }
            }
            const executionTime = Date.now() - startTime;
            const finalStatus = metrics.failed === rawItems.length && rawItems.length > 0 ? 'failed' : 'success';
            this.logger.log(`[END] Import complete for ${this.sourceName}. Time: ${executionTime}ms. Imported: ${metrics.imported}, Updated: ${metrics.updated}, Skipped: ${metrics.skipped}, Failed: ${metrics.failed}, Duplicated: ${metrics.duplicated}`);
            await this.prisma.importJob.create({
                data: {
                    source: this.sourceSlug,
                    startedAt: new Date(startTime),
                    finishedAt: new Date(),
                    duration: executionTime,
                    status: finalStatus,
                    importedCount: metrics.imported,
                    updatedCount: metrics.updated,
                    skippedCount: metrics.skipped,
                    failedCount: metrics.failed
                }
            });
            await this.prisma.syncStatus.upsert({
                where: { source: this.sourceSlug },
                update: {
                    lastSync: new Date(),
                    nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000),
                    status: 'idle',
                    lastError: null
                },
                create: {
                    source: this.sourceSlug,
                    lastSync: new Date(),
                    nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000),
                    status: 'idle',
                    lastError: null
                }
            });
            await this.prisma.fatwa.updateMany({
                where: { source: { slug: this.sourceSlug }, syncStatus: 'stale' },
                data: { syncStatus: 'active' }
            });
            return {
                source: this.sourceSlug,
                status: finalStatus,
                imported: metrics.imported,
                updated: metrics.updated,
                duplicated: metrics.duplicated,
                skipped: metrics.skipped,
                failed: metrics.failed,
                executionTime: executionTime,
            };
        }
        catch (criticalError) {
            this.logger.error(`[FATAL] Pipeline failed for ${this.sourceSlug}`, criticalError.stack);
            const executionTime = Date.now() - startTime;
            await this.prisma.importJob.create({
                data: {
                    source: this.sourceSlug,
                    startedAt: new Date(startTime),
                    finishedAt: new Date(),
                    duration: executionTime,
                    status: 'failed',
                    errorMessage: criticalError.message
                }
            });
            await this.prisma.syncStatus.upsert({
                where: { source: this.sourceSlug },
                update: {
                    status: 'error',
                    lastError: criticalError.message,
                    nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000)
                },
                create: {
                    source: this.sourceSlug,
                    status: 'error',
                    lastError: criticalError.message,
                    nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000)
                }
            });
            await this.prisma.fatwa.updateMany({
                where: { source: { slug: this.sourceSlug } },
                data: { syncStatus: 'stale' }
            });
            return {
                source: this.sourceSlug,
                status: 'failed',
                imported: 0,
                updated: 0,
                duplicated: 0,
                skipped: 0,
                failed: 1,
                executionTime,
                details: criticalError.message,
            };
        }
    }
}
exports.BaseImporterService = BaseImporterService;
//# sourceMappingURL=base-importer.service.js.map