import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImporterService } from './importer.service';
import { ImporterProcessor } from './importer.processor';
import { BinBazImporter } from './plugins/binbaz.importer';
import { UthaymeenImporter } from './plugins/uthaymeen.importer';
import { FawzanImporter } from './plugins/fawzan.importer';
import { PermanentCommitteeImporter } from './plugins/committee.importer';
import { ContentExtractorService } from './services/content-extractor.service';

import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'import-queue',
    }),
    SearchModule,
  ],
  providers: [
    ImporterService,
    ImporterProcessor,
    BinBazImporter,
    UthaymeenImporter,
    FawzanImporter,
    PermanentCommitteeImporter,
    ContentExtractorService,
  ],
  exports: [ImporterService],
})
export class ImporterModule {}
