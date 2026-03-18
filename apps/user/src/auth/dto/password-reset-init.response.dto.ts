import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class PasswordResetInitResponseDto {
    @ApiProperty({ type: String, description: '비밀번호 재설정 토큰' })
    @Expose()
    resetToken: string
}
