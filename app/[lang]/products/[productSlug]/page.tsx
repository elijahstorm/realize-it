'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/utils/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

// Data model and catalog for products supported in POC
// Each product includes basic specs and Printify coverage hints suitable for the POC.

type Color = { name: string; hex: string }

type ProductSpec = {
    slug: string
    name: string
    description: string
    baseCostUSD: number // base printify cost estimate
    materials: string[]
    colors: Color[]
    sizes: string[]
    images: string[]
    printify: {
        templates: { name: string; coverage: string }[]
        printAreas: { name: string; sizePx: string; dpi?: string }[]
        notes?: string
    }
    care: string[]
}

const CATALOG: ProductSpec[] = [
    {
        slug: 't-shirt',
        name: 'Classic T‑Shirt',
        description:
            'Soft, everyday tee with a modern retail fit. Perfect canvas for vibrant AI‑generated art.',
        baseCostUSD: 9.75,
        materials: [
            '100% combed & ring‑spun cotton (heathers: cotton/polyester)',
            'Fabric weight: 4.2 oz/yd²',
        ],
        colors: [
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Black', hex: '#000000' },
            { name: 'Heather Grey', hex: '#9AA0A6' },
            { name: 'Navy', hex: '#14213D' },
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
        images: [
            'https://images.unsplash.com/photo-1620799139505-1c5300f1f4bb?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1548883354-88d5c5d7b5c3?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1520975934081-4f6811412ad2?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [
                { name: 'Bella+Canvas 3001', coverage: 'Front/Back center print' },
                { name: 'Gildan 5000', coverage: 'Front/Back center print' },
            ],
            printAreas: [
                { name: 'Front', sizePx: '4500 × 5400 px', dpi: '300 DPI' },
                { name: 'Back', sizePx: '4500 × 5400 px', dpi: '300 DPI' },
            ],
            notes: 'Best results with transparent PNG, RGB color space.',
        },
        care: [
            'Machine wash cold, inside‑out',
            'Tumble dry low or hang dry',
            'Do not iron directly on the design',
        ],
    },
    {
        slug: 'hoodie',
        name: 'Fleece Hoodie',
        description: 'Warm fleece hoodie with spacious front pocket and durable print area.',
        baseCostUSD: 20.5,
        materials: ['Cotton/Poly fleece blend', 'Midweight 8.0 oz'],
        colors: [
            { name: 'Black', hex: '#000000' },
            { name: 'Charcoal', hex: '#36454F' },
            { name: 'Heather Grey', hex: '#9AA0A6' },
            { name: 'Navy', hex: '#14213D' },
        ],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        images: [
            'https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [
                { name: 'Gildan 18500', coverage: 'Front/Back center print' },
                { name: 'Independent SS4500', coverage: 'Front/Back center print' },
            ],
            printAreas: [
                { name: 'Front', sizePx: '4500 × 5100 px', dpi: '300 DPI' },
                { name: 'Back', sizePx: '4500 × 5100 px', dpi: '300 DPI' },
            ],
            notes: 'Avoid placing important details near seams/pocket.',
        },
        care: ['Machine wash warm', 'Tumble dry low', 'Do not bleach'],
    },
    {
        slug: 'socks',
        name: 'Crew Socks',
        description: 'Comfortable crew socks with vibrant all‑over print coverage.',
        baseCostUSD: 7.2,
        materials: ['Polyester/Spandex blend', 'Cushioned footbed'],
        colors: [{ name: 'White', hex: '#FFFFFF' }],
        sizes: ['M', 'L'],
        images: [
            'https://images.unsplash.com/photo-1556306535-abccb0c2cfb3?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1542219550-37153d387c37?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'All‑over Socks', coverage: 'Full wrap, mirrored seam' }],
            printAreas: [{ name: 'All‑over', sizePx: 'Large template (varies)', dpi: '300 DPI' }],
            notes: 'Keep critical elements away from seam areas.',
        },
        care: ['Machine wash cold', 'Do not dry clean', 'Do not iron'],
    },
    {
        slug: 'mug',
        name: 'Ceramic Mug',
        description: 'Dishwasher‑safe ceramic mug with wraparound print.',
        baseCostUSD: 4.25,
        materials: ['Ceramic', 'Glossy finish'],
        colors: [
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Black', hex: '#000000' },
        ],
        sizes: ['11oz', '15oz'],
        images: [
            'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Ceramic Mug', coverage: 'Wrap print (left/right view)' }],
            printAreas: [{ name: 'Wrap', sizePx: '2700 × 1050 px', dpi: '300 DPI' }],
            notes: 'Keep text ≥ 0.25 in from edges.',
        },
        care: ['Dishwasher safe (top rack)', 'Microwave safe'],
    },
    {
        slug: 'canvas',
        name: 'Wrapped Canvas',
        description: 'Gallery‑wrapped canvas with vivid color reproduction.',
        baseCostUSD: 19.0,
        materials: ['Poly‑cotton canvas', 'Solid wood frame'],
        colors: [{ name: 'Natural', hex: '#F8F8F8' }],
        sizes: ['12×16', '16×20', '24×36'],
        images: [
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Canvas Gallery Wrap', coverage: 'Front (wrapped edges)' }],
            printAreas: [{ name: 'Front', sizePx: 'Varies by size', dpi: '300 DPI' }],
            notes: 'Extend background for wrapped edges (bleed).',
        },
        care: ['Dust with dry cloth', 'Avoid direct sunlight'],
    },
    {
        slug: 'blanket',
        name: 'Plush Blanket',
        description: 'Ultra‑soft throw blanket with all‑over print.',
        baseCostUSD: 24.0,
        materials: ['100% polyester plush'],
        colors: [{ name: 'White', hex: '#FFFFFF' }],
        sizes: ['50×60', '60×80'],
        images: [
            'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Plush Blanket', coverage: 'All‑over front print' }],
            printAreas: [{ name: 'All‑over', sizePx: 'Varies by size', dpi: '300 DPI' }],
            notes: 'Large, seamless backgrounds work best.',
        },
        care: ['Machine wash cold', 'Tumble dry low'],
    },
    {
        slug: 'phone-case',
        name: 'Phone Case',
        description: 'Protective case with edge‑to‑edge print on back.',
        baseCostUSD: 10.0,
        materials: ['Polycarbonate (shell)', 'TPU (bumper)'],
        colors: [
            { name: 'Clear', hex: '#F1F5F9' },
            { name: 'Black', hex: '#000000' },
        ],
        sizes: ['iPhone 13', 'iPhone 14', 'Galaxy S22'],
        images: [
            'https://images.unsplash.com/photo-1579886532841-84f7a2a8b3b9?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1544198365-3c4b3cd3e1ad?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Tough/Glossy Case', coverage: 'Back (edge‑to‑edge)' }],
            printAreas: [{ name: 'Back', sizePx: 'Varies by model', dpi: '300 DPI' }],
            notes: 'Account for camera cutout; keep key details centered.',
        },
        care: ['Wipe with damp cloth', 'Avoid harsh solvents'],
    },
    {
        slug: 'tote',
        name: 'Cotton Tote',
        description: 'Durable tote with reinforced stitching and crisp print.',
        baseCostUSD: 9.0,
        materials: ['100% cotton', 'Heavyweight canvas'],
        colors: [
            { name: 'Natural', hex: '#F5F5F0' },
            { name: 'Black', hex: '#000000' },
        ],
        sizes: ['One Size'],
        images: [
            'https://images.unsplash.com/photo-1593030668930-8130abedb5c6?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1618354691438-25bc04584de9?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Cotton Tote', coverage: 'Front/Back large area' }],
            printAreas: [
                { name: 'Front', sizePx: '4200 × 4800 px', dpi: '300 DPI' },
                { name: 'Back', sizePx: '4200 × 4800 px', dpi: '300 DPI' },
            ],
            notes: 'Use high‑contrast designs for Natural color.',
        },
        care: ['Spot clean if possible', 'Machine wash cold, gentle', 'Air dry'],
    },
    {
        slug: 'stickers',
        name: 'Die‑Cut Stickers',
        description: 'Water‑resistant, durable vinyl stickers in multiple sizes.',
        baseCostUSD: 1.5,
        materials: ['Premium vinyl', 'Matte or glossy'],
        colors: [{ name: 'White', hex: '#FFFFFF' }],
        sizes: ['3"', '4"', '6"'],
        images: [
            'https://images.unsplash.com/photo-1512847936825-6cbb7295b4fd?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1541245931678-c4e4302b1ec8?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Die‑Cut Stickers', coverage: 'Full design within cut line' }],
            printAreas: [{ name: 'Front', sizePx: 'Varies by size', dpi: '300 DPI' }],
            notes: 'Use solid stroke for cut line; avoid super fine details.',
        },
        care: ['Wipe clean', 'Avoid prolonged submersion'],
    },
    {
        slug: 'journal',
        name: 'Hardcover Journal',
        description: 'Premium hardcover journal with wrap cover print.',
        baseCostUSD: 10.5,
        materials: ['Hardcover, matte laminate', '140 lined pages'],
        colors: [{ name: 'Black', hex: '#000000' }],
        sizes: ['A5'],
        images: [
            'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1200&auto=format&fit=crop',
        ],
        printify: {
            templates: [{ name: 'Hardcover Journal A5', coverage: 'Full wrap (front/back/spine)' }],
            printAreas: [{ name: 'Wrap', sizePx: '1748 × 2480 px (per cover)', dpi: '300 DPI' }],
            notes: 'Mind the spine; extend background for bleed.',
        },
        care: ['Wipe clean with dry cloth'],
    },
]

function findProduct(slug: string): ProductSpec | undefined {
    return CATALOG.find((p) => p.slug === slug)
}

function ProductNotFound({ lang }: { lang: string }) {
    return (
        <div className="mx-auto max-w-5xl p-6">
            <Alert className="bg-destructive/10 text-destructive-foreground border-destructive">
                <AlertTitle>Product unavailable</AlertTitle>
                <AlertDescription>
                    We couldn’t find that product. Try browsing our catalog or reach out for help.
                </AlertDescription>
            </Alert>
            <div className="mt-6 flex flex-wrap gap-3">
                <Link
                    href={`/${lang}/products`}
                    className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 shadow transition hover:brightness-105"
                >
                    Browse all products
                </Link>
                <Link
                    href={`/${lang}//help`}
                    className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 transition"
                >
                    Help center
                </Link>
                <Link
                    href={`/${lang}//contact`}
                    className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 transition"
                >
                    Contact us
                </Link>
            </div>
        </div>
    )
}

function ColorSwatch({
    color,
    selected,
    onClick,
}: {
    color: Color
    selected: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={color.name}
            className={cn(
                'h-9 w-9 rounded-full border transition focus:outline-none',
                selected ? 'ring-primary ring-2 ring-offset-2' : 'ring-0',
                'border-border'
            )}
            style={{ backgroundColor: color.hex }}
        />
    )
}

function SizePill({
    size,
    selected,
    onClick,
}: {
    size: string
    selected: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'min-w-[3rem] rounded-md border px-3 py-2 text-sm transition',
                selected
                    ? 'bg-primary text-primary-foreground border-primary shadow'
                    : 'bg-card text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            )}
        >
            {size}
        </button>
    )
}

export default function ProductDetailPage() {
    const { lang, productSlug } = useParams() as { lang: string; productSlug: string }
    const product = useMemo(() => findProduct(productSlug), [productSlug])
    const router = useRouter()
    const { toast } = useToast()

    const [selectedColor, setSelectedColor] = useState<Color | null>(null)
    const [selectedSize, setSelectedSize] = useState<string | null>(null)

    if (!product) return <ProductNotFound lang={lang} />

    const retailUSD = (product.baseCostUSD * 1.2).toFixed(2)

    const handleStart = () => {
        if (!selectedSize || !selectedColor) {
            toast({
                title: 'Select options',
                description: 'Please choose a color and size to continue.',
            })
            return
        }
        const href = `/${lang}/design?product=${encodeURIComponent(product.slug)}&size=${encodeURIComponent(
            selectedSize
        )}&color=${encodeURIComponent(selectedColor.name)}`
        router.push(href)
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <nav className="text-muted-foreground mb-6 text-sm">
                <Link href={`/${lang}`} className="hover:text-foreground">
                    Home
                </Link>
                <span className="mx-2">/</span>
                <Link href={`/${lang}/products`} className="hover:text-foreground">
                    Products
                </Link>
                <span className="mx-2">/</span>
                <span className="text-foreground">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
                    <Carousel className="relative">
                        <CarouselContent>
                            {product.images.map((src, idx) => (
                                <CarouselItem
                                    key={idx}
                                    className="flex items-center justify-center"
                                >
                                    <img
                                        src={src}
                                        alt={`${product.name} preview ${idx + 1}`}
                                        className="h-[420px] w-full rounded-lg object-cover sm:h-[520px]"
                                        loading="lazy"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute top-1/2 left-3 -translate-y-1/2" />
                        <CarouselNext className="absolute top-1/2 right-3 -translate-y-1/2" />
                    </Carousel>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {product.images.slice(0, 6).map((src, idx) => (
                            <img
                                key={`thumb-${idx}`}
                                src={src}
                                alt={`${product.name} thumbnail ${idx + 1}`}
                                className="h-24 w-full rounded-md object-cover"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            {product.name}
                        </h1>
                        <p className="text-muted-foreground mt-2">{product.description}</p>
                        <div className="bg-muted text-muted-foreground mt-3 inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs">
                            <span>Auto‑markup</span>
                            <span className="bg-primary inline-block h-1.5 w-1.5 rounded-full" />
                            <span>20%</span>
                        </div>
                        <div className="mt-4 text-sm">
                            <span className="text-foreground font-medium">Est. base cost:</span>{' '}
                            <span className="text-foreground">
                                ${product.baseCostUSD.toFixed(2)} USD
                            </span>
                            <span className="text-muted-foreground mx-2">•</span>
                            <span className="text-foreground font-medium">Est. retail:</span>{' '}
                            <span className="text-foreground">${retailUSD} USD</span>
                            <div className="text-muted-foreground text-xs">
                                Excludes shipping/tax. KR fulfillment via Printify partners.
                            </div>
                        </div>
                    </div>

                    <Alert className="bg-primary/10 border-primary/20">
                        <AlertTitle className="text-foreground">AI‑only designs</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            This POC enforces AI‑generated artwork only—no manual uploads. You’ll
                            approve a design before checkout. Learn more in our{' '}
                            <Link
                                href={`/${lang}//help`}
                                className="hover:text-foreground underline underline-offset-2"
                            >
                                Help Center
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>

                    <div>
                        <h2 className="text-foreground text-sm font-medium">Colors</h2>
                        <div className="mt-3 flex flex-wrap gap-3">
                            {product.colors.map((c) => (
                                <div key={c.name} className="flex flex-col items-center gap-1">
                                    <ColorSwatch
                                        color={c}
                                        selected={selectedColor?.name === c.name}
                                        onClick={() => setSelectedColor(c)}
                                    />
                                    <span className="text-muted-foreground text-xs">{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-foreground text-sm font-medium">Sizes</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {product.sizes.map((s) => (
                                <SizePill
                                    key={s}
                                    size={s}
                                    selected={selectedSize === s}
                                    onClick={() => setSelectedSize(s)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={handleStart}
                            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!selectedColor || !selectedSize}
                        >
                            Start with this product
                        </button>
                        <Link
                            href={`/${lang}/products`}
                            className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-5 py-3 text-sm font-medium transition"
                        >
                            Browse all products
                        </Link>
                        <Link
                            href={`/${lang}/design`}
                            className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-5 py-3 text-sm font-medium transition"
                        >
                            Open Design Studio
                        </Link>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="border-border bg-card rounded-lg border p-4">
                            <h3 className="text-sm font-medium">Materials</h3>
                            <ul className="text-muted-foreground mt-2 list-inside list-disc text-sm">
                                {product.materials.map((m) => (
                                    <li key={m}>{m}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="border-border bg-card rounded-lg border p-4">
                            <h3 className="text-sm font-medium">Care</h3>
                            <ul className="text-muted-foreground mt-2 list-inside list-disc text-sm">
                                {product.care.map((c) => (
                                    <li key={c}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <Collapsible>
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Size & Fit Guide</h3>
                            <CollapsibleTrigger className="text-primary text-sm underline-offset-4 hover:underline">
                                Toggle
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="border-border bg-card mt-3 rounded-lg border p-3">
                            <Table className="text-sm">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">Size</TableHead>
                                        <TableHead>Fit Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {product.sizes.map((s) => (
                                        <TableRow key={`row-${s}`}>
                                            <TableCell className="font-medium">{s}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                True to size. For an oversized fit, consider 1 size
                                                up.
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="text-muted-foreground mt-3 text-xs">
                                Need help choosing? See our{' '}
                                <Link
                                    href={`/${lang}//help/sizing`}
                                    className="hover:text-foreground underline underline-offset-2"
                                >
                                    full sizing guide
                                </Link>
                                .
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                        <div className="mt-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Printify Specs</h3>
                            <CollapsibleTrigger className="text-primary text-sm underline-offset-4 hover:underline">
                                Toggle
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="border-border bg-card mt-3 rounded-lg border p-3">
                            <h4 className="text-sm font-medium">Templates</h4>
                            <ul className="text-muted-foreground mt-1 list-inside list-disc text-sm">
                                {product.printify.templates.map((t) => (
                                    <li key={t.name}>
                                        {t.name} — {t.coverage}
                                    </li>
                                ))}
                            </ul>
                            <h4 className="mt-3 text-sm font-medium">Print Areas</h4>
                            <ul className="text-muted-foreground mt-1 list-inside list-disc text-sm">
                                {product.printify.printAreas.map((a) => (
                                    <li key={a.name}>
                                        {a.name}: {a.sizePx} {a.dpi && `— ${a.dpi}`}
                                    </li>
                                ))}
                            </ul>
                            {product.printify.notes && (
                                <p className="text-muted-foreground mt-3 text-xs">
                                    {product.printify.notes}
                                </p>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                </section>
            </div>
        </div>
    )
}
