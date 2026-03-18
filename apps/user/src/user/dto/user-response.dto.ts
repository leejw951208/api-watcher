import { ApiProperty } from '@nestjs/swagger'
import { UserDto } from './user.dto'
import { Expose } from 'class-transformer'

export class UserResponseDto extends UserDto {
    @ApiProperty({ required: true, description: 'PK', example: 1 })
    @Expose()
    id: number

    @ApiProperty({ required: true, description: '생성일', example: '2021-01-01' })
    @Expose()
    createdAt: Date

    @ApiProperty({ required: true, description: '수정일', example: '2021-01-01' })
    @Expose()
    updatedAt: Date
}
