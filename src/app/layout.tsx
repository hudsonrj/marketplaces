import './globals.css'
import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'MarketAI - Inteligência de Mercado',
  description: 'Plataforma avançada de monitoramento de preços e concorrentes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{
            flex: 1,
            marginLeft: '260px',
            padding: '2rem',
            background: 'radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%)',
            minHeight: '100vh'
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
