'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { runScraper } from '@/lib/scraper'

const prisma = new PrismaClient()

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const weight = parseFloat(formData.get('weight') as string)
    const originCep = formData.get('originCep') as string

    await prisma.product.create({
        data: {
            name,
            description,
            costPrice,
            weight,
            originCep,
        },
    })

    revalidatePath('/products')
    redirect('/products')
}

export async function updateProduct(formData: FormData) {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const costPrice = parseFloat(formData.get('costPrice') as string)
    const weight = parseFloat(formData.get('weight') as string)
    const dimensions = formData.get('dimensions') as string
    const originCep = formData.get('originCep') as string

    await prisma.product.update({
        where: { id },
        data: {
            name,
            description,
            costPrice,
            weight,
            dimensions,
            originCep,
        },
    })

    revalidatePath('/products')
    redirect('/products')
}

export async function getProducts() {
    return await prisma.product.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function createSearchJob(productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new Error('Product not found')

    const job = await prisma.searchJob.create({
        data: {
            productId,
            status: 'PENDING',
        }
    })

    // Trigger async agent (fire and forget)
    // In production, this should be a queue (BullMQ/Redis)
    // For local dev, we just let it run in background
    setTimeout(() => {
        runScraper(job.id, product.name).catch(console.error)
    }, 100)

    revalidatePath('/jobs')
    redirect('/jobs')
}

export async function getJobs() {
    return await prisma.searchJob.findMany({
        include: {
            product: true,
            results: true
        },
        orderBy: { createdAt: 'desc' }
    })
}
