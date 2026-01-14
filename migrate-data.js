const { PrismaClient } = require('@prisma/client');

// Source database (Supabase) - password encoded: S0f1@@m0r23012015 -> S0f1%40%40m0r23012015
const sourceClient = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:S0f1%40%40m0r23012015@db.wsazsywdqddgdykkuwdq.supabase.co:5432/postgres'
        }
    }
});

// Target database (RDS)
const targetClient = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:Z5rMBUbnTMVnUrYoxRT9@marketplace-ai-dev.c3m6muw866nv.us-east-2.rds.amazonaws.com:5432/postgres'
        }
    }
});

async function migrate() {
    console.log('🚀 Starting data migration from Supabase to RDS...\n');

    try {
        // Test connections
        console.log('📡 Testing Supabase connection...');
        await sourceClient.$connect();
        console.log('✅ Supabase connected!\n');

        console.log('📡 Testing RDS connection...');
        await targetClient.$connect();
        console.log('✅ RDS connected!\n');

        // Migrate Products (no Category model in schema)
        console.log('📦 Migrating Products...');
        const products = await sourceClient.product.findMany();
        console.log(`   Found ${products.length} products`);
        for (const product of products) {
            try {
                await targetClient.product.upsert({
                    where: { id: product.id },
                    update: product,
                    create: product
                });
            } catch (e) {
                console.log(`   ⚠️ Product ${product.id}: ${e.message}`);
            }
        }
        console.log('✅ Products migrated!\n');

        // Migrate SearchJobs
        console.log('📦 Migrating SearchJobs...');
        const searchJobs = await sourceClient.searchJob.findMany();
        console.log(`   Found ${searchJobs.length} search jobs`);
        for (const job of searchJobs) {
            try {
                await targetClient.searchJob.upsert({
                    where: { id: job.id },
                    update: job,
                    create: job
                });
            } catch (e) {
                console.log(`   ⚠️ SearchJob ${job.id}: ${e.message}`);
            }
        }
        console.log('✅ SearchJobs migrated!\n');

        // Migrate SearchResults
        console.log('📦 Migrating SearchResults...');
        const searchResults = await sourceClient.searchResult.findMany();
        console.log(`   Found ${searchResults.length} search results`);
        let resultCount = 0;
        for (const result of searchResults) {
            try {
                await targetClient.searchResult.upsert({
                    where: { id: result.id },
                    update: result,
                    create: result
                });
                resultCount++;
                if (resultCount % 100 === 0) {
                    console.log(`   Processed ${resultCount}/${searchResults.length} results...`);
                }
            } catch (e) {
                console.log(`   ⚠️ SearchResult ${result.id}: ${e.message}`);
            }
        }
        console.log('✅ SearchResults migrated!\n');

        // Migrate Settings
        console.log('📦 Migrating Settings...');
        const settings = await sourceClient.settings.findMany();
        console.log(`   Found ${settings.length} settings`);
        for (const setting of settings) {
            try {
                await targetClient.settings.upsert({
                    where: { id: setting.id },
                    update: setting,
                    create: setting
                });
            } catch (e) {
                console.log(`   ⚠️ Settings ${setting.id}: ${e.message}`);
            }
        }
        console.log('✅ Settings migrated!\n');

        // Migrate AnalysisCache
        console.log('📦 Migrating AnalysisCache...');
        const caches = await sourceClient.analysisCache.findMany();
        console.log(`   Found ${caches.length} cache entries`);
        for (const cache of caches) {
            try {
                await targetClient.analysisCache.upsert({
                    where: { id: cache.id },
                    update: cache,
                    create: cache
                });
            } catch (e) {
                console.log(`   ⚠️ AnalysisCache ${cache.id}: ${e.message}`);
            }
        }
        console.log('✅ AnalysisCache migrated!\n');

        console.log('🎉 Migration completed successfully!');

        // Summary
        console.log('\n📊 Migration Summary:');
        console.log(`   Products: ${products.length}`);
        console.log(`   SearchJobs: ${searchJobs.length}`);
        console.log(`   SearchResults: ${searchResults.length}`);
        console.log(`   Settings: ${settings.length}`);
        console.log(`   AnalysisCache: ${caches.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sourceClient.$disconnect();
        await targetClient.$disconnect();
    }
}

migrate();
