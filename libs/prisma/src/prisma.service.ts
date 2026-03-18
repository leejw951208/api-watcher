import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { Logger } from 'winston'
import { Prisma, PrismaClient } from './generated'

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query'> implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly logger: Logger) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 10,
            idleTimeoutMillis: 30000
        })
        const adapter = new PrismaPg(pool)
        super({ adapter, log: [{ emit: 'event', level: 'query' }] })

        this.$on('query', (e: Prisma.QueryEvent) => {
            this.logger.debug(`${e.query}: ${e.params}`)
        })
    }

    async onModuleInit() {
        await this.$connect()
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }
}
