import { MonitoringCommonModule } from '@libs/common'
import { Module } from '@nestjs/common'
import { EndpointController } from './endpoint.controller'
import { EndpointRepository } from './endpoint.repository'
import { EndpointService } from './endpoint.service'
import { MonitoringLogController } from './monitoring-log.controller'
import { MonitoringLogRepository } from './monitoring-log.repository'
import { MonitoringLogService } from './monitoring-log.service'

@Module({
    imports: [MonitoringCommonModule],
    controllers: [EndpointController, MonitoringLogController],
    providers: [EndpointService, EndpointRepository, MonitoringLogService, MonitoringLogRepository]
})
export class UserMonitoringModule {}
