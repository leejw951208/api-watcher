import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class AdminSigninRequestDto {
    @ApiProperty({ type: String, required: true, description: '로그인 ID', example: 'admin01' })
    @IsNotEmpty({ message: '로그인 ID는 필수입니다.' })
    @IsString({ message: '로그인 ID는 문자열입니다.' })
    loginId: string

    @ApiProperty({ type: String, required: true, description: '비밀번호', example: 'admin1234!@' })
    @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
    @IsString({ message: '비밀번호는 문자열입니다.' })
    password: string
}
