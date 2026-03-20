import { ApiAuthGuard, ApiExceptionResponse, ApiOkBaseResponse, CurrentUser, NOTIFICATION_ERROR, type JwtPayload } from '@libs/common'
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { NotificationResponseDto } from './dto/notification-response.dto'
import { NotificationService } from './notification.service'

@ApiTags('notifications')
@ApiAuthGuard()
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
    constructor(private readonly service: NotificationService) {}

    @ApiOperation({ summary: '알림 상세 조회' })
    @ApiParam({ name: 'id', type: Number, description: '알림 ID' })
    @ApiOkBaseResponse({ type: NotificationResponseDto })
    @ApiExceptionResponse(NOTIFICATION_ERROR.NOT_FOUND)
    @Get(':id')
    async getNotification(
        @CurrentUser() payload: JwtPayload,
        @Param('id', ParseIntPipe) notificationId: number
    ): Promise<NotificationResponseDto> {
        return await this.service.getNotification(payload.id, notificationId)
    }

    @ApiOperation({ summary: '알림 읽음 처리' })
    @ApiParam({ name: 'id', type: Number, description: '알림 ID' })
    @ApiNoContentResponse({ description: '읽음 처리 성공' })
    @ApiExceptionResponse(NOTIFICATION_ERROR.NOT_FOUND)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id')
    async readNotification(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) notificationId: number): Promise<void> {
        await this.service.readNotification(payload.id, notificationId)
    }

    @ApiOperation({ summary: '알림 삭제 (Soft Delete)' })
    @ApiParam({ name: 'id', type: Number, description: '알림 ID' })
    @ApiNoContentResponse({ description: '삭제 성공' })
    @ApiExceptionResponse(NOTIFICATION_ERROR.NOT_FOUND)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deleteNotification(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) notificationId: number): Promise<void> {
        await this.service.deleteNotification(payload.id, notificationId)
    }
}
