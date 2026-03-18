import { execSync } from 'node:child_process'
import path from 'node:path'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

async function main(): Promise<void> {
    // 1) 사용자에게 환경(prompt)과 파일명(prompt) 입력받기
    const rl = createInterface({ input: stdin, output: stdout })
    const env = (await rl.question('환경 (local/dev): ')).trim()
    const migrationName = (await rl.question('마이그레이션 파일명: ')).trim()
    rl.close()

    // 4) 마이그레이션 파일 생성
    try {
        console.log(`📝 ${env} 환경에서 마이그레이션 파일을 생성합니다: ${migrationName}`)
        const configPath = path.resolve(process.cwd(), 'libs/prisma/src/configs/prisma.config.ts')
        execSync(`NODE_ENV=${env} npx prisma migrate dev --name ${migrationName} --create-only --config=${configPath}`, {
            stdio: 'inherit'
        })
        console.log('✅ 마이그레이션 파일이 생성되었습니다. 파일을 검토 및 수정한 후, 별도의 스크립트를 통해 적용하세요.')
    } catch (error) {
        console.error('❌ 마이그레이션 파일 생성 중 오류가 발생했습니다.')
        process.exit(1)
    }
}

void main()
