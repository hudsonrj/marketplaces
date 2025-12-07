'use client'

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { useState } from 'react'

export default function AnalyticsDashboard({ results, history }: { results: any[], history: any[] }) {

    // --- Data Processing ---

    // 1. Stats by Marketplace
    const byMarketplace = results.reduce((acc: Record<string, { name: string, count: number, total: number, min: number, shippingTotal: number, shippingCount: number }>, curr) => {
        const mp = curr.marketplace
        if (!acc[mp]) acc[mp] = { name: mp, count: 0, total: 0, min: Infinity, shippingTotal: 0, shippingCount: 0 }
        acc[mp].count++
        acc[mp].total += Number(curr.price)
        acc[mp].min = Math.min(acc[mp].min, Number(curr.price))
        if (curr.shipping > 0) {
            acc[mp].shippingTotal += Number(curr.shipping)
            acc[mp].shippingCount++
        }
        return acc
    }, {})
    const mpChartData = Object.values(byMarketplace).map((d: any) => ({
        ...d,
        avg: d.total / d.count,
        avgShipping: d.shippingCount > 0 ? d.shippingTotal / d.shippingCount : 0
    }))

    // 2. Stats by Store (Seller)
    const byStore = results.reduce((acc: Record<string, { name: string, count: number }>, curr) => {
        const seller = curr.sellerName || 'Desconhecido'
        if (!acc[seller]) acc[seller] = { name: seller, count: 0 }
        acc[seller].count++
        return acc
    }, {})
    const storeChartData = Object.values(byStore)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10)

    // 3. Stats by Rating
    const byRating = results.reduce((acc: Record<string, { name: string, value: number }>, curr) => {
        const rating = curr.reviewScore ? Math.floor(Number(curr.reviewScore)) : 0
        const label = rating > 0 ? `${rating} Estrelas` : 'Sem Avaliação'
        if (!acc[label]) acc[label] = { name: label, value: 0 }
        acc[label].value++
        return acc
    }, {})
    const ratingChartData = Object.values(byRating)

    // 4. Stats by Condition
    const byCondition = results.reduce((acc: Record<string, { name: string, value: number }>, curr) => {
        const cond = curr.condition === 'new' ? 'Novo' : (curr.condition === 'used' ? 'Usado' : 'Outro')
        if (!acc[cond]) acc[cond] = { name: cond, value: 0 }
        acc[cond].value++
        return acc
    }, {})
    const conditionChartData = Object.values(byCondition)

    // 5. Indicators
    const lowestPrice = results.length > 0 ? Number(results[0].price) : 0
    const avgPrice = results.reduce((sum, r) => sum + Number(r.price), 0) / (results.length || 1)
    const suggestedPrice = avgPrice * 0.90 // 10% below average for competitive pricing
    const freeShippingCount = results.filter(r => r.shipping === 0).length
    const avgShipping = results.reduce((sum, r) => sum + (Number(r.shipping) || 0), 0) / (results.filter(r => r.shipping > 0).length || 1)

    // 6. Insights Generation
    const insights = []
    if (lowestPrice < avgPrice * 0.7) insights.push(`O menor preço encontrado (R$ ${lowestPrice.toFixed(2)}) está 30% abaixo da média de mercado.`)
    if (freeShippingCount > results.length * 0.5) insights.push(`Mais da metade das ofertas (${freeShippingCount}) oferecem Frete Grátis.`)
    const bestMp = mpChartData.sort((a: any, b: any) => a.avg - b.avg)[0]
    if (bestMp) insights.push(`${bestMp.name} tem o melhor preço médio (R$ ${bestMp.avg.toFixed(2)}).`)

    // 7. Top 10 Lowest Offers
    const lowestOffers = [...results].sort((a, b) => a.price - b.price).slice(0, 10)

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <span className="text-sm">{message}</span>
        </div>
    )

    return (
        <div className="space-y-8 animate-fade-in">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-400 mb-2">Menor Preço</div>
                    <div className="text-3xl font-bold text-emerald-400">
                        R$ {lowestPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Melhor oferta encontrada</div>
                </div>

                <div className="glass-card flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-400 mb-2">Preço Médio</div>
                    <div className="text-3xl font-bold text-blue-400">
                        R$ {avgPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Baseado em {results.length} ofertas</div>
                </div>

                <div className="glass-card flex flex-col items-center justify-center text-center border-purple-500/30">
                    <div className="text-sm text-purple-300 mb-2">Sugestão de Venda</div>
                    <div className="text-3xl font-bold text-white">
                        R$ {suggestedPrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-purple-400 mt-1">Competitivo (-10% da média)</div>
                </div>

                <div className="glass-card flex flex-col items-center justify-center text-center">
                    <div className="text-sm text-gray-400 mb-2">Frete Médio</div>
                    <div className="text-3xl font-bold text-orange-400">
                        R$ {avgShipping.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{freeShippingCount} ofertas com Frete Grátis</div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-yellow-400">✨</span> Insights de Mercado
                </h3>
                <div className="grid gap-3">
                    {insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-3 text-gray-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            {insight}
                        </div>
                    ))}
                    {insights.length === 0 && <div className="text-gray-500 italic">Nenhum insight relevante encontrado.</div>}
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Price History */}
                <div className="glass-card lg:col-span-2 h-[400px]">
                    <h3 className="text-lg font-bold mb-6 text-gray-200">Histórico de Preços</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `R$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="min" name="Preço Mínimo" stroke="#10b981" fillOpacity={1} fill="url(#colorMin)" strokeWidth={2} />
                            <Area type="monotone" dataKey="avg" name="Preço Médio" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Marketplace Comparison */}
                <div className="glass-card h-[350px]">
                    <h3 className="text-lg font-bold mb-6 text-gray-200">Comparativo por Marketplace</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mpChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="min" name="Menor Preço" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="avg" name="Preço Médio" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Condition Distribution */}
                <div className="glass-card h-[350px]">
                    <h3 className="text-lg font-bold mb-6 text-gray-200">Condição dos Produtos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={conditionChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {conditionChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }} />
                            <Legend verticalAlign="middle" align="right" layout="vertical" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Offers Table */}
            <div className="glass-panel overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-200">Top 10 Melhores Ofertas</h3>
                    <span className="text-xs text-gray-500 bg-slate-800 px-3 py-1 rounded-full">Ordenado pelo menor preço</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Loja</th>
                                <th className="px-6 py-4">Marketplace</th>
                                <th className="px-6 py-4">Condição</th>
                                <th className="px-6 py-4">Preço</th>
                                <th className="px-6 py-4">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {lowestOffers.map((offer: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white truncate max-w-[300px]" title={offer.title}>
                                        {offer.title}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{offer.sellerName || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold 
                                            ${offer.marketplace === 'MERCADO_LIVRE' ? 'bg-yellow-500/20 text-yellow-500' :
                                                offer.marketplace === 'AMAZON' ? 'bg-blue-500/20 text-blue-500' :
                                                    'bg-gray-500/20 text-gray-400'}`}>
                                            {offer.marketplace}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {offer.condition === 'new' ? 'Novo' : 'Usado'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-400">
                                        R$ {offer.price.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a
                                            href={offer.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            Ver Oferta
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

