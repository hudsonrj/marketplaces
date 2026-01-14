const { PrismaClient } = require('@prisma/client');

// Test with different password encoding approaches
async function testConnections() {
    console.log('🔍 Testing database connections...\n');

    // Test Supabase - trying without URL encoding first
    console.log('📡 Testing Supabase with original password...');
    try {
        const supabase = new PrismaClient({
            datasources: {
                db: {
                    // Original password from .env: S0f1@@m0r23012015 (has double @)
                    url: 'postgresql://postgres.wsazsywdqddgdykkuwdq:S0f1%40%40m0r23012015@aws-0-us-east-2.pooler.supabase.com:6543/postgres'
                }
            }
        });
        await supabase.$connect();
        console.log('✅ Supabase connected with pooler URL!\n');

        // Test query
        const categories = await supabase.category.findMany();
        console.log(`   Found ${categories.length} categories`);

        await supabase.$disconnect();
        console.log('Supabase test complete.\n');

        return supabase;
    } catch (e) {
        console.log('❌ Supabase pooler connection failed:', e.message);
    }

    // Try direct connection
    console.log('\n📡 Testing Supabase direct connection...');
    try {
        const supabase2 = new PrismaClient({
            datasources: {
                db: {
                    url: 'postgresql://postgres:S0f1%40%40m0r23012015@db.wsazsywdqddgdykkuwdq.supabase.co:5432/postgres'
                }
            }
        });
        await supabase2.$connect();
        console.log('✅ Supabase direct connected!\n');
        await supabase2.$disconnect();
    } catch (e) {
        console.log('❌ Direct connection failed:', e.message);
    }
}

testConnections();
