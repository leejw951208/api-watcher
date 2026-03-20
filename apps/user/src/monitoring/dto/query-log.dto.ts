import { OffsetRequestDto } from '@libs/common'
import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsOptional } from 'class-validator'

export class QueryLogDto extends OffsetRequestDto {
    @ApiProperty({ type: String, required: false, description: '시작 날짜', example: '2026-03-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string

    @ApiProperty({ type: String, required: false, description: '종료 날짜', example: '2026-03-20' })
    @IsOptional()
    @IsDateString()
    endDate?: string
}
