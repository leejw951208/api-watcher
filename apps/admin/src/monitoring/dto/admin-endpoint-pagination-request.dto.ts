import { OffsetRequestDto } from '@libs/common'
import { EndpointStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'

export class AdminEndpointPaginationRequestDto extends OffsetRequestDto {
    @ApiProperty({ type: String, required: false, description: '이름 검색' })
    @IsOptional()
    @IsString()
    name?: string

    @ApiProperty({ enum: EndpointStatus, required: false, description: '상태 필터' })
    @IsOptional()
    @IsEnum(EndpointStatus)
    status?: EndpointStatus

    @ApiProperty({ type: Number, required: false, description: '사용자 ID 필터' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    userId?: number
}
