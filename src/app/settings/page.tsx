'use client'

import { useState, useEffect } from 'react'
import { backupDatabase, listBackups, restoreDatabase, getSettings, updateSettings } from './actions'
import { Save, RotateCcw, Database, Check, AlertTriangle, Bot } from 'lucide-react'

export default function SettingsPage() {
    const [backups, setBackups] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // AI Settings State
    const [aiSettings, setAiSettings] = useState({
        aiProvider: 'openai',
        aiModel: 'gpt-4o-mini',
        aiApiKey: ''
    })

    useEffect(() => {
        loadBackups()
        loadSettings()
    }, [])

    const loadSettings = async () => {
        const settings = await getSettings()
        if (settings) {
            setAiSettings({
                aiProvider: settings.aiProvider,
                aiModel: settings.aiModel,
                aiApiKey: settings.aiApiKey
            })
        }
    }

    const loadBackups = async () => {
        const list = await listBackups()
        setBackups(list)
    }

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const res = await updateSettings(aiSettings)
        if (res.success) {
            setMessage({ type: 'success', text: res.message })
        } else {
            setMessage({ type: 'error', text: res.message })
        }
        setLoading(false)
    }

    const handleBackup = async () => {
        setLoading(true)
        setMessage(null)
        const res = await backupDatabase()
        if (res.success) {
            setMessage({ type: 'success', text: res.message })
            await loadBackups()
        } else {
            setMessage({ type: 'error', text: res.message })
        }
        setLoading(false)
    }

    const handleRestore = async (filename: string) => {
        if (!confirm('Tem certeza? O banco atual será substituído (um backup de segurança será criado antes).')) return

        setLoading(true)
        setMessage(null)
        const res = await restoreDatabase(filename)
        if (res.success) {
            setMessage({ type: 'success', text: res.message })
            window.location.reload()
        } else {
            setMessage({ type: 'error', text: res.message })
        }
        setLoading(false)
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Configurações
                </h1>
                <p style={{ color: '#94a3b8' }}>Gerencie o sistema e seus dados.</p>
            </div>

            {message && (
                <div style={{
                    padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                    {message.text}
                </div>
            )}

            {/* AI Settings Section */}
            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)' }}>
                        <Bot size={24} color="#8b5cf6" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>Inteligência Artificial</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Configure o provedor de IA para o assistente e análises.</p>
                    </div>
                </div>

                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Provedor</label>
                        <select
                            value={aiSettings.aiProvider}
                            onChange={e => setAiSettings({ ...aiSettings, aiProvider: e.target.value })}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', outline: 'none'
                            }}
                        >
                            <option value="openai">OpenAI</option>
                            <option value="groq">Groq</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="deepseek">DeepSeek</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Modelo</label>
                        <input
                            type="text"
                            value={aiSettings.aiModel}
                            onChange={e => setAiSettings({ ...aiSettings, aiModel: e.target.value })}
                            placeholder="Ex: gpt-4o-mini, llama3-70b-8192"
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem', fontSize: '0.875rem' }}>API Key</label>
                        <input
                            type="password"
                            value={aiSettings.aiApiKey}
                            onChange={e => setAiSettings({ ...aiSettings, aiApiKey: e.target.value })}
                            placeholder="sk-..."
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '8px',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white', outline: 'none'
                            }}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-end' }}>
                        <Save size={18} />
                        Salvar Configurações
                    </button>
                </form>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Database size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>Backup & Restore</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Gerencie cópias de segurança do banco de dados SQLite.</p>
                    </div>
                </div>

                <button
                    onClick={handleBackup}
                    disabled={loading}
                    className="btn-primary"
                    style={{ width: '100%', marginBottom: '2rem', justifyContent: 'center' }}
                >
                    <Save size={18} />
                    Criar Novo Backup Agora
                </button>

                <h4 style={{ color: '#fff', fontWeight: '600', marginBottom: '1rem' }}>Backups Disponíveis</h4>

                {backups.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>Nenhum backup encontrado.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {backups.map(file => (
                            <div key={file} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px'
                            }}>
                                <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{file}</span>
                                <button
                                    onClick={() => handleRestore(file)}
                                    disabled={loading}
                                    className="btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', gap: '0.5rem' }}
                                    title="Restaurar este backup"
                                >
                                    <RotateCcw size={14} />
                                    Restaurar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
