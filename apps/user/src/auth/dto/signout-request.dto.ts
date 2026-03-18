import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class SignoutRequestDto {
    @ApiProperty({ type: String, required: false, description: '리프레시 토큰', example: 'refresh-token' })
    @IsOptional()
    @IsString({ message: '리프레시 토큰은 문자열입니다.' })
    refreshToken?: string
}
