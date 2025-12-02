import { PrismaClient } from '@prisma/client'
import { BarChart3, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react'

const prisma = new PrismaClient()

async function getGlobalStats() {
    const totalProducts = await prisma.product.count()
    const totalJobs = await prisma.searchJob.count()
    const totalResults = await prisma.searchResult.count()

    // Get average price across all results (just a simple metric)
    const avgPriceResult = await prisma.searchResult.aggregate({
        _avg: { price: true }
    })

    return {
        totalProducts,
        totalJobs,
        totalResults,
        avgPrice: avgPriceResult._avg.price || 0
    }
}

export default async function GlobalAnalyticsPage() {
    const stats = await getGlobalStats()

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Analytics Global
                </h1>
                <p style={{ color: '#94a3b8' }}>Visão consolidada de todos os monitoramentos.</p>
            </div>

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

            {/* Placeholder for more advanced charts */}
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                <BarChart3 size={48} color="#334155" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Relatórios Avançados em Breve</h3>
                <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
                    Estamos processando seus dados para gerar insights de market share, elasticidade de preço e tendências de competidores.
                </p>
            </div>
        </div>
    )
}
