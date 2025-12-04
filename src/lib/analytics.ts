import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function getProductPriceHistory(productId?: string) {
    const filterClause = productId
        ? Prisma.sql`AND j.product_id = ${productId}`
        : Prisma.sql``

    const rows = await prisma.$queryRaw<any[]>`
        SELECT 
            j.created_at as date,
            MIN(r.price) as min,
            AVG(r.price) as avg
        FROM "marketplaces"."SearchResult" r
        JOIN "marketplaces"."SearchJob" j ON r.job_id = j.id
        WHERE r.match_score > 50 ${filterClause}
        GROUP BY j.id, j.created_at
        ORDER BY j.created_at ASC
    `

    return rows.map(row => ({
        date: row.date,
        min: Number(row.min),
        avg: Number(row.avg)
    }))
}

export async function getGlobalAnalyticsData(productId?: string) {
    const filterClause = productId
        ? Prisma.sql`AND job_id IN (SELECT id FROM "marketplaces"."SearchJob" WHERE product_id = ${productId})`
        : Prisma.sql``

    const marketSharePromise = prisma.$queryRaw<any[]>`
        SELECT marketplace, COUNT(*)::int as count 
        FROM "marketplaces"."SearchResult" 
        WHERE match_score > 50 ${filterClause}
        GROUP BY marketplace
    `

    const priceByMarketplacePromise = prisma.$queryRaw<any[]>`
        SELECT marketplace, AVG(price) as avg_price 
        FROM "marketplaces"."SearchResult" 
        WHERE match_score > 50 ${filterClause}
        GROUP BY marketplace
    `

    const topSellersPromise = prisma.$queryRaw<any[]>`
        SELECT seller_name, COUNT(*)::int as count 
        FROM "marketplaces"."SearchResult" 
        WHERE match_score > 50 AND seller_name IS NOT NULL ${filterClause}
        GROUP BY seller_name 
        ORDER BY count DESC 
        LIMIT 10
    `

    const [marketShare, priceByMarketplace, topSellers] = await Promise.all([
        marketSharePromise,
        priceByMarketplacePromise,
        topSellersPromise
    ])

    return {
        marketShare: marketShare.map(r => ({ ...r, count: Number(r.count) })),
        priceByMarketplace: priceByMarketplace.map(r => ({ ...r, avg_price: Number(r.avg_price) })),
        topSellers: topSellers.map(r => ({ ...r, count: Number(r.count) }))
    }
}

export async function getTopLocations(productId?: string) {
    const filterClause = productId
        ? Prisma.sql`AND job_id IN (SELECT id FROM "marketplaces"."SearchJob" WHERE product_id = ${productId})`
        : Prisma.sql``

    const locations = await prisma.$queryRaw<any[]>`
        SELECT state, COUNT(*)::int as count 
        FROM "marketplaces"."SearchResult" 
        WHERE match_score > 50 AND state IS NOT NULL ${filterClause}
        GROUP BY state 
        ORDER BY count DESC 
        LIMIT 10
    `

    return locations.map(r => ({ state: r.state, count: Number(r.count) }))
}
