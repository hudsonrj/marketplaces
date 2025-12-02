import { PrismaClient } from '@prisma/client'
import { BarChart3, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react'
import { getGlobalAnalyticsData } from '@/lib/duckdb'
import GlobalAnalyticsDashboard from './dashboard'
import ProductFilter from './filter'

const prisma = new PrismaClient()

async function getStats(productId?: string) {
    const where = productId ? { productId } : {}
    const whereResult = productId ? { job: { productId } } : {}

    const totalProducts = await prisma.product.count() // Total products always global
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
        avgPrice: avgPriceResult._avg.price || 0
    }
}

export default async function GlobalAnalyticsPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
    const { productId } = await searchParams
    const stats = await getStats(productId)

    // Fetch all products for the filter
    const products = await prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })

    let analyticsData: { marketShare: any[], priceByMarketplace: any[], topSellers: any[] } = { marketShare: [], priceByMarketplace: [], topSellers: [] }
    try {
        analyticsData = await getGlobalAnalyticsData(productId)
    } catch (e) {
        console.error('Failed to fetch global analytics:', e)
    }

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Analytics Global
                </h1>
                <p style={{ color: '#94a3b8' }}>Visão consolidada de todos os monitoramentos.</p>
            </div>

            <ProductFilter products={products} />

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Total de Produtos</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>{stats.totalProducts}</h3>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <ShoppingBag size={24} color="#3b82f6" />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <TrendingUp size={14} /> +2 novos esta semana
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Jobs Executados</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>{stats.totalJobs}</h3>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)' }}>
                            <BarChart3 size={24} color="#8b5cf6" />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Taxa de sucesso de 98%
                    </div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Ofertas Coletadas</p>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>{stats.totalResults}</h3>
                        </div>
                        <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <DollarSign size={24} color="#10b981" />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Preço médio: R$ {Number(stats.avgPrice).toFixed(2)}
                    </div>
                </div>
            </div>

            <GlobalAnalyticsDashboard
                marketShare={analyticsData.marketShare}
                priceByMarketplace={analyticsData.priceByMarketplace}
                topSellers={analyticsData.topSellers}
            />
        </div>
    )
}
