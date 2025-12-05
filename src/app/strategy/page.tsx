import { prisma } from '@/lib/prisma'
import PricingStrategyDashboard from './PricingDashboard'

export const dynamic = 'force-dynamic'

export default async function StrategyPage() {
    const products = await prisma.product.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            costPrice: true,
            weight: true,
            dimensions: true,
            originCep: true
        }
    })

    const serializedProducts = products.map(p => ({
        ...p,
        costPrice: Number(p.costPrice)
    }))

    return <PricingStrategyDashboard products={serializedProducts} />
}
