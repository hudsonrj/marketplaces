
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data export...');

    const products = await prisma.product.findMany();
    const searchJobs = await prisma.searchJob.findMany();
    const searchResults = await prisma.searchResult.findMany();

    let settings = [];
    try {
        settings = await prisma.settings.findMany();
    } catch (e) {
        console.log('Settings table might not exist or be accessible yet.');
    }

    const data = {
        products,
        searchJobs,
        searchResults,
        settings
    };

    fs.writeFileSync('backup_data.json', JSON.stringify(data, null, 2));
    console.log(`Exported ${products.length} products, ${searchJobs.length} jobs, ${searchResults.length} results.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
