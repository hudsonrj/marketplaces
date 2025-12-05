import { prisma } from './prisma'
import { chromium } from 'playwright'
import { analyzeProductMatch, checkProductDuplication, smartParseProductBatch } from './ai'

// ... (imports)

const updateJobProgress = async (jobId: string, progress: number, message: string) => {
    try {
        const job = await prisma.searchJob.findUnique({ where: { id: jobId } }) as any
        const currentLogs = (job?.logs as any[]) || []
        const newLog = { timestamp: new Date().toISOString(), message, progress }

        await prisma.searchJob.update({
            where: { id: jobId },
            data: {
                progress,
                logs: [...currentLogs, newLog]
            } as any
        })
    } catch (e) {
        console.error('Failed to update job progress:', e)
    }
}

export async function runScraper(jobId: string, productName: string, options?: { category?: string, instructions?: string, marketplaces?: string[] }) {
    console.log(`Starting scraper for job ${jobId} - Product: ${productName}`)
    await updateJobProgress(jobId, 5, `Iniciando busca por "${productName}"...`)
    let totalItems = 0
    let browser: any = null

    try {
        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'RUNNING' }
        })

        const product = await prisma.product.findFirst({
            where: { searchJobs: { some: { id: jobId } } }
        })

        const settings = await prisma.settings.findFirst() as any
        const proxyUrl = settings?.proxyUrl

        const launchOptions: any = {
            headless: true,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        }

        if (proxyUrl && proxyUrl.trim() !== '') {
            launchOptions.proxy = { server: proxyUrl }
            console.log(`Using Proxy: ${proxyUrl}`)
        }

        browser = await chromium.launch(launchOptions)

        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo',
            deviceScaleFactor: 1,
            extraHTTPHeaders: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Referer': 'https://www.google.com/'
            }
        })

        context.setDefaultTimeout(60000) // Increase timeout to 60s
        context.setDefaultNavigationTimeout(60000)

        // Block heavy resources to speed up loading
        await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}', (route: any) => route.abort())

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
        // Helper for robust navigation
        const safeGoto = async (page: any, url: string) => {
            let retries = 3
            while (retries > 0) {
                try {
                    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
                    return true
                } catch (e) {
                    console.log(`Navigation failed, retrying... (${retries} left)`)
                    retries--
                    await page.waitForTimeout(2000)
                }
            }
            return false
        }



        const scrapeMercadoLivre = async () => {
            await updateJobProgress(jobId, 10, 'Verificando Mercado Livre...')
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Mercado Livre...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                const success = await safeGoto(page, `https://lista.mercadolivre.com.br/${encodeURIComponent(searchQuery)}_ItemTypeID_2230284_OrderId_PRICE_ASC`)
                if (!success) throw new Error('Failed to load Mercado Livre')

                let pageCount = 0
                while (allData.length < 100 && pageCount < 5) { // Limit to 5 pages max
                    pageCount++
                    await autoScroll(page)

                    // 1. Get Raw HTML Snippets
                    const rawSnippets = await page.evaluate(() => {
                        const items = document.querySelectorAll('.ui-search-layout__item, .ui-search-result__wrapper, li.ui-search-layout__item')
                        return Array.from(items).map(item => item.outerHTML)
                    })

                    console.log(`Mercado Livre: Found ${rawSnippets.length} raw items on page ${pageCount}. Processing with AI...`)

                    // 2. Process in Batches (e.g., 3 at a time to keep prompt size manageable)
                    const batchSize = 3
                    for (let i = 0; i < rawSnippets.length; i += batchSize) {
                        const currentBatch = Math.floor(i / batchSize) + 1
                        const totalBatches = Math.ceil(rawSnippets.length / batchSize)
                        await updateJobProgress(jobId, 15, `Mercado Livre: Pág ${pageCount} - Analisando lote ${currentBatch}/${totalBatches}...`)

                        const batch = rawSnippets.slice(i, i + batchSize)
                        const parsedItems = await smartParseProductBatch(batch, 'MERCADO_LIVRE')

                        const validItems = parsedItems.map((item: any) => ({
                            ...item,
                            sellerName: item.seller, // Map AI 'seller' to DB 'sellerName'
                            sellerLocation: item.location, // Map AI 'location' to DB 'sellerLocation'
                            marketplace: 'MERCADO_LIVRE',
                            condition: item.condition || 'new'
                        })).filter((item: any) => item.title && item.price && item.link && item.condition !== 'used')

                        allData = [...allData, ...validItems]
                        console.log(`Mercado Livre: Processed ${allData.length} items so far`)
                        if (allData.length >= 100) break
                        await new Promise(r => setTimeout(r, 1000)) // Rate limit protection
                    }

                    if (allData.length >= 100) break

                    // Next Page
                    const hasNext = await page.evaluate(() => {
                        const nextBtn = document.querySelector('a.andes-pagination__link[title="Seguinte"], li.andes-pagination__button--next a') as HTMLElement;
                        if (nextBtn) {
                            nextBtn.click();
                            return true;
                        }
                        return false;
                    });

                    if (hasNext) {
                        await page.waitForTimeout(3000); // Wait for dynamic load
                    } else {
                        break
                    }
                }

                await updateJobProgress(jobId, 20, `Mercado Livre: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Mercado Livre:', e)
                await updateJobProgress(jobId, 20, 'Erro ao varrer Mercado Livre.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeAmazon = async () => {
            await updateJobProgress(jobId, 30, 'Verificando Amazon...')
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Amazon...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                // s=price-asc-rank sorts by price low to high
                const amazonSearchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(searchQuery)}&s=price-asc-rank&rh=p_n_condition-type:13862762011`
                const success = await safeGoto(page, amazonSearchUrl)
                if (!success) throw new Error('Failed to load Amazon')

                let pageCount = 0
                while (allData.length < 100 && pageCount < 5) {
                    pageCount++
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
                    console.log(`Amazon: Found ${allData.length} items so far (Page ${pageCount})`)

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
                await updateJobProgress(jobId, 40, `Amazon: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Amazon:', e)
                await updateJobProgress(jobId, 40, 'Erro ao varrer Amazon.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeShopee = async () => {
            await updateJobProgress(jobId, 45, 'Verificando Shopee...')
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Shopee...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                // order=asc&sortBy=price
                const shopeeSearchUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(searchQuery)}&order=asc&sortBy=price`
                console.log('Shopee URL:', shopeeSearchUrl)

                const success = await safeGoto(page, shopeeSearchUrl)
                if (!success) throw new Error('Failed to load Shopee')

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
                        const isDisabled = await page.evaluate((btn: any) => btn.hasAttribute('disabled') || btn.classList.contains('shopee-button-solid--disabled'), nextButton)
                        if (isDisabled) break

                        await nextButton.click()
                        await page.waitForTimeout(3000)
                        pageNum++
                    } else {
                        break
                    }
                }
                await updateJobProgress(jobId, 55, `Shopee: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Shopee:', e)
                await updateJobProgress(jobId, 55, 'Erro ao varrer Shopee.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeMagalu = async () => {
            await updateJobProgress(jobId, 60, 'Verificando Magalu...')
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
                await updateJobProgress(jobId, 65, `Magalu: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Magalu:', e)
                await updateJobProgress(jobId, 65, 'Erro ao varrer Magalu.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeAliExpress = async () => {
            await updateJobProgress(jobId, 70, 'Verificando AliExpress...')
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
                await updateJobProgress(jobId, 75, `AliExpress: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping AliExpress:', e)
                await updateJobProgress(jobId, 75, 'Erro ao varrer AliExpress.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeCasasBahia = async () => {
            await updateJobProgress(jobId, 80, 'Verificando Casas Bahia...')
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
                await updateJobProgress(jobId, 85, `Casas Bahia: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Casas Bahia:', e)
                await updateJobProgress(jobId, 85, 'Erro ao varrer Casas Bahia.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeAmericanas = async () => {
            await updateJobProgress(jobId, 85, 'Verificando Americanas...')
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Americanas...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                await page.goto(`https://www.americanas.com.br/busca/${encodeURIComponent(searchQuery)}`, { waitUntil: 'domcontentloaded' })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    // Americanas selectors (generic fallback as they change often)
                    const items = document.querySelectorAll('div[class*="product-grid-item"], div[class*="inStockCard"]')
                    const data: any[] = []
                    items.forEach((item) => {
                        const title = item.querySelector('h3, span[class*="Title"]')?.textContent?.trim()
                        const priceText = item.querySelector('span[class*="Price"]')?.textContent
                        const link = item.querySelector('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https://www.americanas.com.br${link}`,
                                image,
                                marketplace: 'AMERICANAS'
                            })
                        }
                    })
                    return data
                })
                allData = [...allData, ...pageResults]
                await updateJobProgress(jobId, 90, `Americanas: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Americanas:', e)
                await updateJobProgress(jobId, 90, 'Erro ao varrer Americanas.')
                return allData
            } finally {
                await page.close()
            }
        }

        const scrapeKabum = async () => {
            await updateJobProgress(jobId, 90, 'Verificando Kabum...')
            const page = await context.newPage()
            let allData: any[] = []
            try {
                console.log('Navigating to Kabum...')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                await page.goto(`https://www.kabum.com.br/busca?query=${encodeURIComponent(searchQuery)}`, { waitUntil: 'domcontentloaded' })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('article.productCard')
                    const data: any[] = []
                    items.forEach((item) => {
                        const title = item.querySelector('span.nameCard')?.textContent?.trim()
                        const priceText = item.querySelector('span.priceCard')?.textContent
                        const link = item.querySelector('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            data.push({
                                title,
                                price,
                                link: link.startsWith('http') ? link : `https://www.kabum.com.br${link}`,
                                image,
                                marketplace: 'KABUM'
                            })
                        }
                    })
                    return data
                })
                allData = [...allData, ...pageResults]
                await updateJobProgress(jobId, 95, `Kabum: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Kabum:', e)
                await updateJobProgress(jobId, 95, 'Erro ao varrer Kabum.')
                return allData
            } finally {
                await page.close()
            }
        }

        // Run scrapers based on selection
        const selectedMarketplaces = options?.marketplaces && options.marketplaces.length > 0
            ? options.marketplaces
            : ['MERCADO_LIVRE', 'AMAZON', 'SHOPEE', 'MAGALU', 'CASAS_BAHIA', 'AMERICANAS', 'KABUM']

        const promises = []
        if (selectedMarketplaces.includes('MERCADO_LIVRE')) promises.push(scrapeMercadoLivre())
        if (selectedMarketplaces.includes('AMAZON')) promises.push(scrapeAmazon())
        if (selectedMarketplaces.includes('SHOPEE')) promises.push(scrapeShopee())
        if (selectedMarketplaces.includes('MAGALU')) promises.push(scrapeMagalu())
        if (selectedMarketplaces.includes('ALIEXPRESS')) promises.push(scrapeAliExpress())
        if (selectedMarketplaces.includes('CASAS_BAHIA')) promises.push(scrapeCasasBahia())
        if (selectedMarketplaces.includes('AMERICANAS')) promises.push(scrapeAmericanas())
        if (selectedMarketplaces.includes('KABUM')) promises.push(scrapeKabum())

        const results = await Promise.all(promises)
        const allResults = results.flat()
        console.log(`Total raw items found: ${allResults.length}`)
        totalItems = allResults.length

        // Process results with AI (Parallelized batches)
        const allProcessedResults: any[] = []

        const processBatch = async (items: any[]) => {
            // Filter items that need AI processing (Mercado Livre already has some, but we might want to re-verify or just process raw ones if we changed logic)
            // Actually, for Mercado Livre we already processed with AI inside the scraper function!
            // Wait, in the previous step I moved AI processing INSIDE scrapeMercadoLivre.
            // So 'allResults' from scrapeMercadoLivre are ALREADY processed items.
            // But other scrapers (Amazon, Shopee) return raw items.
            // We need to distinguish them.

            const rawItems = items.filter(i => !i.matchScore) // Items without matchScore need processing
            const alreadyProcessed = items.filter(i => i.matchScore) // Items already processed (e.g. from ML scraper)

            allProcessedResults.push(...alreadyProcessed)

            if (rawItems.length === 0) return

            for (const res of rawItems) {
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
                        sellerName: res.sellerName || res.seller,
                        sellerLocation: res.sellerLocation || res.location,
                        matchScore: analysis.score,
                        matchReasoning: analysis.reasoning,
                        normalizedName: analysis.normalizedName,
                        city: analysis.city,
                        state: analysis.state,
                        condition: res.condition || 'new'
                    })
                }
            }
        }

        // Split processing into chunks
        await updateJobProgress(jobId, 95, 'Processando dados com IA...')
        const chunkSize = 10;
        for (let i = 0; i < allResults.length; i += chunkSize) {
            console.log(`Processing batch ${i / chunkSize + 1}...`)
            await updateJobProgress(jobId, 95, `Analisando lote ${Math.floor(i / chunkSize) + 1} com IA...`)
            const chunk = allResults.slice(i, i + chunkSize);
            await processBatch(chunk);
        }

        await browser.close()

        // Single Transaction Write for ALL results
        if (allProcessedResults.length > 0) {
            console.log(`Writing ${allProcessedResults.length} results to database...`)
            await updateJobProgress(jobId, 98, 'Salvando resultados...')
            await prisma.$transaction(
                allProcessedResults.map(data => prisma.searchResult.create({ data }))
            )
        } else {
            console.log('No relevant results found to save.')
        }

        // Calculate best price
        const bestResult = await prisma.searchResult.findFirst({
            where: { jobId: jobId, matchScore: { gt: 50 } },
            orderBy: { price: 'asc' }
        })

        if (bestResult) {
            await prisma.product.update({
                where: { id: product?.id },
                data: { lastBestPrice: bestResult.price }
            })
        }

        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETED' }
        })
        await updateJobProgress(jobId, 100, 'Busca finalizada com sucesso!')

    } catch (error) {
        console.error('Scraper failed:', error)
        await prisma.searchJob.update({
            where: { id: jobId },
            data: { status: 'FAILED' }
        })
        await updateJobProgress(jobId, 0, `Falha na busca: ${error}`)
    } finally {
        if (browser) await browser.close()
    }
}


