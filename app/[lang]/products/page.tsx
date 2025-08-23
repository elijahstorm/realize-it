'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useMemo, useState } from 'react'

type Product = {
    slug: string
    name: string
    summary: string
    badges?: string[]
    baseColors?: string[]
    aspect?: string
    dpi?: string
}

const PRODUCTS: Product[] = [
    {
        slug: 't-shirt',
        name: 'T‑Shirt',
        summary: 'Premium cotton tees with front/back print. Perfect for bold, centered graphics.',
        badges: ['Apparel', 'Unisex', 'Best Seller'],
        baseColors: ['white', 'black', 'heather'],
        aspect: '1:1 or 3:4',
        dpi: '300 DPI',
    },
    {
        slug: 'hoodie',
        name: 'Hoodie',
        summary: 'Cozy fleece hoodies. Aim for larger artwork and strong contrast.',
        badges: ['Apparel', 'Fall/Winter'],
        baseColors: ['black', 'navy', 'gray'],
        aspect: '3:4',
        dpi: '300 DPI',
    },
    {
        slug: 'socks',
        name: 'Socks',
        summary: 'All-over print socks. Repeating patterns and small motifs shine.',
        badges: ['All‑over', 'Pattern'],
        baseColors: ['white'],
        aspect: '9:16',
        dpi: '300 DPI',
    },
    {
        slug: 'mug',
        name: 'Mug',
        summary: 'Ceramic mugs. Horizontal wraps or two‑side prints look great.',
        badges: ['Home', 'Gift'],
        baseColors: ['white'],
        aspect: '3:1',
        dpi: '300 DPI',
    },
    {
        slug: 'canvas',
        name: 'Canvas',
        summary: 'Gallery‑wrapped canvas prints. Go high‑res with dramatic visuals.',
        badges: ['Wall Art', 'HD'],
        baseColors: ['—'],
        aspect: 'Varies (1:1 / 4:5 / 2:3)',
        dpi: '300 DPI',
    },
    {
        slug: 'blanket',
        name: 'Blanket',
        summary: 'Soft fleece blankets. Large formats for cozy, immersive designs.',
        badges: ['Home', 'All‑over'],
        baseColors: ['white', 'cream'],
        aspect: '4:3 or 1:1',
        dpi: '300 DPI',
    },
    {
        slug: 'phone-case',
        name: 'Phone Case',
        summary: 'Slim & tough cases. Keep key elements centered with safe margins.',
        badges: ['Accessory', 'Matte/Gloss'],
        baseColors: ['clear', 'black'],
        aspect: '9:19',
        dpi: '300 DPI',
    },
    {
        slug: 'tote',
        name: 'Tote Bag',
        summary: 'Durable totes. Crisp vector or bold typographic designs pop.',
        badges: ['Accessory', 'Eco'],
        baseColors: ['natural', 'black'],
        aspect: '1:1 or 3:4',
        dpi: '300 DPI',
    },
    {
        slug: 'stickers',
        name: 'Stickers',
        summary: 'Die‑cut & kiss‑cut stickers. High‑contrast, clean edges recommended.',
        badges: ['Pack', 'Matte/Gloss'],
        baseColors: ['—'],
        aspect: 'Varies',
        dpi: '300 DPI',
    },
    {
        slug: 'journal',
        name: 'Journal',
        summary: 'Hardcover journals. Seamless covers with spine‑aware layouts.',
        badges: ['Stationery', 'Gift'],
        baseColors: ['black', 'navy', 'maroon'],
        aspect: '2:3',
        dpi: '300 DPI',
    },
]

export default function ProductsPage() {
    const params = useParams<{ lang?: string }>()
    const lang = params?.lang ?? 'en'
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [badgeFilter, setBadgeFilter] = useState<string | null>(null)
    const searchParams = useSearchParams()

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return PRODUCTS.filter((p) => {
            const inText = !q
                ? true
                : [p.name, p.summary, p.slug, ...(p.badges ?? []), ...(p.baseColors ?? [])]
                      .join(' ')
                      .toLowerCase()
                      .includes(q)
            const inBadge = badgeFilter ? (p.badges ?? []).includes(badgeFilter) : true
            return inText && inBadge
        })
    }, [query, badgeFilter])

    const allBadges = useMemo(() => {
        const set = new Set<string>()
        for (const p of PRODUCTS) (p.badges ?? []).forEach((b) => set.add(b))
        return Array.from(set).sort()
    }, [])

    const build = (path: string) => `/${lang}${path}`

    return (
        <main className="bg-background text-foreground min-h-screen">
            <section className="border-border from-muted/40 to-background border-b bg-gradient-to-b">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                Catalog
                            </h1>
                            <p className="text-muted-foreground mt-2 max-w-2xl">
                                Explore AI‑ready products. Pick a type to view details or jump
                                straight into design. All orders are auto‑fulfilled via Printify
                                with a simple, secure checkout.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href={build('/design')}
                                className="bg-primary text-primary-foreground focus:ring-ring inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-90 focus:ring-2 focus:outline-none"
                            >
                                Start new design
                            </Link>
                            <Link
                                href={build('/cart')}
                                className="border-input bg-background hover:bg-muted focus:ring-ring inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium focus:ring-2 focus:outline-none"
                            >
                                View cart
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Carousel className="w-full">
                            <CarouselContent>
                                <CarouselItem className="basis-full md:basis-1/2 lg:basis-1/3">
                                    <PromoCard
                                        title="Tees to hoodies"
                                        description="Kick off with apparel best‑sellers."
                                        hrefPrimary={build(
                                            '/design?product=t-shirt&intent=design&source=catalog-hero'
                                        )}
                                        hrefSecondary={build('/products/t-shirt')}
                                        gradient="from-chart-1/30 via-primary/10 to-transparent"
                                    />
                                </CarouselItem>
                                <CarouselItem className="basis-full md:basis-1/2 lg:basis-1/3">
                                    <PromoCard
                                        title="Mugs & totes"
                                        description="Giftable favorites with fast turnaround."
                                        hrefPrimary={build(
                                            '/design?product=mug&intent=design&source=catalog-hero'
                                        )}
                                        hrefSecondary={build('/products/mug')}
                                        gradient="from-chart-2/30 via-secondary/10 to-transparent"
                                    />
                                </CarouselItem>
                                <CarouselItem className="basis-full md:basis-1/2 lg:basis-1/3">
                                    <PromoCard
                                        title="Stickers galore"
                                        description="Crisp die‑cut designs with bold outlines."
                                        hrefPrimary={build(
                                            '/design?product=stickers&intent=design&source=catalog-hero'
                                        )}
                                        hrefSecondary={build('/products/stickers')}
                                        gradient="from-chart-3/30 via-accent/10 to-transparent"
                                    />
                                </CarouselItem>
                            </CarouselContent>
                            <div className="mt-3 flex items-center gap-2">
                                <CarouselPrevious className="h-8 w-8" />
                                <CarouselNext className="h-8 w-8" />
                            </div>
                        </Carousel>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="order-2 md:order-1 md:col-span-2">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex-1">
                                <label htmlFor="search" className="sr-only">
                                    Search products
                                </label>
                                <input
                                    id="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search products, materials, or tags"
                                    className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-4 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => setBadgeFilter(null)}
                                    className={cn(
                                        'rounded-full border px-3 py-1 text-xs',
                                        !badgeFilter
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-input hover:bg-muted'
                                    )}
                                >
                                    All
                                </button>
                                {allBadges.map((b) => (
                                    <button
                                        key={b}
                                        onClick={() =>
                                            setBadgeFilter((cur) => (cur === b ? null : b))
                                        }
                                        className={cn(
                                            'rounded-full border px-3 py-1 text-xs',
                                            badgeFilter === b
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-input hover:bg-muted'
                                        )}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((p) => (
                                <article
                                    key={p.slug}
                                    className="group border-border bg-card relative overflow-hidden rounded-xl border p-5 shadow-sm transition hover:shadow-md"
                                >
                                    <div
                                        aria-hidden
                                        className="from-muted to-muted/20 ring-border pointer-events-none mb-4 h-40 w-full rounded-lg bg-gradient-to-br ring-1 ring-inset"
                                    >
                                        <div className="flex h-full items-center justify-center text-6xl opacity-70">
                                            {iconFor(p.slug)}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium tracking-tight">{p.name}</h3>
                                    <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">
                                        {p.summary}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(p.badges ?? []).map((b) => (
                                            <span
                                                key={b}
                                                className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[10px] font-medium"
                                            >
                                                {b}
                                            </span>
                                        ))}
                                    </div>

                                    <dl className="text-muted-foreground mt-4 grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-muted/50 rounded-md p-2">
                                            <dt className="text-foreground font-medium">Aspect</dt>
                                            <dd>{p.aspect}</dd>
                                        </div>
                                        <div className="bg-muted/50 rounded-md p-2">
                                            <dt className="text-foreground font-medium">
                                                Recommended
                                            </dt>
                                            <dd>{p.dpi}</dd>
                                        </div>
                                    </dl>

                                    <div className="mt-5 flex items-center gap-2">
                                        <Link
                                            href={build(`/products/${p.slug}`)}
                                            className="border-input bg-background hover:bg-muted focus:ring-ring inline-flex flex-1 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium focus:ring-2 focus:outline-none"
                                        >
                                            View details
                                        </Link>
                                        <Link
                                            href={build(
                                                `/design?product=${encodeURIComponent(p.slug)}&intent=design&source=catalog-card`
                                            )}
                                            className="bg-primary text-primary-foreground focus:ring-ring inline-flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium shadow hover:opacity-90 focus:ring-2 focus:outline-none"
                                        >
                                            Design for {p.name}
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="order-1 md:order-2">
                        <div className="sticky top-4 flex flex-col gap-6">
                            <nav className="border-border bg-card rounded-xl border p-4 shadow-sm">
                                <h2 className="text-sm font-semibold">Quick links</h2>
                                <ul className="mt-3 space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href={build('/design')}
                                            className="text-primary hover:underline"
                                        >
                                            Start a new design
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/checkout')} className="hover:underline">
                                            Checkout
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/orders')} className="hover:underline">
                                            Order history
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/account')} className="hover:underline">
                                            Account settings
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/about')} className="hover:underline">
                                            About
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/help')} className="hover:underline">
                                            Help Center
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/contact')} className="hover:underline">
                                            Contact us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href={build('/admin')} className="hover:underline">
                                            Admin dashboard
                                        </Link>
                                    </li>
                                </ul>
                            </nav>

                            <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
                                <h2 className="text-sm font-semibold">Why RealizeIt?</h2>
                                <ul className="text-muted-foreground mt-3 list-disc space-y-2 pl-5 text-sm">
                                    <li>
                                        AI‑only generation ensures clean licensing and consistency.
                                    </li>
                                    <li>
                                        Live pricing with a transparent 20% markup over base costs.
                                    </li>
                                    <li>Automatic Printify fulfillment with tracking for KR.</li>
                                </ul>
                                <div className="mt-4 flex gap-2">
                                    <Link
                                        href={build('/legal/terms')}
                                        className="text-primary text-xs hover:underline"
                                    >
                                        Terms
                                    </Link>
                                    <span className="text-muted-foreground">•</span>
                                    <Link
                                        href={build('/legal/privacy')}
                                        className="text-xs hover:underline"
                                    >
                                        Privacy
                                    </Link>
                                    <span className="text-muted-foreground">•</span>
                                    <Link
                                        href={build('/legal/ip-policy')}
                                        className="text-xs hover:underline"
                                    >
                                        IP Policy
                                    </Link>
                                </div>
                            </div>

                            <Alert className="border-primary/40 bg-primary/5">
                                <AlertTitle className="font-semibold">AI‑only designs</AlertTitle>
                                <AlertDescription className="text-muted-foreground text-sm">
                                    Customer uploads are disabled in this POC. All artwork is
                                    generated and composited automatically. You can review
                                    variations before checkout.
                                </AlertDescription>
                            </Alert>

                            <div className="border-border bg-card rounded-xl border p-4 shadow-sm">
                                <h2 className="text-sm font-semibold">New here?</h2>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    Create an account to save addresses, view orders, and track
                                    shipments.
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={build('/sign-in')}
                                        className="border-input bg-background hover:bg-muted inline-flex flex-1 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={build('/sign-up')}
                                        className="bg-secondary text-secondary-foreground inline-flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
                                    >
                                        Create account
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <footer className="border-border bg-muted/30 border-t">
                <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href={build('/')} className="hover:underline">
                            Home
                        </Link>
                        <Link href={build('/products')} className="hover:underline">
                            All Products
                        </Link>
                        <Link href={build('/checkout')} className="hover:underline">
                            Checkout
                        </Link>
                        <Link href={build('/orders')} className="hover:underline">
                            Orders
                        </Link>
                    </div>
                    <p>RealizeIt • POC</p>
                </div>
            </footer>
        </main>
    )
}

function iconFor(slug: string) {
    switch (slug) {
        case 't-shirt':
            return '👕'
        case 'hoodie':
            return '🧥'
        case 'socks':
            return '🧦'
        case 'mug':
            return '☕️'
        case 'canvas':
            return '🖼️'
        case 'blanket':
            return '🧣'
        case 'phone-case':
            return '📱'
        case 'tote':
            return '👜'
        case 'stickers':
            return '🔖'
        case 'journal':
            return '📓'
        default:
            return '🛍️'
    }
}

function PromoCard({
    title,
    description,
    hrefPrimary,
    hrefSecondary,
    gradient,
}: {
    title: string
    description: string
    hrefPrimary: string
    hrefSecondary: string
    gradient?: string
}) {
    return (
        <div
            className={cn(
                'border-border bg-card relative flex h-40 w-full flex-col justify-between overflow-hidden rounded-xl border p-5 shadow-sm',
                gradient && `bg-gradient-to-br ${gradient}`
            )}
        >
            <div>
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            </div>
            <div className="flex items-center gap-2">
                <Link
                    href={hrefPrimary}
                    className="bg-primary text-primary-foreground focus:ring-ring inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium shadow hover:opacity-90 focus:ring-2 focus:outline-none"
                >
                    Start designing
                </Link>
                <Link
                    href={hrefSecondary}
                    className="border-input bg-background hover:bg-muted focus:ring-ring inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium focus:ring-2 focus:outline-none"
                >
                    View details
                </Link>
            </div>
            <div className="bg-primary/10 pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full" />
        </div>
    )
}
