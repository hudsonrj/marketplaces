'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, DollarSign, Truck, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Product {
    id: string
    name: string
    costPrice: number
    weight: number | null
    dimensions: string | null
    originCep: string | null
}

interface Competitor {
    sellerName: string
    price: number
    shipping: number
    marketplace: string
    condition: string
    link: string
}

export default function PricingStrategyDashboard({ products }: { products: Product[] }) {
    const [selectedProductId, setSelectedProductId] = useState('')
    const [desiredMargin, setDesiredMargin] = useState(20) // %
    const [discountStrategy, setDiscountStrategy] = useState(5) // % below market
    const [competitors, setCompetitors] = useState<Competitor[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [analysis, setAnalysis] = useState<string | null>(null)

    const selectedProduct = products.find(p => p.id === selectedProductId)

    useEffect(() => {
        if (selectedProductId) {
            fetchCompetitors(selectedProductId)
        }
    }, [selectedProductId])

    const fetchCompetitors = async (productId: string) => {
        setIsLoading(true)
        try {
            // In a real app, this would fetch from your API/Database
            // For now, we simulate with mock data or fetch from recent jobs
            const response = await fetch(`/api/products/${productId}/competitors`)
            if (response.ok) {
                const data = await response.json()
                setCompetitors(data)
            }
        } catch (error) {
            console.error('Failed to fetch competitors', error)
        } finally {
            setIsLoading(false)
        }
    }

    const calculatePricing = () => {
        if (!selectedProduct) return null

        const cost = Number(selectedProduct.costPrice)
        const marketAvg = competitors.length > 0
            ? competitors.reduce((acc, curr) => acc + curr.price, 0) / competitors.length
            : 0
        const marketMin = competitors.length > 0
            ? Math.min(...competitors.map(c => c.price))
            : 0

        // Strategy 1: Cost + Margin
        const priceWithMargin = cost * (1 + desiredMargin / 100)

        // Strategy 2: Market Penetration (Below Lowest Competitor)
        const priceBelowMarket = marketMin > 0 ? marketMin * (1 - discountStrategy / 100) : 0

        // Suggested Price (Weighted or Logic based)
        // If we can afford to beat the market, do it. Otherwise, stick to margin.
        const suggestedPrice = priceBelowMarket > cost ? priceBelowMarket : priceWithMargin

        return {
            cost,
            marketAvg,
            marketMin,
            priceWithMargin,
            priceBelowMarket,
            suggestedPrice,
            profit: suggestedPrice - cost,
            roi: ((suggestedPrice - cost) / cost) * 100
        }
    }

    const pricingData = calculatePricing()

    const handleGenerateAnalysis = async () => {
        if (!pricingData) return
        setIsLoading(true)
        // Simulate AI Analysis
        setTimeout(() => {
            setAnalysis(`
                **Análise de Estratégia de Preços:**
                
                Com base nos dados coletados, o mercado apresenta uma média de R$ ${pricingData.marketAvg.toFixed(2)}.
                O menor preço encontrado foi R$ ${pricingData.marketMin.toFixed(2)}.
                
                Sua margem desejada de ${desiredMargin}% sugere um preço de R$ ${pricingData.priceWithMargin.toFixed(2)}.
                Para ser competitivo (${discountStrategy}% abaixo do mercado), o preço ideal seria R$ ${pricingData.priceBelowMarket.toFixed(2)}.
                
                **Recomendação:**
                ${pricingData.priceBelowMarket > pricingData.cost
                    ? "É viável competir por preço! Você ainda terá lucro."
                    : "Cuidado! Competir pelo menor preço pode corroer sua margem. Foque em diferenciais como frete grátis ou kits."}
            `)
            setIsLoading(false)
        }, 1500)
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Estratégia de Preços
                    </h1>
                    <p className="text-slate-400">Defina preços competitivos com base em dados reais.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="glass-panel p-6 space-y-6 h-fit">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Selecione o Produto</label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedProduct && (
                        <>
                            <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400">Preço de Custo</span>
                                    <span className="text-white font-mono">R$ {Number(selectedProduct.costPrice).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Peso / Dimensões</span>
                                    <span className="text-slate-300 text-sm">
                                        {selectedProduct.weight ? `${selectedProduct.weight}kg` : '-'} / {selectedProduct.dimensions || '-'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Margem de Lucro Desejada (%)</label>
                                <input
                                    type="number"
                                    value={desiredMargin}
                                    onChange={(e) => setDesiredMargin(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Desconto vs. Mercado (%)</label>
                                <input
                                    type="number"
                                    value={discountStrategy}
                                    onChange={(e) => setDiscountStrategy(Number(e.target.value))}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-white outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Quanto % abaixo do menor concorrente você quer ficar.</p>
                            </div>

                            <button
                                onClick={handleGenerateAnalysis}
                                disabled={isLoading}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <TrendingUp size={18} />
                                {isLoading ? 'Analisando...' : 'Gerar Análise IA'}
                            </button>
                        </>
                    )}
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {pricingData ? (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-panel p-4 border-l-4 border-blue-500">
                                    <p className="text-slate-400 text-sm mb-1">Preço Sugerido</p>
                                    <p className="text-2xl font-bold text-white">R$ {pricingData.suggestedPrice.toFixed(2)}</p>
                                    <p className={`text-xs mt-1 ${pricingData.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        Lucro: R$ {pricingData.profit.toFixed(2)} ({pricingData.roi.toFixed(1)}%)
                                    </p>
                                </div>
                                <div className="glass-panel p-4 border-l-4 border-yellow-500">
                                    <p className="text-slate-400 text-sm mb-1">Média de Mercado</p>
                                    <p className="text-2xl font-bold text-white">R$ {pricingData.marketAvg.toFixed(2)}</p>
                                </div>
                                <div className="glass-panel p-4 border-l-4 border-green-500">
                                    <p className="text-slate-400 text-sm mb-1">Menor Concorrente</p>
                                    <p className="text-2xl font-bold text-white">R$ {pricingData.marketMin.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            {analysis && (
                                <div className="glass-panel p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/30">
                                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                                        <AlertCircle size={20} />
                                        <h3 className="font-semibold">Insight da IA</h3>
                                    </div>
                                    <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-line">
                                        {analysis}
                                    </div>
                                </div>
                            )}

                            {/* Competitors List */}
                            <div className="glass-panel p-6">
                                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                                    <ShoppingCart size={18} />
                                    Concorrentes Monitorados
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-700/50 text-slate-400 text-sm">
                                                <th className="p-3">Vendedor</th>
                                                <th className="p-3">Marketplace</th>
                                                <th className="p-3">Condição</th>
                                                <th className="p-3">Preço</th>
                                                <th className="p-3">Frete</th>
                                                <th className="p-3">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {competitors.length > 0 ? competitors.map((comp, idx) => (
                                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-3 text-white font-medium">{comp.sellerName || 'N/A'}</td>
                                                    <td className="p-3 text-slate-300">{comp.marketplace}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${comp.condition === 'new' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                            {comp.condition === 'new' ? 'Novo' : 'Usado'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-white">R$ {comp.price.toFixed(2)}</td>
                                                    <td className="p-3 text-slate-400">{comp.shipping ? `R$ ${comp.shipping.toFixed(2)}` : '-'}</td>
                                                    <td className="p-3 text-blue-400 font-bold">
                                                        R$ {(comp.price + (comp.shipping || 0)).toFixed(2)}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                                        Nenhum concorrente encontrado para este produto recentemente.
                                                        <br />
                                                        <Link href="/jobs" className="text-blue-400 hover:underline mt-2 inline-block">
                                                            Iniciar uma nova busca
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 glass-panel text-slate-500">
                            <DollarSign size={48} className="mb-4 opacity-20" />
                            <p>Selecione um produto para começar a análise de preços.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
