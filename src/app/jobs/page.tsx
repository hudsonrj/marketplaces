import { getJobs, getProducts } from '../actions'
import JobsDashboard from './JobsDashboard'

export default async function JobsPage() {
    const rawJobs = await getJobs()
    const rawProducts = await getProducts()
    const products = rawProducts.map(p => ({
        id: p.id,
        name: p.name
    }))

    const jobs = rawJobs.map(job => ({
        id: job.id,
        productId: job.productId,
        status: job.status,
        createdAt: job.createdAt,
        scheduledFor: job.scheduledFor,
        product: {
            name: job.product.name
        },
        results: job.results.map(r => ({
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
            collectedAt: r.collectedAt
        }))
    }))

    return <JobsDashboard initialJobs={jobs} products={products} />
}
