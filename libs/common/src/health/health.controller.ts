import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus'
import { PrismaService } from '@libs/prisma'
import { Public } from '../decorator/public.decorator'
import { RedisHealthIndicator } from './redis.health-indicator'

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly prismaHealth: PrismaHealthIndicator,
        private readonly prisma: PrismaService,
        private readonly redisHealth: RedisHealthIndicator
    ) {}

    @ApiOperation({ summary: 'Health Check' })
    @Public()
    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prisma),
            () => this.redisHealth.isHealthy('redis')
        ])
    }
}
