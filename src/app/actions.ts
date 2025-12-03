'use server'
import { getAIClient } from '@/lib/ai'
import { prisma } from '@/lib/prisma'
import { runScraper } from '@/lib/scraper'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const weight = parseFloat(formData.get('weight') as string)
    const originCep = formData.get('originCep') as string

    await prisma.product.create({
        data: {
            name,
            description,
            costPrice,
            weight,
            originCep,
        },
    })

    revalidatePath('/products')
    redirect('/products')
}

export async function updateProduct(formData: FormData) {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const weight = parseFloat(formData.get('weight') as string)
    const dimensions = formData.get('dimensions') as string
    const originCep = formData.get('originCep') as string

    await prisma.product.update({
        where: { id },
        data: {
            name,
            description,
            costPrice,
            weight,
            dimensions,
            originCep,
        },
    })

    revalidatePath('/products')
    redirect('/products')
}

export async function toggleProductActive(id: string, active: boolean) {
    await prisma.product.update({
        where: { id },
        data: { active }
    })
    revalidatePath('/products')
}

export async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function createSearchJob(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const job = await prisma.searchJob.create({
        data: {
            productId,
            status: 'PENDING',
        }
    })

    // Trigger async agent (fire and forget)
    // In production, this should be a queue (BullMQ/Redis)
    // For local dev, we just let it run in background
    setTimeout(() => {
        runScraper(job.id, product.name).catch(console.error)
    }, 100)

    revalidatePath('/jobs')
    redirect('/jobs')
}

export async function getJobs() {
    return await prisma.searchJob.findMany({
        include: {
            product: true,
            results: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function askAssistant(history: { role: 'user' | 'assistant', content: string }[]) {
    try {
        const { client, model } = await getAIClient()

        const tools = [
            {
                type: "function" as const,
                function: {
                    name: "search_product_prices",
                    description: "Search for product prices. First checks the local database. If not found, it can trigger a web scrape ONLY if forceUpdate is true.",
                    parameters: {
                        type: "object",
                        properties: {
                            productName: { type: "string", description: "The name of the product to search for" },
                            forceUpdate: { type: "boolean", description: "Set to true ONLY if the user explicitly asks to 'search online', 'create a job', 'update', or confirms a search after a 'not found' message." }
                        },
                        required: ["productName"]
                    }
                }
            },
            {
                type: "function" as const,
                function: {
                    name: "navigate_to_page",
                    description: "Generate a link to a specific page in the application or an external URL.",
                    parameters: {
                        type: "object",
                        properties: {
                            destination: { type: "string", enum: ["products", "jobs", "analytics", "external"], description: "Internal page or external URL" },
                            url: { type: "string", description: "The URL if destination is external" }
                        },
                        required: ["destination"]
                    }
                }
            }
        ]

        // Convert history to OpenAI format
        const conversation = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }))

        const messages = [
            { role: "system" as const, content: "You are a helpful Marketplace Assistant. \n\nRULES:\n1. When asked for a product price, use 'search_product_prices'.\n2. If the tool returns a database result, show it to the user.\n3. If the tool says 'Not found', ask the user if they want to start an online search (job).\n4. If the user confirms, call 'search_product_prices' with forceUpdate=true.\n5. Use 'navigate_to_page' only when the user specifically asks to go to a page or to see details.\n6. Answer in Portuguese." },
            ...conversation
        ]

        const response = await client.chat.completions.create({
            model: model,
            messages: messages,
            tools: tools,
            tool_choice: "auto"
        })

        const responseMessage = response.choices[0].message

        if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls as any[]) {
                if (toolCall.function.name === "navigate_to_page") {
                    const args = JSON.parse(toolCall.function.arguments)
                    if (args.destination === 'products') return "Claro! Acesse a lista de produtos aqui: [Ir para Produtos](/products)"
                    if (args.destination === 'jobs') return "Você pode ver os status das buscas aqui: [Ir para Jobs](/jobs)"
                    if (args.destination === 'analytics') return "Veja as análises detalhadas aqui: [Ir para Analytics](/analytics)"
                    if (args.destination === 'external') return `Abrindo página solicitada: [Acessar Link](${args.url})`
                }

                if (toolCall.function.name === "search_product_prices") {
                    const args = JSON.parse(toolCall.function.arguments)

                    // 1. Check Database FIRST
                    let product = await prisma.product.findFirst({
                        where: {
                            name: { contains: args.productName }
                        }
                    })

                    // Verify match quality
                    if (product && Math.abs(product.name.length - args.productName.length) > 15) {
                        product = null // Too different, treat as new
                    }

                    // If found and NOT forced update, return DB data
                    if (product && !args.forceUpdate) {
                        const price = product.lastBestPrice ? `R$ ${Number(product.lastBestPrice).toFixed(2)}` : "Preço não disponível"
                        return `Encontrei este produto no seu catálogo:\n\n**${product.name}**\nPreço Atual: **${price}**\nCategoria: ${product.category || '-'}\n\n[Ver Detalhes](/products/${product.id}/analytics)\n\nSe quiser atualizar este preço, me peça para "atualizar o preço de ${product.name}".`
                    }

                    // If not found and NOT forced update, ASK USER
                    if (!product && !args.forceUpdate) {
                        return `Não encontrei o produto **"${args.productName}"** no seu banco de dados.\n\nDeseja que eu inicie uma busca online (Job) para encontrar preços deste produto?`
                    }

                    // If we are here, it means forceUpdate is TRUE, or product exists and we are updating.
                    // If product doesn't exist but forceUpdate is true, create it.
                    if (!product) {
                        // Create a temporary product for this ad-hoc search
                        product = await prisma.product.create({
                            data: {
                                name: args.productName,
                                description: "Busca via Assistente",
                                costPrice: 0,
                                active: true
                            }
                        })
                    }

                    // Proceed with Scraper
                    const job = await prisma.searchJob.create({
                        data: { productId: product.id, status: 'PENDING' }
                    })

                    // Run scraper
                    try {
                        const scraperPromise = runScraper(job.id, args.productName)
                        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))

                        await Promise.race([scraperPromise, timeoutPromise])

                        const bestResult = await prisma.searchResult.findFirst({
                            where: { jobId: job.id, matchScore: { gt: 50 } },
                            orderBy: { price: 'asc' }
                        })

                        if (bestResult) {
                            return `Busca finalizada! O menor preço encontrado para **"${args.productName}"** foi **R$ ${Number(bestResult.price).toFixed(2)}** no **${bestResult.marketplace}**.\n\n[Ver oferta](${bestResult.link})`
                        } else {
                            return `Finalizei a busca, mas não encontrei ofertas exatas para "${args.productName}" agora.`
                        }

                    } catch (error) {
                        return `Iniciei a atualização de preço para **"${args.productName}"**. Isso pode levar alguns instantes.\n\nAcompanhe em: [Jobs](/jobs)`
                    }
                }
            }
        }

        return responseMessage.content || "Não entendi, pode repetir?"

    } catch (error) {
        console.error('Assistant Error:', error)
        return "Desculpe, ocorreu um erro ao processar sua mensagem."
    }
}
