import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { ArrowLeft, BarChart2, Clock, Package } from 'lucide-react'
import ProductCharts from './charts'
import ResultsTable from './results-table'

const prisma = new PrismaClient()

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const job = await prisma.searchJob.findUnique({
        where: { id },
        include: {
            product: true,
            results: {
                orderBy: { price: 'asc' }
            }
        }
    })

    if (!job) return <div style={{ padding: '2rem', color: 'white' }}>Job não encontrado</div>

    // Serialize Decimal to number for Client Components
    const serializedResults = job.results.map(r => ({
        ...r,
        price: Number(r.price),
        shipping: r.shipping ? Number(r.shipping) : null
    }))

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Voltar para Monitoramento
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                            {job.product.name}
                        </h1>
                        <div style={{ display: 'flex', gap: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={16} />
                                {new Date(job.createdAt).toLocaleString('pt-BR')}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={16} />
                                {job.results.length} resultados
                            </div>
                            <div style={{
                                padding: '0.1rem 0.5rem', borderRadius: '4px',
                                background: job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: job.status === 'COMPLETED' ? '#10b981' : '#3b82f6',
                                fontSize: '0.75rem', fontWeight: '600'
                            }}>
                                {job.status}
                            </div>
                        </div>
                    </div>

                    <Link href={`/jobs/${id}/analytics`}>
                        <button className="btn btn-primary">
                            <BarChart2 size={18} />
                            Ver Análise Detalhada
                        </button>
                    </Link>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <ProductCharts results={serializedResults} />
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'white' }}>Resultados da Busca</h3>
                <ResultsTable results={serializedResults} />
            </div>
        </div>
    )
}
