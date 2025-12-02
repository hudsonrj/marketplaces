import { Save, Bell, Shield, Key } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Configurações
                </h1>
                <p style={{ color: '#94a3b8' }}>Gerencie suas preferências e chaves de API.</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>

                {/* API Keys Section */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)' }}>
                            <Key size={20} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Chaves de API</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>OpenAI API Key</label>
                            <input type="password" value="sk-................................" className="input-field" readOnly />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Usada para análise de relevância de produtos.</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Groq API Key</label>
                            <input type="password" value="gsk_................................" className="input-field" readOnly />
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <Bell size={20} color="#f59e0b" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Notificações</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                            <span style={{ color: '#cbd5e1' }}>Alertar quando o preço cair mais de 10%</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                            <span style={{ color: '#cbd5e1' }}>Receber resumo diário por e-mail</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                            <span style={{ color: '#cbd5e1' }}>Notificar falhas em jobs de busca</span>
                        </label>
                    </div>
                </div>

                {/* System Section */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)' }}>
                            <Shield size={20} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Sistema</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>Intervalo de Scraper (ms)</label>
                            <input type="number" defaultValue={60000} className="input-field" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1' }}>User Agent</label>
                            <input type="text" defaultValue="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..." className="input-field" />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary">
                        <Save size={18} />
                        Salvar Alterações
                    </button>
                </div>

            </div>
        </div>
    )
}
