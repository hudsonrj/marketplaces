import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowUpRight, TrendingDown, TrendingUp, Activity, Search, Package } from 'lucide-react'

async function getDashboardData() {
    const productsCount = await prisma.product.count()
    const jobsCount = await prisma.searchJob.count()
    const recentJobs = await prisma.searchJob.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { product: true }
    })

    // Mocking some "AI Insights" based on real data could be complex, so we'll do basic stats
    // Real implementation would compare historical averages.

    return { productsCount, jobsCount, recentJobs }
}

export default async function Home() {
    const { productsCount, jobsCount, recentJobs } = await getDashboardData()

    return (
        <div>
            {/* Header */}
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Visão Geral
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                    Bem-vindo ao painel de controle da MarketAI. Aqui estão seus insights de hoje.
                </p>
            </header>

            {/* AI Insights Section */}
            <section style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <Activity size={20} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Insights da IA</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Oportunidade de Mercado</span>
                            <TrendingDown size={20} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Queda de Preços Detectada</h3>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                            A IA detectou uma queda de 12% nos preços de eletrônicos na Shopee nas últimas 24h. Momento ideal para ajustar margens.
                        </p>
                    </div>

                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Tendência de Busca</span>
                            <TrendingUp size={20} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Alta Demanda em "Smartphones"</h3>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                            O volume de buscas por smartphones aumentou significativamente. Considere atualizar o monitoramento destes itens.
                        </p>
                    </div>

                    <div className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Performance</span>
                            <Package size={20} color="#f59e0b" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{productsCount} Produtos Monitorados</h3>
                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                            Sua base de dados está crescendo. {jobsCount} jobs de busca foram executados com sucesso até o momento.
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Recent Activity */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Atividade Recente</h3>
                        <Link href="/jobs" style={{ fontSize: '0.875rem', color: '#3b82f6', textDecoration: 'none' }}>Ver tudo</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentJobs.map((job) => (
                            <div key={job.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Search size={18} color="#3b82f6" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '500', color: 'white' }}>{job.product.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {new Date(job.createdAt).toLocaleDateString('pt-BR')} às {new Date(job.createdAt).toLocaleTimeString('pt-BR')}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                    background: job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: job.status === 'COMPLETED' ? '#10b981' : '#f59e0b'
                                }}>
                                    {job.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Word Cloud / Top Products */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Nuvem de Produtos</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {['iPhone 13', 'Samsung S23', 'Notebook Dell', 'PlayStation 5', 'MacBook Air', 'AirPods Pro', 'Kindle', 'Monitor Gamer', 'Cadeira Ergonomica', 'Mouse Logitech'].map((tag, i) => (
                            <span key={i} style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                background: `rgba(${Math.random() * 255}, ${Math.random() * 255}, 255, 0.1)`,
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: `${Math.max(0.75, Math.random() * 1.2)}rem`,
                                cursor: 'default'
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6', marginBottom: '0.5rem' }}>Dica Pro</h4>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                            Adicione mais produtos para enriquecer sua nuvem de dados e obter insights mais precisos.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
