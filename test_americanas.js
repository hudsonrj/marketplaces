const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'pt-BR'
    });
    const page = await context.newPage();

    console.log('Testing AMERICANAS...');
    await page.goto('https://www.americanas.com.br/busca/iphone-15', { waitUntil: 'domcontentloaded' });

    // Wait for some content
    try {
        await page.waitForSelector('a[href*="/produto/"]', { timeout: 10000 });
    } catch (e) {
        console.log('Timeout waiting for product links');
    }

    const items = await page.evaluate(() => {
        // Try to find product cards by looking for links containing "/produto/"
        const links = Array.from(document.querySelectorAll('a[href*="/produto/"]'));
        return links.map(a => {
            // Go up to find the container
            const container = a.closest('div[class*="col-"], div[class*="grid-item"]');
            // Or just extract from the link element itself if it contains title/price
            const title = a.querySelector('h3, span[class*="Title"]')?.textContent || a.innerText;
            const price = a.querySelector('span[class*="Price"]')?.textContent ||
                a.parentElement?.querySelector('span[class*="Price"]')?.textContent;

            return { title, price, href: a.href };
        }).slice(0, 5); // Just first 5
    });

    console.log(`Found ${items.length} potential items`);
    console.log('Sample:', items[0]);

    await browser.close();
})();
