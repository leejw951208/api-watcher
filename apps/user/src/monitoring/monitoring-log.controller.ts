import { ApiAuthGuard, ApiExceptionResponse, CurrentUser, MONITORING_ERROR, OffsetResponseDto, type JwtPayload } from '@libs/common'
import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import { QueryLogDto } from './dto/query-log.dto'
import { MonitoringLogService } from './monitoring-log.service'

@ApiTags('monitoring')
@ApiAuthGuard()
@Controller({ path: 'monitoring', version: '1' })
export class MonitoringLogController {
    constructor(private readonly service: MonitoringLogService) {}

    @ApiOperation({ summary: '특정 엔드포인트 모니터링 이력 조회' })
    @ApiParam({ name: 'endpointId', type: Number, description: '엔드포인트 ID' })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Get('logs/:endpointId')
    async getLogsByEndpoint(
        @CurrentUser() payload: JwtPayload,
        @Param('endpointId', ParseIntPipe) endpointId: number,
        @Query() dto: QueryLogDto
    ): Promise<OffsetResponseDto<unknown>> {
        return await this.service.getLogsByEndpoint(payload.id, endpointId, dto)
    }

    @ApiOperation({ summary: '가용률 통계 조회' })
    @ApiParam({ name: 'endpointId', type: Number, description: '엔드포인트 ID' })
    @ApiQuery({ name: 'period', required: false, description: '기간 (1d, 7d, 30d)', example: '7d' })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Get('stats/:endpointId')
    async getUptimeStats(
        @CurrentUser() payload: JwtPayload,
        @Param('endpointId', ParseIntPipe) endpointId: number,
        @Query('period') period: string = '7d'
    ) {
        return await this.service.getUptimeStats(payload.id, endpointId, period)
    }

    @ApiOperation({ summary: '개인 대시보드' })
    @Get('dashboard')
    async getDashboard(@CurrentUser() payload: JwtPayload) {
        return await this.service.getDashboard(payload.id)
    }
}
