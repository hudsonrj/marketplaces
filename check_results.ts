import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkResults() {
    try {
        const results = await prisma.searchResult.groupBy({
            by: ['marketplace'],
            _count: {
                id: true
            }
        })
        console.log('--- COUNTS ---')
        results.forEach(r => console.log(`${r.marketplace}: ${r._count.id}`))
        console.log('--------------')

        const jobs = await prisma.searchJob.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { product: true }
        })
        console.log('Recent Jobs:', JSON.stringify(jobs, null, 2))

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

checkResults()
