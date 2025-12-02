import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Edit, Trash2, Search, TrendingUp, Power, PowerOff } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { createSearchJob, toggleProductActive } from '../actions'

async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { searchJobs: true } }
        }
    })
}

async function deleteProduct(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await prisma.product.delete({ where: { id } })
    revalidatePath('/products')
}

export default async function ProductsPage() {
    const products = await getProducts()

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Produtos
                    </h1>
                    <p style={{ color: '#94a3b8' }}>Gerencie os produtos que você deseja monitorar.</p>
                </div>
                <Link href="/products/new">
                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Novo Produto
                    </button>
                </Link>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>STATUS</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>NOME</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>MELHOR PREÇO</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>JOBS</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', opacity: product.active ? 1 : 0.5 }}>
                                <td style={{ padding: '1rem' }}>
                                    <form action={async () => {
                                        'use server'
                                        await toggleProductActive(product.id, !product.active)
                                    }}>
                                        <button type="submit" title={product.active ? "Desativar" : "Ativar"}>
                                            {product.active ?
                                                <Power size={18} color="#10b981" /> :
                                                <PowerOff size={18} color="#ef4444" />
                                            }
                                        </button>
                                    </form>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{product.name}</td>
                                <td style={{ padding: '1rem', color: product.lastBestPrice ? '#10b981' : '#94a3b8' }}>
                                    {product.lastBestPrice ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>R$ {Number(product.lastBestPrice).toFixed(2)}</span>
                                            {product.lastBestPriceDate && (
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                    {new Date(product.lastBestPriceDate).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '0.75rem', fontWeight: '600' }}>
                                        {product._count.searchJobs} Jobs
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <form action={async () => {
                                        'use server'
                                        await createSearchJob(product.id)
                                    }}>
                                        <button type="submit" className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px' }} title="Buscar Agora" disabled={!product.active}>
                                            <Search size={16} />
                                        </button>
                                    </form>

                                    <Link href={`/products/${product.id}/analytics`}>
                                        <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.2)' }} title="Evolução de Preço">
                                            <TrendingUp size={16} />
                                        </button>
                                    </Link>

                                    <Link href={`/products/${product.id}/edit`}>
                                        <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px' }} title="Editar">
                                            <Edit size={16} />
                                        </button>
                                    </Link>

                                    <form action={deleteProduct}>
                                        <input type="hidden" name="id" value={product.id} />
                                        <button className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }} title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    Nenhum produto cadastrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
