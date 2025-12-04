import { getJobs, getProducts } from '../actions'
import JobsDashboard from './JobsDashboard'

export default async function JobsPage() {
    const rawJobs = await getJobs()
    const products = await getProducts()

    const jobs = rawJobs.map(job => ({
        ...job,
        results: job.results.map(r => ({
            ...r,
            price: Number(r.price),
            shipping: r.shipping ? Number(r.shipping) : null
        }))
    }))

    return <JobsDashboard initialJobs={jobs} products={products} />
}
