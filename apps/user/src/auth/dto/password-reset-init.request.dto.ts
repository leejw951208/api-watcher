import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, Matches } from 'class-validator'

export class PasswordResetInitRequestDto {
    @ApiProperty({ type: String, required: true, description: '이메일', example: 'testuser@user.com' })
    @IsNotEmpty({ message: '이메일은 필수입니다.' })
    @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
    email: string

    @ApiProperty({ type: String, required: true, description: '휴대폰번호', example: '01012345678' })
    @IsNotEmpty({ message: '휴대폰번호는 필수입니다.' })
    @Matches(/^010\d{8}$/, { message: '유효한 휴대폰번호를 입력해주세요. (예: 01012345678)' })
    phone: string
}
