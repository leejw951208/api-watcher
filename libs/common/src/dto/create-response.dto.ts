import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'
import { ResponseDto } from './response.dto'

export class CreateResponseDto extends ResponseDto<number | string> {
    @ApiProperty({ required: true, description: '생성된 데이터 ID', example: 1 })
    @Expose()
    id: number | string

    constructor(id: number | string) {
        super(id)
    }
}
