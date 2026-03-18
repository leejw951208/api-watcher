import { BaseException, USER_ERROR } from '@libs/common'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { UserResponseDto } from './dto/user-response.dto'
import { UserUpdateDto } from './dto/user-update.dto'
import { UserRepository } from './user.repository'

@Injectable()
export class UserService {
    constructor(private readonly repository: UserRepository) {}

    async getMe(userId: number): Promise<UserResponseDto> {
        const foundUser = await this.repository.findById(userId)

        if (!foundUser) {
            throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        }

        return plainToInstance(UserResponseDto, foundUser, { excludeExtraneousValues: true })
    }

    async updateMe(userId: number, reqDto: UserUpdateDto): Promise<void> {
        const foundUser = await this.repository.findById(userId)

        if (!foundUser) {
            throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        }

        await this.repository.update(userId, reqDto)
    }

    async withdraw(userId: number): Promise<void> {
        const foundUser = await this.repository.findById(userId)

        if (!foundUser) {
            throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        }

        if (foundUser.isDeleted) {
            throw new BaseException(USER_ERROR.ALREADY_DELETED, this.constructor.name)
        }

        await this.repository.softDelete(userId)
    }
}
