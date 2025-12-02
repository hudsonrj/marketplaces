import { askAssistant } from './src/app/assistant/actions'

async function test() {
    console.log('Testing Assistant with query: "busque precos do iphone 17 pro max na shopee"')
    const result = await askAssistant('busque precos do iphone 17 pro max na shopee')
    console.log('Result:', result)
}

test()
