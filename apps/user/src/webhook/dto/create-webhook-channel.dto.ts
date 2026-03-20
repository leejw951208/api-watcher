import { WebhookType } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsString, IsUrl, Length } from 'class-validator'

export class CreateWebhookChannelDto {
    @ApiProperty({ type: String, description: '채널 이름', example: '팀 슬랙 알림' })
    @IsNotEmpty()
    @IsString()
    @Length(1, 50)
    name: string

    @ApiProperty({ enum: WebhookType, description: 'Webhook 타입', example: 'SLACK' })
    @IsNotEmpty()
    @IsEnum(WebhookType)
    type: WebhookType

    @ApiProperty({ type: String, description: 'Webhook URL (HTTPS만 허용)', example: 'https://hooks.slack.com/services/T00/B00/xxx' })
    @IsNotEmpty()
    @IsUrl({ protocols: ['https'], require_protocol: true })
    url: string
}
