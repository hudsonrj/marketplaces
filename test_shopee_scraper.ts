import { runScraper } from './src/lib/scraper'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
    // Create a dummy job
    const product = await prisma.product.findFirst()
    if (!product) return console.log('No product found')

    const job = await prisma.searchJob.create({
        data: {
            productId: product.id,
            status: 'PENDING'
        }
    })

    console.log('Running scraper for:', product.name)
    await runScraper(job.id, product.name)
}

test()
