require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLocations() {
    try {
        const totalResults = await prisma.searchResult.count()
        const resultsWithState = await prisma.searchResult.count({
            where: {
                state: {
                    not: null
                }
            }
        })

        console.log(`Total Results: ${totalResults}`)
        console.log(`Results with State: ${resultsWithState}`)

        if (resultsWithState > 0) {
            const sample = await prisma.searchResult.findMany({
                where: { state: { not: null } },
                take: 5,
                select: { state: true, city: true, marketplace: true }
            })
            console.log('Sample locations:', sample)
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

checkLocations()
