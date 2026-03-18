import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class RefreshTokenResponseDto {
    @ApiProperty({ type: String, required: true, description: '액세스 토큰', example: 'access-token' })
    @Expose()
    accessToken: string
}
