'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import { motion } from "framer-motion"
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Filter, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface AnalyticsDashboardProps {
    stats: {
        totalProducts: number
        totalJobs: number
        totalResults: number
        avgPrice: number
    }
    products: { id: string, name: string, count: number }[]
    selectedProductId?: string
    marketShare: { marketplace: string, count: number }[]
    priceByMarketplace: { marketplace: string, avg_price: number }[]
    topSellers: { seller_name: string, count: number }[]
    priceHistory: { date: Date, min: number, avg: number }[]
    topLocations: { state: string, count: number }[]
}

export default function AnalyticsDashboard({
    stats,
    products,
    selectedProductId,
    marketShare,
    priceByMarketplace,
    topSellers,
    priceHistory,
    topLocations
}: AnalyticsDashboardProps) {
    const router = useRouter()

    // Format data for charts
    const marketShareData = marketShare.map(item => ({
        name: item.marketplace.replace('_', ' '),
        value: Number(item.count)
    }))

    const priceData = priceByMarketplace.map(item => ({
        name: item.marketplace.replace('_', ' '),
        price: Number(item.avg_price)
    }))

    const sellerData = topSellers.map(item => ({
        name: item.seller_name,
        offers: Number(item.count)
    }))

    const locationData = topLocations.map(item => ({
        name: item.state,
        count: Number(item.count)
    }))

    const historyData = priceHistory.map(item => ({
        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        min: Number(item.min),
        avg: Number(item.avg)
    }))

    const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const productId = e.target.value
        if (productId) {
            router.push(`/analytics?productId=${productId}`)
        } else {
            router.push('/analytics')
        }
    }

    const EmptyState = ({ message }: { message: string }) => (
        <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <BarChart3 size={32} className="opacity-20" />
            <p className="text-sm">{message}</p>
        </div>
    )

    return (
        <div>
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Analytics {selectedProductId ? 'do Produto' : 'Global'}
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {selectedProductId
                            ? 'Análise detalhada de performance e concorrência.'
                            : 'Visão consolidada de todos os monitoramentos.'}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                        <Filter size={18} />
                        <span className="text-sm font-medium hidden md:inline">Produto:</span>
                    </div>
                    <select
                        value={selectedProductId || ''}
                        onChange={handleProductChange}
                        className="bg-slate-900/50 border border-white/10 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 min-w-[200px] outline-none"
                    >
                        <option value="" className="bg-slate-900">Todos os Produtos</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id} className="bg-slate-900">
                                {p.name} ({p.count} registros)
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
                    className="glass-panel p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBag size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Total de Produtos</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{stats.totalProducts}</h3>
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium bg-emerald-400/10 w-fit px-2 py-1 rounded-full">
                        <TrendingUp size={12} /> Ativos
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass-panel p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart3 size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Jobs Executados</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{stats.totalJobs}</h3>
                    <div className="flex items-center gap-1 text-blue-400 text-xs font-medium bg-blue-400/10 w-fit px-2 py-1 rounded-full">
                        <ArrowUpRight size={12} /> +12% essa semana
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-panel p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Ofertas Coletadas</p>
                    <h3 className="text-3xl font-bold text-white mb-2">{stats.totalResults}</h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium bg-slate-400/10 w-fit px-2 py-1 rounded-full">
                        <Calendar size={12} /> Últimos 30 dias
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass-panel p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Preço Médio</p>
                    <h3 className="text-3xl font-bold text-white mb-2">R$ {Number(stats.avgPrice).toFixed(2)}</h3>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-medium bg-amber-400/10 w-fit px-2 py-1 rounded-full">
                        Variação de mercado
                    </div>
                </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Price History */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="glass-panel p-6 lg:col-span-2"
                >
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500" />
                        Histórico de Preços
                    </h3>
                    <div className="h-[350px] w-full">
                        {historyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
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
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="min" name="Preço Mínimo" stroke="#10b981" fillOpacity={1} fill="url(#colorMin)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="avg" name="Preço Médio" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Sem histórico de preços suficiente para exibir o gráfico." />
                        )}
                    </div>
                </motion.div>

                {/* Market Share */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <ShoppingBag size={20} className="text-purple-500" />
                        Distribuição por Marketplace
                    </h3>
                    <div className="h-[300px] w-full">
                        {marketShareData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={marketShareData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {marketShareData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Nenhum dado de distribuição encontrado." />
                        )}
                    </div>
                </motion.div>

                {/* Price by Marketplace */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <DollarSign size={20} className="text-amber-500" />
                        Preço Médio por Canal
                    </h3>
                    <div className="h-[300px] w-full">
                        {priceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priceData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço Médio']}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="price" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={32}>
                                        {priceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Sem dados de preço por canal." />
                        )}
                    </div>
                </motion.div>

                {/* Top Sellers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-emerald-500" />
                        Top Competidores (Volume)
                    </h3>
                    <div className="h-[300px] w-full">
                        {sellerData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sellerData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="offers" fill="#10b981" radius={[4, 4, 0, 0]} name="Ofertas Encontradas" barSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Nenhum competidor identificado." />
                        )}
                    </div>
                </motion.div>

                {/* Top Locations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-cyan-500" />
                        Distribuição Geográfica (Estados)
                    </h3>
                    <div className="h-[300px] w-full">
                        {locationData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={locationData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Ofertas" barSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Sem dados de localização." />
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
