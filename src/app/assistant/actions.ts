'use server'

import { prisma } from '@/lib/prisma'
import { runScraper } from '@/lib/scraper'
import { getAIClient, checkProductDuplication } from '@/lib/ai'
import { exploreProductLink } from '@/lib/explorer'

export async function askAssistant(query: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
    try {
        const { client, model } = await getAIClient()

        // 1. Convert natural language to Prisma query intent using OpenAI
        const prompt = `
        You are a database assistant for a product marketplace monitoring system.
        The system has the following Prisma schema:
        
        model Product {
          id, name, description, costPrice, active, searchJobs[]
        }
        model SearchJob {
          id, productId, status, createdAt, results[]
        }
        model SearchResult {
          id, jobId, marketplace, title, price, link, matchScore, city, state, sellerName
        }

        Your goal is to return a JSON object that describes what data to fetch OR if a new search is needed.
        
        Supported intents:
        - "find_products": Filter products by name, active status, etc.
        - "find_results": Filter search results by price, marketplace, city, state, product name.
        - "count_results": Count results matching criteria.
        - "trigger_search": User wants to find prices for a product that might not be tracked yet, or wants a fresh search.
        - "explore_offer": User wants more details about a specific link or product offer mentioned in context.
        
        Return JSON format:
        {
            "intent": "find_results" | "find_products" | "count_results" | "trigger_search" | "explore_offer",
            "filters": {
                "productName": string (optional),
                "minPrice": number (optional),
                "maxPrice": number (optional),
                "marketplace": string (optional),
                "city": string (optional),
                "state": string (optional),
                "active": boolean (optional),
                "link": string (optional, for explore_offer)
            },
            "question": string (optional, for explore_offer, specific question about the link),
            "limit": number (optional, default 10)
        }
        `

        const messages: any[] = [
            { role: "system", content: prompt },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: "user", content: query }
        ]

        const completion = await client.chat.completions.create({
            messages: messages,
            model: model,
            response_format: { type: "json_object" }
        })

        const intent = JSON.parse(completion.choices[0].message.content || '{}')
        console.log('Assistant Intent:', intent)

        // 2. Execute query based on intent
        let data: any = null
        let message = ''

        if (intent.intent === 'explore_offer' && intent.filters?.link) {
            const result = await exploreProductLink(intent.filters.link, intent.question || query)
            message = result || 'Não foi possível analisar o link fornecido.'
        }
        else if (intent.intent === 'trigger_search') {
            const productName = intent.filters.productName || query

            // 1. Find potential duplicates using keyword search
            const keywords = productName.split(' ').filter((w: string) => w.length > 3).slice(0, 3)
            const potentialMatches = await prisma.product.findMany({
                where: {
                    OR: keywords.map((k: string) => ({ name: { contains: k } }))
                },
                select: { id: true, name: true }
            })

            let productId: string | null = null

            // 2. AI Duplication Check
            if (potentialMatches.length > 0) {
                const duplicationCheck = await checkProductDuplication(
                    { name: productName, description: '' },
                    potentialMatches
                )
                if (duplicationCheck.isDuplicate && duplicationCheck.existingProductId) {
                    productId = duplicationCheck.existingProductId
                    const existing = potentialMatches.find(p => p.id === productId)
                    message = `Encontrei um produto existente: "${existing?.name}". Iniciando nova busca para ele. `
                }
            }

            // 3. Create if not found
            if (!productId) {
                const product = await prisma.product.create({
                    data: {
                        name: productName,
                        costPrice: 0,
                        active: true
                    }
                })
                productId = product.id
                message = `Produto "${productName}" cadastrado com sucesso. `
            }

            // 4. Create Job
            const job = await prisma.searchJob.create({
                data: {
                    productId: productId!,
                    status: 'PENDING'
                }
            })

            // 5. Trigger Scraper (Async)
            try {
                // We don't await this fully to avoid blocking the UI, but we trigger it.
                runScraper(job.id, productName).catch((e: any) => console.error('Async scraper error:', e))
                message += `Iniciei uma busca. Isso pode levar alguns minutos. Você pode acompanhar em 'Jobs' ou aguardar.`
            } catch (e) {
                console.error('Failed to trigger scraper:', e)
                message += `Erro ao iniciar o scraper: ${e}`
            }

            return { message, data: null }
        }
        else if (intent.intent === 'find_products') {
            const where: any = {}
            if (intent.filters.productName) where.name = { contains: intent.filters.productName }
            if (intent.filters.active !== undefined) where.active = intent.filters.active

            data = await prisma.product.findMany({
                where,
                take: intent.limit || 10
            })
            message = `Encontrei ${data.length} produtos.`
        }
        else if (intent.intent === 'find_results') {
            const where: any = { matchScore: { gt: 50 } }
            if (intent.filters.minPrice) where.price = { gte: intent.filters.minPrice }
            if (intent.filters.maxPrice) where.price = { lte: intent.filters.maxPrice }
            if (intent.filters.marketplace) where.marketplace = { contains: intent.filters.marketplace.toUpperCase() }
            if (intent.filters.city) where.city = { contains: intent.filters.city }
            if (intent.filters.state) where.state = { contains: intent.filters.state }
            if (intent.filters.productName) {
                // Try to find product ID first to be more precise
                const products = await prisma.product.findMany({
                    where: { name: { contains: intent.filters.productName } },
                    select: { id: true }
                })
                const productIds = products.map(p => p.id)

                if (productIds.length > 0) {
                    // Find jobs for these products
                    const jobs = await prisma.searchJob.findMany({
                        where: { productId: { in: productIds } },
                        select: { id: true }
                    })
                    const jobIds = jobs.map(j => j.id)

                    if (jobIds.length > 0) {
                        where.jobId = { in: jobIds }
                    } else {
                        // Fallback: search by title if no jobs found for product
                        where.title = { contains: intent.filters.productName }
                    }
                } else {
                    where.title = { contains: intent.filters.productName }
                }
            }

            // Fallback: if no results found with high match score, try without it
            let results = await prisma.searchResult.findMany({
                where,
                orderBy: { price: 'asc' },
                take: intent.limit || 10,
                select: { title: true, price: true, marketplace: true, link: true, city: true, state: true }
            })

            if (results.length === 0 && where.matchScore) {
                delete where.matchScore
                results = await prisma.searchResult.findMany({
                    where,
                    orderBy: { price: 'asc' },
                    take: intent.limit || 10,
                    select: { title: true, price: true, marketplace: true, link: true, city: true, state: true }
                })
            }

            data = results
            message = `Encontrei ${data.length} ofertas.`
        }

        return { message, data }

    } catch (error) {
        console.error('Assistant Error Details:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
            console.error('Stack:', error.stack)
        }
        return { message: 'Desculpe, não consegui processar sua solicitação. Verifique o console para mais detalhes.', data: null }
    }
}
