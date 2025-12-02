
import { prisma } from './src/lib/prisma'

async function debugProducts() {
    console.log('Debugging Products...')
    const products = await prisma.product.findMany({
        include: {
            searchJobs: {
                include: {
                    results: true
                }
            }
        }
    })

    for (const p of products) {
        console.log(`Product: ${p.name} (ID: ${p.id})`)
        console.log(`- Total Jobs: ${p.searchJobs.length}`)

        const completedJobs = p.searchJobs.filter(j => j.status === 'COMPLETED')
        console.log(`- Completed Jobs: ${completedJobs.length}`)

        for (const j of completedJobs) {
            console.log(`  Job ${j.id}: ${j.results.length} results`)
            const validResults = j.results.filter(r => (r.matchScore || 0) > 50)
            console.log(`  - Valid Results (>50 score): ${validResults.length}`)
            if (validResults.length > 0) {
                const minPrice = Math.min(...validResults.map(r => Number(r.price)))
                console.log(`  - Min Price: ${minPrice}`)
            }
        }
        console.log('---')
    }
}

debugProducts()
