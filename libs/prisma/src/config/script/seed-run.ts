import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import fs from 'fs'
import { stdin, stdout } from 'node:process'
import readline from 'node:readline/promises'
import path from 'path'
import { Pool } from 'pg'
import { PrismaClient } from '../../generated'

async function run() {
    let env = process.env.NODE_ENV?.trim()

    if (!env) {
        const rl = readline.createInterface({ input: stdin, output: stdout })
        env = (await rl.question('환경 (local/dev/test/prod): ')).trim()
        rl.close()
    } else {
        console.log(`NODE_ENV에서 감지된 환경: ${env}`)
    }

    const envFilePath = path.resolve(process.cwd(), `./envs/.env.${env}`)
    dotenv.config({ path: envFilePath })

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL 이 설정되지 않았습니다.')
        process.exit(1)
    }

    // 단일 PrismaClient 인스턴스 생성 (연결 풀 최적화)
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20, // 연결 풀 크기 증가
        min: 5, // 최소 유지 연결
        idleTimeoutMillis: 10000, // 유휴 연결 타임아웃 단축
        connectionTimeoutMillis: 5000
    })
    const adapter = new PrismaPg(pool)

    // 시드 환경에서는 쿼리 로깅 비활성화
    const prisma = new PrismaClient({ adapter })

    const seedsDir = path.resolve(process.cwd(), 'libs/prisma/src/config/seed')

    // 실행 순서: 파일명 접두 숫자 오름차순 (예: 1_*.ts → 2_*.ts → 10_*.ts)
    const entries = fs
        .readdirSync(seedsDir)
        .filter((f) => /^\d+_.*\.ts$/.test(f))
        .sort((a, b) => {
            const na = Number(a.slice(0, a.indexOf('_')))
            const nb = Number(b.slice(0, b.indexOf('_')))
            return na - nb || a.localeCompare(b)
        })

    if (entries.length === 0) {
        console.log('⚠️ 실행할 시드가 없습니다.')
        return
    }

    console.log(`🚀 시드 실행 시작 (env=${env})`)
    const startTime = Date.now()

    try {
        for (const file of entries) {
            const abs = path.join(seedsDir, file)
            console.log(`➡️  ${file} 실행`)

            const fileStartTime = Date.now()

            // 동적 import로 시드 함수 가져오기
            const seedModule = await import(abs)
            const seedFn = seedModule.default

            if (typeof seedFn !== 'function') {
                console.error(`❌ ${file}: default export가 함수가 아닙니다.`)
                process.exit(1)
            }

            // PrismaClient 인스턴스 전달
            await seedFn(prisma)

            const fileEndTime = Date.now()
            console.log(`✅ ${file} 완료 (${fileEndTime - fileStartTime}ms)`)
        }

        const endTime = Date.now()
        console.log(`\n✅ 모든 시드 실행 완료 (총 ${endTime - startTime}ms)`)
    } catch (e) {
        console.error('❌ 시드 실행 중 오류:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

run().catch((e) => {
    console.error('❌ 시드 실행 중 오류:', e)
    process.exit(1)
})
