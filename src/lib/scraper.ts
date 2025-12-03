import { prisma } from './prisma'
import { chromium } from 'playwright'
import { analyzeProductMatch, checkProductDuplication } from './ai'

// ... (imports)

export async function runScraper(jobId: string, productName: string, options?: { category?: string, instructions?: string, marketplaces?: string[] }) {
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
            headless: true, // User requested background, so headless true is better, but let's keep it false for debugging if needed or make it configurable. 
            // Actually, for "background" jobs initiated by user, headless=true is standard.
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
            let allData: any[] = []
            try {
                console.log('Navigating to Mercado Livre...')
                // Construct URL with sorting directly if possible
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                await page.goto(`https://lista.mercadolivre.com.br/${encodeURIComponent(searchQuery)}_OrderId_PRICE_ASC`, { waitUntil: 'domcontentloaded' })

                // Pagination Loop
                while (allData.length < 100) {
                    await autoScroll(page)

                    const pageResults = await page.evaluate(() => {
                        const items = document.querySelectorAll('.ui-search-layout__item, .ui-search-result__wrapper, li.ui-search-layout__item')
                        const data: any[] = []
                        items.forEach((item) => {
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

                    allData = [...allData, ...pageResults]
                    console.log(`Mercado Livre: Found ${allData.length} items so far`)

                    if (allData.length >= 100) break

                    // Next Page
                    const nextButton = await page.$('a.andes-pagination__link[title="Seguinte"], li.andes-pagination__button--next a')
                    if (nextButton) {
                        await nextButton.click()
                        await page.waitForTimeout(2000)
                    } else {
                        break // No more pages
                    }
                }

                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Mercado Livre:', e)
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeAmazon = async () => {
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Amazon...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                // s=price-asc-rank sorts by price low to high
                const amazonSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(searchQuery)}&s=price-asc-rank`
                await page.goto(amazonSearchUrl, { waitUntil: 'domcontentloaded' })

                while (allData.length < 100) {
                    await autoScroll(page)

                    const pageResults = await page.evaluate(() => {
                        const items = document.querySelectorAll('div[data-asin]:not([data-asin=""])')
                        const data: any[] = []
                        items.forEach((item) => {
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

                    allData = [...allData, ...pageResults]
                    console.log(`Amazon: Found ${allData.length} items so far`)

                    if (allData.length >= 100) break

                    // Next Page
                    const nextButton = await page.$('a.s-pagination-next')
                    if (nextButton) {
                        const isDisabled = await nextButton.getAttribute('aria-disabled')
                        if (isDisabled === 'true') break
                        await nextButton.click()
                        await page.waitForTimeout(2000)
                    } else {
                        break
                    }
                }
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Amazon:', e)
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeShopee = async () => {
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Shopee...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                // order=asc&sortBy=price
                const shopeeSearchUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(searchQuery)}&order=asc&sortBy=price`
                console.log('Shopee URL:', shopeeSearchUrl)

                await page.goto(shopeeSearchUrl, { waitUntil: 'domcontentloaded' })
                await page.waitForTimeout(3000)

                try {
                    const closePopup = await page.locator('.shopee-popup__close-btn').first()
                    if (await closePopup.isVisible()) await closePopup.click()
                } catch { }

                let pageNum = 0
                while (allData.length < 100 && pageNum < 5) { // Limit pages to avoid infinite loops
                    await autoScroll(page)

                    const pageResults = await page.evaluate(() => {
                        const items = document.querySelectorAll('.shopee-search-item-result__item')
                        const data: any[] = []
                        items.forEach((item) => {
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

                    allData = [...allData, ...pageResults]
                    console.log(`Shopee: Found ${allData.length} items so far`)

                    if (allData.length >= 100) break

                    // Next Page (Shopee pagination is tricky, usually button with icon)
                    const nextButton = await page.$('.shopee-icon-button--right')
                    if (nextButton) {
                        // Check if disabled
                        const isDisabled = await page.evaluate((btn) => btn.hasAttribute('disabled') || btn.classList.contains('shopee-button-solid--disabled'), nextButton)
                        if (isDisabled) break

                        await nextButton.click()
                        await page.waitForTimeout(3000)
                        pageNum++
                    } else {
                        break
                    }
                }
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Shopee:', e)
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeMagalu = async () => {
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Magalu...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                await page.goto(`https://www.magazineluiza.com.br/busca/${encodeURIComponent(searchQuery)}/`, { waitUntil: 'domcontentloaded' })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('[data-testid="product-card-content"]')
                    const data: any[] = []
                    items.forEach((item) => {
                        const title = item.querySelector('[data-testid="product-title"]')?.textContent?.trim()
                        const priceText = item.querySelector('[data-testid="price-value"]')?.textContent
                        const link = item.closest('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https://www.magazineluiza.com.br${link}`,
                                image,
                                marketplace: 'MAGALU'
                            })
                        }
                    })
                    return data
                })
                allData = [...allData, ...pageResults]
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Magalu:', e)
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeAliExpress = async () => {
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to AliExpress...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                await page.goto(`https://pt.aliexpress.com/wholesale?SearchText=${encodeURIComponent(searchQuery)}`, { waitUntil: 'domcontentloaded' })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    // AliExpress selectors are dynamic, using generic classes
                    const items = document.querySelectorAll('.list--gallery--34Gt4P8 > a') // Example selector, might need adjustment
                    const data: any[] = []
                    items.forEach((item) => {
                        const title = item.querySelector('.multi--titleText--nXeOvyr')?.textContent?.trim()
                        const priceText = item.querySelector('.multi--price-sale--U-S0jtj')?.textContent
                        const link = item.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https:${link}`,
                                image,
                                marketplace: 'ALIEXPRESS'
                            })
                        }
                    })
                    return data
                })
                allData = [...allData, ...pageResults]
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping AliExpress:', e)
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeCasasBahia = async () => {
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Casas Bahia...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                await page.goto(`https://www.casasbahia.com.br/${encodeURIComponent(searchQuery)}/b`, { waitUntil: 'domcontentloaded' })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('.product-card')
                    const data: any[] = []
                    items.forEach((item) => {
                        const title = item.querySelector('.product-card__title')?.textContent?.trim()
                        const priceText = item.querySelector('.product-card__price')?.textContent
                        const link = item.querySelector('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https://www.casasbahia.com.br${link}`,
                                image,
                                marketplace: 'CASAS_BAHIA'
                            })
                        }
                    })
                    return data
                })
                allData = [...allData, ...pageResults]
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Casas Bahia:', e)
                return allData
            } finally {
                await page.close()
            }
        }

        // Run scrapers based on selection (default to all if not specified or empty)
        const selectedMarketplaces = options?.marketplaces && options.marketplaces.length > 0
            ? options.marketplaces
            : ['MERCADO_LIVRE', 'AMAZON', 'SHOPEE']

        const promises = []
        if (selectedMarketplaces.includes('MERCADO_LIVRE')) promises.push(scrapeMercadoLivre())
        if (selectedMarketplaces.includes('AMAZON')) promises.push(scrapeAmazon())
        if (selectedMarketplaces.includes('SHOPEE')) promises.push(scrapeShopee())
        if (selectedMarketplaces.includes('MAGALU')) promises.push(scrapeMagalu())
        if (selectedMarketplaces.includes('ALIEXPRESS')) promises.push(scrapeAliExpress())
        if (selectedMarketplaces.includes('CASAS_BAHIA')) promises.push(scrapeCasasBahia())

        const results = await Promise.all(promises)
        const allResults = results.flat()
        console.log(`Total raw items found: ${allResults.length}`)
        totalItems = allResults.length

        // Process results with AI (Parallelized batches)
        const allProcessedResults: any[] = []

        const processBatch = async (items: any[]) => {
            for (const res of items) {
                const searchTerms = productName.toLowerCase().split(' ').filter(w => w.length > 2)
                const titleLower = res.title.toLowerCase()
                // Basic pre-filter
                if (!searchTerms.some(term => titleLower.includes(term))) continue

                const analysis = await analyzeProductMatch(
                    { name: productName, description: product?.description },
                    { title: res.title, price: res.price, link: res.link, rawLocation: res.location },
                    options?.instructions // Pass instructions to AI
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
