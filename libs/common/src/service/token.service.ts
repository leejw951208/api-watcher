import { Owner, PrismaService, TokenType } from '@libs/prisma'
import { Inject, Injectable } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import Redis from 'ioredis'
import { commonEnvConfig } from '../config'
import { AUTH_ERROR, BaseException } from '../exception'
import { REDIS_CLIENT } from '../redis'

export type JwtPayload = {
    id: number // pk
    type: 'ac' | 're' // 토큰 타입
    aud: 'admin' | 'user' // 토큰 수신자
    jti: string // 토큰 고유 값
    issuer: string // 토큰 발급자
}

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        @Inject(commonEnvConfig.KEY) private readonly config: ConfigType<typeof commonEnvConfig>,
        private readonly prisma: PrismaService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis
    ) {}

    async createAccessToken(ownerId: number, owner: Owner, jti: string): Promise<string> {
        const payload = this.createTokenPayload(ownerId, owner, 'ac', jti)
        return await this.signToken(payload, this.config.jwtAccessTokenTtl / 1000)
    }

    async createRefreshToken(ownerId: number, owner: Owner, jti: string): Promise<string> {
        const payload = this.createTokenPayload(ownerId, owner, 're', jti)
        return await this.signToken(payload, this.config.jwtRefreshTokenTtl / 1000)
    }

    createTokenPayload(ownerId: number, owner: Owner, type: 'ac' | 're', jti: string): JwtPayload {
        return {
            id: ownerId,
            type,
            aud: owner === Owner.USER ? 'user' : 'admin',
            jti,
            issuer: 'monorepo'
        } as JwtPayload
    }

    async signToken(payload: JwtPayload, expiresIn: number): Promise<string> {
        return await this.jwtService.signAsync(payload, { secret: this.config.jwtSecretKey, expiresIn })
    }

    async verify(token: string, type: 'ac' | 're'): Promise<JwtPayload> {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
            secret: this.config.jwtSecretKey
        })

        if (payload.type !== type || payload.issuer !== 'monorepo') {
            // 검증 대상 토큰 타입에 맞는 에러 코드 반환
            const invalidError = type === 'ac' ? AUTH_ERROR.INVALID_ACCESS_TOKEN : AUTH_ERROR.INVALID_REFRESH_TOKEN
            throw new BaseException(invalidError, this.constructor.name)
        }

        return payload
    }

    // ================= Token Storage Methods =================

    async saveRefreshToken(ownerId: number, owner: Owner, jti: string, tokenHash: string, ttl: number): Promise<void> {
        await this.createRefreshTokenInDB(ownerId, owner, jti, tokenHash)

        const redisKey = `rt:${owner}:${ownerId}:${jti}`
        await Promise.all([this.redis.set(redisKey, tokenHash, 'PX', ttl), this.addUserTokenToRedisList(ownerId, owner, jti)])
    }

    async getRefreshToken(ownerId: number, owner: Owner, jti: string): Promise<string | null> {
        const redisKey = `rt:${owner}:${ownerId}:${jti}`
        return this.redis.get(redisKey)
    }

    async deleteRefreshToken(ownerId: number, owner: Owner, jti: string): Promise<void> {
        const redisKey = `rt:${owner}:${ownerId}:${jti}`

        await Promise.allSettled([
            this.redis.del(redisKey),
            this.removeUserTokenFromRedisList(ownerId, owner, jti),
            this.deleteRefreshTokenInDB(ownerId, owner, jti)
        ])
    }

    async deleteAllRefreshTokens(ownerId: number, owner: Owner): Promise<void> {
        const tokensKey = `${owner}:${ownerId}:tokens`
        // SMEMBERS: Redis Set에서 모든 JTI를 원자적으로 조회
        const jtis = await this.redis.smembers(tokensKey)

        const tasks: Promise<any>[] = [this.deleteAllRefreshTokensInDB(ownerId, owner), this.redis.del(tokensKey)]

        if (jtis.length > 0) {
            const deleteKeys = jtis.map((jti) => this.redis.del(`rt:${owner}:${ownerId}:${jti}`))
            tasks.push(...deleteKeys)
        }

        await Promise.allSettled(tasks)
    }

    // ================= Private Methods (DB) =================

    private async createRefreshTokenInDB(ownerId: number, owner: Owner, jti: string, tokenHash: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const token = await tx.token.create({
                data: {
                    tokenHash,
                    tokenType: TokenType.JWT,
                    owner,
                    ownerId
                }
            })
            await tx.tokenJwt.create({
                data: { tokenId: token.id, jti }
            })
        })
    }

    private async deleteRefreshTokenInDB(ownerId: number, owner: Owner, jti: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const target = await tx.tokenJwt.findFirst({
                where: { jti, token: { ownerId, owner } },
                select: { tokenId: true }
            })

            if (target) {
                await tx.token.delete({ where: { id: target.tokenId } })
            }
        })
    }

    private async deleteAllRefreshTokensInDB(ownerId: number, owner: Owner): Promise<void> {
        await this.prisma.token.deleteMany({
            where: {
                ownerId,
                owner,
                tokenType: TokenType.JWT
            }
        })
    }

    // ================= Private Methods (Redis) =================

    private async addUserTokenToRedisList(ownerId: number, owner: Owner, jti: string): Promise<void> {
        const tokensKey = `${owner}:${ownerId}:tokens`
        // SADD: 동시 요청 시에도 JTI가 유실되지 않도록 원자적으로 Set에 추가
        const added = await this.redis.sadd(tokensKey, jti)
        if (added > 0) {
            // 새로 추가된 경우에만 TTL 갱신 (리프레시 토큰 만료 주기와 동일하게 설정)
            await this.redis.pexpire(tokensKey, this.config.jwtRefreshTokenTtl)
        }
    }

    private async removeUserTokenFromRedisList(ownerId: number, owner: Owner, jti: string): Promise<void> {
        const tokensKey = `${owner}:${ownerId}:tokens`
        // SREM: 원자적으로 특정 JTI를 Set에서 제거
        await this.redis.srem(tokensKey, jti)
    }
}
