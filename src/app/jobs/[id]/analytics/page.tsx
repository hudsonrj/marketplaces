


import Link from 'next/link'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, PieChart, Pie, Cell
} from 'recharts'

// We need to fetch data in a server component, but render charts in a client component.
// For simplicity in this iteration, we will pass data from the server page to a client component.
// But since this file is marked as a page, we need to separate the chart logic.

// Let's create a Client Component for the charts inside this file? No, better separate.
// Actually, let's make this page a Server Component that fetches data, 
// and imports a Client Component for the charts.


import AnalyticsDashboard from './dashboard'
import { prisma } from '@/lib/prisma'

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const job = await prisma.searchJob.findUnique({
        where: { id },
        include: {
            product: true,
            results: {
                where: { matchScore: { gt: 50 } },
                orderBy: { price: 'asc' }
            }
        }
    })

    if (!job) return <div>Job não encontrado</div>

    // Fetch history
    const allJobs = await prisma.searchJob.findMany({
        where: { productId: job.productId, status: 'COMPLETED' },
        include: {
            results: {
                where: { matchScore: { gt: 50 } },
                select: { price: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    const historyData = allJobs.map(j => {
        const prices = j.results.map(r => Number(r.price))
        const min = prices.length ? Math.min(...prices) : 0
        const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
        return {
            date: j.createdAt.toLocaleDateString('pt-BR'),
            min,
            avg
        }
    }).filter(h => h.min > 0)

    const serializedResults = job.results.map(r => ({
        ...r,
        price: Number(r.price),
        shipping: r.shipping ? Number(r.shipping) : null
    }))

    return (
        <div>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link href={`/jobs/${id}`} style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        ← Voltar para Resultados
                    </Link>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        Análise de Precificação
                    </h2>
                    <p style={{ color: '#94a3b8' }}>Produto: {job.product.name}</p>
                </div>
            </div>

            <AnalyticsDashboard results={serializedResults} history={historyData} />
        </div>
    )
}

