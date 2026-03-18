import { ApiAuthGuard, ApiOkOffsetPaginationResponse, OffsetResponseDto, Permission, PermissionGuard } from '@libs/common'
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateNotificationRequestDto } from './dto/notification-create-request.dto'
import { NotificationPaginationRequestDto } from './dto/notification-pagination-request.dto'
import { NotificationResponseDto } from './dto/notification-response.dto'
import { NotificationService } from './notification.service'

@ApiTags('notifications')
@ApiAuthGuard()
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @ApiOperation({ summary: '알림 발송' })
    @ApiBody({ type: CreateNotificationRequestDto })
    @ApiCreatedResponse({ description: '알림 발송 성공' })
    @Permission('notification', 'write')
    @UseGuards(PermissionGuard)
    @Post()
    async createNotification(@Body() dto: CreateNotificationRequestDto): Promise<void> {
        return await this.notificationService.createNotification(dto)
    }

    @ApiOperation({ summary: '알림 목록 조회' })
    @ApiOkOffsetPaginationResponse({ type: NotificationResponseDto })
    @Permission('notification', 'read')
    @UseGuards(PermissionGuard)
    @Get()
    async getNotifications(@Query() dto: NotificationPaginationRequestDto): Promise<OffsetResponseDto<NotificationResponseDto>> {
        return await this.notificationService.getNotifications(dto)
    }
}
