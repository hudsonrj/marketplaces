'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts'

export default function ProductCharts({ results }: { results: any[] }) {
    // Filter only high confidence matches
    const validResults = results.filter(r => r.matchScore > 70)

    if (validResults.length === 0) return null

    // Group by State
    const stateData = validResults.reduce((acc: any, curr) => {
        const state = curr.state || 'N/A'
        if (!acc[state]) {
            acc[state] = { state, count: 0, total: 0, min: Infinity, max: -Infinity }
        }
        acc[state].count += 1
        acc[state].total += Number(curr.price)
        acc[state].min = Math.min(acc[state].min, Number(curr.price))
        acc[state].max = Math.max(acc[state].max, Number(curr.price))
        return acc
    }, {})

    const chartData = Object.values(stateData).map((d: any) => ({
        ...d,
        avg: d.total / d.count
    }))

    // Scatter Data (Price vs Marketplace)
    const scatterData = validResults.map(r => ({
        price: Number(r.price),
        marketplace: r.marketplace,
        name: r.normalizedName || r.title
    }))

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div className="card">
                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Preço Médio por Estado</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="state" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            />
                            <Legend />
                            <Bar dataKey="avg" name="Preço Médio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="min" name="Mínimo" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Dispersão de Preços</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="category" dataKey="marketplace" name="Marketplace" stroke="#94a3b8" />
                            <YAxis type="number" dataKey="price" name="Preço" unit="R$" stroke="#94a3b8" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                            <Scatter name="Ofertas" data={scatterData} fill="#8b5cf6" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
