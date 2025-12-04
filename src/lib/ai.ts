import OpenAI from 'openai'
import { prisma } from './prisma'

export async function getAIClient() {
    const settings = await prisma.settings.findFirst()

    const apiKey = settings?.aiApiKey || process.env.OPENAI_API_KEY || ''
    const baseURL =
        settings?.aiProvider === 'openrouter' ? 'https://openrouter.ai/api/v1' :
            settings?.aiProvider === 'groq' ? 'https://api.groq.com/openai/v1' :
                settings?.aiProvider === 'deepseek' ? 'https://api.deepseek.com/v1' :
                    undefined // Default OpenAI

    const model = settings?.aiModel || 'gpt-4o-mini'

    const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
        dangerouslyAllowBrowser: true
    })

    return { client, model }
}

export async function analyzeProductMatch(
    target: { name: string, description?: string | null },
    candidate: { title: string, price: number, link: string, rawLocation?: string | null },
    instructions?: string
): Promise<{
    score: number;
    reasoning: string;
    normalizedName: string;
    city: string | null;
    state: string | null;
    newProductCandidate?: {
        name: string;
        brand: string;
        category: string;
        description: string;
    } | null
}> {
    let retries = 3
    while (retries > 0) {
        try {
            const { client, model } = await getAIClient()

            const prompt = `
            Analyze the following product offer against the target product.
            
            Target Product: "${target.name}"
            Target Description: "${target.description || ''}"
            
            Candidate Offer:
            Title: "${candidate.title}"
            Price: ${candidate.price}
            Location Raw: "${candidate.rawLocation || ''}"

            ${instructions ? `ADDITIONAL INSTRUCTIONS FROM USER:\n"${instructions}"\n(Strictly follow these instructions when calculating the score)` : ''}
            
            Tasks:
            1. Calculate a match score (0-100) representing how likely this offer is for the EXACT target product.
            2. Extract a normalized product name (e.g., "iPhone 13 128GB Midnight").
            3. Extract the City and State (UF) from the Location Raw field if available. Use 2-letter code for State (e.g., SP, RJ).
            4. **CRITICAL**: If this candidate is a VALID, REAL product but DIFFERENT from the target (e.g., different model, different memory, different color, or an accessory), provide details to register it as a NEW product in our catalog.
               - Name: A clean, standardized name for this new product.
               - Brand: The brand of the product.
               - Category: A general category (e.g., "Smartphones", "Acessórios", "Eletrodomésticos").
               - Description: A brief description based on the title.
            
            Return ONLY a JSON object with this structure:
            {
                "score": number,
                "reasoning": "string",
                "normalizedName": "string",
                "city": "string" | null,
                "state": "string" | null,
                "newProductCandidate": {
                    "name": "string",
                    "brand": "string",
                    "category": "string",
                    "description": "string"
                } | null
            }
            `

            const completion = await client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: model,
                response_format: { type: "json_object" }
            })

            const content = completion.choices[0].message.content
            if (!content) throw new Error('Empty response from OpenAI')

            return JSON.parse(content)

        } catch (error) {
            console.error(`AI Analysis failed (Attempt ${4 - retries}/3):`, error)
            retries--
            if (retries === 0) {
                return { score: 0, reasoning: 'Error after retries', normalizedName: candidate.title, city: null, state: null }
            }
            // Wait 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000))
        }
    }
    return { score: 0, reasoning: 'Unexpected exit', normalizedName: candidate.title, city: null, state: null }
}

export async function checkProductDuplication(
    newProduct: { name: string, description: string },
    existingProducts: { id: string, name: string }[]
): Promise<{ isDuplicate: boolean, existingProductId?: string, reasoning: string }> {
    try {
        if (existingProducts.length === 0) return { isDuplicate: false, reasoning: 'No existing products to compare.' }

        const { client, model } = await getAIClient()

        const prompt = `
        I have a potential new product to register and a list of existing products in my database.
        I need to know if this new product is already registered (duplicate) or if it is truly new.
        
        New Product Candidate:
        Name: "${newProduct.name}"
        Description: "${newProduct.description}"
        
        Existing Products List:
        ${JSON.stringify(existingProducts.map(p => ({ id: p.id, name: p.name })))}
        
        Task:
        Compare the New Product Candidate against the Existing Products List.
        - Look for semantic equivalence (e.g., "iPhone 13 128GB" is the same as "Apple iPhone 13 128 GB").
        - Ignore minor differences in casing, spacing, or word order.
        - If you find a match, return true and the ID of the matching product.
        
        Return ONLY a JSON object:
        {
            "isDuplicate": boolean,
            "existingProductId": "string" | null,
            "reasoning": "string"
        }
        `

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model,
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error('Empty response from OpenAI')

        return JSON.parse(content)

    } catch (error) {
        console.error('Duplication check failed:', error)
        return { isDuplicate: false, reasoning: 'Error during check.' }
    }
}
