import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['error', 'warn'], // Reduced logging to improve performance
    })

if (process.env.NODE_ENV !== 'production') {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = prisma
        console.log('Initialized Prisma Client Singleton')
    }
}
