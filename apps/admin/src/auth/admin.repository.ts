import { Admin, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AdminRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findByLoginId(loginId: string): Promise<Admin | null> {
        return this.prisma.admin.findFirst({
            where: { loginId, isDeleted: false }
        })
    }

    async findById(id: number): Promise<Admin | null> {
        return this.prisma.admin.findFirst({
            where: { id, isDeleted: false }
        })
    }
}
