import { analyzeProductMatch } from './src/lib/ai'

async function testAI() {
    console.log('Testing AI...')
    const result = await analyzeProductMatch(
        { name: 'iPhone 13', description: 'Smartphone Apple' },
        { title: 'iPhone 13 128GB Midnight', price: 4000, link: 'http://test.com', rawLocation: 'São Paulo, SP' }
    )
    console.log('AI Result:', result)
}

testAI()
