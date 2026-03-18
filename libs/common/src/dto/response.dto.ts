import { ApiProperty } from '@nestjs/swagger'

export class ResponseDto<T> {
    @ApiProperty({ type: Object, required: true, description: '데이터' })
    data: T

    constructor(data: T) {
        this.data = data
    }
}
