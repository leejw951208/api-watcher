import { CheckInterval, EndpointStatus, HttpMethod } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class EndpointResponseDto {
    @ApiProperty({ type: Number })
    @Expose()
    id: number

    @ApiProperty({ type: String })
    @Expose()
    name: string

    @ApiProperty({ type: String })
    @Expose()
    url: string

    @ApiProperty({ enum: HttpMethod })
    @Expose()
    method: HttpMethod

    @ApiProperty({ type: Number })
    @Expose()
    expectedStatus: number

    @ApiProperty({ type: Number })
    @Expose()
    timeout: number

    @ApiProperty({ enum: CheckInterval })
    @Expose()
    interval: CheckInterval

    @ApiProperty({ enum: EndpointStatus })
    @Expose()
    status: EndpointStatus

    @ApiProperty({ type: Number })
    @Expose()
    failureThreshold: number

    @ApiProperty({ type: Number })
    @Expose()
    consecutiveFailures: number

    @ApiProperty({ type: Boolean })
    @Expose()
    isPaused: boolean

    @ApiProperty({ type: Date, required: false })
    @Expose()
    lastCheckedAt: Date | null

    @ApiProperty({ type: Date })
    @Expose()
    createdAt: Date
}
