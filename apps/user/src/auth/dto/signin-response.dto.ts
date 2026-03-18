import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { UserResponseDto } from '../../user/dto/user-response.dto'

export class SigninResponseDto {
    @ApiProperty({ type: String, required: true, description: '액세스 토큰', example: 'access-token' })
    @Expose()
    accessToken: string

    @ApiProperty({ type: UserResponseDto, required: true, description: '회원 정보', example: () => new UserResponseDto() })
    @Expose()
    user: UserResponseDto
}
