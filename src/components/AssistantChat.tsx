'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react'
import { askAssistant } from '@/app/actions'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

export default function AssistantChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Sou seu assistente de marketplace. Posso ajudar a buscar preços, analisar produtos ou tirar dúvidas sobre o sistema.' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const newHistory = [...messages, { role: 'user' as const, content: userMsg }]
            const response = await askAssistant(newHistory)
            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um erro ao processar sua solicitação.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '6.5rem',
                    right: '2rem',
                    width: '380px',
                    height: '500px',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <div style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6'
                        }}>
                            <Bot size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'white', margin: 0 }}>Assistente IA</h3>
                            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Online</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        padding: '1rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                borderBottomRightRadius: msg.role === 'user' ? '0.25rem' : '1rem',
                                borderBottomLeftRadius: msg.role === 'assistant' ? '0.25rem' : '1rem',
                                background: msg.role === 'user' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                color: msg.role === 'user' ? 'white' : '#e2e8f0',
                                fontSize: '0.9rem',
                                lineHeight: '1.4',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.content.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                    const match = part.match(/\[(.*?)\]\((.*?)\)/)
                                    if (match) {
                                        return (
                                            <a
                                                key={i}
                                                href={match[2]}
                                                target={match[2].startsWith('/') ? '_self' : '_blank'}
                                                rel="noopener noreferrer"
                                                style={{ color: msg.role === 'user' ? 'white' : '#3b82f6', textDecoration: 'underline', fontWeight: '500' }}
                                            >
                                                {match[1]}
                                            </a>
                                        )
                                    }
                                    return part
                                })}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', color: '#94a3b8' }}>
                                <Loader2 size={16} className="animate-spin" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} style={{
                        padding: '1rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        gap: '0.5rem'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                width: '2.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}
