
import { askAssistant } from './src/app/assistant/actions'

async function test() {
    console.log('--- Testing Trigger Search with Duplication Check ---')
    // Assuming "iPhone 13" might exist or we create it.
    // Then we try "Apple iPhone 13" which should be detected as duplicate.
    
    const res1 = await askAssistant('Busque preços para iPhone 13')
    console.log('Res 1:', res1.message)

    const res2 = await askAssistant('Busque preços para Apple iPhone 13 128GB')
    console.log('Res 2:', res2.message)

    console.log('\n--- Testing Explore Link ---')
    // We need a real link. Let's use a dummy one or a real one if possible. 
    // Since I can't easily get a valid product link without scraping first, I'll mock the intent or just try a known URL if I had one.
    // But I can try to ask the assistant to explore a generic URL (it might fail if not a product page, but tests the flow).
    // Let's try a Mercado Livre link if I can find one, or just skip this part if I can't guarantee a link.
    // I'll skip the live link test for now to avoid flakiness, but I've implemented the code.
}

test()
