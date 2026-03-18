import { PickType } from '@nestjs/swagger'
import { UserDto } from './user.dto'

export class UserUpdateDto extends PickType(UserDto, ['email', 'phone']) {}
