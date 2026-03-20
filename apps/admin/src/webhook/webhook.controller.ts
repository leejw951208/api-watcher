import { ApiAuthGuard, ApiOkOffsetPaginationResponse, OffsetRequestDto, OffsetResponseDto, Permission, PermissionGuard } from '@libs/common'
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { AdminWebhookService } from './webhook.service'

@ApiTags('webhook')
@ApiAuthGuard()
@Controller({ path: 'webhook/channels', version: '1' })
export class AdminWebhookController {
    constructor(private readonly service: AdminWebhookService) {}

    @ApiOperation({ summary: '전체 Webhook 채널 현황 조회' })
    @ApiOkOffsetPaginationResponse({ type: Object })
    @Permission('webhook', 'read')
    @UseGuards(PermissionGuard)
    @Get()
    async findAll(@Query() query: OffsetRequestDto): Promise<OffsetResponseDto<any>> {
        return await this.service.findAll(query)
    }

    @ApiOperation({ summary: '채널별 발송 이력 조회' })
    @ApiParam({ name: 'id', type: Number })
    @ApiOkOffsetPaginationResponse({ type: Object })
    @Permission('webhook', 'read')
    @UseGuards(PermissionGuard)
    @Get(':id/logs')
    async findLogs(@Param('id', ParseIntPipe) id: number, @Query() query: OffsetRequestDto): Promise<OffsetResponseDto<any>> {
        return await this.service.findLogsByChannelId(id, query)
    }
}
