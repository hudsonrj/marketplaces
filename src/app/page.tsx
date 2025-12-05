import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
    const fetchData = async () => {
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
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const lastWeekJobs = await prisma.searchJob.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { createdAt: true }
        })

        const jobsPerDayMap = new Map<string, number>()
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

    let retries = 3
    while (retries > 0) {
        try {
            return await fetchData()
        } catch (error: any) {
            console.error(`Dashboard fetch failed (Attempt ${4 - retries}/3):`, error.message)
            if (retries === 1) throw error
            retries--
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }
    throw new Error('Failed to fetch dashboard data after retries')
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
