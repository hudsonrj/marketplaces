
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

async function main() {
    try {
        await prisma.$connect()
        console.log('Successfully connected to the database')
    } catch (e) {
        console.error('Connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
