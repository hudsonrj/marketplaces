import { getJobs, getProducts } from '../actions'
import JobsDashboard from './JobsDashboard'

export default async function JobsPage() {
    const rawJobs = await getJobs()
    const rawProducts = await getProducts()
    const products = rawProducts.map(p => ({
        id: p.id,
        name: p.name
    }))

    const jobs = rawJobs.map((job: any) => ({
        id: job.id,
        productId: job.productId,
        status: job.status,
        progress: job.progress,
        logs: job.logs,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        scheduledFor: job.scheduledFor ? job.scheduledFor.toISOString() : null,
        product: {
            name: job.product.name
        },
        results: job.results.map((r: any) => ({
            id: r.id,
            jobId: r.jobId,
            marketplace: r.marketplace,
            title: r.title,
            price: Number(r.price),
            shipping: r.shipping ? Number(r.shipping) : null,
            link: r.link,
            sellerName: r.sellerName,
            sellerLocation: r.sellerLocation,
            sellerRating: r.sellerRating,
            imageUrl: r.imageUrl,
            matchScore: r.matchScore,
            matchReasoning: r.matchReasoning,
            normalizedName: r.normalizedName,
            city: r.city,
            state: r.state,
            installments: r.installments,
            quantitySold: r.quantitySold,
            reviewScore: r.reviewScore,
            collectedAt: r.collectedAt.toISOString()
        }))
    }))

    return <JobsDashboard initialJobs={jobs} products={products} />
}
