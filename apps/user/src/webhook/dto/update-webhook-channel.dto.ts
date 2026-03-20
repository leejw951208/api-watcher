import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, IsUrl, Length } from 'class-validator'

export class UpdateWebhookChannelDto {
    @ApiProperty({ type: String, required: false, description: '채널 이름' })
    @IsOptional()
    @IsString()
    @Length(1, 50)
    name?: string

    @ApiProperty({ type: String, required: false, description: 'Webhook URL (HTTPS만 허용)' })
    @IsOptional()
    @IsUrl({ protocols: ['https'], require_protocol: true })
    url?: string

    @ApiProperty({ type: Boolean, required: false, description: '활성화 여부' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean
}
