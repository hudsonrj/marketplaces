import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: any
) {
    const productId = params.id

    try {
        // Get the latest completed job for this product
        const latestJob = await prisma.searchJob.findFirst({
            where: {
                productId,
                status: 'COMPLETED'
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!latestJob) {
            return NextResponse.json([])
        }

        // Get results from this job, filtering for 'new' condition if possible
        // Note: We might want to include all results and let the frontend filter, 
        // but for strategy we usually care about 'new' items.
        const competitors = await prisma.searchResult.findMany({
            where: {
                jobId: latestJob.id,
                condition: 'new' as any // Only fetch new items for pricing strategy
            },
            orderBy: { price: 'asc' },
            take: 50
        })

        const serializedCompetitors = competitors.map(c => ({
            sellerName: c.sellerName,
            price: Number(c.price),
            shipping: c.shipping ? Number(c.shipping) : 0,
            marketplace: c.marketplace,
            condition: (c as any).condition,
            link: c.link
        }))

        return NextResponse.json(serializedCompetitors)

    } catch (error) {
        console.error('Error fetching competitors:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
