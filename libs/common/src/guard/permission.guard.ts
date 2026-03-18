import { PrismaService } from '@libs/prisma'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ClsService } from 'nestjs-cls'
import { AUTH_ERROR, BaseException } from '../exception'

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly cls: ClsService,
        private readonly prisma: PrismaService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const id = this.cls.get('id')
        const aud = this.cls.get('aud')
        if (!id || !aud) throw new BaseException(AUTH_ERROR.RESOURCE_ACCESS_DENIED, this.constructor.name)

        const permission = this.reflector.get<{ scope: string; action: string }>('permission', context.getHandler())
        if (!permission) return true

        // aud별 조인 경로
        const whereByAud =
            aud === 'admin'
                ? { rolePermissions: { some: { role: { adminRoles: { some: { adminId: id } } } } } } // Admin용
                : { rolePermissions: { some: { role: { userRoles: { some: { userId: id } } } } } } // User용

        const owned = await this.prisma.permission.findFirst({
            where: {
                scope: permission.scope,
                action: permission.action,
                ...whereByAud
            }
        })

        return !!owned
    }
}
