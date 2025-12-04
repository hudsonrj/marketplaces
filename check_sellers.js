require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSellerNames() {
    try {
        const totalResults = await prisma.searchResult.count()
        const resultsWithSeller = await prisma.searchResult.count({
            where: {
                sellerName: {
                    not: null
                }
            }
        })

        console.log(`Total Results: ${totalResults}`)
        console.log(`Results with Seller Name: ${resultsWithSeller}`)

        if (resultsWithSeller > 0) {
            const sample = await prisma.searchResult.findMany({
                where: { sellerName: { not: null } },
                take: 5,
                select: { sellerName: true, marketplace: true }
            })
            console.log('Sample sellers:', sample)
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

checkSellerNames()
