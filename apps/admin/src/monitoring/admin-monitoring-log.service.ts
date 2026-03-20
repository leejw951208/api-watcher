import { OffsetResponseDto } from '@libs/common'
import { Injectable } from '@nestjs/common'
import { AdminMonitoringLogRepository } from './admin-monitoring-log.repository'

@Injectable()
export class AdminMonitoringLogService {
    constructor(private readonly repository: AdminMonitoringLogRepository) {}

    async getLogs(page: number, size: number, endpointId?: number): Promise<OffsetResponseDto<unknown>> {
        const { items, totalCount } = await this.repository.findLogsOffset(page, size, endpointId)
        return new OffsetResponseDto(items, { page, totalCount })
    }

    async getSystemDashboard() {
        return this.repository.getSystemDashboard()
    }
}
