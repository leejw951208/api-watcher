import {
    ApiAuthGuard,
    ApiExceptionResponse,
    ApiOkBaseResponse,
    ApiOkOffsetPaginationResponse,
    CreateResponseDto,
    CurrentUser,
    MONITORING_ERROR,
    OffsetResponseDto,
    Permission,
    PermissionGuard,
    type JwtPayload
} from '@libs/common'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { CreateEndpointDto } from './dto/create-endpoint.dto'
import { EndpointPaginationRequestDto } from './dto/endpoint-pagination-request.dto'
import { EndpointResponseDto } from './dto/endpoint-response.dto'
import { UpdateEndpointDto } from './dto/update-endpoint.dto'
import { EndpointService } from './endpoint.service'

@ApiTags('monitoring')
@ApiAuthGuard()
@Controller({ path: 'monitoring/endpoints', version: '1' })
export class EndpointController {
    constructor(private readonly service: EndpointService) {}

    @ApiOperation({ summary: '모니터링 엔드포인트 등록' })
    @ApiBody({ type: CreateEndpointDto })
    @ApiCreatedResponse({ type: CreateResponseDto })
    @ApiExceptionResponse(MONITORING_ERROR.DUPLICATE_URL)
    @ApiExceptionResponse(MONITORING_ERROR.ENDPOINT_LIMIT_EXCEEDED)
    @Permission('monitoring', 'write')
    @UseGuards(PermissionGuard)
    @Post()
    async createEndpoint(@CurrentUser() payload: JwtPayload, @Body() dto: CreateEndpointDto): Promise<CreateResponseDto> {
        return await this.service.createEndpoint(payload.id, dto)
    }

    @ApiOperation({ summary: '내 모니터링 엔드포인트 목록 조회' })
    @ApiOkOffsetPaginationResponse({ type: EndpointResponseDto })
    @Get()
    async getEndpoints(
        @CurrentUser() payload: JwtPayload,
        @Query() dto: EndpointPaginationRequestDto
    ): Promise<OffsetResponseDto<EndpointResponseDto>> {
        return await this.service.getEndpoints(payload.id, dto)
    }

    @ApiOperation({ summary: '모니터링 엔드포인트 상세 조회' })
    @ApiParam({ name: 'id', type: Number, description: '엔드포인트 ID' })
    @ApiOkBaseResponse({ type: EndpointResponseDto })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Get(':id')
    async getEndpoint(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<EndpointResponseDto> {
        return await this.service.getEndpoint(payload.id, id)
    }

    @ApiOperation({ summary: '모니터링 엔드포인트 수정' })
    @ApiParam({ name: 'id', type: Number, description: '엔드포인트 ID' })
    @ApiBody({ type: UpdateEndpointDto })
    @ApiNoContentResponse({ description: '수정 성공' })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Permission('monitoring', 'write')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id')
    async updateEndpoint(
        @CurrentUser() payload: JwtPayload,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEndpointDto
    ): Promise<void> {
        await this.service.updateEndpoint(payload.id, id, dto)
    }

    @ApiOperation({ summary: '모니터링 엔드포인트 삭제' })
    @ApiParam({ name: 'id', type: Number, description: '엔드포인트 ID' })
    @ApiNoContentResponse({ description: '삭제 성공' })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Permission('monitoring', 'delete')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deleteEndpoint(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.deleteEndpoint(payload.id, id)
    }

    @ApiOperation({ summary: '모니터링 일시정지' })
    @ApiParam({ name: 'id', type: Number, description: '엔드포인트 ID' })
    @ApiNoContentResponse({ description: '일시정지 성공' })
    @Permission('monitoring', 'write')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/pause')
    async pauseEndpoint(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.pauseEndpoint(payload.id, id)
    }

    @ApiOperation({ summary: '모니터링 재개' })
    @ApiParam({ name: 'id', type: Number, description: '엔드포인트 ID' })
    @ApiNoContentResponse({ description: '재개 성공' })
    @Permission('monitoring', 'write')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/resume')
    async resumeEndpoint(@CurrentUser() payload: JwtPayload, @Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.resumeEndpoint(payload.id, id)
    }
}
