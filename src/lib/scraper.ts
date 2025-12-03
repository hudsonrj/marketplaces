import { prisma } from './prisma'
import { chromium } from 'playwright'
import { analyzeProductMatch, checkProductDuplication } from './ai'

// ... (imports)

export async function runScraper(jobId: string, productName: string) {
    console.log(`Starting scraper for job ${jobId} - Product: ${productName}`)
    let totalItems = 0

    try {
        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING' }
        })

        const product = await prisma.product.findFirst({
            where: { searchJobs: { some: { id: jobId } } }
        })

        const browser = await chromium.launch({
            headless: false,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        })

        const context = await browser.newContext({
            viewport: { width: 1366, height: 768 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo'
        })

        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        // Helper function for robust scrolling (Optimized for Speed)
        const autoScroll = async (page: any) => {
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 400; // Increased distance
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight || totalHeight > 25000) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 50); // Reduced interval
                });
            });
        };

        // Define scraper tasks
        const scrapeMercadoLivre = async () => {
            const page = await context.newPage()
            try {
                console.log('Navigating to Mercado Livre...')
                await page.goto('https://www.mercadolivre.com.br')
                await page.waitForTimeout(2000)
                await page.fill('input.nav-search-input', productName)
                await page.press('input.nav-search-input', 'Enter')

                try { await page.waitForSelector('.ui-search-layout', { timeout: 5000 }) } catch { }

                // Sort by Lowest Price
                try {
                    const currentUrl = page.url()
                    if (!currentUrl.includes('_OrderId_PRICE_ASC')) {
                        const sortTrigger = await page.$('button.ui-search-sort-filter__trigger, button.andes-dropdown__trigger')
                        if (sortTrigger) {
                            await sortTrigger.click()
                            await page.waitForTimeout(500)
                            const priceAscOption = await page.$('li.ui-search-sort-filter__item--price-asc a, a.andes-list__item-action[href*="price-asc"]')
                            if (priceAscOption) {
                                await priceAscOption.click()
                                await page.waitForTimeout(2000)
                            }
                        }
                    }
                } catch (e) { }

                await autoScroll(page)

                const mlResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('.ui-search-layout__item, .ui-search-result__wrapper, li.ui-search-layout__item')
                    const data: any[] = []
                    items.forEach((item) => {
                        if (data.length >= 50) return // Limit to 50 for speed
                        const title = item.querySelector('.ui-search-item__title, .poly-component__title')?.textContent?.trim()

                        let priceText = item.querySelector('.ui-search-price__part-without-discount .andes-money-amount__fraction')?.textContent
                        if (!priceText) priceText = item.querySelector('.andes-money-amount__fraction')?.textContent
                        if (!priceText) priceText = item.querySelector('.poly-price__current .andes-money-amount__fraction')?.textContent

                        const link = item.querySelector('a.ui-search-link, a.poly-component__title')?.getAttribute('href')
                        let image = item.querySelector('img.ui-search-result-image__element')?.getAttribute('src')
                        if (!image) image = item.querySelector('img.poly-component__picture')?.getAttribute('src')

                        let location = item.querySelector('.ui-search-item__location, .poly-component__location')?.textContent?.trim()
                        let seller = item.querySelector('.ui-search-official-store-label, .poly-component__seller')?.textContent?.trim()
                        if (seller && seller.startsWith('por ')) seller = seller.replace('por ', '')

                        if (title && priceText && link) {
                            data.push({
                                title,
                                price: parseFloat(priceText.replace('.', '').replace(',', '.')),
                                link,
                                image,
                                location,
                                seller,
                                marketplace: 'MERCADO_LIVRE'
                            })
                        }
                    })
                    return data
                })

                console.log(`Mercado Livre: Found ${mlResults.length} items`)
                return mlResults
            } catch (e) {
                console.error('Error scraping Mercado Livre:', e)
                return []
            } finally {
                await page.close()
            }
        }

        const scrapeAmazon = async () => {
            const page = await context.newPage()
            try {
                console.log('Navigating to Amazon...')
                const amazonSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(productName)}&s=price-asc-rank`
                await page.goto(amazonSearchUrl, { waitUntil: 'domcontentloaded' })
                await autoScroll(page)

                const amzResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('div[data-asin]:not([data-asin=""])')
                    const data: any[] = []
                    items.forEach((item) => {
                        if (data.length >= 50) return
                        const title = item.querySelector('h2 span, span.a-text-normal')?.textContent?.trim()
                        const priceWhole = item.querySelector('.a-price-whole')?.textContent
                        const priceFraction = item.querySelector('.a-price-fraction')?.textContent
                        const linkElement = item.querySelector('h2 a, a.a-link-normal')
                        const link = linkElement?.getAttribute('href')
                        const image = item.querySelector('.s-image')?.getAttribute('src')

                        if (title && priceWhole && link) {
                            const price = parseFloat(`${priceWhole.replace(/\./g, '').replace(',', '')}.${priceFraction || '00'}`)
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https://www.amazon.com.br${link}`,
                                image,
                                marketplace: 'AMAZON'
                            })
                        }
                    })
                    return data
                })

                console.log(`Amazon: Found ${amzResults.length} items`)
                return amzResults
            } catch (e) {
                console.error('Error scraping Amazon:', e)
                return []
            } finally {
                await page.close()
            }
        }

        const scrapeShopee = async () => {
            const page = await context.newPage()
            try {
                console.log('Navigating to Shopee...')
                // Simplified URL as requested by user to avoid login issues
                const shopeeSearchUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(productName)}`
                console.log('Shopee URL:', shopeeSearchUrl)

                await page.goto(shopeeSearchUrl, { waitUntil: 'domcontentloaded' })
                await page.waitForTimeout(3000) // Wait for dynamic content

                try {
                    const closePopup = await page.locator('.shopee-popup__close-btn').first()
                    if (await closePopup.isVisible()) await closePopup.click()
                } catch { }

                await autoScroll(page)

                const shopeeResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('.shopee-search-item-result__item')
                    const data: any[] = []
                    items.forEach((item) => {
                        if (data.length >= 50) return
                        const linkElement = item.querySelector('a')
                        const link = linkElement?.getAttribute('href')

                        let title = item.querySelector('div[data-sqe="name"] > div')?.textContent?.trim()
                        if (!title) title = linkElement?.textContent?.trim()

                        let priceText = item.querySelector('div[data-sqe="name"] + div')?.textContent
                        if (!priceText) priceText = Array.from(item.querySelectorAll('span')).find(el => el.textContent?.includes('R$'))?.textContent

                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.')
                            const price = parseFloat(cleanPrice)
                            if (!isNaN(price)) {
                                data.push({
                                    title,
                                    price,
                                    link: link.startsWith('http') ? link : `https://shopee.com.br${link}`,
                                    image,
                                    marketplace: 'SHOPEE'
                                })
                            }
                        }
                    })
                    return data
                })

                console.log(`Shopee: Found ${shopeeResults.length} items`)
                return shopeeResults
            } catch (e) {
                console.error('Error scraping Shopee:', e)
                return []
            } finally {
                await page.close()
            }
        }

        // Run all scrapers in parallel
        const [mlItems, amzItems, shopeeItems] = await Promise.all([
            scrapeMercadoLivre(),
            scrapeAmazon(),
            scrapeShopee()
        ])

        const allResults = [...mlItems, ...amzItems, ...shopeeItems]
        console.log(`Total raw items found: ${allResults.length}`)
        totalItems = allResults.length

        // Process results with AI (Parallelized batches)
        const allProcessedResults: any[] = []

        const processBatch = async (items: any[]) => {
            for (const res of items) {
                const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2)
                const titleLower = res.title.toLowerCase()
                if (!searchTerms.some(term => titleLower.includes(term))) continue

                const analysis = await analyzeProductMatch(
                    { name: productName, description: product?.description },
                    { title: res.title, price: res.price, link: res.link, rawLocation: res.location }
                )

                if (analysis.score > 50) {
                    allProcessedResults.push({
                        jobId,
                        marketplace: res.marketplace,
                        title: res.title,
                        price: res.price,
                        shipping: res.shipping || 0,
                        link: res.link,
                        imageUrl: res.image,
                        sellerName: res.seller,
                        matchScore: analysis.score,
                        matchReasoning: analysis.reasoning,
                        normalizedName: analysis.normalizedName,
                        city: analysis.city,
                        state: analysis.state
                    })
                }
            }
        }

        // Split processing into chunks to avoid overwhelming AI API
        const chunkSize = 10;
        for (let i = 0; i < allResults.length; i += chunkSize) {
            const chunk = allResults.slice(i, i + chunkSize);
            await processBatch(chunk);
        }

        await browser.close()

        // Single Transaction Write for ALL results (Fixes Database Locked issues)
        if (allProcessedResults.length > 0) {
            console.log(`Writing ${allProcessedResults.length} results to database...`)
            await prisma.$transaction(
                allProcessedResults.map(data => prisma.searchResult.create({ data }))
            )
        }

        // Calculate best price
        const bestResult = await prisma.searchResult.findFirst({
            where: { jobId: jobId, matchScore: { gt: 50 } },
            orderBy: { price: 'asc' }
        })

        if (bestResult) {
            await prisma.product.update({
                where: { id: product?.id },
                data: {
                    lastBestPrice: bestResult.price,
                    lastBestPriceDate: new Date()
                }
            })
        }

        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED' }
        })

        return totalItems

    } catch (error) {
        console.error('Fatal error in scraper:', error)
        await prisma.searchJob.update({ where: { id: jobId }, data: { status: 'FAILED' } })
        return 0
    }
}
