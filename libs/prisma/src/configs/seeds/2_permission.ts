import { PrismaClient } from '../../generated'

export default async function seed(prisma: PrismaClient) {
    console.log('🚀 Permission Seeding 시작')

    const permissions = [
        // User 관련
        { scope: 'user', action: 'create' },
        { scope: 'user', action: 'read' },
        { scope: 'user', action: 'update' },
        { scope: 'user', action: 'delete' },
        // Post 관련
        { scope: 'post', action: 'create' },
        { scope: 'post', action: 'read' },
        { scope: 'post', action: 'write' },
        { scope: 'post', action: 'update' },
        { scope: 'post', action: 'delete' },
        // Notification 관련
        { scope: 'notification', action: 'create' },
        { scope: 'notification', action: 'read' },
        { scope: 'notification', action: 'write' },
        { scope: 'notification', action: 'update' },
        { scope: 'notification', action: 'delete' },
        // Admin 관련
        { scope: 'admin', action: 'create' },
        { scope: 'admin', action: 'read' },
        { scope: 'admin', action: 'update' },
        { scope: 'admin', action: 'delete' },
        // Role 관련
        { scope: 'role', action: 'create' },
        { scope: 'role', action: 'read' },
        { scope: 'role', action: 'update' },
        { scope: 'role', action: 'delete' }
    ]

    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { scope_action: { scope: permission.scope, action: permission.action } },
            update: {},
            create: {
                scope: permission.scope,
                action: permission.action,
                createdBy: 0
            }
        })
    }

    // Role-Permission 매핑 (SUPER_ADMIN은 모든 권한)
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } })
    const allPermissions = await prisma.permission.findMany()

    if (superAdminRole) {
        for (const permission of allPermissions) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
                update: {},
                create: {
                    roleId: superAdminRole.id,
                    permissionId: permission.id,
                    createdBy: 0
                }
            })
        }
    }

    // ADMIN은 user, post, notification 권한만
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } })
    const adminPermissions = await prisma.permission.findMany({
        where: { scope: { in: ['user', 'post', 'notification'] } }
    })

    if (adminRole) {
        for (const permission of adminPermissions) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
                update: {},
                create: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                    createdBy: 0
                }
            })
        }
    }

    // USER 역할은 post 권한
    const userRole = await prisma.role.findFirst({ where: { name: 'USER' } })
    const userPermissions = await prisma.permission.findMany({
        where: { scope: 'post' }
    })

    if (userRole) {
        for (const permission of userPermissions) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: userRole.id, permissionId: permission.id } },
                update: {},
                create: {
                    roleId: userRole.id,
                    permissionId: permission.id,
                    createdBy: 0
                }
            })
        }
    }

    console.log(`✅ Permission Seeding 완료 (${permissions.length}개)`)
}
