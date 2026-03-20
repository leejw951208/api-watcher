import { OffsetRequestDto } from '@libs/common'
import { EndpointStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class EndpointPaginationRequestDto extends OffsetRequestDto {
    @ApiProperty({ type: String, required: false, description: '이름 검색' })
    @IsOptional()
    @IsString()
    name?: string

    @ApiProperty({ enum: EndpointStatus, required: false, description: '상태 필터' })
    @IsOptional()
    @IsEnum(EndpointStatus)
    status?: EndpointStatus
}
