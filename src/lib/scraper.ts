import { prisma } from './prisma'
import { chromium } from 'playwright'
import { analyzeProductMatch, checkProductDuplication, smartParseProductBatch } from './ai'
import { generateProductHash } from './hash'

// ... (imports)

const lastUpdates: Record<string, number> = {}

const updateJobProgress = async (jobId: string, progress: number, message: string) => {
    const now = Date.now()
    // Rate limit: Max 1 update per 2 seconds, unless it's the final update (100%)
    if (lastUpdates[jobId] && now - lastUpdates[jobId] < 2000 && progress < 100) {
        return
    }
    lastUpdates[jobId] = now

    try {
        const job = await prisma.searchJob.findUnique({ where: { id: jobId } })
        if (!job) {
            // Job might have been deleted or not found
            return
        }
        const currentLogs = ((job as any).logs as any[]) || []
        const newLog = { timestamp: new Date().toISOString(), message, progress }

        await prisma.searchJob.update({
            where: { id: jobId },
            data: {
                progress,
                logs: [...currentLogs, newLog]
            } as any
        })
    } catch (e) {
        // Suppress errors to avoid crashing the scraper loop
        console.error(`[Job ${jobId}] Progress update failed (non-critical):`, (e as any).message)
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
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            locale: 'pt-BR',
            timezoneId: 'America/Sao_Paulo',
            deviceScaleFactor: 1,
            extraHTTPHeaders: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Referer': 'https://www.google.com/'
            }
        })

        context.setDefaultTimeout(60000)
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
                console.log('Mercado Livre: FAST DOM MODE ACTIVE')
                const searchQuery = options?.category ? `${productName} ${options.category}` : productName
                const success = await safeGoto(page, `https://lista.mercadolivre.com.br/${encodeURIComponent(searchQuery)}_ItemTypeID_2230284_OrderId_PRICE_ASC`)
                if (!success) throw new Error('Failed to load Mercado Livre')

                let pageCount = 0
                while (allData.length < 100 && pageCount < 5) { // Limit to 5 pages max
                    pageCount++
                    await autoScroll(page)

                    // 1. Get Raw Data via DOM (Fast)
                    const pageResults = await page.evaluate(() => {
                        // Updated selectors to include new 'poly-card' structure
                        const items = document.querySelectorAll('.ui-search-layout__item, .ui-search-result__wrapper, li.ui-search-layout__item, div.poly-card')
                        const data: any[] = []
                        items.forEach((item) => {
                            // Selectors for Title
                            const title = item.querySelector('.ui-search-item__title, .poly-component__title, h2.ui-search-item__title, .poly-component__title-wrapper a')?.textContent?.trim()

                            // Selectors for Price
                            let price = 0
                            const priceContainer = item.querySelector('.ui-search-price__part, .andes-money-amount, .poly-price__current .andes-money-amount')
                            if (priceContainer) {
                                const fraction = priceContainer.querySelector('.andes-money-amount__fraction')?.textContent
                                const cents = priceContainer.querySelector('.andes-money-amount__cents')?.textContent || '00'
                                if (fraction) {
                                    price = parseFloat(`${fraction.replace(/\./g, '').replace(',', '')}.${cents}`)
                                }
                            }

                            // Selectors for Link
                            const linkElement = item.querySelector('a.ui-search-link, a.ui-search-item__group__element, .poly-component__title-wrapper a')
                            const link = linkElement?.getAttribute('href')

                            // Selectors for Image
                            const image = item.querySelector('img.ui-search-result-image__element, img.poly-component__picture, .poly-card__portada img')?.getAttribute('src')

                            // Condition (New/Used)
                            const isUsed = item.textContent?.toLowerCase().includes('usado')

                            if (title && price > 0 && link) {
                                data.push({
                                    title,
                                    price,
                                    link,
                                    image,
                                    marketplace: 'MERCADO_LIVRE',
                                    condition: isUsed ? 'used' : 'new'
                                })
                            }
                        })
                        return data
                    })

                    allData = [...allData, ...pageResults]
                    console.log(`Mercado Livre: Found ${allData.length} items so far (Page ${pageCount})`)

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
                const shopeeSearchUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(searchQuery)}&order=asc&sortBy=price`

                // Increased timeout and better wait strategy
                try {
                    await page.goto(shopeeSearchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
                    // Wait for some network activity to settle, as Shopee is heavy on JS
                    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { /* ignore */ }
                } catch (e) {
                    console.log('Shopee: Navigation timeout (likely blocked or slow).')
                    await updateJobProgress(jobId, 50, 'Shopee: Timeout (Lento/Bloqueado).')
                    return []
                }

                // Quick check for login redirect or block
                if (page.url().includes('login') || page.url().includes('verify')) {
                    console.log('Shopee: Redirected to login/verify. Skipping.')
                    await updateJobProgress(jobId, 50, 'Shopee: Bloqueado (Login/Captcha).')
                    return []
                }

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    // Try multiple selector strategies
                    const items = document.querySelectorAll('.shopee-search-item-result__item, [data-sqe="item"], div[class*="search-item-result"]')
                    const data: any[] = []
                    items.forEach((item) => {
                        const linkElement = item.querySelector('a')
                        const link = linkElement?.getAttribute('href')

                        let title = item.querySelector('div[data-sqe="name"] > div')?.textContent?.trim()
                        if (!title) title = item.querySelector('.text-shopee-black')?.textContent?.trim()
                        if (!title) title = linkElement?.textContent?.trim()

                        let priceText = item.querySelector('div[data-sqe="name"] + div')?.textContent
                        if (!priceText) priceText = Array.from(item.querySelectorAll('span')).find(el => el.textContent?.includes('R$'))?.textContent
                        if (!priceText) priceText = item.querySelector('[class*="price"]')?.textContent

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
                await updateJobProgress(jobId, 50, `Shopee: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Shopee:', e)
                await updateJobProgress(jobId, 50, 'Shopee: Sem dados (Bloqueio/Timeout).')
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
                await page.goto(`https://www.magazineluiza.com.br/busca/${encodeURIComponent(searchQuery)}/`, { waitUntil: 'domcontentloaded', timeout: 45000 })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    // Primary: data-testid (Best)
                    // Fallback: Generic classes
                    const items = document.querySelectorAll('[data-testid="product-card-content"], [class*="ProductCard"], div[class*="sc-"]')
                    const data: any[] = []
                    items.forEach((item) => {
                        let title = item.querySelector('[data-testid="product-title"]')?.textContent?.trim()
                        if (!title) title = item.querySelector('h2, h3, [class*="Title"]')?.textContent?.trim()

                        let priceText = item.querySelector('[data-testid="price-value"]')?.textContent
                        if (!priceText) priceText = item.querySelector('[data-testid="price-original"]')?.textContent
                        if (!priceText) priceText = item.querySelector('[class*="Price"], [class*="price"]')?.textContent

                        const link = item.closest('a')?.getAttribute('href') || item.querySelector('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            // Clean price: remove "R$", dots, replace comma with dot
                            const cleanPrice = priceText.replace(/[^\d,]/g, '').replace(',', '.')
                            const price = parseFloat(cleanPrice)

                            if (!isNaN(price)) {
                                data.push({
                                    title,
                                    price,
                                    link: link.startsWith('http') ? link : `https://www.magazineluiza.com.br${link}`,
                                    image,
                                    marketplace: 'MAGALU'
                                })
                            }
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
                // Clean query to avoid issues with special chars
                const cleanQuery = searchQuery.replace(/[^\w\s\u00C0-\u00FF]/g, '').trim()
                const cbUrl = `https://www.casasbahia.com.br/${encodeURIComponent(cleanQuery)}/b`

                try {
                    await page.goto(cbUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
                    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { /* ignore */ }
                } catch (e) {
                    console.log('Casas Bahia: Navigation timeout (likely blocked).')
                    await updateJobProgress(jobId, 80, 'Casas Bahia: Bloqueado (Timeout).')
                    return []
                }

                // Quick check for Access Denied
                const title = await page.title()
                if (title.includes('Access Denied') || title.includes('Acesso Negado')) {
                    console.log('Casas Bahia: Access Denied.')
                    await updateJobProgress(jobId, 80, 'Casas Bahia: Bloqueado (Access Denied).')
                    return []
                }

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    // Try more generic selectors
                    const items = document.querySelectorAll('.product-card, [class*="ProductCard"], div[class*="product-card"], div[id*="product-card"]')
                    const data: any[] = []
                    items.forEach((item) => {
                        let title = item.querySelector('.product-card__title, [class*="Title"], h3')?.textContent?.trim()
                        if (!title) title = item.querySelector('h2')?.textContent?.trim()

                        let priceText = item.querySelector('.product-card__price, [class*="Price"], [class*="price"]')?.textContent

                        const link = item.querySelector('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            if (!isNaN(price)) {
                                data.push({
                                    title,
                                    price,
                                    link: link.startsWith('http') ? link : `https://www.casasbahia.com.br${link}`,
                                    image,
                                    marketplace: 'CASAS_BAHIA'
                                })
                            }
                        }
                    })
                    return data
                })

                allData = [...allData, ...pageResults]
                await updateJobProgress(jobId, 80, `Casas Bahia: ${allData.length} itens encontrados.`)
                return allData.slice(0, 100)
            } catch (e) {
                console.error('Error scraping Casas Bahia:', e)
                await updateJobProgress(jobId, 80, 'Casas Bahia: Sem dados (Bloqueio/Timeout).')
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
                const cleanQuery = searchQuery.replace(/[^\w\s\u00C0-\u00FF]/g, '').trim()

                try {
                    await page.goto(`https://www.americanas.com.br/busca/${encodeURIComponent(cleanQuery)}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
                    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { /* ignore */ }
                } catch (e) {
                    console.log('Americanas: Navigation timeout (likely blocked).')
                    await updateJobProgress(jobId, 90, 'Americanas: Bloqueado (Timeout).')
                    return []
                }

                // Fast check for products
                try {
                    await page.waitForSelector('a[href*="/produto/"]', { timeout: 5000 })
                } catch (e) {
                    console.log('Americanas: Fast selector wait timed out, proceeding to extract anyway...')
                }

                const pageResults = await page.evaluate(() => {
                    // Try to find product cards by looking for links containing "/produto/"
                    // This is much more robust than relying on specific class names like "product-grid-item"
                    const links = Array.from(document.querySelectorAll('a[href*="/produto/"]'))
                    const uniqueLinks = new Set()
                    const data: any[] = []

                    links.forEach((a: any) => {
                        if (uniqueLinks.has(a.href)) return
                        uniqueLinks.add(a.href)

                        // Try to find price and title relative to the link
                        // Usually the link wraps the whole card or is inside it
                        const card = a.closest('div') || a
                        const title = card.innerText.split('\n').find((t: string) => t.length > 10 && !t.includes('R$')) || a.innerText
                        const priceText = card.innerText.split('\n').find((t: string) => t.includes('R$'))

                        if (title && priceText) {
                            const price = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'))
                            if (!isNaN(price)) {
                                data.push({
                                    title: title.trim(),
                                    price,
                                    link: a.href,
                                    image: card.querySelector('img')?.src,
                                    marketplace: 'AMERICANAS'
                                })
                            }
                        }
                    })
                    return data.slice(0, 24) // Limit to avoid garbage
                })

                allData = [...allData, ...pageResults]
                await updateJobProgress(jobId, 90, `Americanas: ${allData.length} itens encontrados.`)
                return allData
            } catch (e) {
                console.error('Error scraping Americanas:', e)
                await updateJobProgress(jobId, 90, 'Americanas: Sem dados (Bloqueio/Timeout).')
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
                const cleanQuery = searchQuery.replace(/[^\w\s\u00C0-\u00FF]/g, '').trim()
                await page.goto(`https://www.kabum.com.br/busca?query=${encodeURIComponent(cleanQuery)}`, { waitUntil: 'domcontentloaded', timeout: 45000 })

                await autoScroll(page)

                const pageResults = await page.evaluate(() => {
                    const items = document.querySelectorAll('article.productCard, div[class*="productCard"], div[class*="ProductCard"]')
                    const data: any[] = []
                    items.forEach((item) => {
                        let title = item.querySelector('span.nameCard, [class*="nameCard"], h2')?.textContent?.trim()
                        if (!title) title = item.querySelector('span[class*="Title"]')?.textContent?.trim()

                        let priceText = item.querySelector('span.priceCard, [class*="priceCard"], [class*="Price"]')?.textContent

                        const link = item.querySelector('a')?.getAttribute('href')
                        const image = item.querySelector('img')?.getAttribute('src')

                        if (title && priceText && link) {
                            const price = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
                            if (!isNaN(price)) {
                                data.push({
                                    title,
                                    price,
                                    link: link.startsWith('http') ? link : `https://www.kabum.com.br${link}`,
                                    image,
                                    marketplace: 'KABUM'
                                })
                            }
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

        // Consolidate & Deduplicate Logic
        // 1. Group by Hash (Title-based)
        const groupedItems: Record<string, any[]> = {}

        for (const item of allResults) {
            // Skip used/refurbished/broken items immediately
            const titleLower = item.title.toLowerCase()
            const forbidden = ['capa', 'case', 'pelicula', 'vidro', 'acessorio', 'quebrado', 'defeito', 'peca']
            if (forbidden.some(f => titleLower.includes(f)) && !forbidden.some(f => productName.toLowerCase().includes(f))) continue
            if (item.condition === 'used' || titleLower.includes('usado') || titleLower.includes('seminovo')) continue

            const hash = generateProductHash(productName, item.title)
            if (!groupedItems[hash]) groupedItems[hash] = []
            groupedItems[hash].push(item)
        }

        const uniqueHashes = Object.keys(groupedItems)
        console.log(`Consolidated into ${uniqueHashes.length} unique product groups.`)
        await updateJobProgress(jobId, 95, `Analisando ${uniqueHashes.length} grupos de produtos...`)

        // 2. Process Unique Groups


        // Process in chunks of groups to avoid rate limits
        const chunkSize = 5
        for (let i = 0; i < uniqueHashes.length; i += chunkSize) {
            const batchHashes = uniqueHashes.slice(i, i + chunkSize)

            await Promise.all(batchHashes.map(async (hash) => {
                const group = groupedItems[hash]
                const representative = group[0] // Use the first item as representative for AI analysis

                let analysis: any = null

                // A. Check Cache
                try {
                    // @ts-ignore
                    if (prisma.analysisCache) {
                        // @ts-ignore
                        const cached = await prisma.analysisCache.findUnique({ where: { hash } })
                        if (cached) {
                            console.log(`Cache HIT for group: ${representative.title.substring(0, 30)}...`)
                            analysis = {
                                score: cached.matchScore,
                                reasoning: cached.matchReasoning,
                                normalizedName: cached.normalizedName,
                                city: cached.city,
                                state: cached.state
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Cache read failed:', e)
                }

                if (!analysis) {
                    // B. AI Analysis (Cache MISS)
                    console.log(`Cache MISS for group: ${representative.title.substring(0, 30)}... Analyzing...`)
                    analysis = await analyzeProductMatch(
                        { name: productName, description: product?.description },
                        { title: representative.title, price: representative.price, link: representative.link, rawLocation: representative.location },
                        options?.instructions
                    )

                    // C. Save to Cache
                    if (analysis) {
                        try {
                            // @ts-ignore
                            if (prisma.analysisCache) {
                                // @ts-ignore
                                await prisma.analysisCache.create({
                                    data: {
                                        hash,
                                        matchScore: analysis.score,
                                        matchReasoning: analysis.reasoning,
                                        normalizedName: analysis.normalizedName,
                                        city: analysis.city,
                                        state: analysis.state
                                    }
                                }).catch((e: any) => console.log('Cache write skipped (duplicate)'))
                            }
                        } catch (e) {
                            console.warn('Cache write failed:', e)
                        }
                    }
                }

                // D. Replicate Result to All Items in Group
                if (analysis && analysis.score > 50) {
                    for (const item of group) {
                        allProcessedResults.push({
                            jobId,
                            marketplace: item.marketplace,
                            title: item.title,
                            price: item.price,
                            shipping: item.shipping || 0,
                            link: item.link,
                            imageUrl: item.image,
                            sellerName: item.sellerName || item.seller,
                            sellerLocation: item.sellerLocation || item.location,
                            matchScore: analysis.score,
                            matchReasoning: analysis.reasoning,
                            normalizedName: analysis.normalizedName,
                            city: analysis.city,
                            state: analysis.state,
                            condition: item.condition || 'new'
                        })
                    }
                }
            }))
        }

        // Close browser immediately to free up resources (Staging Concept)
        if (browser) await browser.close()
        browser = null // Prevent double close in finally



        // Single Transaction Write for ALL results
        // Filter out invalid results (must have price)
        const validResults = allProcessedResults.filter(r => r.price !== undefined && r.price !== null && !isNaN(Number(r.price)))

        if (validResults.length > 0) {
            console.log(`Writing ${validResults.length} results to database...`)
            await updateJobProgress(jobId, 98, 'Salvando resultados...')
            await prisma.$transaction(
                validResults.map(data => {
                    const { jobId, ...rest } = data
                    return prisma.searchResult.create({
                        data: {
                            ...rest,
                            job: { connect: { id: jobId } }
                        }
                    })
                })
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


