
'use client'

import { startBulkSearch } from '@/app/actions'
import { useState } from 'react'
import { Search, Check, ArrowRight, Loader2, ShoppingBag, Info } from 'lucide-react'
import { motion } from 'framer-motion'

interface BulkSearchFormProps {
    productCount: number
}

export default function BulkSearchForm({ productCount }: BulkSearchFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>(['MERCADO_LIVRE', 'AMAZON', 'SHOPEE'])

    const toggleMarketplace = (value: string) => {
        if (selectedMarketplaces.includes(value)) {
            setSelectedMarketplaces(selectedMarketplaces.filter(m => m !== value))
        } else {
            setSelectedMarketplaces([...selectedMarketplaces, value])
        }
    }

    const handleSubmit = async (formData: FormData) => {
        if (selectedMarketplaces.length === 0) return
        setIsSubmitting(true)
        selectedMarketplaces.forEach(mp => formData.append('marketplaces', mp))
        await startBulkSearch(formData)
        setIsSubmitting(false)
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-2xl"
            >
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <Check size={32} />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-3">Processamento Iniciado</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    Sua solicitação foi enviada para a fila de processamento. <br />
                    Os agentes estão analisando <strong>{productCount} produtos</strong> em segundo plano.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <a href="/jobs" className="px-6 py-2.5 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors text-sm">
                        Ver Fila de Jobs
                    </a>
                    <a href="/products" className="px-6 py-2.5 text-slate-300 hover:text-white transition-colors text-sm font-medium">
                        Voltar para Produtos
                    </a>
                </div>
            </motion.div>
        )
    }

    return (
        <form action={handleSubmit} className="max-w-3xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">

                {/* Section 1: Marketplaces */}
                <div className="p-8 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-white mb-1">Fontes de Dados</h3>
                            <p className="text-sm text-slate-400">Selecione onde os agentes devem buscar informações.</p>
                        </div>
                        <span className="text-xs font-medium bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                            {selectedMarketplaces.length} selecionados
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { id: 'ml', value: 'MERCADO_LIVRE', label: 'Mercado Livre' },
                            { id: 'amz', value: 'AMAZON', label: 'Amazon' },
                            { id: 'shp', value: 'SHOPEE', label: 'Shopee' },
                            { id: 'mgl', value: 'MAGALU', label: 'Magalu' },
                            { id: 'ali', value: 'ALIEXPRESS', label: 'AliExpress' },
                            { id: 'cba', value: 'CASAS_BAHIA', label: 'Casas Bahia' }
                        ].map((m) => {
                            const isSelected = selectedMarketplaces.includes(m.value)
                            return (
                                <div
                                    key={m.id}
                                    onClick={() => toggleMarketplace(m.value)}
                                    className={`
                                        group relative cursor-pointer rounded-xl border p-4 transition-all duration-200
                                        ${isSelected
                                            ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_0_1px_rgba(59,130,246,0.5)]'
                                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <ShoppingBag size={18} className={isSelected ? 'text-blue-400' : 'text-slate-500'} />
                                        {isSelected && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-100' : 'text-slate-300 group-hover:text-white'}`}>
                                        {m.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Section 2: Instructions */}
                <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-medium text-white">Instruções de Refinamento</h3>
                        <div className="group relative">
                            <Info size={16} className="text-slate-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                A IA usará estas instruções para filtrar resultados irrelevantes ou priorizar certas características.
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <textarea
                            name="instructions"
                            placeholder="Ex: Ignorar produtos usados. Considerar apenas voltagem 220v. Priorizar vendedores oficiais."
                            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none"
                        />
                        <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 uppercase tracking-wider font-medium">
                            AI Context
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Estimativa: <span className="text-slate-300">~{Math.ceil(productCount * 0.5)} min</span>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || selectedMarketplaces.length === 0}
                        className="
                            inline-flex items-center gap-2 px-6 py-2.5 
                            bg-white text-slate-950 rounded-lg font-semibold text-sm
                            hover:bg-slate-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all shadow-lg shadow-white/5
                        "
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Iniciando...
                            </>
                        ) : (
                            <>
                                Iniciar Busca
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    )
}
