import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { runScraper } from './lib/scraper'

const prisma = new PrismaClient()

console.log('Scheduler started. Jobs will run at 06:00, 12:00, and 18:00.')

// Schedule tasks to be run on the server.
// 0 6,12,18 * * * means at minute 0 of hour 6, 12, and 18 of every day
cron.schedule('0 6,12,18 * * *', async () => {
    console.log('Running scheduled jobs...')

    try {
        // Get all active products
        const products = await prisma.product.findMany({
            where: { active: true }
        })

        console.log(`Found ${products.length} active products to process.`)

        for (const product of products) {
            console.log(`Creating job for ${product.name}...`)

            const job = await prisma.searchJob.create({
                data: {
                    productId: product.id,
                    status: 'PENDING',
                }
            })

            // Run scraper (sequentially to avoid overloading)
            await runScraper(job.id, product.name)
        }

        console.log('All scheduled jobs completed.')
    } catch (error) {
        console.error('Error in scheduled jobs:', error)
    }
})
