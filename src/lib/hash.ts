import crypto from 'crypto'

export function generateProductHash(targetName: string, candidateTitle: string): string {
    // Normalize to ignore case and extra spaces
    const t = targetName.toLowerCase().trim().replace(/\s+/g, ' ')
    const c = candidateTitle.toLowerCase().trim().replace(/\s+/g, ' ')
    const data = `${t}|${c}`
    return crypto.createHash('md5').update(data).digest('hex')
}
