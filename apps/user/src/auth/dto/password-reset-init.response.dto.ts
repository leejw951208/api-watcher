import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class PasswordResetInitResponseDto {
    @ApiProperty({ type: String, description: '안내 메시지', example: '이메일을 확인해주세요.' })
    @Expose()
    message: string
}
