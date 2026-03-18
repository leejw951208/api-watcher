import { ApiProperty } from '@nestjs/swagger'
import { ResponseDto } from './response.dto'

class OffsetResponseMeta {
    @ApiProperty({ type: Number, required: false, description: '현재 페이지 번호', example: 2 })
    page: number

    @ApiProperty({ type: Number, required: true, description: '전체 데이터 수', example: 101 })
    totalCount: number
}

export class OffsetResponseDto<T> extends ResponseDto<T[]> {
    @ApiProperty({ type: OffsetResponseMeta, required: true, description: '메타 데이터' })
    meta: OffsetResponseMeta

    constructor(data: T[], meta: OffsetResponseMeta) {
        super(data)
        this.data = data
        this.meta = meta
    }
}

class CursorResponseMeta {
    @ApiProperty({ type: Number, required: false, description: '다음 페이지 항목 PK (null이면 마지막 페이지)', example: '5' })
    nextCursor: number | null
}

export class CursorResponseDto<T> extends ResponseDto<T[]> {
    @ApiProperty({ type: CursorResponseMeta, required: true, description: '메타 데이터' })
    meta: CursorResponseMeta

    constructor(data: T[], meta: CursorResponseMeta) {
        super(data)
        this.data = data
        this.meta = meta
    }
}
