import { MonitoringCommonModule } from '@libs/common'
import { Module } from '@nestjs/common'
import { AdminEndpointController } from './admin-endpoint.controller'
import { AdminEndpointRepository } from './admin-endpoint.repository'
import { AdminEndpointService } from './admin-endpoint.service'
import { AdminMonitoringLogController } from './admin-monitoring-log.controller'
import { AdminMonitoringLogRepository } from './admin-monitoring-log.repository'
import { AdminMonitoringLogService } from './admin-monitoring-log.service'

@Module({
    imports: [MonitoringCommonModule],
    controllers: [AdminEndpointController, AdminMonitoringLogController],
    providers: [AdminEndpointService, AdminEndpointRepository, AdminMonitoringLogService, AdminMonitoringLogRepository]
})
export class AdminMonitoringModule {}
