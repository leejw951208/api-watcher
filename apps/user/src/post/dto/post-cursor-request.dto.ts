import { CursorRequestDto } from '@libs/common'
import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class PostCursorRequestDto extends CursorRequestDto {
    @ApiProperty({ type: String, required: false, description: '게시글 제목', example: '공지사항' })
    @IsOptional()
    @IsString()
    title?: string
}
