import { ApiProperty } from '@nestjs/swagger'

export class WebhookLogResponseDto {
    @ApiProperty({ type: Number })
    id: number

    @ApiProperty({ type: String })
    alertType: string

    @ApiProperty({ type: Number, nullable: true })
    statusCode: number | null

    @ApiProperty({ type: Boolean })
    isSuccess: boolean

    @ApiProperty({ type: Number })
    retryCount: number

    @ApiProperty({ type: String, nullable: true })
    errorMessage: string | null

    @ApiProperty({ type: Date })
    createdAt: Date
}

export class WebhookTestResponseDto {
    @ApiProperty({ type: Boolean })
    success: boolean

    @ApiProperty({ type: Number, nullable: true })
    statusCode: number | null

    @ApiProperty({ type: String })
    message: string
}
