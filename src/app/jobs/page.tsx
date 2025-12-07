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
        resultsCount: job._count.results,
        results: []
    }))

    return <JobsDashboard initialJobs={jobs} products={products} />
}
