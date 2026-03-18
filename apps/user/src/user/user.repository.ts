import { PrismaService, User, UserStatus } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'

export type CreateUserData = {
    email: string
    password: string
    name: string
    phone: string
    status: UserStatus
}

export type UpdateUserData = {
    email?: string
    phone?: string
}

@Injectable()
export class UserRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { id, isDeleted: false }
        })
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { email, isDeleted: false }
        })
    }

    async findByEmailAndPhone(email: string, phone: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { email, phone, isDeleted: false }
        })
    }

    async existsByEmail(email: string): Promise<boolean> {
        const user = await this.prisma.user.findFirst({
            where: { email, isDeleted: false },
            select: { id: true }
        })
        return !!user
    }

    async create(data: CreateUserData): Promise<User> {
        return this.prisma.user.create({ data: { ...data, createdBy: this.cls.get('id') } })
    }

    async update(id: number, data: UpdateUserData): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { ...data, updatedAt: new Date(), updatedBy: this.cls.get('id') }
        })
    }

    async updatePassword(id: number, hashedPassword: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword, updatedAt: new Date(), updatedBy: this.cls.get('id') }
        })
    }

    async softDelete(id: number): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: {
                status: UserStatus.WITHDRAWN,
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: this.cls.get('id')
            }
        })
    }
}
