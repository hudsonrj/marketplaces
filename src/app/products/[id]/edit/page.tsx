import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { updateProduct } from '../../../actions'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const product = await prisma.product.findUnique({ where: { id } })

    if (!product) return <div>Produto não encontrado</div>

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Voltar para Produtos
                </Link>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>Editar Produto</h1>
                <p style={{ color: '#94a3b8' }}>Atualize as informações do produto.</p>
            </div>

            <form action={updateProduct} className="glass-panel" style={{ padding: '2rem' }}>
                <input type="hidden" name="id" value={product.id} />
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Nome do Produto</label>
                        <input name="name" type="text" defaultValue={product.name} className="input-field" required />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Descrição (para IA)</label>
                        <textarea name="description" className="input-field" rows={4} defaultValue={product.description || ''} style={{ resize: 'vertical' }}></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Preço de Custo (R$)</label>
                            <input name="costPrice" type="number" step="0.01" defaultValue={Number(product.costPrice)} className="input-field" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Peso (kg)</label>
                            <input name="weight" type="number" step="0.01" defaultValue={Number(product.weight)} className="input-field" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Dimensões</label>
                            <input name="dimensions" type="text" defaultValue={product.dimensions || ''} className="input-field" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>CEP de Origem</label>
                            <input name="originCep" type="text" defaultValue={product.originCep || ''} className="input-field" />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} />
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
