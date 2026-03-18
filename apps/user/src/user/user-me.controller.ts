import {
    ApiAuthGuard,
    ApiExceptionResponse,
    ApiOkBaseResponse,
    ApiOkCursorPaginationResponse,
    ApiOkOffsetPaginationResponse,
    CurrentUser,
    CursorResponseDto,
    CustomThrottlerGuard,
    NOTIFICATION_ERROR,
    OffsetResponseDto,
    POST_ERROR,
    USER_ERROR,
    type JwtPayload
} from '@libs/common'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { NotificationCursorRequestDto } from '../notification/dto/notification-cursor-request.dto'
import { NotificationResponseDto } from '../notification/dto/notification-response.dto'
import { NotificationService } from '../notification/notification.service'
import { PostCursorRequestDto } from '../post/dto/post-cursor-request.dto'
import { PostOffsetRequestDto } from '../post/dto/post-offset-request.dto'
import { PostResponseDto } from '../post/dto/post-response.dto'
import { PostService } from '../post/post.service'
import { UserResponseDto } from './dto/user-response.dto'
import { UserUpdateDto } from './dto/user-update.dto'
import { UserService } from './user.service'

@ApiTags('users/me')
@ApiAuthGuard()
@UseGuards(CustomThrottlerGuard)
@Controller({ path: 'users/me', version: '1' })
export class UserMeController {
    constructor(
        private readonly userService: UserService,
        private readonly postService: PostService,
        private readonly notificationService: NotificationService
    ) {}

    // ─── 내 정보 ───

    @ApiOperation({ summary: '내 정보 조회' })
    @ApiOkBaseResponse({ type: UserResponseDto })
    @ApiExceptionResponse(USER_ERROR.NOT_FOUND)
    @Throttle({ ip: { limit: 5, ttl: 60000 }, user: { limit: 5, ttl: 60000 } })
    @Get()
    async getMe(@CurrentUser() payload: JwtPayload): Promise<UserResponseDto> {
        return await this.userService.getMe(payload.id)
    }

    @ApiOperation({ summary: '내 정보 수정' })
    @ApiBody({ type: UserUpdateDto })
    @ApiNoContentResponse({ description: '수정 성공' })
    @ApiExceptionResponse(USER_ERROR.NOT_FOUND)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch()
    async updateMe(@CurrentUser() payload: JwtPayload, @Body() reqDto: UserUpdateDto): Promise<void> {
        await this.userService.updateMe(payload.id, reqDto)
    }

    @ApiOperation({ summary: '회원 탈퇴 (Soft Delete)' })
    @ApiNoContentResponse({ description: '탈퇴 성공' })
    @ApiExceptionResponse([USER_ERROR.NOT_FOUND, USER_ERROR.ALREADY_DELETED])
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete()
    async deleteMe(@CurrentUser() payload: JwtPayload): Promise<void> {
        await this.userService.withdraw(payload.id)
    }

    // ─── 내 게시글 ───

    @ApiOperation({ summary: '내 게시글 목록 조회 (Offset Pagination)' })
    @ApiOkOffsetPaginationResponse({ type: PostResponseDto })
    @Get('posts/offset')
    async getMyPostsOffset(
        @CurrentUser() payload: JwtPayload,
        @Query() searchCondition: PostOffsetRequestDto
    ): Promise<OffsetResponseDto<PostResponseDto>> {
        return await this.postService.getPostsOffset(searchCondition, payload.id)
    }

    @ApiOperation({ summary: '내 게시글 목록 조회 (Cursor Pagination)' })
    @ApiOkCursorPaginationResponse({ type: PostResponseDto })
    @Get('posts/cursor')
    async getMyPostsCursor(
        @CurrentUser() payload: JwtPayload,
        @Query() searchCondition: PostCursorRequestDto
    ): Promise<CursorResponseDto<PostResponseDto>> {
        return await this.postService.getPostsCursor(searchCondition, payload.id)
    }

    // ─── 내 알림 ───

    @ApiOperation({ summary: '내 알림 목록 조회 (Cursor Pagination)' })
    @ApiOkCursorPaginationResponse({ type: NotificationResponseDto })
    @Get('notifications/cursor')
    async getMyNotifications(
        @CurrentUser() payload: JwtPayload,
        @Query() searchCondition: NotificationCursorRequestDto
    ): Promise<CursorResponseDto<NotificationResponseDto>> {
        return await this.notificationService.getMyNotifications(searchCondition, payload.id)
    }

    @ApiOperation({ summary: '모든 알림 읽음 처리' })
    @ApiNoContentResponse({ description: '전체 읽음 처리 성공' })
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch('notifications/read-all')
    async readAllNotifications(@CurrentUser() payload: JwtPayload): Promise<void> {
        await this.notificationService.readAllNotifications(payload.id)
    }
}
