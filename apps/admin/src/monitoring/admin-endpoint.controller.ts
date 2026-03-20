import {
    ApiAuthGuard,
    ApiExceptionResponse,
    ApiOkBaseResponse,
    ApiOkOffsetPaginationResponse,
    MONITORING_ERROR,
    OffsetResponseDto,
    Permission,
    PermissionGuard
} from '@libs/common'
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { AdminEndpointPaginationRequestDto } from './dto/admin-endpoint-pagination-request.dto'
import { AdminEndpointResponseDto } from './dto/admin-endpoint-response.dto'
import { AdminEndpointService } from './admin-endpoint.service'

@ApiTags('monitoring')
@ApiAuthGuard()
@Controller({ path: 'monitoring/endpoints', version: '1' })
export class AdminEndpointController {
    constructor(private readonly service: AdminEndpointService) {}

    @ApiOperation({ summary: '전체 모니터링 엔드포인트 목록 (관리자)' })
    @ApiOkOffsetPaginationResponse({ type: AdminEndpointResponseDto })
    @Permission('monitoring', 'read')
    @UseGuards(PermissionGuard)
    @Get()
    async getEndpoints(@Query() dto: AdminEndpointPaginationRequestDto): Promise<OffsetResponseDto<AdminEndpointResponseDto>> {
        return await this.service.getEndpoints(dto)
    }

    @ApiOperation({ summary: '엔드포인트 상세 조회 (관리자)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiOkBaseResponse({ type: AdminEndpointResponseDto })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Permission('monitoring', 'read')
    @UseGuards(PermissionGuard)
    @Get(':id')
    async getEndpoint(@Param('id', ParseIntPipe) id: number): Promise<AdminEndpointResponseDto> {
        return await this.service.getEndpoint(id)
    }

    @ApiOperation({ summary: '엔드포인트 강제 일시정지 (관리자)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiNoContentResponse({ description: '일시정지 성공' })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Permission('monitoring', 'update')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/pause')
    async pauseEndpoint(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.pauseEndpoint(id)
    }

    @ApiOperation({ summary: '엔드포인트 강제 삭제 (관리자)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiNoContentResponse({ description: '삭제 성공' })
    @ApiExceptionResponse(MONITORING_ERROR.NOT_FOUND)
    @Permission('monitoring', 'delete')
    @UseGuards(PermissionGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':id')
    async deleteEndpoint(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.service.deleteEndpoint(id)
    }
}
