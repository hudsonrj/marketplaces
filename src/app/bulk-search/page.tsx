
import { prisma } from '@/lib/prisma'
import BulkSearchForm from '@/components/BulkSearchForm'
import { Zap, Box, Layers } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BulkSearchPage() {
    // Fetch active product count
    const productCount = await prisma.product.count({
        where: { active: true }
    })

    return (
        <div className="min-h-screen pb-20">
            {/* Background Ambient Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
                <header className="mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/5">
                                    <Layers size={24} className="text-blue-400" />
                                </div>
                                <span className="text-blue-400 font-medium tracking-wide text-sm uppercase">Centro de Comando</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                                Busca em Massa
                            </h1>
                            <p className="text-lg text-slate-400 max-w-2xl">
                                Orquestre múltiplos agentes autônomos para varrer o mercado em busca de dados atualizados.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Status do Catálogo</span>
                                <div className="flex items-center gap-2 text-white font-mono">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xl font-bold">{productCount}</span>
                                    <span className="text-slate-500">Ativos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <BulkSearchForm productCount={productCount} />
            </div>
        </div>
    )
}
