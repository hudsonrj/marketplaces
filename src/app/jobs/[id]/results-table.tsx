'use client'

import { useState } from 'react'
import { ArrowUpDown, ExternalLink, MapPin, Truck } from 'lucide-react'

type Result = {
    id: string
    normalizedName: string | null
    title: string
    price: any
    shipping: any
    marketplace: string
    city: string | null
    state: string | null
    matchScore: number | null
    matchReasoning: string | null
    link: string
    imageUrl: string | null
    sellerName: string | null
}

export default function ResultsTable({ results }: { results: Result[] }) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Result; direction: 'asc' | 'desc' }>({
        key: 'price',
        direction: 'asc'
    })

    const sortedResults = [...results].sort((a, b) => {
        const aValue = a[sortConfig.key] ?? ''
        const bValue = b[sortConfig.key] ?? ''

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (key: keyof Result) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const SortIcon = ({ column }: { column: keyof Result }) => {
        return <ArrowUpDown size={14} style={{ opacity: sortConfig.key === column ? 1 : 0.3 }} />
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>IMAGEM</th>
                        <th onClick={() => handleSort('normalizedName')} style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>PRODUTO <SortIcon column="normalizedName" /></div>
                        </th>
                        <th onClick={() => handleSort('price')} style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>PREÇO <SortIcon column="price" /></div>
                        </th>
                        <th onClick={() => handleSort('marketplace')} style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>MARKETPLACE <SortIcon column="marketplace" /></div>
                        </th>
                        <th onClick={() => handleSort('city')} style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>LOCAL <SortIcon column="city" /></div>
                        </th>
                        <th onClick={() => handleSort('matchScore')} style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>SCORE IA <SortIcon column="matchScore" /></div>
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8', fontSize: '0.875rem', fontWeight: '600' }}>AÇÃO</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedResults.map((result) => (
                        <tr key={result.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                            <td style={{ padding: '1rem' }}>
                                {result.imageUrl && (
                                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img
                                            src={result.imageUrl}
                                            alt={result.title}
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: '600', color: 'white', marginBottom: '0.25rem' }}>{result.normalizedName || 'Produto não identificado'}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={result.title}>
                                    {result.title}
                                </div>
                                {result.sellerName && (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Vendedor: {result.sellerName}</div>
                                )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1rem' }}>
                                    R$ {Number(result.price).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <Truck size={12} />
                                    {result.shipping ? `R$ ${Number(result.shipping).toFixed(2)}` : 'Grátis'}
                                </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white'
                                }}>
                                    {result.marketplace}
                                </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.875rem' }}>
                                    <MapPin size={14} color="#64748b" />
                                    {result.city ? `${result.city}, ${result.state}` : '-'}
                                </div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                {result.matchScore !== null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: `2px solid ${result.matchScore > 80 ? '#10b981' : result.matchScore > 50 ? '#f59e0b' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>
                                            {result.matchScore}
                                        </div>
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <a href={result.link} target="_blank" className="btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.875rem' }}>
                                    Ver <ExternalLink size={14} />
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
