import fs from 'node:fs'
import path from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

async function main(): Promise<void> {
    const rl = createInterface({ input: stdin, output: stdout })
    const num = (await rl.question('실행 순서(1, 2): ')).trim()
    const name = (await rl.question('파일명(영문, 확장자 제외): ')).trim()
    rl.close()

    if (!num || !/^\d+$/.test(num)) {
        console.error('❌ 실행 순서는 숫자만 허용됩니다.')
        process.exit(1)
    }
    if (!name) {
        console.error('❌ 파일명을 입력하세요.')
        process.exit(1)
    }

    const normalized = name
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .toLowerCase()

    const seedsDir = path.resolve(process.cwd(), 'libs/prisma/src/config/seed')
    const filename = `${num}_${normalized}.ts`
    const target = path.join(seedsDir, filename)

    if (fs.existsSync(target)) {
        console.error(`❌ 이미 존재하는 파일: ${filename}`)
        process.exit(1)
    }

    const template = `import { Prisma, PrismaClient } from '../../generated'

export default async function seed(prisma: PrismaClient) {
    console.log('🚀 ${normalized} Seeding 시작')

    // TODO: write seed

    console.log('✅ ${normalized} Seeding 완료')
}
`

    fs.writeFileSync(target, template, { encoding: 'utf8' })
    console.log(`✅ 생성: ${path.relative(process.cwd(), target)}`)
}

void main()
