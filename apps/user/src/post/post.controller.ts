import {
    ApiAuthGuard,
    ApiExceptionResponse,
    ApiOkBaseResponse,
    ApiOkCursorPaginationResponse,
    ApiOkOffsetPaginationResponse,
    CreateResponseDto,
    CurrentUser,
    CursorResponseDto,
    OffsetResponseDto,
    Permission,
    PermissionGuard,
    POST_ERROR,
    type JwtPayload
} from '@libs/common'

import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { PostCreateDto } from './dto/post-create.dto'
import { PostCursorRequestDto } from './dto/post-cursor-request.dto'
import { PostOffsetRequestDto } from './dto/post-offset-request.dto'
import { PostResponseDto } from './dto/post-response.dto'
import { PostUpdateDto } from './dto/post-update.dto'
import { PostService } from './post.service'

@ApiTags('posts')
@ApiAuthGuard()
@Controller({ path: 'posts', version: '1' })
export class PostController {
    constructor(private readonly service: PostService) {}

    @ApiOperation({ summary: '전체 게시글 목록 조회 (Offset Pagination)' })
    @ApiOkOffsetPaginationResponse({ type: PostResponseDto })
    @Get('offset')
    async getPostsOffset(@Query() searchCondition: PostOffsetRequestDto): Promise<OffsetResponseDto<PostResponseDto>> {
        return await this.service.getPostsOffset(searchCondition)
    }

    @ApiOperation({ summary: '전체 게시글 목록 조회 (Cursor Pagination)' })
    @ApiOkCursorPaginationResponse({ type: PostResponseDto })
    @Get('cursor')
    async getPostsCursor(@Query() searchCondition: PostCursorRequestDto): Promise<CursorResponseDto<PostResponseDto>> {
        return await this.service.getPostsCursor(searchCondition)
    }

    @ApiOperation({ summary: '게시글 상세 조회' })
    @ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
    @ApiOkBaseResponse({ type: PostResponseDto })
    @ApiExceptionResponse(POST_ERROR.NOT_FOUND)
    @Get(':id')
    async getPost(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<PostResponseDto> {
        return await this.service.getPost(payload.id, id)
    }

    @ApiOperation({ summary: '게시글 작성' })
    @ApiBody({ type: PostCreateDto })
    @ApiCreatedResponse({ type: CreateResponseDto })
    @Permission('post', 'write')
    @UseGuards(PermissionGuard)
    @Post()
    async createPost(@CurrentUser() payload: JwtPayload, @Body() reqDto: PostCreateDto): Promise<CreateResponseDto> {
        return await this.service.savePost(payload.id, reqDto)
    }

    @ApiOperation({ summary: '게시글 수정' })
    @ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
    @ApiBody({ type: PostUpdateDto })
    @ApiNoContentResponse({ description: '수정 성공' })
    @ApiExceptionResponse(POST_ERROR.NOT_FOUND)
    @Permission('post', 'write')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id')
    async updatePost(
        @CurrentUser() payload: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
        @Body() reqDto: PostUpdateDto
    ): Promise<void> {
        await this.service.updatePost(payload.id, id, reqDto)
    }

    @ApiOperation({ summary: '게시글 삭제 (Soft Delete)' })
    @ApiParam({ name: 'id', type: Number, description: '게시글 ID' })
    @ApiNoContentResponse({ description: '삭제 성공' })
    @ApiExceptionResponse(POST_ERROR.NOT_FOUND)
    @Permission('post', 'delete')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deletePost(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.deletePost(payload.id, id)
    }
}
