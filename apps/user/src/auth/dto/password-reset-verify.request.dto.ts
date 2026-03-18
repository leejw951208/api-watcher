import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class PasswordResetVerifyRequestDto {
    @ApiProperty({ type: String, required: true, description: '비밀번호 재설정 토큰', example: 'abc123...' })
    @IsNotEmpty({ message: '재설정 토큰은 필수입니다.' })
    @IsString({ message: '재설정 토큰은 문자열입니다.' })
    token: string
}
