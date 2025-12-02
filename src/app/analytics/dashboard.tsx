'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { motion } from "framer-motion"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface GlobalAnalyticsDashboardProps {
    marketShare: { marketplace: string, count: number }[]
    priceByMarketplace: { marketplace: string, avg_price: number }[]
    topSellers: { seller_name: string, count: number }[]
}

export default function GlobalAnalyticsDashboard({ marketShare, priceByMarketplace, topSellers }: GlobalAnalyticsDashboardProps) {

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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Share */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-6"
            >
                <h3 className="text-lg font-semibold mb-4 text-white">Market Share (Volume de Ofertas)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={marketShareData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {marketShareData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Average Price by Marketplace */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-panel p-6"
            >
                <h3 className="text-lg font-semibold mb-4 text-white">Preço Médio por Marketplace</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priceData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Preço Médio']}
                            />
                            <Bar dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Top Sellers */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-panel p-6 md:col-span-2"
            >
                <h3 className="text-lg font-semibold mb-4 text-white">Top Competidores (Mais Ofertas)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sellerData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={150} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            />
                            <Bar dataKey="offers" fill="#10b981" radius={[0, 4, 4, 0]} name="Ofertas Encontradas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    )
}
