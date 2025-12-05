const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
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
            'Referer': 'https://www.google.com/',
            'Origin': 'https://www.casasbahia.com.br'
        }
    });
    const page = await context.newPage();

    console.log('Testing CASAS BAHIA...');
    try {
        await page.goto('https://www.casasbahia.com.br/iphone-15/b', { waitUntil: 'domcontentloaded' });

        const title = await page.title();
        console.log('Page Title:', title);

        const items = await page.evaluate(() => {
            const nodes = document.querySelectorAll('.product-card');
            return Array.from(nodes).map(n => ({
                title: n.querySelector('.product-card__title')?.textContent?.trim(),
                price: n.querySelector('.product-card__price')?.textContent
            }));
        });

        console.log(`Casas Bahia found: ${items.length} items`);
        if (items.length > 0) console.log('Sample:', items[0]);
        else {
            // Debug: check for other selectors
            const links = await page.evaluate(() => document.querySelectorAll('a').length);
            console.log(`Found ${links} links.`);
            const body = await page.content();
            console.log('Body length:', body.length);
        }

    } catch (e) {
        console.error('Casas Bahia Error:', e.message);
    }

    await browser.close();
})();
