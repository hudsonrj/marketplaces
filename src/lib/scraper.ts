import { PrismaClient } from '@prisma/client'
import { chromium } from 'playwright'
import { analyzeProductMatch } from './ai'

const prisma = new PrismaClient()

export async function runScraper(jobId: string, productName: string) {
    console.log(`Starting scraper for job ${jobId} - Product: ${productName}`)

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
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        });

        const page = await context.newPage()

        // Helper function for robust scrolling
        const autoScroll = async (page: any) => {
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        // Scroll until we reach the bottom or a maximum limit (e.g., 25000px for ~100 items)
                        if (totalHeight >= scrollHeight || totalHeight > 25000) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100); // Slower scroll to allow lazy loading
                });
            });
        };

        // Mercado Livre Scraper
        try {
            console.log('Navigating to Mercado Livre...')
            await page.goto('https://www.mercadolivre.com.br')
            await page.waitForTimeout(3000)
            await page.fill('input.nav-search-input', productName)
            await page.waitForTimeout(1000)
            await page.press('input.nav-search-input', 'Enter')

            try { await page.waitForSelector('.ui-search-layout', { timeout: 10000 }) } catch { }

            // Sort by Lowest Price
            try {
                const currentUrl = page.url()
                if (!currentUrl.includes('_OrderId_PRICE_ASC')) {
                    const sortTrigger = await page.$('button.ui-search-sort-filter__trigger, button.andes-dropdown__trigger')
                    if (sortTrigger) {
                        await sortTrigger.click()
                        await page.waitForTimeout(1000)
                        const priceAscOption = await page.$('li.ui-search-sort-filter__item--price-asc a, a.andes-list__item-action[href*="price-asc"]')
                        if (priceAscOption) {
                            await priceAscOption.click()
                            await page.waitForTimeout(3000)
                        }
                    }
                }
            } catch (e) { }

            console.log('Mercado Livre: Scrolling...')
            await autoScroll(page)
            await page.waitForTimeout(2000) // Wait a bit after scrolling

            const mlResults = await page.evaluate(() => {
                const items = document.querySelectorAll('.ui-search-layout__item, .ui-search-result__wrapper, li.ui-search-layout__item')
                const data: any[] = []
                items.forEach((item) => {
                    if (data.length >= 100) return
                    const title = item.querySelector('.ui-search-item__title, .poly-component__title')?.textContent?.trim()

                    let priceText = item.querySelector('.ui-search-price__part-without-discount .andes-money-amount__fraction')?.textContent
                    if (!priceText) priceText = item.querySelector('.andes-money-amount__fraction')?.textContent
                    if (!priceText) priceText = item.querySelector('.poly-price__current .andes-money-amount__fraction')?.textContent

                    const link = item.querySelector('a.ui-search-link, a.poly-component__title')?.getAttribute('href')

                    let image = item.querySelector('img.ui-search-result-image__element')?.getAttribute('src')
                    if (!image) image = item.querySelector('img.poly-component__picture')?.getAttribute('src')

                    let location = item.querySelector('.ui-search-item__location, .poly-component__location, .ui-search-item__group__element--location')?.textContent?.trim()

                    let shippingText = item.querySelector('.ui-search-item__shipping, .poly-component__shipping, .ui-search-item__group__element--shipping')?.textContent?.trim()
                    let shipping = 0
                    if (shippingText) {
                        if (shippingText.toLowerCase().includes('grátis') || shippingText.toLowerCase().includes('gratis')) {
                            shipping = 0
                        } else {
                            const match = shippingText.match(/R\$\s*([\d.,]+)/)
                            if (match) {
                                shipping = parseFloat(match[1].replace('.', '').replace(',', '.'))
                            }
                        }
                    }

                    let seller = item.querySelector('.ui-search-official-store-label, .poly-component__seller')?.textContent?.trim()
                    if (seller && seller.startsWith('por ')) seller = seller.replace('por ', '')

                    const installments = item.querySelector('.ui-search-item__installments, .poly-component__installments')?.textContent?.trim()
                    const reviewScore = item.querySelector('.ui-search-reviews__rating-number, .poly-component__rating-number')?.textContent?.trim()
                    let quantitySold = null
                    const reviewsText = item.querySelector('.ui-search-reviews__amount, .poly-component__reviews-amount')?.textContent?.trim()
                    if (reviewsText) quantitySold = reviewsText

                    if (title && priceText && link) {
                        data.push({
                            title,
                            price: parseFloat(priceText.replace('.', '').replace(',', '.')),
                            link,
                            image,
                            location: location,
                            shipping,
                            seller,
                            installments,
                            reviewScore,
                            quantitySold,
                            marketplace: 'MERCADO_LIVRE'
                        })
                    }
                })
                return data
            })

            console.log(`Mercado Livre: Found ${mlResults.length} items`)

            for (const res of mlResults) {
                const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2)
                const titleLower = res.title.toLowerCase()
                const hasMatch = searchTerms.some(term => titleLower.includes(term))

                if (!hasMatch) continue

                const analysis = await analyzeProductMatch(
                    { name: productName, description: product?.description },
                    { title: res.title, price: res.price, link: res.link, rawLocation: res.location }
                )

                if (analysis.score > 50) {
                    await prisma.searchResult.create({
                        data: {
                            jobId,
                            marketplace: res.marketplace,
                            title: res.title,
                            price: res.price,
                            shipping: res.shipping,
                            link: res.link,
                            imageUrl: res.image,
                            sellerName: res.seller,
                            installments: res.installments,
                            quantitySold: res.quantitySold,
                            reviewScore: res.reviewScore,
                            matchScore: analysis.score,
                            matchReasoning: analysis.reasoning,
                            normalizedName: analysis.normalizedName,
                            city: analysis.city,
                            state: analysis.state
                        }
                    })
                }

                // Automatic Product Registration
                if (analysis.newProductCandidate) {
                    const { name, brand, category, description } = analysis.newProductCandidate

                    // Check if product already exists (fuzzy match or exact name)
                    const existingProduct = await prisma.product.findFirst({
                        where: { name: { equals: name } } // Simple exact match for now, could be improved
                    })

                    if (!existingProduct) {
                        console.log(`New product discovered: ${name}. Registering...`)
                        await prisma.product.create({
                            data: {
                                name,
                                brand,
                                category,
                                description,
                                costPrice: 0, // Default, needs user input later
                                imageUrl: res.image
                            }
                        })
                    }
                }
            }
        } catch (e) { console.error('Error scraping Mercado Livre:', e) }

        // Amazon Scraper
        try {
            console.log('Navigating to Amazon...')
            const amazonSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(productName)}&s=price-asc-rank`
            await page.goto(amazonSearchUrl, { waitUntil: 'domcontentloaded' })

            console.log('Amazon: Scrolling...')
            await autoScroll(page)
            await page.waitForTimeout(2000)

            try {
                if (await page.locator('form[action="/errors/validateCaptcha"]').isVisible()) {
                    console.error('Amazon CAPTCHA detected!')
                    await page.screenshot({ path: 'public/amazon_captcha.png' })
                    throw new Error('Amazon CAPTCHA')
                }
            } catch { }

            const amzResults = await page.evaluate(() => {
                const items = document.querySelectorAll('div[data-asin]:not([data-asin=""])')
                const data: any[] = []
                items.forEach((item) => {
                    if (data.length >= 100) return

                    const title = item.querySelector('h2 span, span.a-text-normal')?.textContent?.trim()
                    const priceWhole = item.querySelector('.a-price-whole')?.textContent
                    const priceFraction = item.querySelector('.a-price-fraction')?.textContent
                    const linkElement = item.querySelector('h2 a, a.a-link-normal')
                    const link = linkElement?.getAttribute('href')
                    const image = item.querySelector('.s-image')?.getAttribute('src')

                    const deliveryText = item.querySelector('.a-row.a-size-base.a-color-secondary.s-align-children-center, .a-row.a-size-base.a-color-secondary')?.textContent?.trim()

                    let shipping = 0
                    if (deliveryText) {
                        if (deliveryText.toLowerCase().includes('grátis') || deliveryText.toLowerCase().includes('free')) {
                            shipping = 0
                        } else {
                            const match = deliveryText.match(/R\$\s*([\d.,]+)/)
                            if (match) {
                                shipping = parseFloat(match[1].replace('.', '').replace(',', '.'))
                            }
                        }
                    }

                    const installments = item.textContent?.match(/em até \d+x/)?.[0]
                    const quantitySold = item.querySelector('.a-row.a-size-base.a-color-secondary .a-size-base.a-color-secondary')?.textContent?.trim()
                    const reviewScore = item.querySelector('.a-icon-alt')?.textContent?.split(' ')[0]

                    if (title && priceWhole && link) {
                        const price = parseFloat(`${priceWhole.replace(/\./g, '').replace(',', '')}.${priceFraction || '00'}`)
                        data.push({
                            title,
                            price,
                            link: link.startsWith('http') ? link : `https://www.amazon.com.br${link}`,
                            image,
                            location: deliveryText,
                            shipping,
                            installments,
                            quantitySold: quantitySold?.includes('compra') ? quantitySold : null,
                            reviewScore,
                            marketplace: 'AMAZON'
                        })
                    }
                })
                return data
            })

            console.log(`Amazon: Extracted ${amzResults.length} valid items`)

            for (const res of amzResults) {
                const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2)
                const titleLower = res.title.toLowerCase()
                const hasMatch = searchTerms.some(term => titleLower.includes(term))

                if (!hasMatch) continue

                const analysis = await analyzeProductMatch(
                    { name: productName, description: product?.description },
                    { title: res.title, price: res.price, link: res.link, rawLocation: res.location }
                )

                if (analysis.score > 50 || analysis.score === 0) {
                    await prisma.searchResult.create({
                        data: {
                            jobId,
                            marketplace: res.marketplace,
                            title: res.title,
                            price: res.price,
                            shipping: res.shipping,
                            link: res.link,
                            imageUrl: res.image,
                            installments: res.installments,
                            quantitySold: res.quantitySold,
                            reviewScore: res.reviewScore,
                            matchScore: analysis.score,
                            matchReasoning: analysis.reasoning,
                            normalizedName: analysis.normalizedName,
                            city: analysis.city,
                            state: analysis.state
                        }
                    })
                }

                // Automatic Product Registration (Amazon)
                if (analysis.newProductCandidate) {
                    const { name, brand, category, description } = analysis.newProductCandidate
                    const existingProduct = await prisma.product.findFirst({ where: { name: { equals: name } } })
                    if (!existingProduct) {
                        console.log(`New product discovered (Amazon): ${name}. Registering...`)
                        await prisma.product.create({
                            data: { name, brand, category, description, costPrice: 0, imageUrl: res.image }
                        })
                    }
                }
            }
        } catch (e) { console.error('Error scraping Amazon:', e) }

        // Shopee Scraper
        try {
            console.log('Navigating to Shopee...')
            const shopeeSearchUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(productName)}&sortBy=price&order=asc`
            await page.goto(shopeeSearchUrl, { waitUntil: 'domcontentloaded' })

            console.log('Shopee: Waiting for content...')
            await page.waitForTimeout(8000) // Increased wait time

            try {
                const closePopup = await page.locator('.shopee-popup__close-btn').first()
                if (await closePopup.isVisible()) await closePopup.click()
            } catch { }

            console.log('Shopee: Scrolling...')
            await autoScroll(page)
            await page.waitForTimeout(3000)

            const shopeeResults = await page.evaluate(() => {
                const items = document.querySelectorAll('div.shopee-search-item-result__item')
                const data: any[] = []

                items.forEach((item) => {
                    if (data.length >= 100) return

                    const linkElement = item.querySelector('a')
                    const link = linkElement?.getAttribute('href')

                    let title = item.querySelector('div[data-sqe="name"] > div')?.textContent?.trim()
                    if (!title) title = linkElement?.textContent?.trim()

                    let priceText = item.querySelector('div[data-sqe="name"] + div')?.textContent
                    if (!priceText) priceText = Array.from(item.querySelectorAll('span')).find(el => el.textContent?.includes('R$'))?.textContent

                    const image = item.querySelector('img')?.getAttribute('src')

                    let location = item.querySelector('.zGGwiV, ._2CWevj, div[data-sqe="location"]')?.textContent?.trim()

                    let shipping = 0

                    const quantitySold = item.querySelector('div[data-sqe="rating"] + div, .r6HknA')?.textContent?.trim()
                    const reviewScore = null

                    if (title && priceText && link) {
                        const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.')
                        const price = parseFloat(cleanPrice)

                        if (!isNaN(price)) {
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https://shopee.com.br${link}`,
                                image,
                                location,
                                shipping,
                                quantitySold,
                                reviewScore,
                                marketplace: 'SHOPEE'
                            })
                        }
                    }
                })
                return data
            })

            console.log(`Shopee: Found ${shopeeResults.length} items`)
            if (shopeeResults.length === 0) {
                console.log('Shopee: No items found. Debugging...')
                await page.screenshot({ path: 'public/shopee_failed.png' })
            }

            for (const res of shopeeResults) {
                const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2)
                const titleLower = res.title.toLowerCase()
                const hasMatch = searchTerms.some(term => titleLower.includes(term))

                if (!hasMatch) continue

                const analysis = await analyzeProductMatch(
                    { name: productName, description: product?.description },
                    { title: res.title, price: res.price, link: res.link, rawLocation: res.location }
                )

                if (analysis.score > 50 || analysis.score === 0) {
                    await prisma.searchResult.create({
                        data: {
                            jobId,
                            marketplace: res.marketplace,
                            title: res.title,
                            price: res.price,
                            shipping: res.shipping,
                            link: res.link,
                            imageUrl: res.image,
                            sellerName: res.seller,
                            quantitySold: res.quantitySold,
                            reviewScore: res.reviewScore,
                            matchScore: analysis.score,
                            matchReasoning: analysis.reasoning,
                            normalizedName: analysis.normalizedName,
                            city: analysis.city,
                            state: analysis.state
                        }
                    })
                }

                // Automatic Product Registration (Shopee)
                if (analysis.newProductCandidate) {
                    const { name, brand, category, description } = analysis.newProductCandidate
                    const existingProduct = await prisma.product.findFirst({ where: { name: { equals: name } } })
                    if (!existingProduct) {
                        console.log(`New product discovered (Shopee): ${name}. Registering...`)
                        await prisma.product.create({
                            data: { name, brand, category, description, costPrice: 0, imageUrl: res.image }
                        })
                    }
                }
            }

        } catch (e) { console.error('Error scraping Shopee:', e) }

        await browser.close()

        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED' }
        })

        console.log(`Job ${jobId} completed.`)

    } catch (error) {
        console.error('Fatal error in scraper:', error)
        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'FAILED' }
        })
    }
}
