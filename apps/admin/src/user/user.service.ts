import { BaseException, OffsetResponseDto, USER_ERROR } from '@libs/common'
import { UserStatus } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { AdminUserPaginationRequestDto } from './dto/admin-user-pagination-request.dto'
import { AdminUserResponseDto } from './dto/admin-user-response.dto'
import { AdminUserRepository } from './user.repository'

@Injectable()
export class AdminUserService {
    constructor(private readonly repository: AdminUserRepository) {}

    async getUser(userId: number): Promise<AdminUserResponseDto> {
        const foundUser = await this.repository.findById(userId)
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        return plainToInstance(AdminUserResponseDto, foundUser, { excludeExtraneousValues: true })
    }

    async getUsers(dto: AdminUserPaginationRequestDto): Promise<OffsetResponseDto<AdminUserResponseDto>> {
        const { items, totalCount } = await this.repository.findUsersOffset(dto)
        return new OffsetResponseDto(plainToInstance(AdminUserResponseDto, items, { excludeExtraneousValues: true }), {
            page: dto.page,
            totalCount
        })
    }

    async updateUserStatus(userId: number, status: UserStatus): Promise<void> {
        const foundUser = await this.repository.findById(userId)
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.updateStatus(userId, status)
    }

    async deleteUser(userId: number): Promise<void> {
        const foundUser = await this.repository.findById(userId)
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.softDelete(userId)
    }
}
