import { UserStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'

export class UserDto {
    @ApiProperty({ required: true, description: '이메일', example: 'testuser@user.com' })
    @IsNotEmpty()
    @IsString()
    @Expose()
    email: string

    @ApiProperty({ required: true, description: '이름', example: '홍길동' })
    @IsNotEmpty()
    @IsString()
    @Expose()
    name: string

    @ApiProperty({ required: true, description: '전화번호', example: '01012345678' })
    @IsNotEmpty()
    @IsString()
    @Expose()
    phone: string

    @ApiProperty({ required: true, enum: UserStatus, description: '상태', example: 'ACTIVE' })
    @IsNotEmpty()
    @IsEnum(UserStatus)
    @Expose()
    status: UserStatus
}
