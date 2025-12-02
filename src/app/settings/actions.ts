'use server'

import { promises as fs } from 'fs'
import path from 'path'

export async function backupDatabase() {
    try {
        const dbPath = path.join(process.cwd(), 'prisma/dev.db')
        const backupDir = path.join(process.cwd(), 'backups')

        await fs.mkdir(backupDir, { recursive: true })

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = path.join(backupDir, `backup-${timestamp}.db`)

        await fs.copyFile(dbPath, backupPath)

        return { success: true, message: `Backup criado em: ${backupPath}` }
    } catch (error) {
        console.error('Backup failed:', error)
        return { success: false, message: 'Falha ao criar backup.' }
    }
}

export async function listBackups() {
    try {
        const backupDir = path.join(process.cwd(), 'backups')
        await fs.mkdir(backupDir, { recursive: true })

        const files = await fs.readdir(backupDir)
        return files.filter(f => f.endsWith('.db')).sort().reverse()
    } catch (error) {
        return []
    }
}

export async function restoreDatabase(filename: string) {
    try {
        const dbPath = path.join(process.cwd(), 'prisma/dev.db')
        const backupPath = path.join(process.cwd(), 'backups', filename)

        // Create a safety backup of current state before restoring
        await backupDatabase()

        await fs.copyFile(backupPath, dbPath)

        return { success: true, message: 'Banco de dados restaurado com sucesso.' }
    } catch (error) {
        console.error('Restore failed:', error)
        return { success: false, message: 'Falha ao restaurar backup.' }
    }
}

import { prisma } from '@/lib/prisma'

export async function getSettings() {
    try {
        const settings = await prisma.settings.findFirst()
        if (!settings) {
            return await prisma.settings.create({
                data: {
                    aiProvider: 'openai',
                    aiModel: 'gpt-4o-mini',
                    aiApiKey: ''
                }
            })
        }
        return settings
    } catch (error) {
        console.error('Failed to get settings:', error)
        return null
    }
}

export async function updateSettings(data: { aiProvider: string, aiModel: string, aiApiKey: string }) {
    try {
        const settings = await prisma.settings.findFirst()
        if (settings) {
            await prisma.settings.update({
                where: { id: settings.id },
                data
            })
        } else {
            await prisma.settings.create({ data })
        }
        return { success: true, message: 'Configurações salvas com sucesso.' }
    } catch (error) {
        console.error('Failed to update settings:', error)
        return { success: false, message: 'Erro ao salvar configurações.' }
    }
}
