import { getJobs, createSearchJob } from '../actions'
import Link from 'next/link'
import { Search, RefreshCw, Eye, Clock } from 'lucide-react'

export default async function JobsPage() {
    const rawJobs = await getJobs()
    const jobs = rawJobs.map(job => ({
        ...job,
        results: job.results.map(r => ({
            ...r,
            price: Number(r.price),
            shipping: r.shipping ? Number(r.shipping) : null
        }))
    }))

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Monitoramento de Buscas
                </h1>
                <p style={{ color: '#94a3b8' }}>Histórico de execuções e resultados encontrados.</p>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>DATA</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>PRODUTO</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>STATUS</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>RESULTADOS</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={14} color="#64748b" />
                                        {new Date(job.createdAt).toLocaleString('pt-BR')}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{job.product.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' :
                                            job.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.1)' :
                                                job.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' :
                                                    'rgba(148, 163, 184, 0.1)',
                                        color: job.status === 'COMPLETED' ? '#10b981' :
                                            job.status === 'RUNNING' ? '#3b82f6' :
                                                job.status === 'FAILED' ? '#ef4444' :
                                                    '#94a3b8',
                                        border: `1px solid ${job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' :
                                            job.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.2)' :
                                                job.status === 'FAILED' ? 'rgba(239, 68, 68, 0.2)' :
                                                    'rgba(148, 163, 184, 0.2)'
                                            }`
                                    }}>
                                        {job.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                                    {job.results.length} itens
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <Link href={`/jobs/${job.id}`}>
                                        <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px' }} title="Ver Detalhes">
                                            <Eye size={16} />
                                        </button>
                                    </Link>

                                    <form action={async () => {
                                        'use server'
                                        await createSearchJob(job.productId)
                                    }}>
                                        <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px' }} title="Re-executar">
                                            <RefreshCw size={16} />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {jobs.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                    Nenhuma busca realizada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
