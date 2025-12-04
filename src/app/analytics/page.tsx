import { prisma } from '@/lib/prisma'
import { getGlobalAnalyticsData, getProductPriceHistory, getTopLocations } from '@/lib/analytics'
import AnalyticsDashboard from './AnalyticsDashboard'

async function getStats(productId?: string) {
    const where = productId ? { productId } : {}
    const whereResult = productId ? { job: { productId } } : {}

    const totalProducts = await prisma.product.count()
    const totalJobs = await prisma.searchJob.count({ where })
    const totalResults = await prisma.searchResult.count({ where: whereResult })

    const avgPriceResult = await prisma.searchResult.aggregate({
        _avg: { price: true },
        where: whereResult
    })

    return {
        totalProducts,
        totalJobs,
        totalResults,
        avgPrice: avgPriceResult._avg.price ? Number(avgPriceResult._avg.price) : 0
    }
}

export default async function GlobalAnalyticsPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
    const { productId } = await searchParams
    const stats = await getStats(productId)

    // Fetch all products for the filter with result counts
    const productsRaw = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    searchJobs: true
                }
            }
        },
        orderBy: { name: 'asc' }
    })

    // We need a more complex query to get the actual useful result count (results with match_score > 50)
    // Doing this via a separate aggregation or raw query might be faster, but let's try to keep it simple first.
    // Actually, the user wants to know "quantity of records". 
    // Let's get the count of SearchResults linked to the product's jobs.

    // Optimized query to get counts in one go
    const counts = await prisma.$queryRaw<any[]>`
        SELECT j.product_id, COUNT(r.id)::int as count
        FROM "marketplaces"."SearchResult" r
        JOIN "marketplaces"."SearchJob" j ON r.job_id = j.id
        WHERE r.match_score > 50
        GROUP BY j.product_id
    `

    const countMap = new Map(counts.map(c => [c.product_id, Number(c.count)]))

    const productsWithCounts = productsRaw.map(p => ({
        id: p.id,
        name: p.name,
        count: countMap.get(p.id) || 0
    }))

    let analyticsData: { marketShare: any[], priceByMarketplace: any[], topSellers: any[] } = { marketShare: [], priceByMarketplace: [], topSellers: [] }
    let priceHistory: any[] = []
    let topLocations: any[] = []

    try {
        const [data, history, locations] = await Promise.all([
            getGlobalAnalyticsData(productId),
            getProductPriceHistory(productId),
            getTopLocations(productId)
        ])
        analyticsData = data
        priceHistory = history
        topLocations = locations
    } catch (e) {
        console.error('Failed to fetch analytics:', e)
    }

    return (
        <AnalyticsDashboard
            stats={stats}
            products={productsWithCounts}
            selectedProductId={productId}
            marketShare={analyticsData.marketShare}
            priceByMarketplace={analyticsData.priceByMarketplace}
            topSellers={analyticsData.topSellers}
            priceHistory={priceHistory}
            topLocations={topLocations}
        />
    )
}
