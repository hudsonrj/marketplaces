'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Search, TrendingUp, Power, PowerOff, Filter, LayoutGrid, List, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { createSearchJob, toggleProductActive, deleteProduct } from '../actions'

interface Product {
    id: string
    name: string
    category: string | null
    brand: string | null
    costPrice: number
    weight: number
    active: boolean
    lastBestPrice: number | null
    lastBestPriceDate: Date | null
    _count: { searchJobs: number }
}

export default function ProductsDashboard({ initialProducts }: { initialProducts: Product[] }) {
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'category' | 'brand'>('list')
    const [filterCategory, setFilterCategory] = useState<string>('all')
    const [filterBrand, setFilterBrand] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    // Extract unique categories and brands
    const categories = useMemo(() => Array.from(new Set(initialProducts.map(p => p.category || 'Sem Categoria'))).sort(), [initialProducts])
    const brands = useMemo(() => Array.from(new Set(initialProducts.map(p => p.brand || 'Sem Marca'))).sort(), [initialProducts])

    // Filter products
    const filteredProducts = useMemo(() => {
        return initialProducts.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = filterCategory === 'all' || (p.category || 'Sem Categoria') === filterCategory
            const matchesBrand = filterBrand === 'all' || (p.brand || 'Sem Marca') === filterBrand
            return matchesSearch && matchesCategory && matchesBrand
        })
    }, [initialProducts, searchTerm, filterCategory, filterBrand])

    // Group products
    const groupedProducts = useMemo(() => {
        if (viewMode === 'list' || viewMode === 'grid') return null

        const groups: Record<string, Product[]> = {}
        filteredProducts.forEach(p => {
            const key = viewMode === 'category' ? (p.category || 'Sem Categoria') : (p.brand || 'Sem Marca')
            if (!groups[key]) groups[key] = []
            groups[key].push(p)
        })
        return groups
    }, [filteredProducts, viewMode])

    // Statistics
    const stats = useMemo(() => {
        const total = filteredProducts.length
        const active = filteredProducts.filter(p => p.active).length
        const byCategory = categories.map(c => ({
            name: c,
            count: initialProducts.filter(p => (p.category || 'Sem Categoria') === c).length
        })).sort((a, b) => b.count - a.count)

        const byBrand = brands.map(b => ({
            name: b,
            count: initialProducts.filter(p => (p.brand || 'Sem Marca') === b).length
        })).sort((a, b) => b.count - a.count)

        return { total, active, byCategory, byBrand }
    }, [filteredProducts, initialProducts, categories, brands])

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }

    const renderProductCard = (product: Product) => (
        <div key={product.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', opacity: product.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: '600', color: 'white', fontSize: '1rem', lineHeight: '1.4' }}>{product.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                            {product.brand || 'Sem Marca'}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                            {product.category || 'Sem Categoria'}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: product.lastBestPrice ? '#10b981' : '#94a3b8' }}>
                        {product.lastBestPrice ? `R$ ${Number(product.lastBestPrice).toFixed(2)}` : '-'}
                    </span>
                    {product.lastBestPriceDate && (
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {new Date(product.lastBestPriceDate).toLocaleDateString('pt-BR')}
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => toggleProductActive(product.id, !product.active)}
                        className="btn-icon"
                        title={product.active ? "Desativar" : "Ativar"}
                        style={{ color: product.active ? '#10b981' : '#ef4444', background: 'rgba(0,0,0,0.2)' }}
                    >
                        {product.active ? <Power size={14} /> : <PowerOff size={14} />}
                    </button>
                    <Link href={`/products/${product.id}/analytics`}>
                        <button className="btn-icon" title="Analytics" style={{ color: '#8b5cf6', background: 'rgba(0,0,0,0.2)' }}>
                            <TrendingUp size={14} />
                        </button>
                    </Link>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => createSearchJob(product.id)}
                        className="btn-icon"
                        title="Buscar Agora"
                        style={{ color: '#3b82f6', background: 'rgba(0,0,0,0.2)' }}
                    >
                        <Search size={14} />
                    </button>
                    <Link href={`/products/${product.id}/edit`}>
                        <button className="btn-icon" title="Editar" style={{ color: '#e2e8f0', background: 'rgba(0,0,0,0.2)' }}>
                            <Edit size={14} />
                        </button>
                    </Link>
                    <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="btn-icon" title="Excluir" style={{ color: '#ef4444', background: 'rgba(0,0,0,0.2)' }}>
                            <Trash2 size={14} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )

    return (
        <div>
            {/* Header & Stats */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Produtos
                        </h1>
                        <p style={{ color: '#94a3b8' }}>Gerencie seu catálogo monitorado.</p>
                    </div>
                    <Link href="/products/new">
                        <button className="btn btn-primary">
                            <Plus size={18} />
                            Novo Produto
                        </button>
                    </Link>
                </div>

                {/* Charts / Stats Bar */}
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '2rem', overflowX: 'auto' }}>
                    <div style={{ minWidth: '150px' }}>
                        <input
                            type="text"
                            placeholder="Buscar produtos..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="glass-select"
                        >
                            <option value="all">Todas Categorias</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <select
                            value={filterBrand}
                            onChange={e => setFilterBrand(e.target.value)}
                            className="glass-select"
                        >
                            <option value="all">Todas Marcas</option>
                            {brands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }} />

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
                            title="Lista"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
                            title="Grade"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('category')}
                            className={`btn-icon ${viewMode === 'category' ? 'active' : ''}`}
                            title="Agrupar por Categoria"
                        >
                            <Filter size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('brand')}
                            className={`btn-icon ${viewMode === 'brand' ? 'active' : ''}`}
                            title="Agrupar por Marca"
                        >
                            <BarChart3 size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {groupedProducts ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(groupedProducts).map(([group, products]) => (
                        <div key={group} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                            <div
                                onClick={() => toggleGroup(group)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>{group}</h2>
                                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                                        {products.length} itens
                                    </span>
                                </div>
                                {expandedGroups[group] ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                            </div>

                            {!expandedGroups[group] && ( // Default to expanded? Logic above defaults to collapsed (false). Let's invert logic or default true.
                                <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {products.map(renderProductCard)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    display: viewMode === 'grid' ? 'grid' : 'flex',
                    flexDirection: 'column',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredProducts.map(product => (
                        viewMode === 'grid' ? renderProductCard(product) : (
                            // List View Item
                            <div key={product.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: '600', color: 'white' }}>{product.name}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{product.brand}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>•</span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{product.category}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                    <span style={{ display: 'block', fontWeight: '700', color: product.lastBestPrice ? '#10b981' : '#94a3b8' }}>
                                        {product.lastBestPrice ? `R$ ${Number(product.lastBestPrice).toFixed(2)}` : '-'}
                                    </span>
                                    {product.lastBestPriceDate && (
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                            {new Date(product.lastBestPriceDate).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link href={`/products/${product.id}/analytics`}>
                                        <button className="btn-icon" title="Analytics"><TrendingUp size={16} /></button>
                                    </Link>
                                    <Link href={`/products/${product.id}/edit`}>
                                        <button className="btn-icon" title="Editar"><Edit size={16} /></button>
                                    </Link>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}

            <style jsx>{`
                .glass-select {
                    padding: 0.5rem 2rem 0.5rem 1rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    color: #e2e8f0;
                    outline: none;
                    cursor: pointer;
                }
                .glass-select option {
                    background: #1e293b;
                }
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
                .btn-icon.active {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                }
            `}</style>
        </div>
    )
}
