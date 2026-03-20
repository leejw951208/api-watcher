import {
    ApiAuthGuard,
    ApiExceptionResponse,
    ApiOkBaseResponse,
    ApiOkOffsetPaginationResponse,
    OffsetResponseDto,
    Permission,
    PermissionGuard,
    USER_ERROR
} from '@libs/common'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { AdminUserPaginationRequestDto } from './dto/admin-user-pagination-request.dto'
import { AdminUserResponseDto } from './dto/admin-user-response.dto'
import { AdminUserStatusUpdateDto } from './dto/admin-user-status-update.dto'
import { AdminUserService } from './user.service'

@ApiTags('users')
@ApiAuthGuard()
@Controller({ path: 'users', version: '1' })
export class AdminUserController {
    constructor(private readonly service: AdminUserService) {}

    @ApiOperation({ summary: '사용자 목록 조회' })
    @ApiOkOffsetPaginationResponse({ type: AdminUserResponseDto })
    @Permission('user', 'read')
    @UseGuards(PermissionGuard)
    @Get()
    async getUsers(@Query() dto: AdminUserPaginationRequestDto): Promise<OffsetResponseDto<AdminUserResponseDto>> {
        return await this.service.getUsers(dto)
    }

    @ApiOperation({ summary: '사용자 상세 조회' })
    @ApiParam({ name: 'id', type: Number, description: '사용자 ID' })
    @ApiOkBaseResponse({ type: AdminUserResponseDto })
    @ApiExceptionResponse(USER_ERROR.NOT_FOUND)
    @Permission('user', 'read')
    @UseGuards(PermissionGuard)
    @Get(':id')
    async getUser(@Param('id', ParseIntPipe) id: number): Promise<AdminUserResponseDto> {
        return await this.service.getUser(id)
    }

    @ApiOperation({ summary: '사용자 상태 변경' })
    @ApiParam({ name: 'id', type: Number, description: '사용자 ID' })
    @ApiBody({ type: AdminUserStatusUpdateDto })
    @ApiNoContentResponse({ description: '상태 변경 성공' })
    @ApiExceptionResponse(USER_ERROR.NOT_FOUND)
    @Permission('user', 'update')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/status')
    async updateUserStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminUserStatusUpdateDto): Promise<void> {
        await this.service.updateUserStatus(id, dto.status)
    }

    @ApiOperation({ summary: '사용자 삭제 (Soft Delete)' })
    @ApiParam({ name: 'id', type: Number, description: '사용자 ID' })
    @ApiNoContentResponse({ description: '삭제 성공' })
    @ApiExceptionResponse(USER_ERROR.NOT_FOUND)
    @Permission('user', 'delete')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.deleteUser(id)
    }
}
