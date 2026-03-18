import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class AdminResponseDto {
    @ApiProperty({ type: Number, description: '관리자 ID' })
    @Expose()
    id: number

    @ApiProperty({ type: String, description: '로그인 ID' })
    @Expose()
    loginId: string

    @ApiProperty({ type: String, description: '이메일' })
    @Expose()
    email: string

    @ApiProperty({ type: String, description: '이름' })
    @Expose()
    name: string

    @ApiProperty({ type: String, description: '전화번호' })
    @Expose()
    phone: string

    @ApiProperty({ type: Date, description: '생성일' })
    @Expose()
    createdAt: Date

    @ApiProperty({ type: Date, required: false, description: '수정일' })
    @Expose()
    updatedAt: Date | null
}

export class AdminSigninResponseDto {
    @ApiProperty({ type: String, description: '액세스 토큰' })
    @Expose()
    accessToken: string

    @ApiProperty({ type: AdminResponseDto, description: '관리자 정보' })
    @Expose()
    admin: AdminResponseDto
}
