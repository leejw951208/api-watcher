import { ApiAuthGuard, ApiExceptionResponse, ApiOkBaseResponse, ApiOkOffsetPaginationResponse, OffsetResponseDto, Permission, PermissionGuard, POST_ERROR } from '@libs/common'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { AdminPostPaginationRequestDto } from './dto/admin-post-pagination-request.dto'
import { AdminPostResponseDto } from './dto/admin-post-response.dto'
import { AdminPostStatusUpdateDto } from './dto/admin-post-status-update.dto'
import { AdminPostService } from './post.service'

@ApiTags('posts')
@ApiAuthGuard()
@Controller({ path: 'posts', version: '1' })
export class AdminPostController {
    constructor(private readonly service: AdminPostService) {}

    @ApiOperation({ summary: '게시글 목록 조회' })
    @ApiOkOffsetPaginationResponse({ type: AdminPostResponseDto })
    @Permission('post', 'read')
    @UseGuards(PermissionGuard)
    @Get()
    async getPosts(@Query() dto: AdminPostPaginationRequestDto): Promise<OffsetResponseDto<AdminPostResponseDto>> {
        return await this.service.getPosts(dto)
    }

    @ApiOperation({ summary: '게시글 상세 조회' })
    @ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
    @ApiOkBaseResponse({ type: AdminPostResponseDto })
    @ApiExceptionResponse(POST_ERROR.NOT_FOUND)
    @Permission('post', 'read')
    @UseGuards(PermissionGuard)
    @Get(':id')
    async getPost(@Param('id', ParseIntPipe) id: number): Promise<AdminPostResponseDto> {
        return await this.service.getPost(id)
    }

    @ApiOperation({ summary: '게시글 상태 변경 (숨김/발행)' })
    @ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
    @ApiBody({ type: AdminPostStatusUpdateDto })
    @ApiNoContentResponse({ description: '상태 변경 성공' })
    @ApiExceptionResponse(POST_ERROR.NOT_FOUND)
    @Permission('post', 'update')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/status')
    async updatePostStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: AdminPostStatusUpdateDto): Promise<void> {
        await this.service.updatePostStatus(id, dto.status)
    }

    @ApiOperation({ summary: '게시글 삭제 (Soft Delete)' })
    @ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
    @ApiNoContentResponse({ description: '삭제 성공' })
    @ApiExceptionResponse(POST_ERROR.NOT_FOUND)
    @Permission('post', 'delete')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deletePost(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.deletePost(id)
    }
}
