import { SetMetadata } from '@nestjs/common'

export const PERMISSION_KEY = 'permission'
export const Permission = (scope: string, action: string = 'read') => SetMetadata(PERMISSION_KEY, { scope, action })
