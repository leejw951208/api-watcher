import { defineConfig } from 'prisma/config'
import path from 'node:path'
import dotenv from 'dotenv'

const envFilePath = path.resolve(process.cwd(), `envs/.env.${process.env.NODE_ENV}`)
dotenv.config({ path: envFilePath })

export default defineConfig({
    schema: '.',
    migrations: {
        path: 'migrations'
    },
    datasource: {
        url: process.env.DATABASE_URL
    }
})
