'use client'

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts'

export default function AnalyticsDashboard({ results, history }: { results: any[], history: any[] }) {

    // 1. Stats by Marketplace
    const byMarketplace = results.reduce((acc: any, curr) => {
        const mp = curr.marketplace
        if (!acc[mp]) acc[mp] = { name: mp, count: 0, total: 0, min: Infinity }
        acc[mp].count++
        acc[mp].total += Number(curr.price)
        acc[mp].min = Math.min(acc[mp].min, Number(curr.price))
        return acc
    }, {})
    const mpChartData = Object.values(byMarketplace).map((d: any) => ({ ...d, avg: d.total / d.count }))

    // 2. Stats by Store (Seller)
    const byStore = results.reduce((acc: any, curr) => {
        const seller = curr.sellerName || 'Desconhecido'
        if (!acc[seller]) acc[seller] = { name: seller, count: 0 }
        acc[seller].count++
        return acc
    }, {})
    const storeChartData = Object.values(byStore)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10) // Top 10 stores

    // 3. Stats by Rating
    const byRating = results.reduce((acc: any, curr) => {
        const rating = curr.reviewScore ? Math.floor(Number(curr.reviewScore)) : 0
        const label = rating > 0 ? `${rating} Estrelas` : 'Sem Avaliação'
        if (!acc[label]) acc[label] = { name: label, value: 0 }
        acc[label].value++
        return acc
    }, {})
    const ratingChartData = Object.values(byRating)
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

    // 4. Indicators
    const lowestPrice = results.length > 0 ? Number(results[0].price) : 0
    const avgPrice = results.reduce((sum, r) => sum + Number(r.price), 0) / (results.length || 1)
    const suggestedPrice = avgPrice * 0.95

    // 5. Top 10 Lowest Offers
    const lowestOffers = [...results].sort((a, b) => a.price - b.price).slice(0, 10)

    return (
        <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Menor Preço Encontrado</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        R$ {lowestPrice.toFixed(2)}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Preço Médio de Mercado</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        R$ {avgPrice.toFixed(2)}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center', border: '1px solid #8b5cf6' }}>
                    <div style={{ fontSize: '0.875rem', color: '#8b5cf6' }}>Sugestão de Venda</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                        R$ {suggestedPrice.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(-5% da média)</div>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                {/* Price History */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Histórico de Preços (Banco de Dados)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                <Legend />
                                <Line type="monotone" dataKey="min" name="Preço Mínimo" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="avg" name="Preço Médio" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Marketplace Comparison */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Comparativo por Marketplace</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mpChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                <Bar dataKey="avg" name="Preço Médio" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="min" name="Menor Preço" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Stores */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Top 10 Lojas (Mais Ofertas)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storeChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" style={{ fontSize: '0.75rem' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                                <Bar dataKey="count" name="Ofertas" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ratings Distribution */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Distribuição de Avaliações</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={ratingChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {ratingChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lowest Offers Table */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Top 10 Menores Ofertas</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Produto</th>
                                    <th style={{ padding: '0.75rem' }}>Loja</th>
                                    <th style={{ padding: '0.75rem' }}>Marketplace</th>
                                    <th style={{ padding: '0.75rem' }}>Preço</th>
                                    <th style={{ padding: '0.75rem' }}>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lowestOffers.map((offer: any, i: number) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '0.75rem' }}>{offer.title.substring(0, 50)}...</td>
                                        <td style={{ padding: '0.75rem' }}>{offer.sellerName || '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>{offer.marketplace}</td>
                                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>
                                            R$ {offer.price.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <a href={offer.link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                                Ver
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}

