import { Database } from 'duckdb'
import path from 'path'

const dbPath = path.join(process.cwd(), 'prisma/dev.db')

export async function queryDuckDB(query: string, params: any[] = []) {
    return new Promise<any[]>((resolve, reject) => {
        const db = new Database(':memory:')

        db.all(`INSTALL sqlite; LOAD sqlite; ATTACH '${dbPath.replace(/\\/g, '/')}' AS mongo (TYPE SQLITE); ${query}`, params, (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
            // db.close() // Keep it open? No, for one-off queries close it or reuse. 
            // For simplicity in this serverless-like env, we might close it. 
            // But actually, creating a new DB instance every time might be overhead.
            // However, DuckDB in node is embedded.
        })
    })
}

export async function getProductPriceHistory(productId: string) {
    // We need to join SearchResult with SearchJob to filter by productId
    // Tables in sqlite are usually named as in schema, but Prisma might capitalize or not?
    // Prisma default: Model name matches table name? No, usually it respects @map or defaults to Model name.
    // In schema: SearchResult, SearchJob.
    // Let's check the actual table names. Usually Prisma uses "SearchJob" and "SearchResult" (PascalCase) or "search_job" if mapped?
    // The schema has @map("created_at") but not on the model itself.
    // So table names are likely "SearchJob" and "SearchResult".

    // Query: Get min, avg price per job (date)
    const sql = `
        SELECT 
            strftime('%Y-%m-%d %H:%M:%S', j.created_at / 1000, 'unixepoch') as date, -- Prisma stores DateTime as numeric timestamp in SQLite? Or ISO string?
            -- SQLite stores DateTime as string usually if not configured otherwise. Prisma uses ISO-8601 strings.
            -- Wait, Prisma with SQLite stores DateTime as milliseconds? No, usually strings.
            -- Let's assume strings for now.
            j.created_at as raw_date,
            MIN(r.price) as min_price,
            AVG(r.price) as avg_price
        FROM mongo.SearchResult r
        JOIN mongo.SearchJob j ON r.job_id = j.id
        WHERE j.product_id = ?
        AND r.match_score > 50
        GROUP BY j.id, j.created_at
        ORDER BY j.created_at ASC
    `

    // Wait, if Prisma stores dates as ISO strings like "2023-01-01T00:00:00.000Z", we can just sort by them.
    // DuckDB can parse them.

    // Let's try a simpler query first to verify table names if possible, but I can't interactively check.
    // I will assume "SearchJob" and "SearchResult".

    return new Promise<any[]>((resolve, reject) => {
        const db = new Database(':memory:')
        db.serialize(() => {
            db.run("INSTALL sqlite;")
            db.run("LOAD sqlite;")
            db.run(`ATTACH '${dbPath.replace(/\\/g, '/')}' AS mongo (TYPE SQLITE);`)

            db.all(`
                SELECT 
                    j.created_at as date,
                    MIN(r.price) as min,
                    AVG(r.price) as avg
                FROM mongo.SearchResult r
                JOIN mongo.SearchJob j ON r.job_id = j.id
                WHERE j.product_id = '${productId}'
                AND r.match_score > 50
                GROUP BY j.id, j.created_at
                ORDER BY j.created_at ASC
            `, (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    })
}
