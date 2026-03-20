import { PrismaModule } from '@libs/prisma'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { WebhookCommonModule } from '../webhook/webhook-common.module'
import { HealthCheckerService } from './health-checker.service'
import { MonitoringAlertService } from './monitoring-alert.service'
import { MonitoringSchedulerService } from './monitoring-scheduler.service'

@Module({
    imports: [ScheduleModule.forRoot(), HttpModule, PrismaModule, WebhookCommonModule],
    providers: [MonitoringSchedulerService, HealthCheckerService, MonitoringAlertService],
    exports: [MonitoringSchedulerService, HealthCheckerService, MonitoringAlertService]
})
export class MonitoringCommonModule {}
