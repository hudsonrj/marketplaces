const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });

    // Common stealth headers
    const extraHTTPHeaders = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
    };

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
        extraHTTPHeaders
    });

    const productName = 'iphone 15';

    const testScraper = async (name, url, selector, extractFn) => {
        console.log(`\n--- Testing ${name} ---`);
        const page = await context.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait for selector if provided
            if (selector) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                } catch (e) {
                    console.log(`Timeout waiting for selector: ${selector}`);
                }
            }

            const title = await page.title();
            console.log(`Page Title: ${title.substring(0, 50)}...`);

            const items = await page.evaluate(extractFn);
            console.log(`Found: ${items.length} items`);
            if (items.length > 0) console.log('Sample:', items[0]);
            else {
                const content = await page.content();
                console.log(`Page content length: ${content.length}`);
                if (content.includes('Access Denied') || content.includes('CAPTCHA')) {
                    console.log('BLOCKED!');
                }
            }
        } catch (e) {
            console.error(`Error: ${e.message}`);
        } finally {
            await page.close();
        }
    };

    // 1. AMAZON
    await testScraper('AMAZON',
        `https://www.amazon.com.br/s?k=${encodeURIComponent(productName)}&rh=p_n_condition-type:13862762011`,
        'div[data-asin]',
        () => {
            const nodes = document.querySelectorAll('div[data-asin]:not([data-asin=""])');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('h2 span, span.a-text-normal')?.textContent?.trim(),
                price: n.querySelector('.a-price-whole')?.textContent
            })).filter(i => i.title && i.price);
        }
    );

    // 2. MAGALU
    await testScraper('MAGALU',
        `https://www.magazineluiza.com.br/busca/${encodeURIComponent(productName)}/`,
        '[data-testid="product-card-content"]',
        () => {
            const nodes = document.querySelectorAll('[data-testid="product-card-content"]');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('[data-testid="product-title"]')?.textContent?.trim(),
                price: n.querySelector('[data-testid="price-value"]')?.textContent
            }));
        }
    );

    // 3. CASAS BAHIA
    await testScraper('CASAS BAHIA',
        `https://www.casasbahia.com.br/${encodeURIComponent(productName)}/b`,
        '.product-card',
        () => {
            const nodes = document.querySelectorAll('.product-card');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('.product-card__title')?.textContent?.trim(),
                price: n.querySelector('.product-card__price')?.textContent
            }));
        }
    );

    // 4. KABUM
    await testScraper('KABUM',
        `https://www.kabum.com.br/busca?query=${encodeURIComponent(productName)}`,
        'article.productCard',
        () => {
            const nodes = document.querySelectorAll('article.productCard');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('span.nameCard')?.textContent?.trim(),
                price: n.querySelector('span.priceCard')?.textContent
            }));
        }
    );

    // 5. AMERICANAS
    await testScraper('AMERICANAS',
        `https://www.americanas.com.br/busca/${encodeURIComponent(productName)}`,
        'div[class*="product-grid-item"]',
        () => {
            const nodes = document.querySelectorAll('div[class*="product-grid-item"], div[class*="inStockCard"]');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('h3, span[class*="Title"]')?.textContent?.trim(),
                price: n.querySelector('span[class*="Price"]')?.textContent
            }));
        }
    );

    // 6. ALIEXPRESS
    await testScraper('ALIEXPRESS',
        `https://pt.aliexpress.com/wholesale?SearchText=${encodeURIComponent(productName)}`,
        '.list--gallery--34Gt4P8 > a',
        () => {
            const nodes = document.querySelectorAll('.list--gallery--34Gt4P8 > a, a[class*="search-card-item"]');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('.multi--titleText--nXeOvyr, h1')?.textContent?.trim(),
                price: n.querySelector('.multi--price-sale--U-S0jtj, div[class*="price"]')?.textContent
            }));
        }
    );

    await browser.close();
})();
