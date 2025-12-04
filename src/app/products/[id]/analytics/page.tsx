import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AnalyticsDashboard from '@/app/jobs/[id]/analytics/dashboard'
import { getProductPriceHistory } from '@/lib/analytics'

export default async function ProductAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            searchJobs: {
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' }, // Get latest first for current results
                take: 1,
                include: {
                    results: {
                        where: { matchScore: { gt: 50 } }
                    }
                }
            }
        }
    })

    if (!product) return <div>Produto não encontrado</div>

    // Fetch history using DuckDB for high performance analytics
    let historyData: any[] = []
    try {
        const duckData = await getProductPriceHistory(id)
        historyData = duckData.map(d => ({
            date: new Date(d.date).toLocaleDateString('pt-BR'),
            min: d.min,
            avg: d.avg
        }))
    } catch (e) {
        console.error('DuckDB Error:', e)
        // Fallback or empty
    }

    // Use the LATEST job results for "current state" charts
    const latestJob = product.searchJobs[0]
    const currentResults = latestJob ? latestJob.results.map(r => ({
        ...r,
        price: Number(r.price),
        shipping: r.shipping ? Number(r.shipping) : null
    })) : []

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Voltar para Produtos
                </Link>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>Análise de Evolução: {product.name}</h1>
                <p style={{ color: '#94a3b8' }}>Histórico de preços e indicadores de mercado baseados em {product.searchJobs.length} jobs executados.</p>
            </div>

            {product.searchJobs.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Nenhum dado histórico disponível. Execute uma busca para começar a monitorar.
                </div>
            ) : (
                <AnalyticsDashboard results={currentResults} history={historyData} />
            )}
        </div>
    )
}
