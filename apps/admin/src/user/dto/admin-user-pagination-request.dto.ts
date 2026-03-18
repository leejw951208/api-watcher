import { OffsetRequestDto } from '@libs/common'
import { UserStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class AdminUserPaginationRequestDto extends OffsetRequestDto {
    @ApiProperty({ type: String, required: false, description: '이름 검색' })
    @IsOptional()
    @IsString()
    name?: string

    @ApiProperty({ type: String, required: false, description: '이메일 검색' })
    @IsOptional()
    @IsString()
    email?: string

    @ApiProperty({ enum: UserStatus, required: false, description: '사용자 상태' })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus
}
