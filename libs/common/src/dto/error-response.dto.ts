import { ApiProperty } from '@nestjs/swagger'

export class ErrorResponseDto {
    @ApiProperty({ type: String, required: true, description: '에러 코드', example: 'POST_ERROR_001' })
    errorCode: string

    @ApiProperty({ type: String, required: true, description: '에러 메시지', example: '게시글을 찾을 수 없습니다.' })
    message: string

    @ApiProperty({ type: String, required: true, description: '에러 발생 위치', example: 'PostService' })
    location: string
}
