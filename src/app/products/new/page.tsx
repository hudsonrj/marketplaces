import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

async function createProduct(formData: FormData) {
    'use server'

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const weight = parseFloat(formData.get('weight') as string)
    const dimensions = formData.get('dimensions') as string
    const originCep = formData.get('originCep') as string

    await prisma.product.create({
        data: {
            name,
            description,
            costPrice,
            weight,
            dimensions,
            originCep
        }
    })

    redirect('/products')
}

export default function NewProductPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', textDecoration: 'none', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} />
                    Voltar para Produtos
                </Link>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>Novo Produto</h1>
                <p style={{ color: '#94a3b8' }}>Cadastre um novo produto para monitoramento.</p>
            </div>

            <form action={createProduct} className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Nome do Produto</label>
                        <input name="name" type="text" className="input-field" placeholder="Ex: iPhone 13 128GB" required />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Descrição (para IA)</label>
                        <textarea name="description" className="input-field" rows={4} placeholder="Detalhes importantes para a IA identificar o produto correto..." style={{ resize: 'vertical' }}></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Preço de Custo (R$)</label>
                            <input name="costPrice" type="number" step="0.01" className="input-field" placeholder="0.00" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Peso (kg)</label>
                            <input name="weight" type="number" step="0.01" className="input-field" placeholder="0.00" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Dimensões</label>
                            <input name="dimensions" type="text" className="input-field" placeholder="Ex: 10x20x5" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>CEP de Origem</label>
                            <input name="originCep" type="text" className="input-field" placeholder="00000-000" />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} />
                            Salvar Produto
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
