'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'

interface ProductFilterProps {
    products: { id: string, name: string }[]
}

export default function ProductFilter({ products }: ProductFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentProductId = searchParams.get('productId') || ''

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value
        if (productId) {
            router.push(`/analytics?productId=${productId}`)
        } else {
            router.push('/analytics')
        }
    }

    return (
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
                <Filter size={18} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Filtrar por Produto:</span>
            </div>
            <select
                value={currentProductId}
                onChange={handleChange}
                style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    outline: 'none',
                    minWidth: '250px'
                }}
            >
                <option value="">Todos os Produtos</option>
                {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
        </div>
    )
}
