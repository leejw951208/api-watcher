import { ApiProperty } from '@nestjs/swagger'

export class WebhookChannelResponseDto {
    @ApiProperty({ type: Number })
    id: number

    @ApiProperty({ type: String })
    name: string

    @ApiProperty({ type: String })
    type: string

    @ApiProperty({ type: String, description: '마스킹된 URL' })
    url: string

    @ApiProperty({ type: Boolean })
    isActive: boolean

    @ApiProperty({ type: Date })
    createdAt: Date
}
