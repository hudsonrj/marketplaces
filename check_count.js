
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkResults() {
    try {
        const count = await prisma.searchResult.count()
        console.log(`Current SearchResult count: ${count}`)
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

checkResults()
