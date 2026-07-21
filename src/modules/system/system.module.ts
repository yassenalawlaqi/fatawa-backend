import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { SystemController } from './system.controller';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [TerminusModule],
  controllers: [SystemController],
  providers: [AuditService],
  exports: [AuditService],
})
export class SystemModule {}
