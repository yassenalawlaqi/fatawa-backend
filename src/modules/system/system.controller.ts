import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller({ path: 'system', version: '1' })
export class SystemController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Check system health (Database, Redis, etc.)' })
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      // Redis ping check would go here
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if system is ready to accept requests' })
  ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }
}
