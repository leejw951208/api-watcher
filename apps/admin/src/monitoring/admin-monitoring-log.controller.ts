import { ApiAuthGuard, OffsetResponseDto, Permission, PermissionGuard } from '@libs/common'
import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { AdminMonitoringLogService } from './admin-monitoring-log.service'

@ApiTags('monitoring')
@ApiAuthGuard()
@Controller({ path: 'monitoring', version: '1' })
export class AdminMonitoringLogController {
    constructor(private readonly service: AdminMonitoringLogService) {}

    @ApiOperation({ summary: '전체 모니터링 이력 조회 (관리자)' })
    @ApiQuery({ name: 'page', type: Number, example: 1 })
    @ApiQuery({ name: 'size', type: Number, example: 20 })
    @ApiQuery({ name: 'endpointId', required: false, type: Number })
    @Permission('monitoring', 'read')
    @UseGuards(PermissionGuard)
    @Get('logs')
    async getLogs(
        @Query('page') page: number = 1,
        @Query('size') size: number = 20,
        @Query('endpointId') endpointId?: number
    ): Promise<OffsetResponseDto<unknown>> {
        return await this.service.getLogs(Number(page), Number(size), endpointId ? Number(endpointId) : undefined)
    }

    @ApiOperation({ summary: '시스템 대시보드 (관리자)' })
    @Permission('monitoring', 'read')
    @UseGuards(PermissionGuard)
    @Get('dashboard')
    async getSystemDashboard() {
        return await this.service.getSystemDashboard()
    }
}
