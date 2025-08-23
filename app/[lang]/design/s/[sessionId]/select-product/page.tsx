'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

type Params = { lang: string; sessionId: string }

type Category = 'Apparel' | 'Drinkware' | 'Home' | 'Accessories' | 'Stationery'

type Product = {
    slug: string
    name: string
    description: string
    category: Category
    accent: string // tailwind gradient accent
    Icon: React.FC<{ className?: string }>
}

const TShirtIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
            d="M7 6l5-3 5 3 2.5-1.5L22 8l-3 1v8.5A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5V9L2 8l2.5-3.5L7 6z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
    </svg>
)

const HoodieIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12 3c3 0 5 2 5 5v1l3 2v9a2 2 0 0 1-2 2h-2v-7a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v7H4a2 2 0 0 1-2-2v-9l3-2V8c0-3 2-5 5-5h0z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
    </svg>
)

const SweatshirtIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M7 5h10l3 4v10a2 2 0 0 1-2 2h-2v-7H8v7H6a2 2 0 0 1-2-2V9l3-4z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
    </svg>
)

const MugIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M4 6h10a2 2 0 0 1 2 2v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6z"
            fill="currentColor"
            className="text-foreground/80"
        />
        <path
            d="M16 9h2.5A2.5 2.5 0 0 1 21 11.5v1A2.5 2.5 0 0 1 18.5 15H16"
            stroke="currentColor"
            strokeWidth="1.5"
        />
    </svg>
)

const ToteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect
            x="3"
            y="8"
            width="18"
            height="12"
            rx="2"
            fill="currentColor"
            className="text-foreground/80"
        />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
)

const SocksIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M9 3v9l-3 4a4 4 0 0 0 7 3l3-4V3H9z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
    </svg>
)

const PhoneCaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect
            x="7"
            y="2"
            width="10"
            height="20"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
        <rect
            x="10"
            y="5"
            width="4"
            height="1.5"
            rx="0.75"
            fill="currentColor"
            className="text-background"
        />
    </svg>
)

const CanvasIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect
            x="3"
            y="4"
            width="18"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
        <path d="M6 16l4-5 3 3 3-4 2 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
)

const BlanketIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <path
            d="M4 7a3 3 0 0 1 3-3h9a4 4 0 0 1 4 4v7a3 3 0 0 1-3 3H8a4 4 0 0 1-4-4V7z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
    </svg>
)

const StickersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="5" fill="currentColor" className="text-foreground/80" />
        <rect
            x="11"
            y="11"
            width="8"
            height="8"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/60"
        />
    </svg>
)

const JournalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect
            x="5"
            y="3"
            width="14"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            className="text-foreground/80"
        />
        <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
)

const PRODUCTS: Product[] = [
    {
        slug: 't-shirt',
        name: 'T‑Shirt',
        description: 'Classic unisex tee for everyday wear.',
        category: 'Apparel',
        accent: 'from-primary/20 to-accent/20',
        Icon: TShirtIcon,
    },
    {
        slug: 'hoodie',
        name: 'Hoodie',
        description: 'Cozy pullover with roomy front pocket.',
        category: 'Apparel',
        accent: 'from-secondary/20 to-primary/20',
        Icon: HoodieIcon,
    },
    {
        slug: 'sweatshirt',
        name: 'Sweatshirt',
        description: 'Crewneck warmth without the bulk.',
        category: 'Apparel',
        accent: 'from-accent/20 to-secondary/20',
        Icon: SweatshirtIcon,
    },
    {
        slug: 'mug',
        name: 'Mug',
        description: 'Ceramic mug for hot or cold sips.',
        category: 'Drinkware',
        accent: 'from-chart-1/25 to-chart-2/25',
        Icon: MugIcon,
    },
    {
        slug: 'tote',
        name: 'Tote',
        description: 'Durable canvas tote for daily carry.',
        category: 'Accessories',
        accent: 'from-chart-3/25 to-chart-4/25',
        Icon: ToteIcon,
    },
    {
        slug: 'socks',
        name: 'Socks',
        description: 'All-over print crew socks.',
        category: 'Apparel',
        accent: 'from-chart-5/25 to-chart-2/25',
        Icon: SocksIcon,
    },
    {
        slug: 'phone-case',
        name: 'Phone Case',
        description: 'Protective case with vibrant print.',
        category: 'Accessories',
        accent: 'from-primary/15 to-secondary/15',
        Icon: PhoneCaseIcon,
    },
    {
        slug: 'canvas',
        name: 'Canvas',
        description: 'Gallery-wrapped wall art canvas.',
        category: 'Home',
        accent: 'from-accent/15 to-primary/15',
        Icon: CanvasIcon,
    },
    {
        slug: 'blanket',
        name: 'Blanket',
        description: 'Ultra-soft fleece blanket.',
        category: 'Home',
        accent: 'from-secondary/15 to-accent/15',
        Icon: BlanketIcon,
    },
    {
        slug: 'stickers',
        name: 'Stickers',
        description: 'Die-cut waterproof stickers.',
        category: 'Accessories',
        accent: 'from-chart-4/25 to-chart-1/25',
        Icon: StickersIcon,
    },
    {
        slug: 'journal',
        name: 'Journal',
        description: 'Hardcover notebook with premium pages.',
        category: 'Stationery',
        accent: 'from-chart-2/25 to-chart-5/25',
        Icon: JournalIcon,
    },
]

export default function SelectProductPage() {
    const router = useRouter()
    const params = useParams() as unknown as Params
    const { lang, sessionId } = params

    const [query, setQuery] = useState('')
    const [category, setCategory] = useState<'All' | Category>('All')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return PRODUCTS.filter((p) => {
            const matchQ =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.slug.includes(q)
            const matchC = category === 'All' || p.category === category
            return matchQ && matchC
        })
    }, [query, category])

    const categories: ('All' | Category)[] = [
        'All',
        'Apparel',
        'Drinkware',
        'Home',
        'Accessories',
        'Stationery',
    ]

    const base = `/${lang}`

    return (
        <div className="bg-background text-foreground min-h-[calc(100dvh)]">
            <header className="supports-[backdrop-filter]:bg-background/60 border-border sticky top-0 z-30 border-b backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href={`${base}/design/s/${sessionId}`}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm transition-colors"
                    >
                        <span aria-hidden>←</span>
                        <span className="ml-2">Design session</span>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <Link
                        href={`${base}/design/s/${sessionId}/variations`}
                        className="text-muted-foreground hover:text-foreground text-sm"
                    >
                        Variations
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-sm font-medium">Select product</span>
                    <div className="ml-auto flex items-center gap-3">
                        <Link
                            href={`${base}/products`}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Catalog
                        </Link>
                        <Link
                            href={`${base}/cart`}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Cart
                        </Link>
                        <Link
                            href={`${base}/account`}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Account
                        </Link>
                        <Link
                            href={`${base}/help`}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Help
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Choose your product
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Your AI-generated design will be tailored to the selected product’s
                            print specs.
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                        <div className="min-w-[220px] flex-1">
                            <label htmlFor="product-search" className="sr-only">
                                Search products
                            </label>
                            <input
                                id="product-search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search products..."
                                className="border-input bg-input/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="category" className="sr-only">
                                Category
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="border-input bg-input/50 text-foreground focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none sm:w-[200px]"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <Alert className="bg-card text-card-foreground border-border mt-6">
                    <AlertTitle className="font-medium">AI‑only designs</AlertTitle>
                    <AlertDescription>
                        Customer uploads are disabled in this POC. By proceeding you accept our{' '}
                        <Link
                            href={`${base}/legal/ip-policy`}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            IP Policy
                        </Link>{' '}
                        and{' '}
                        <Link
                            href={`${base}/legal/terms`}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            Terms
                        </Link>
                        .
                    </AlertDescription>
                </Alert>

                <Separator className="my-6" />

                {filtered.length === 0 ? (
                    <div className="border-border bg-card text-card-foreground rounded-lg border p-8">
                        <p className="text-sm">
                            No matching products. Browse the full{' '}
                            <Link
                                href={`${base}/products`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                catalog
                            </Link>{' '}
                            or{' '}
                            <button
                                onClick={() => {
                                    setQuery('')
                                    setCategory('All')
                                }}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                reset filters
                            </button>
                            .
                        </p>
                    </div>
                ) : (
                    <ul
                        role="list"
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        {filtered.map((p) => {
                            const href = `${base}/design/s/${sessionId}/configure/${p.slug}`
                            const learnHref = `${base}/products/${p.slug}`
                            return (
                                <li key={p.slug} className="group">
                                    <div
                                        className={cn(
                                            'border-border bg-card text-card-foreground focus-within:ring-ring relative overflow-hidden rounded-xl border shadow-sm transition focus-within:ring-2 hover:shadow-md'
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'h-28 w-full bg-gradient-to-br',
                                                p.accent
                                            )}
                                        />
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-background/80 border-border -mt-12 flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border shadow-sm backdrop-blur">
                                                    <p.Icon className="text-foreground h-9 w-9" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="mb-1 text-base leading-none font-semibold">
                                                        {p.name}
                                                    </h3>
                                                    <p className="text-muted-foreground line-clamp-2 text-sm">
                                                        {p.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-2">
                                                <Link
                                                    prefetch
                                                    href={href}
                                                    className="bg-primary text-primary-foreground focus:ring-ring inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition hover:opacity-90 focus:ring-2 focus:outline-none"
                                                    aria-label={`Configure ${p.name}`}
                                                >
                                                    Configure
                                                    <span className="ml-1" aria-hidden>
                                                        →
                                                    </span>
                                                </Link>
                                                <Link
                                                    href={learnHref}
                                                    className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                                                    aria-label={`Learn more about ${p.name}`}
                                                >
                                                    Learn more
                                                </Link>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => router.push(href)}
                                            className="absolute inset-0"
                                            aria-label={`Select ${p.name}`}
                                        />
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}

                <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="border-border rounded-lg border p-4">
                        <h4 className="text-sm font-medium">Need inspiration?</h4>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Review your AI design options before choosing a product.
                        </p>
                        <Link
                            href={`${base}/design/s/${sessionId}/variations`}
                            className="text-primary mt-2 inline-flex text-sm underline underline-offset-4"
                        >
                            View variations
                        </Link>
                    </div>
                    <div className="border-border rounded-lg border p-4">
                        <h4 className="text-sm font-medium">Already sure?</h4>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Go straight to checkout after configuration.
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                            <Link
                                href={`${base}/cart`}
                                className="text-primary text-sm underline underline-offset-4"
                            >
                                Cart
                            </Link>
                            <Link
                                href={`${base}/checkout`}
                                className="text-primary text-sm underline underline-offset-4"
                            >
                                Checkout
                            </Link>
                        </div>
                    </div>
                    <div className="border-border rounded-lg border p-4">
                        <h4 className="text-sm font-medium">Orders & tracking</h4>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Find your previous purchases and delivery status.
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                            <Link
                                href={`${base}/account/orders`}
                                className="text-primary text-sm underline underline-offset-4"
                            >
                                Account orders
                            </Link>
                            <Link
                                href={`${base}/orders`}
                                className="text-primary text-sm underline underline-offset-4"
                            >
                                All orders
                            </Link>
                        </div>
                    </div>
                </div>

                <Separator className="my-10" />

                <footer className="text-muted-foreground grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 md:grid-cols-6">
                    <Link href={`${base}/about`} className="hover:text-foreground">
                        About
                    </Link>
                    <Link href={`${base}/contact`} className="hover:text-foreground">
                        Contact
                    </Link>
                    <Link href={`${base}/legal/terms`} className="hover:text-foreground">
                        Terms
                    </Link>
                    <Link href={`${base}/legal/privacy`} className="hover:text-foreground">
                        Privacy
                    </Link>
                    <Link href={`${base}/legal/ip-policy`} className="hover:text-foreground">
                        IP Policy
                    </Link>
                    <Link href={`${base}/admin`} className="hover:text-foreground">
                        Admin
                    </Link>
                </footer>
            </main>
        </div>
    )
}
