import { prisma } from '@/lib/prisma'
import ProductsDashboard from './ProductsDashboard'

async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { searchJobs: true } }
        }
    })
}

export default async function ProductsPage() {
    const rawProducts = await getProducts()

    const products = rawProducts.map(p => ({
        ...p,
        costPrice: Number(p.costPrice),
        weight: p.weight ? Number(p.weight) : 0,
        lastBestPrice: p.lastBestPrice ? Number(p.lastBestPrice) : null
    }))

    return <ProductsDashboard initialProducts={products} />
}
