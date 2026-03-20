import {
    ApiAuthGuard,
    ApiExceptionResponse,
    ApiOkOffsetPaginationResponse,
    CurrentUser,
    OffsetRequestDto,
    OffsetResponseDto,
    Permission,
    PermissionGuard,
    WEBHOOK_ERROR,
    type JwtPayload
} from '@libs/common'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CreateWebhookChannelDto } from './dto/create-webhook-channel.dto'
import { UpdateWebhookChannelDto } from './dto/update-webhook-channel.dto'
import { WebhookChannelResponseDto } from './dto/webhook-channel-response.dto'
import { WebhookLogResponseDto, WebhookTestResponseDto } from './dto/webhook-log-response.dto'
import { WebhookService } from './webhook.service'

@ApiTags('webhook')
@ApiAuthGuard()
@Controller({ path: 'webhook/channels', version: '1' })
export class WebhookController {
    constructor(private readonly service: WebhookService) {}

    @ApiOperation({ summary: 'Webhook 채널 등록' })
    @ApiBody({ type: CreateWebhookChannelDto })
    @ApiCreatedResponse({ type: WebhookChannelResponseDto })
    @ApiExceptionResponse(WEBHOOK_ERROR.INVALID_URL)
    @ApiExceptionResponse(WEBHOOK_ERROR.CHANNEL_LIMIT_EXCEEDED)
    @ApiExceptionResponse(WEBHOOK_ERROR.DUPLICATE_URL)
    @Permission('webhook', 'write')
    @UseGuards(PermissionGuard)
    @Post()
    async create(@CurrentUser() payload: JwtPayload, @Body() dto: CreateWebhookChannelDto): Promise<WebhookChannelResponseDto> {
        return await this.service.create(payload.id, dto)
    }

    @ApiOperation({ summary: '내 Webhook 채널 목록 조회' })
    @ApiOkResponse({ type: [WebhookChannelResponseDto] })
    @Get()
    async findAll(@CurrentUser() payload: JwtPayload): Promise<WebhookChannelResponseDto[]> {
        return await this.service.findAll(payload.id)
    }

    @ApiOperation({ summary: 'Webhook 채널 상세 조회' })
    @ApiParam({ name: 'id', type: Number })
    @ApiOkResponse({ type: WebhookChannelResponseDto })
    @ApiExceptionResponse(WEBHOOK_ERROR.NOT_FOUND)
    @Get(':id')
    async findOne(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<WebhookChannelResponseDto> {
        return await this.service.findOne(id, payload.id)
    }

    @ApiOperation({ summary: 'Webhook 채널 수정' })
    @ApiParam({ name: 'id', type: Number })
    @ApiBody({ type: UpdateWebhookChannelDto })
    @ApiOkResponse({ type: WebhookChannelResponseDto })
    @ApiExceptionResponse(WEBHOOK_ERROR.NOT_FOUND)
    @Permission('webhook', 'write')
    @UseGuards(PermissionGuard)
    @Patch(':id')
    async update(
        @CurrentUser() payload: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWebhookChannelDto
    ): Promise<WebhookChannelResponseDto> {
        return await this.service.update(id, payload.id, dto)
    }

    @ApiOperation({ summary: 'Webhook 채널 삭제' })
    @ApiParam({ name: 'id', type: Number })
    @ApiNoContentResponse()
    @ApiExceptionResponse(WEBHOOK_ERROR.NOT_FOUND)
    @Permission('webhook', 'write')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async remove(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.remove(id, payload.id)
    }

    @ApiOperation({ summary: 'Webhook 테스트 발송' })
    @ApiParam({ name: 'id', type: Number })
    @ApiOkResponse({ type: WebhookTestResponseDto })
    @ApiExceptionResponse(WEBHOOK_ERROR.NOT_FOUND)
    @Post(':id/test')
    async testDispatch(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<WebhookTestResponseDto> {
        return await this.service.testDispatch(id, payload.id)
    }

    @ApiOperation({ summary: 'Webhook 발송 이력 조회' })
    @ApiParam({ name: 'id', type: Number })
    @ApiOkOffsetPaginationResponse({ type: WebhookLogResponseDto })
    @ApiExceptionResponse(WEBHOOK_ERROR.NOT_FOUND)
    @Get(':id/logs')
    async findLogs(
        @CurrentUser() payload: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
        @Query() query: OffsetRequestDto
    ): Promise<OffsetResponseDto<WebhookLogResponseDto>> {
        return await this.service.findLogs(id, payload.id, query)
    }
}
