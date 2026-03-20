import { CheckInterval, HttpMethod } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator'

export class CreateEndpointDto {
    @ApiProperty({ type: String, description: '엔드포인트 이름', example: 'My API Health' })
    @IsNotEmpty()
    @IsString()
    name: string

    @ApiProperty({ type: String, description: '모니터링 URL', example: 'https://api.example.com/health' })
    @IsNotEmpty()
    @IsUrl()
    url: string

    @ApiProperty({ enum: HttpMethod, description: 'HTTP 메서드', default: 'GET' })
    @IsOptional()
    @IsEnum(HttpMethod)
    method?: HttpMethod

    @ApiProperty({ type: Object, required: false, description: '요청 헤더' })
    @IsOptional()
    headers?: Record<string, string>

    @ApiProperty({ type: Object, required: false, description: '요청 바디' })
    @IsOptional()
    body?: Record<string, unknown>

    @ApiProperty({ type: Number, description: '예상 응답 상태코드', default: 200 })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    expectedStatus?: number

    @ApiProperty({ type: Number, description: '타임아웃 (ms)', default: 10000 })
    @IsOptional()
    @IsInt()
    @Min(1000)
    @Max(30000)
    @Type(() => Number)
    timeout?: number

    @ApiProperty({ enum: CheckInterval, description: '체크 주기', default: 'MIN_1' })
    @IsOptional()
    @IsEnum(CheckInterval)
    interval?: CheckInterval

    @ApiProperty({ type: Number, description: '장애 판정 연속 실패 횟수', default: 3 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    @Type(() => Number)
    failureThreshold?: number
}
