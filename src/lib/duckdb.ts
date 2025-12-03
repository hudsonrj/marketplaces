import { Database } from 'duckdb'

export async function queryDuckDB(query: string, params: any[] = []) {
    return new Promise<any[]>((resolve, reject) => {
        const db = new Database(':memory:')
        const connStr = process.env.DATABASE_URL || ''

        db.serialize(() => {
            db.run("INSTALL postgres;")
            db.run("LOAD postgres;")
            db.run(`ATTACH '${connStr}' AS db (TYPE POSTGRES);`, (err) => {
                if (err) return reject(err)

                // Replace 'mongo' with 'db.marketplaces' and ensure table names are quoted if needed
                // But the user passes raw query. This helper might be risky if query assumes SQLite syntax or 'mongo' alias.
                // We should probably deprecate this generic helper or update it to be smart.
                // For now, let's assume the caller will be updated or we fix the query here.
                // Actually, this helper is not used in the provided snippets, only the specific functions below.

                db.all(query, params, (err, rows) => {
                    if (err) reject(err)
                    else resolve(rows)
                })
            })
        })
    })
}

export async function getProductPriceHistory(productId: string) {
    return new Promise<any[]>((resolve, reject) => {
        const db = new Database(':memory:')
        const connStr = process.env.DATABASE_URL || ''

        db.serialize(() => {
            db.run("INSTALL postgres;")
            db.run("LOAD postgres;")
            db.run(`ATTACH '${connStr}' AS db (TYPE POSTGRES);`, (err) => {
                if (err) {
                    console.error('DuckDB Attach Error:', err)
                    return reject(err)
                }

                db.all(`
                    SELECT 
                        j.created_at as date,
                        MIN(r.price) as min,
                        AVG(r.price) as avg
                    FROM db.marketplaces."SearchResult" r
                    JOIN db.marketplaces."SearchJob" j ON r.job_id = j.id
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
    })
}

export async function getGlobalAnalyticsData(productId?: string) {
    return new Promise<{
        marketShare: any[],
        priceByMarketplace: any[],
        topSellers: any[]
    }>((resolve, reject) => {
        const db = new Database(':memory:')
        const connStr = process.env.DATABASE_URL || ''

        db.serialize(() => {
            db.run("INSTALL postgres;")
            db.run("LOAD postgres;")
            db.run(`ATTACH '${connStr}' AS db (TYPE POSTGRES);`, (err) => {
                if (err) return reject(err)

                const filterClause = productId ? `AND job_id IN (SELECT id FROM db.marketplaces."SearchJob" WHERE product_id = '${productId}')` : ''

                const queries = {
                    marketShare: `
                        SELECT marketplace, COUNT(*) as count 
                        FROM db.marketplaces."SearchResult" 
                        WHERE match_score > 50 ${filterClause}
                        GROUP BY marketplace
                    `,
                    priceByMarketplace: `
                        SELECT marketplace, AVG(price) as avg_price 
                        FROM db.marketplaces."SearchResult" 
                        WHERE match_score > 50 ${filterClause}
                        GROUP BY marketplace
                    `,
                    topSellers: `
                        SELECT seller_name, COUNT(*) as count 
                        FROM db.marketplaces."SearchResult" 
                        WHERE match_score > 50 AND seller_name IS NOT NULL ${filterClause}
                        GROUP BY seller_name 
                        ORDER BY count DESC 
                        LIMIT 10
                    `
                }

                const results: any = {}
                let completed = 0
                const totalQueries = 3

                const checkDone = () => {
                    completed++
                    if (completed === totalQueries) resolve(results)
                }

                db.all(queries.marketShare, (err, rows) => {
                    if (err) return reject(err)
                    results.marketShare = rows
                    checkDone()
                })

                db.all(queries.priceByMarketplace, (err, rows) => {
                    if (err) return reject(err)
                    results.priceByMarketplace = rows
                    checkDone()
                })

                db.all(queries.topSellers, (err, rows) => {
                    if (err) return reject(err)
                    results.topSellers = rows
                    checkDone()
                })
            })
        })
    })
}
