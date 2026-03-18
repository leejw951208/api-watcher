import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator'

export class SignupRequestDto {
    @ApiProperty({ type: String, required: true, description: '이메일', example: 'testuser@user.com' })
    @IsNotEmpty({ message: '이메일은 필수입니다.' })
    @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
    email: string

    @ApiProperty({ type: String, required: true, description: '비밀번호', example: 'user1234!@' })
    @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
    @IsString({ message: '비밀번호는 문자열입니다.' })
    @Matches(/^(?=.*[a-z])(?=.*\d).{8,}$/, {
        message: '비밀번호는 최소 8자 이상이며, 영문 소문자, 숫자를 각각 최소 1자 이상 포함해야 합니다.'
    })
    password: string

    @ApiProperty({ type: String, required: true, description: '이름', example: '홍길동' })
    @IsNotEmpty({ message: '이름은 필수입니다.' })
    @IsString({ message: '이름은 문자열입니다.' })
    name: string

    @ApiProperty({ type: String, required: true, description: '전화번호', example: '01012345678' })
    @IsNotEmpty({ message: '전화번호는 필수입니다.' })
    @IsString({ message: '전화번호는 문자열입니다.' })
    @Matches(/^010\d{8}$/, { message: '유효한 전화번호를 입력해주세요.' })
    phone: string
}
