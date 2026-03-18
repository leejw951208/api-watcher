import * as bcrypt from 'bcrypt'
import { PrismaClient, UserStatus } from '../../generated'

export default async function seed(prisma: PrismaClient) {
    console.log('🚀 User Seeding 시작')

    const hashedPassword = await bcrypt.hash('password123!', 10)

    const users = [
        { email: 'user1@example.com', name: '홍길동', phone: '01012345678' },
        { email: 'user2@example.com', name: '김철수', phone: '01023456789' },
        { email: 'user3@example.com', name: '이영희', phone: '01034567890' },
        { email: 'premium@example.com', name: '프리미엄유저', phone: '01045678901' }
    ]

    const userRole = await prisma.role.findFirst({ where: { name: 'USER' } })
    const premiumRole = await prisma.role.findFirst({ where: { name: 'PREMIUM_USER' } })

    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                email: userData.email,
                password: hashedPassword,
                name: userData.name,
                phone: userData.phone,
                status: UserStatus.ACTIVE,
                createdBy: 0
            }
        })

        // UserRole 매핑
        const roleId = userData.email === 'premium@example.com' ? premiumRole?.id : userRole?.id
        if (roleId) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId } },
                update: {},
                create: {
                    userId: user.id,
                    roleId,
                    createdBy: 0
                }
            })
        }
    }

    console.log(`✅ User Seeding 완료 (${users.length}명)`)
}
