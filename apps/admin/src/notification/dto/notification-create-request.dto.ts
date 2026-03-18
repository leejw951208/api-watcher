import { NotificationType } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateNotificationRequestDto {
    @ApiProperty({
        description: '수신자 ID (특정 사용자에게 보낼 경우 입력, 전체 발송 시 생략)',
        required: false,
        example: 1
    })
    @IsOptional()
    @IsInt()
    userId?: number

    @ApiProperty({
        description: '알림 제목',
        example: '시스템 점검 안내',
        maxLength: 100
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string

    @ApiProperty({
        description: '알림 내용',
        example: '내일 오전 0시부터 2시까지 시스템 점검이 있을 예정입니다.',
        maxLength: 500
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content: string

    @ApiProperty({
        description: '알림 유형',
        enum: NotificationType,
        example: NotificationType.SYSTEM
    })
    @IsEnum(NotificationType)
    @IsNotEmpty()
    type: NotificationType
}
