import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
    try {
        const products = await prisma.product.findMany()
        console.log(`Products found: ${products.length}`)
        products.forEach(p => console.log(`- ${p.name} (ID: ${p.id}) [Active: ${p.active}]`))

        const jobs = await prisma.searchJob.findMany()
        console.log(`Jobs found: ${jobs.length}`)

        const results = await prisma.searchResult.findMany()
        console.log(`Results found: ${results.length}`)

        if (results.length > 0) {
            console.log('Sample Result:', results[0])
        }

    } catch (e) {
        console.error('Error checking data:', e)
    } finally {
        await prisma.$disconnect()
    }
}

checkData()
