const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
    console.log('--- INICIANDO DIAGNÓSTICO COMPLETO DO SISTEMA ---');

    // 1. Verificar Banco de Dados
    try {
        const productCount = await prisma.product.count();
        console.log(`[DB] Conexão OK. Produtos cadastrados: ${productCount}`);

        const settings = await prisma.settings.findFirst();
        console.log(`[DB] Configurações carregadas.`);
        console.log(`[DB] Provedor IA: ${settings?.aiProvider}`);
        console.log(`[DB] Proxy Configurado: ${settings?.proxyUrl ? 'SIM' : 'NÃO'}`);
    } catch (e) {
        console.error('[DB] ERRO CRÍTICO DE BANCO DE DADOS:', e.message);
        process.exit(1);
    }

    // 2. Testar Scrapers (Simulação Real)
    const browser = await chromium.launch({ headless: true });

    // Configuração Stealth (igual ao scraper.ts)
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        locale: 'pt-BR',
        timezoneId: 'America/Sao_Paulo',
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
            'Cache-Control': 'max-age=0'
        }
    });

    const productName = 'iphone 15';
    console.log(`\n[SCRAPER] Testando busca por: "${productName}"`);

    const testSite = async (name, url, selector) => {
        const page = await context.newPage();
        try {
            console.log(`[${name}] Acessando ${url}...`);
            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            if (response.status() === 403 || response.status() === 503) {
                console.log(`[${name}] ❌ BLOQUEADO (Status ${response.status()})`);
                return;
            }

            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector);

                if (count > 0) {
                    console.log(`[${name}] ✅ SUCESSO: ${count} itens encontrados.`);
                } else {
                    console.log(`[${name}] ⚠️ ALERTA: Página carregou mas seletor retornou 0 itens.`);
                    // Debug: print title
                    const title = await page.title();
                    console.log(`[${name}] Título da página: ${title}`);
                }
            } catch (e) {
                console.log(`[${name}] ❌ FALHA: Timeout aguardando seletor.`);
                const title = await page.title();
                console.log(`[${name}] Título da página: ${title}`);
            }

        } catch (e) {
            console.error(`[${name}] ❌ ERRO DE CONEXÃO: ${e.message}`);
        } finally {
            await page.close();
        }
    };

    // Executar Testes
    await testSite('MERCADO LIVRE', `https://lista.mercadolivre.com.br/${encodeURIComponent(productName)}_ItemTypeID_2230284_OrderId_PRICE_ASC`, '.ui-search-layout__item');
    await testSite('AMAZON', `https://www.amazon.com.br/s?k=${encodeURIComponent(productName)}&rh=p_n_condition-type:13862762011`, 'div[data-asin]');
    await testSite('MAGALU', `https://www.magazineluiza.com.br/busca/${encodeURIComponent(productName)}/`, '[data-testid="product-card-content"]');
    await testSite('SHOPEE', `https://shopee.com.br/search?keyword=${encodeURIComponent(productName)}`, '.shopee-search-item-result__item');
    await testSite('CASAS BAHIA', `https://www.casasbahia.com.br/${encodeURIComponent(productName)}/b`, '.product-card, [class*="ProductCard"]');
    await testSite('AMERICANAS', `https://www.americanas.com.br/busca/${encodeURIComponent(productName)}`, 'a[href*="/produto/"]');
    await testSite('KABUM', `https://www.kabum.com.br/busca?query=${encodeURIComponent(productName)}`, 'article.productCard');

    console.log('\n--- DIAGNÓSTICO FINALIZADO ---');
    await browser.close();
})();
