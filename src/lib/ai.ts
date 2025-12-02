import OpenAI from 'openai'


const openai = new OpenAI({
    apiKey: 'sk-hcs-account-y3YVsqfqyNSBM9rRl72yT3BlbkFJB4PKHd3DxOMe1grQS1cp', // User provided key
    dangerouslyAllowBrowser: true // Only if running on client, but this is server side usually
})

export async function analyzeProductMatch(
    target: { name: string, description?: string | null },
    candidate: { title: string, price: number, link: string, rawLocation?: string | null }
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


    try {
        const prompt = `
        Analyze the following product offer against the target product.
        
        Target Product: "${target.name}"
        Target Description: "${target.description || ''}"
        
        Candidate Offer:
        Title: "${candidate.title}"
        Price: ${candidate.price}
        Location Raw: "${candidate.rawLocation || ''}"
        
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

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini",
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error('Empty response from OpenAI')

        return JSON.parse(content)

    } catch (error) {
        console.error('AI Analysis failed:', error)
        return { score: 0, reasoning: 'Error', normalizedName: candidate.title, city: null, state: null }
    }
}
