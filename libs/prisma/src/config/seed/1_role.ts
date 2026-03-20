import { Owner, PrismaClient } from '../../generated'

export default async function seed(prisma: PrismaClient) {
    console.log('🚀 Role Seeding 시작')

    const roles = [
        { name: 'SUPER_ADMIN', owner: Owner.ADMIN, description: '최고 관리자' },
        { name: 'ADMIN', owner: Owner.ADMIN, description: '일반 관리자' },
        { name: 'USER', owner: Owner.USER, description: '일반 사용자' },
        { name: 'PREMIUM_USER', owner: Owner.USER, description: '프리미엄 사용자' }
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: { id: roles.indexOf(role) + 1 },
            update: {},
            create: {
                name: role.name,
                owner: role.owner,
                description: role.description,
                createdBy: 0
            }
        })
    }

    console.log(`✅ Role Seeding 완료 (${roles.length}개)`)
}
