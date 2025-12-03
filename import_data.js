
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    console.log('Starting data import...');

    const rawData = fs.readFileSync('backup_data.json', 'utf-8');
    const data = JSON.parse(rawData);

    console.log(`Found ${data.products.length} products, ${data.searchJobs.length} jobs, ${data.searchResults.length} results.`);

    // Import Products
    console.log('Importing Products...');
    for (const p of data.products) {
        // We use upsert to avoid duplicates if run multiple times
        await prisma.product.upsert({
            where: { id: p.id },
            update: {},
            create: {
                id: p.id,
                name: p.name,
                description: p.description,
                costPrice: p.costPrice,
                weight: p.weight,
                dimensions: p.dimensions,
                originCep: p.originCep,
                category: p.category,
                brand: p.brand,
                imageUrl: p.imageUrl,
                active: p.active,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                lastBestPrice: p.lastBestPrice,
                lastBestPriceDate: p.lastBestPriceDate
            }
        });
    }

    // Import SearchJobs
    console.log('Importing SearchJobs...');
    for (const j of data.searchJobs) {
        await prisma.searchJob.upsert({
            where: { id: j.id },
            update: {},
            create: {
                id: j.id,
                productId: j.productId,
                status: j.status,
                createdAt: j.createdAt,
                updatedAt: j.updatedAt
            }
        });
    }

    // Import SearchResults
    console.log('Importing SearchResults...');
    for (const r of data.searchResults) {
        await prisma.searchResult.upsert({
            where: { id: r.id },
            update: {},
            create: {
                id: r.id,
                jobId: r.jobId,
                marketplace: r.marketplace,
                title: r.title,
                price: r.price,
                shipping: r.shipping,
                link: r.link,
                sellerName: r.sellerName,
                sellerLocation: r.sellerLocation,
                sellerRating: r.sellerRating,
                imageUrl: r.imageUrl,
                matchScore: r.matchScore,
                matchReasoning: r.matchReasoning,
                normalizedName: r.normalizedName,
                city: r.city,
                state: r.state,
                installments: r.installments,
                quantitySold: r.quantitySold,
                reviewScore: r.reviewScore,
                collectedAt: r.collectedAt
            }
        });
    }

    // Import Settings
    if (data.settings && data.settings.length > 0) {
        console.log('Importing Settings...');
        for (const s of data.settings) {
            await prisma.settings.upsert({
                where: { id: s.id },
                update: {},
                create: {
                    id: s.id,
                    aiProvider: s.aiProvider,
                    aiModel: s.aiModel,
                    aiApiKey: s.aiApiKey,
                    updatedAt: s.updatedAt
                }
            });
        }
    }

    console.log('Import completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
