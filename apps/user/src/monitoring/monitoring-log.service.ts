import { BaseException, MONITORING_ERROR, OffsetResponseDto } from '@libs/common'
import { Injectable } from '@nestjs/common'
import { QueryLogDto } from './dto/query-log.dto'
import { EndpointRepository } from './endpoint.repository'
import { MonitoringLogRepository, UptimeStats } from './monitoring-log.repository'

const PERIOD_MS: Record<string, number> = {
    '1d': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000
}

@Injectable()
export class MonitoringLogService {
    constructor(
        private readonly logRepository: MonitoringLogRepository,
        private readonly endpointRepository: EndpointRepository
    ) {}

    async getLogsByEndpoint(userId: number, endpointId: number, dto: QueryLogDto): Promise<OffsetResponseDto<unknown>> {
        // 소유자 검증
        const endpoint = await this.endpointRepository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)

        const { items, totalCount } = await this.logRepository.findLogsByEndpoint(endpointId, dto)
        return new OffsetResponseDto(items, { page: dto.page, totalCount })
    }

    async getUptimeStats(
        userId: number,
        endpointId: number,
        period: string
    ): Promise<UptimeStats & { endpointId: number; period: string }> {
        const endpoint = await this.endpointRepository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)

        const ms = PERIOD_MS[period] ?? PERIOD_MS['7d']
        const since = new Date(Date.now() - ms)
        const stats = await this.logRepository.getUptimeStats(endpointId, since)

        return { endpointId, period, ...stats }
    }

    async getDashboard(userId: number) {
        return this.logRepository.getDashboardByUserId(userId)
    }
}
