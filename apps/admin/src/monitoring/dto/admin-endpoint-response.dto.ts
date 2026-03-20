import { CheckInterval, EndpointStatus, HttpMethod } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose, Type } from 'class-transformer'

class EndpointUserDto {
    @ApiProperty({ type: Number })
    @Expose()
    id: number

    @ApiProperty({ type: String })
    @Expose()
    email: string

    @ApiProperty({ type: String })
    @Expose()
    name: string
}

export class AdminEndpointResponseDto {
    @ApiProperty({ type: Number })
    @Expose()
    id: number

    @ApiProperty({ type: Number })
    @Expose()
    userId: number

    @ApiProperty({ type: () => EndpointUserDto })
    @Expose()
    @Type(() => EndpointUserDto)
    user: EndpointUserDto

    @ApiProperty({ type: String })
    @Expose()
    name: string

    @ApiProperty({ type: String })
    @Expose()
    url: string

    @ApiProperty({ enum: HttpMethod })
    @Expose()
    method: HttpMethod

    @ApiProperty({ enum: EndpointStatus })
    @Expose()
    status: EndpointStatus

    @ApiProperty({ enum: CheckInterval })
    @Expose()
    interval: CheckInterval

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
