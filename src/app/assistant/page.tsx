'use client'

import { useState } from 'react'
import { askAssistant } from './actions'
import { Send, Bot, User } from 'lucide-react'

export default function AssistantPage() {
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, data?: any }[]>([
        { role: 'assistant', content: 'Olá! Sou seu assistente virtual. Posso ajudar a encontrar produtos, analisar preços ou buscar ofertas específicas. O que você precisa?' }
    ])
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setLoading(true)

        try {
            // Filter out data property and map to simple history format
            const history = messages.map(m => ({ role: m.role, content: m.content }))
            const response = await askAssistant(userMsg, history)

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.message,
                data: response.data
            }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Ocorreu um erro ao processar sua mensagem.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Assistente Virtual
                </h1>
                <p style={{ color: '#94a3b8' }}>Converse com seus dados de forma natural.</p>
            </div>

            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '1rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: msg.role === 'assistant' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: msg.role === 'assistant' ? '#3b82f6' : '#10b981'
                            }}>
                                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                            <div style={{ maxWidth: '80%' }}>
                                <div style={{
                                    padding: '1rem', borderRadius: '12px',
                                    background: msg.role === 'assistant' ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.1)',
                                    color: msg.role === 'assistant' ? '#e2e8f0' : '#fff',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '0' : '12px',
                                    borderTopRightRadius: msg.role === 'user' ? '0' : '12px'
                                }}>
                                    {msg.content}
                                </div>
                                {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                                    <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.875rem' }}>
                                        {msg.data.map((item: any, i: number) => (
                                            <div key={i} style={{ padding: '0.5rem', borderBottom: i < msg.data.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                                <div style={{ fontWeight: '600', color: '#fff' }}>{item.title || item.name}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                    <span>{item.marketplace || 'Produto'}</span>
                                                    {item.price && <span style={{ color: '#10b981' }}>R$ {Number(item.price).toFixed(2)}</span>}
                                                </div>
                                                {item.link && <a href={item.link} target="_blank" style={{ color: '#3b82f6', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>Ver Oferta</a>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bot size={18} color="#3b82f6" />
                            </div>
                            <div style={{ padding: '1rem', color: '#94a3b8' }}>Digitando...</div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ex: Encontre iPhones abaixo de R$ 5000 em São Paulo..."
                        style={{
                            flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '0.75rem', color: 'white', outline: 'none'
                        }}
                    />
                    <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '0.75rem', borderRadius: '8px' }}>
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    )
}
