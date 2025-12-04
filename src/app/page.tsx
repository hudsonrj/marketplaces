import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
    // 1. Basic Stats
    const productsCount = await prisma.product.count()
    const jobsCount = await prisma.searchJob.count()
    const resultsCount = await prisma.searchResult.count()
    const activeJobsCount = await prisma.searchJob.count({
        where: { status: { in: ['RUNNING', 'PENDING'] } }
    })

    // 2. Marketplaces (distinct)
    const marketplaceGroups = await prisma.searchResult.groupBy({
        by: ['marketplace'],
        _count: { marketplace: true },
        orderBy: { _count: { marketplace: 'desc' } },
        take: 6
    })
    const marketplaces = marketplaceGroups.map(g => g.marketplace)

    // 3. Categories
    const categoryGroups = await prisma.product.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 5
    })
    const categories = categoryGroups.map(g => ({
        category: g.category || 'Outros',
        count: g._count.category
    }))

    // 4. Recent Jobs
    const recentJobs = await prisma.searchJob.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true } } }
    })

    // 5. Running Jobs (Real-time monitor)
    const runningJobs = await prisma.searchJob.findMany({
        where: { status: { in: ['RUNNING', 'PENDING'] } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { product: { select: { name: true } } }
    })

    // 6. Jobs Per Day (Last 7 days)
    // Prisma doesn't support complex date grouping easily without raw query, 
    // but for small scale we can fetch recent jobs and aggregate in JS or use raw query.
    // Let's use a raw query for performance if needed, or just simple JS aggregation of last 100 jobs.
    // For simplicity and safety with different DBs, let's fetch last 7 days jobs metadata.
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const lastWeekJobs = await prisma.searchJob.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true }
    })

    const jobsPerDayMap = new Map<string, number>()
    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        jobsPerDayMap.set(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 0)
    }

    lastWeekJobs.forEach(job => {
        const dateKey = new Date(job.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        if (jobsPerDayMap.has(dateKey)) {
            jobsPerDayMap.set(dateKey, (jobsPerDayMap.get(dateKey) || 0) + 1)
        }
    })

    // Convert map to array and reverse to show oldest to newest
    const jobsPerDay = Array.from(jobsPerDayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse()

    return {
        stats: {
            productsCount,
            jobsCount,
            resultsCount,
            activeJobsCount
        },
        marketplaces,
        categories,
        recentJobs,
        runningJobs,
        jobsPerDay
    }
}

export default async function Home() {
    const data = await getDashboardData()

    return (
        <DashboardClient
            stats={data.stats}
            marketplaces={data.marketplaces}
            categories={data.categories}
            recentJobs={data.recentJobs}
            runningJobs={data.runningJobs}
            jobsPerDay={data.jobsPerDay}
        />
    )
}
