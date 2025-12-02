
import { chromium } from 'playwright'
import { getAIClient } from './ai'

export async function exploreProductLink(url: string, question?: string) {
    console.log(`Exploring link: ${url}`)
    let browser = null
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        const page = await browser.newPage()

        // Block images and fonts for speed
        await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2}', route => route.abort())

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

        // Extract main text content
        const content = await page.evaluate(() => {
            // Remove scripts, styles, etc
            const scripts = document.querySelectorAll('script, style, noscript, iframe, svg')
            scripts.forEach(s => s.remove())

            // Get text from body
            return document.body.innerText.slice(0, 10000) // Limit to 10k chars to fit context
        })

        await browser.close()
        browser = null

        // Use AI to answer the question or summarize
        const { client, model } = await getAIClient()

        const prompt = `
        I have scraped the content of a product page.
        
        User Question: "${question || 'Summarize the product details, technical specs, and seller info.'}"
        
        Page Content (truncated):
        ${content}
        
        Please answer the user's question based on the page content.
        `

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: model
        })

        return completion.choices[0].message.content

    } catch (error) {
        console.error('Error exploring link:', error)
        if (browser) await browser.close()
        return "Desculpe, não consegui acessar o link para extrair informações."
    }
}
