'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, ShoppingBag, Search, Settings, BarChart3, Zap, Bot } from 'lucide-react'
import { motion } from 'framer-motion'

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: ShoppingBag, label: 'Produtos', href: '/products' },
    { icon: Search, label: 'Jobs de Busca', href: '/jobs' },
    { icon: Zap, label: 'Busca em Massa', href: '/bulk-search' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: Bot, label: 'Assistente', href: '/assistant' },
    { icon: Settings, label: 'Configurações', href: '/settings' },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-r-[rgba(255,255,255,0.05)] flex flex-col z-50"
            style={{
                width: '260px',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem'
            }}
        >
            <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '40px', height: '40px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                }}>
                    <Zap color="white" size={24} fill="white" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    MarketAI
                </h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '10px',
                                    color: isActive ? 'white' : '#94a3b8',
                                    background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent)' : 'transparent',
                                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'white'
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = '#94a3b8'
                                        e.currentTarget.style.background = 'transparent'
                                    }
                                }}
                            >
                                <item.icon size={20} />
                                <span style={{ fontWeight: 500 }}>{item.label}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>STATUS DO SISTEMA</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                    Operacional
                </div>
            </div>
        </motion.aside>
    )
}
