
import { prisma } from './src/lib/prisma'
import { runScraper } from './src/lib/scraper'

async function main() {
    console.log('Checking pending jobs...')
    const jobs = await prisma.searchJob.findMany({
        where: { status: 'PENDING' },
        include: { product: true },
        take: 5
    })

    console.log(`Found ${jobs.length} pending jobs.`)

    if (jobs.length > 0) {
        const job = jobs[0]
        console.log(`Attempting to run job ${job.id} for product ${job.product.name}`)

        // Extract config from logs
        let options: any = {}
        if (Array.isArray(job.logs) && job.logs.length > 0) {
            const configLog = (job.logs as any[]).find((l: any) => l.type === 'config')
            if (configLog) {
                console.log('Found config in logs:', configLog)
                options = {
                    marketplaces: configLog.marketplaces,
                    instructions: configLog.instructions,
                    category: job.product.category || undefined
                }
            }
        }

        try {
            await runScraper(job.id, job.product.name, options)
            console.log('Job finished successfully')
        } catch (e) {
            console.error('Job failed:', e)
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
