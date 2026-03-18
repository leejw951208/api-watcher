import { UserStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class AdminUserResponseDto {
    @ApiProperty({ type: Number, description: '사용자 ID' })
    @Expose()
    id: number

    @ApiProperty({ type: String, description: '이메일' })
    @Expose()
    email: string

    @ApiProperty({ type: String, description: '이름' })
    @Expose()
    name: string

    @ApiProperty({ type: String, description: '전화번호' })
    @Expose()
    phone: string

    @ApiProperty({ enum: UserStatus, description: '상태' })
    @Expose()
    status: UserStatus

    @ApiProperty({ type: Date, description: '생성일' })
    @Expose()
    createdAt: Date

    @ApiProperty({ type: Date, required: false, description: '수정일' })
    @Expose()
    updatedAt: Date | null
}
