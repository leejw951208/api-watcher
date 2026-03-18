import { Inject, Injectable } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { commonEnvConfig } from '../config'

@Injectable()
export class CryptoService {
    constructor(@Inject(commonEnvConfig.KEY) private readonly config: ConfigType<typeof commonEnvConfig>) {}

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(this.config.aesAlgorithm, this.config.aesSecretKey, iv)
        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        return `${iv.toString('hex')}:${encrypted}`
    }

    decrypt(text: string): string {
        const [iv, encrypted] = text.split(':')
        const decipher = crypto.createDecipheriv(this.config.aesAlgorithm, this.config.aesSecretKey, Buffer.from(iv, 'hex'))
        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    }

    async hash(plain: string): Promise<string> {
        return await bcrypt.hash(plain, this.config.bcryptSaltRounds)
    }

    async compare(plain: string, hashed: string): Promise<boolean> {
        return await bcrypt.compare(plain, hashed)
    }
}
