import { execSync } from 'node:child_process'
import path from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

async function main(): Promise<void> {
    // 1) NODE_ENV에서 환경을 읽거나 사용자에게 입력받기
    let env = process.env.NODE_ENV?.trim()

    if (!env) {
        const rl = createInterface({ input: stdin, output: stdout })
        env = (await rl.question('환경 (local/dev/test/prod): ')).trim()
        rl.close()
    } else {
        console.log(`NODE_ENV에서 감지된 환경: ${env}`)
    }

    // 2) 입력 검증
    if (!env) {
        console.error('❌ 환겨을 입력해야 합니다.')
        process.exit(1)
    }

    // 4) 마이그레이션 파일 생성
    try {
        console.log(`📝 ${env} 환경에서 Prisma 설정 업데이트를 진행합니다.`)
        const configPath = path.resolve(process.cwd(), 'libs/prisma/src/configs/prisma.config.ts')
        execSync(`NODE_ENV=${env} npx prisma generate --config=${configPath}`, { stdio: 'inherit' })
        console.log('✅ Prisma 설정 업데이트가 완료되었습니다.')
    } catch (error) {
        console.error('❌ Prisma 설정 업데이트 중 오류가 발생했습니다.')
        process.exit(1)
    }
}

void main()
