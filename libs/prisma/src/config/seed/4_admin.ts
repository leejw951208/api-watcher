import * as bcrypt from 'bcrypt'
import { PrismaClient, UserStatus } from '../../generated'

export default async function seed(prisma: PrismaClient) {
    console.log('🚀 Admin Seeding 시작')

    const hashedPassword = await bcrypt.hash('admin1234!', 10)

    const admins = [
        { loginId: 'superadmin', email: 'superadmin@example.com', name: '최고관리자', phone: '01011111111' },
        { loginId: 'admin01', email: 'admin01@example.com', name: '관리자1', phone: '01022222222' }
    ]

    const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } })
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } })

    for (const adminData of admins) {
        const admin = await prisma.admin.upsert({
            where: { loginId: adminData.loginId },
            update: {},
            create: {
                loginId: adminData.loginId,
                email: adminData.email,
                password: hashedPassword,
                name: adminData.name,
                phone: adminData.phone,
                status: UserStatus.ACTIVE,
                createdBy: 0
            }
        })

        const roleId = adminData.loginId === 'superadmin' ? superAdminRole?.id : adminRole?.id
        if (roleId) {
            await prisma.adminRole.upsert({
                where: { adminId_roleId: { adminId: admin.id, roleId } },
                update: {},
                create: {
                    adminId: admin.id,
                    roleId,
                    createdBy: 0
                }
            })
        }
    }

    console.log(`✅ Admin Seeding 완료 (${admins.length}명)`)
}
