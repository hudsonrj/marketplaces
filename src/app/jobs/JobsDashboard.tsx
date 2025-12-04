'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, RefreshCw, Eye, Clock, Trash2, Edit, Plus, Calendar, X, Save, Play } from 'lucide-react'
import { createSearchJob, deleteJob, updateJob, processPendingJobs } from '../actions'

interface Job {
    id: string
    productId: string
    status: string
    createdAt: Date
    scheduledFor: Date | null
    updatedAt: Date
    product: {
        name: string
    }
    results: any[]
}

interface Product {
    id: string
    name: string
}

export default function JobsDashboard({ initialJobs, products }: { initialJobs: Job[], products: Product[] }) {
    const router = useRouter()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingJob, setEditingJob] = useState<Job | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Create Form State
    const [selectedProductId, setSelectedProductId] = useState('')
    const [scheduleDate, setScheduleDate] = useState('')

    // Edit Form State
    const [editStatus, setEditStatus] = useState('')
    const [editDate, setEditDate] = useState('')

    // Auto-refresh if there are running jobs
    useEffect(() => {
        const hasRunningJobs = initialJobs.some(job => job.status === 'RUNNING' || job.status === 'PENDING')
        if (!hasRunningJobs) return

        const interval = setInterval(() => {
            router.refresh()
        }, 5000)

        return () => clearInterval(interval)
    }, [initialJobs, router])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedProductId) return

        const date = scheduleDate ? new Date(scheduleDate) : undefined
        await createSearchJob(selectedProductId, date)
        setIsCreateModalOpen(false)
        setSelectedProductId('')
        setScheduleDate('')
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingJob) return

        const formData = new FormData()
        formData.append('id', editingJob.id)
        formData.append('status', editStatus)
        if (editDate) formData.append('scheduledFor', editDate)

        await updateJob(formData)
        setEditingJob(null)
    }

    const handleProcessQueue = async () => {
        setIsProcessing(true)
        try {
            await processPendingJobs()
        } catch (error) {
            console.error(error)
        } finally {
            setIsProcessing(false)
        }
    }

    const openEditModal = (job: Job) => {
        setEditingJob(job)
        setEditStatus(job.status)
        setEditDate(job.scheduledFor ? new Date(job.scheduledFor).toISOString().slice(0, 16) : '')
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Monitoramento de Buscas
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Histórico e agendamento de execuções.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleProcessQueue}
                        disabled={isProcessing}
                        className="btn-secondary"
                        title="Processar Fila (Executar Pendentes)"
                        style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <Play size={18} className={isProcessing ? 'animate-spin' : ''} />
                        {isProcessing ? 'Processando...' : 'Rodar Pendentes'}
                    </button>
                    <button onClick={() => router.refresh()} className="btn-secondary" title="Atualizar Lista">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary">
                        <Plus size={18} />
                        Nova Busca
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>CRIADO EM</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>AGENDADO PARA</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>PRODUTO</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>STATUS</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>RESULTADOS</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialJobs.map((job) => {
                            const isStuck = job.status === 'RUNNING' && new Date().getTime() - new Date(job.updatedAt).getTime() > 1000 * 60 * 10 // 10 mins
                            return (
                                <tr key={job.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={14} color="#64748b" />
                                            {new Date(job.createdAt).toLocaleString('pt-BR')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#cbd5e1', fontSize: '0.9rem' }}>
                                        {job.scheduledFor ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                                                <Calendar size={14} />
                                                {new Date(job.scheduledFor).toLocaleString('pt-BR')}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{job.product.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' :
                                                    job.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.1)' :
                                                        job.status === 'FAILED' ? 'rgba(239, 68, 68, 0.1)' :
                                                            job.status === 'SCHEDULED' ? 'rgba(251, 191, 36, 0.1)' :
                                                                'rgba(148, 163, 184, 0.1)',
                                                color: job.status === 'COMPLETED' ? '#10b981' :
                                                    job.status === 'RUNNING' ? '#3b82f6' :
                                                        job.status === 'FAILED' ? '#ef4444' :
                                                            job.status === 'SCHEDULED' ? '#fbbf24' :
                                                                '#94a3b8',
                                                border: `1px solid ${job.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' :
                                                    job.status === 'RUNNING' ? 'rgba(59, 130, 246, 0.2)' :
                                                        job.status === 'FAILED' ? 'rgba(239, 68, 68, 0.2)' :
                                                            job.status === 'SCHEDULED' ? 'rgba(251, 191, 36, 0.2)' :
                                                                'rgba(148, 163, 184, 0.2)'
                                                    }`
                                            }}>
                                                {job.status}
                                            </span>
                                            {isStuck && (
                                                <span title="Este job parece estar travado (rodando há mais de 10min). Pode ter sido interrompido." style={{ cursor: 'help' }}>
                                                    ⚠️
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                                        {job.results.length} itens
                                    </td>
                                    <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link href={`/jobs/${job.id}`}>
                                            <button className="btn-icon" title="Ver Detalhes">
                                                <Eye size={16} />
                                            </button>
                                        </Link>

                                        <button onClick={() => openEditModal(job)} className="btn-icon" title="Editar">
                                            <Edit size={16} />
                                        </button>

                                        <form action={deleteJob}>
                                            <input type="hidden" name="id" value={job.id} />
                                            <button className="btn-icon" style={{ color: '#ef4444' }} title="Excluir">
                                                <Trash2 size={16} />
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Nova Busca</h2>
                            <button onClick={() => setIsCreateModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Produto</label>
                                <select
                                    value={selectedProductId}
                                    onChange={e => setSelectedProductId(e.target.value)}
                                    className="glass-input"
                                    required
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Selecione um produto...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Agendar para (Opcional)</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                    className="glass-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Criar Job</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingJob && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Editar Job</h2>
                            <button onClick={() => setEditingJob(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Status</label>
                                <select
                                    value={editStatus}
                                    onChange={e => setEditStatus(e.target.value)}
                                    className="glass-input"
                                    style={{ width: '100%' }}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="RUNNING">RUNNING</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="SCHEDULED">SCHEDULED</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>Agendamento</label>
                                <input
                                    type="datetime-local"
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className="glass-input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setEditingJob(null)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .btn-icon {
                    padding: 0.5rem;
                    border-radius: 6px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    color: #94a3b8;
                    background: transparent;
                }
                .btn-icon:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    width: 100%;
                    max-width: 500px;
                    padding: 2rem;
                }
                .glass-input {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 0.75rem;
                    color: white;
                    outline: none;
                }
                .glass-input:focus {
                    border-color: #3b82f6;
                }
                .glass-input option {
                    background: #1e293b;
                }
            `}</style>
        </div>
    )
}
