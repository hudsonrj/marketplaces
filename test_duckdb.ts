import { getGlobalAnalyticsData } from './src/lib/duckdb'

async function testDuckDB() {
    try {
        console.log('Testing DuckDB Analytics...')
        const data = await getGlobalAnalyticsData()
        console.log('Analytics Data:', JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('DuckDB Error:', error)
    }
}

testDuckDB()
