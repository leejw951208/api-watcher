import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class SigninRequestDto {
    @ApiProperty({ type: String, required: true, description: '이메일', example: 'testuser@example.com' })
    @IsNotEmpty({ message: '이메일은 필수입니다.' })
    @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
    email: string

    @ApiProperty({ type: String, required: true, description: '비밀번호', example: 'user1234!@' })
    @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
    @IsString({ message: '비밀번호는 문자열입니다.' })
    password: string
}
