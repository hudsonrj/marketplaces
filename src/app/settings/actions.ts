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
