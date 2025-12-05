'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'
import { motion } from "framer-motion"
import {
    Activity, Search, Package, TrendingUp, TrendingDown,
    Clock, Globe, ShoppingCart, AlertCircle, CheckCircle2,
    Play, Pause, Zap, Trash2, ArrowLeft
} from 'lucide-react'
import { deleteJob } from './actions'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface DashboardProps {
    stats: {
        productsCount: number
        jobsCount: number
        resultsCount: number
        activeJobsCount: number
    }
    marketplaces: string[]
    categories: { category: string, count: number }[]
    recentJobs: any[]
    runningJobs: any[]
    jobsPerDay: { date: string, count: number }[]
}

export default function DashboardClient({
    stats,
    marketplaces,
    categories,
    recentJobs,
    runningJobs,
    jobsPerDay
}: DashboardProps) {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Auto-refresh if there are running jobs
        if (runningJobs.length > 0) {
            const interval = setInterval(() => {
                router.refresh()
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [runningJobs.length, router])

    if (!mounted) return null

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
                        Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        Visão geral do seu ecossistema de monitoramento.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium animate-pulse">
                    <Activity size={16} />
                    Sistema Operacional
                </div>
            </div>

            {/* Real-time Monitor */}
            {runningJobs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-blue-500/30 rounded-xl p-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-shimmer" />
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Zap size={20} className="text-yellow-400" />
                            Monitoramento em Tempo Real
                        </h3>
                        <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                            {runningJobs.length} Processos Ativos
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {runningJobs.map(job => (
                            <div key={job.id} className="bg-slate-800/50 rounded-lg p-4 border border-white/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Search size={20} className="text-blue-400 animate-spin-slow" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{job.product.name}</p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={10} /> Processando...
                                        </p>
                                    </div>
                                </div>
                                <form action={deleteJob}>
                                    <input type="hidden" name="id" value={job.id} />
                                    <button className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Cancelar/Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Produtos Monitorados"
                    value={stats.productsCount}
                    icon={<Package size={24} className="text-emerald-400" />}
                    trend="+2 novos"
                    color="emerald"
                />
                <KpiCard
                    title="Total de Buscas"
                    value={stats.jobsCount}
                    icon={<Search size={24} className="text-blue-400" />}
                    trend={`${stats.activeJobsCount} rodando`}
                    color="blue"
                />
                <KpiCard
                    title="Ofertas Encontradas"
                    value={stats.resultsCount}
                    icon={<ShoppingCart size={24} className="text-purple-400" />}
                    trend="Base crescente"
                    color="purple"
                />
                <KpiCard
                    title="Marketplaces"
                    value={marketplaces.length}
                    icon={<Globe size={24} className="text-amber-400" />}
                    trend="Fontes ativas"
                    color="amber"
                />
            </div>

            {/* Strategy Banner */}
            <Link href="/strategy">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="glass-panel p-6 bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 flex items-center justify-between cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Estratégia de Preços & Análise</h3>
                            <p className="text-slate-400">Defina preços ideais, calcule margens e analise concorrentes com IA.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                        Acessar Ferramenta <ArrowLeft className="rotate-180" size={20} />
                    </div>
                </motion.div>
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity Chart */}
                <div className="lg:col-span-2 glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Volume de Buscas (Últimos 7 dias)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={jobsPerDay}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categories */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Package size={20} className="text-emerald-500" />
                        Categorias
                    </h3>
                    <div className="space-y-4">
                        {categories.map((cat, index) => (
                            <div key={index} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-slate-300 group-hover:text-white transition-colors">
                                        {cat.category || 'Sem categoria'}
                                    </span>
                                </div>
                                <span className="text-sm font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                    {cat.count}
                                </span>
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-slate-500 text-sm">Nenhuma categoria registrada.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Marketplaces & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Marketplaces Grid */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Globe size={20} className="text-amber-500" />
                        Fontes de Dados (Marketplaces)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {marketplaces.map((mp, i) => (
                            <div key={i} className="bg-slate-800/50 border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-colors cursor-default group">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="text-lg font-bold text-amber-500">{mp.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className="text-sm font-medium text-slate-300 capitalize">{mp.replace('_', ' ')}</span>
                            </div>
                        ))}
                        {marketplaces.length === 0 && (
                            <p className="text-slate-500 text-sm col-span-3 text-center">Nenhum marketplace detectado ainda.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock size={20} className="text-purple-500" />
                            Atividade Recente
                        </h3>
                        <Link href="/jobs" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            Ver histórico completo
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {recentJobs.map((job) => (
                            <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                        job.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                                            'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {job.status === 'COMPLETED' ? <CheckCircle2 size={16} /> :
                                            job.status === 'FAILED' ? <AlertCircle size={16} /> :
                                                <Play size={16} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{job.product.name}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(job.createdAt).toLocaleDateString('pt-BR')} • {new Date(job.createdAt).toLocaleTimeString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' :
                                        job.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                                            'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {job.status}
                                    </span>
                                    <form action={deleteJob}>
                                        <input type="hidden" name="id" value={job.id} />
                                        <button className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Excluir">
                                            <Trash2 size={14} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function KpiCard({ title, value, icon, trend, color }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="glass-panel p-6 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-${color}-500`}>
                {icon}
            </div>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-${color}-500/10`}>
                    {icon}
                </div>
            </div>
            <div className={`flex items-center gap-1 text-${color}-400 text-xs font-medium bg-${color}-400/10 w-fit px-2 py-1 rounded-full`}>
                <TrendingUp size={12} /> {trend}
            </div>
        </motion.div>
    )
}
