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
import { Toaster } from '@/components/ui/toaster'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'

function safeUuid() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
    const s4 = () =>
        Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .slice(1)
    return `${Date.now()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}`
}

const popularStyles = [
    'Minimalist',
    'Vintage',
    'Korean streetwear',
    'Cute (kawaii)',
    'Bold typography',
    'Nature/Floral',
    'Geometric',
    'Retro 90s',
    'Cyberpunk',
    'Hand-drawn',
]

const quickPrompts = [
    'A playful cat chasing butterflies in a flower field',
    'Seoul skyline at dusk with neon accents, retro vaporwave style',
    'Inspirational quote: Dream. Build. Ship. in bold modern typography',
    'Abstract geometric shapes with gradient pastel colors',
    'Traditional Korean patterns blended with modern minimalism',
    'A serene mountain landscape with a sunrise and birds',
]

export default function DesignEntryPage() {
    const router = useRouter()
    const params = useParams<{ lang: string }>()
    const lang = params?.lang ?? 'en'

    const [prompt, setPrompt] = useState('')
    const [styleHints, setStyleHints] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const canSubmit = useMemo(() => prompt.trim().length >= 8 && !submitting, [prompt, submitting])

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault()
            const p = prompt.trim()
            const s = styleHints.trim()
            if (p.length < 8) {
                toast({
                    title: 'Tell us a bit more',
                    description:
                        'Please provide a slightly longer prompt so our AI can design better.',
                })
                return
            }
            try {
                setSubmitting(true)
                const sessionId = safeUuid()
                try {
                    const payload = { prompt: p, styleHints: s, createdAt: Date.now(), lang }
                    sessionStorage.setItem(`design-session:${sessionId}`, JSON.stringify(payload))
                } catch {}
                const query = new URLSearchParams()
                query.set('q', p)
                if (s) query.set('style', s)
                toast({
                    title: 'Starting your design session...',
                    description: 'Generating design brief and preparing options.',
                })
                router.push(`/${lang}/design/s/${sessionId}?${query.toString()}`)
            } finally {
                setSubmitting(false)
            }
        },
        [prompt, styleHints, router, lang]
    )

    const onStyleTagClick = (tag: string) => {
        const current = styleHints
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        if (current.includes(tag)) {
            const next = current.filter((t) => t !== tag).join(', ')
            setStyleHints(next)
        } else {
            const next = [...current, tag].join(', ')
            setStyleHints(next)
        }
    }

    return (
        <div className="from-background via-muted/30 to-muted/60 min-h-[calc(100dvh-0px)] bg-gradient-to-b">
            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-12">
                <div className="mb-6 flex items-center justify-between">
                    <nav className="text-muted-foreground text-sm">
                        <Link href={`/${lang}`} className="hover:text-foreground">
                            Home
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground">Design</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${lang}/products`}
                            className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm shadow-sm"
                        >
                            Browse Products
                        </Link>
                        <Link
                            href={`/${lang}/sign-in`}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-3 py-1.5 text-sm shadow-sm"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                <div className="border-border bg-card relative overflow-hidden rounded-2xl border p-6 shadow-sm sm:p-10">
                    <div className="bg-primary/10 absolute -top-24 -right-20 h-64 w-64 rounded-full blur-3xl" />
                    <div className="bg-accent/10 absolute -bottom-32 -left-24 h-72 w-72 rounded-full blur-3xl" />

                    <div className="relative z-10 grid items-start gap-8 lg:grid-cols-2">
                        <div>
                            <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                                Turn your idea into a product
                            </h1>
                            <p className="text-muted-foreground mt-3">
                                Describe your vision in Korean or English. We’ll generate three AI
                                designs and help you pick the right product, price, and variant. No
                                uploads required.
                            </p>

                            <Alert className="mt-5">
                                <AlertTitle className="font-semibold">AI-only designs</AlertTitle>
                                <AlertDescription>
                                    We only use AI-generated artwork. By continuing, you agree to
                                    our policies.
                                    <span className="ml-2 inline-flex gap-2">
                                        <Link
                                            className="hover:text-foreground underline"
                                            href={`/${lang}//legal/terms`}
                                        >
                                            Terms
                                        </Link>
                                        <Link
                                            className="hover:text-foreground underline"
                                            href={`/${lang}//legal/ip-policy`}
                                        >
                                            IP Policy
                                        </Link>
                                        <Link
                                            className="hover:text-foreground underline"
                                            href={`/${lang}//legal/privacy`}
                                        >
                                            Privacy
                                        </Link>
                                    </span>
                                </AlertDescription>
                            </Alert>

                            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label
                                        htmlFor="prompt"
                                        className="text-foreground block text-sm font-medium"
                                    >
                                        Your idea
                                    </label>
                                    <textarea
                                        id="prompt"
                                        name="prompt"
                                        required
                                        rows={5}
                                        placeholder="e.g., A minimalist crane illustration symbolizing luck, with soft beige and navy palette"
                                        className="border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:ring-ring mt-2 w-full resize-y rounded-lg border px-3 py-2 text-base shadow-sm focus:ring-2 focus:outline-none"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="style"
                                        className="text-foreground block text-sm font-medium"
                                    >
                                        Optional style hints
                                    </label>
                                    <input
                                        id="style"
                                        type="text"
                                        placeholder="e.g., minimalist, line art, soft palette, centered composition"
                                        className="border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:ring-ring mt-2 w-full rounded-lg border px-3 py-2 text-base shadow-sm focus:ring-2 focus:outline-none"
                                        value={styleHints}
                                        onChange={(e) => setStyleHints(e.target.value)}
                                    />
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {popularStyles.map((tag) => {
                                            const active = styleHints
                                                .split(',')
                                                .map((t) => t.trim())
                                                .filter(Boolean)
                                                .includes(tag)
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => onStyleTagClick(tag)}
                                                    className={`rounded-full border px-3 py-1 text-sm transition ${
                                                        active
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border bg-muted text-foreground hover:bg-accent hover:text-accent-foreground'
                                                    }`}
                                                    aria-pressed={active}
                                                >
                                                    {tag}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className={`focus:ring-ring inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none ${
                                            canSubmit
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                        aria-busy={submitting}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="h-5 w-5"
                                        >
                                            <path d="M12 2a1 1 0 0 1 .894.553l8 16A1 1 0 0 1 20 20h-6.382l-.724 1.447a1 1 0 0 1-1.788 0L10.382 20H4a1 1 0 0 1-.894-1.447l8-16A1 1 0 0 1 12 2Zm0 4.618L6.618 18H11a1 1 0 0 1 .894.553L12 19.382l.106-.829A1 1 0 0 1 13 18h4.382L12 6.618Z" />
                                        </svg>
                                        Generate designs
                                    </button>
                                    <Link
                                        href={`/${lang}/products`}
                                        className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none"
                                    >
                                        Explore products first
                                    </Link>
                                </div>
                            </form>

                            <div className="mt-6">
                                <p className="text-foreground mb-2 text-sm font-medium">
                                    Quick prompts
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {quickPrompts.map((qp, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPrompt(qp)}
                                            className="border-border bg-background text-foreground hover:bg-muted rounded-md border px-3 py-1.5 text-left text-sm shadow-sm"
                                            title="Use this prompt"
                                        >
                                            {qp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:pl-6">
                            <div className="border-border bg-background rounded-xl border p-4 sm:p-6">
                                <h2 className="text-foreground text-lg font-semibold">
                                    Pick your product any time
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    You can choose a product after generating designs. Start now or
                                    browse first.
                                </p>
                                <Separator className="my-4" />

                                <Carousel className="w-full" opts={{ align: 'start', loop: true }}>
                                    <CarouselContent>
                                        {[
                                            {
                                                emoji: '👕',
                                                name: 'T‑Shirts',
                                                href: `/${lang}/products/t-shirt`,
                                            },
                                            {
                                                emoji: '🧥',
                                                name: 'Hoodies',
                                                href: `/${lang}/products/hoodie`,
                                            },
                                            {
                                                emoji: '☕',
                                                name: 'Mugs',
                                                href: `/${lang}/products/mug`,
                                            },
                                            {
                                                emoji: '📱',
                                                name: 'Phone Cases',
                                                href: `/${lang}/products/phone-case`,
                                            },
                                            {
                                                emoji: '🧦',
                                                name: 'Socks',
                                                href: `/${lang}/products/socks`,
                                            },
                                            {
                                                emoji: '👜',
                                                name: 'Totes',
                                                href: `/${lang}/products/tote`,
                                            },
                                            {
                                                emoji: '🖼️',
                                                name: 'Canvas',
                                                href: `/${lang}/products/canvas`,
                                            },
                                            {
                                                emoji: '📓',
                                                name: 'Journal',
                                                href: `/${lang}/products/journal`,
                                            },
                                            {
                                                emoji: '🎨',
                                                name: 'Stickers',
                                                href: `/${lang}/products/stickers`,
                                            },
                                            {
                                                emoji: '🛋️',
                                                name: 'Blanket',
                                                href: `/${lang}/products/blanket`,
                                            },
                                        ].map((item, idx) => (
                                            <CarouselItem
                                                key={idx}
                                                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                                            >
                                                <Link
                                                    href={item.href}
                                                    className="group border-border bg-card hover:bg-accent hover:text-accent-foreground block h-full rounded-lg border p-4 text-center shadow-sm transition"
                                                >
                                                    <div className="text-4xl">{item.emoji}</div>
                                                    <div className="mt-2 text-sm font-medium">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-muted-foreground group-hover:text-accent-foreground/80 mt-1 text-xs">
                                                        Learn more
                                                    </div>
                                                </Link>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <div className="mt-3 flex items-center justify-between">
                                        <CarouselPrevious className="border-border bg-background/70 hover:bg-muted rounded-md border" />
                                        <CarouselNext className="border-border bg-background/70 hover:bg-muted rounded-md border" />
                                    </div>
                                </Carousel>

                                <Separator className="my-6" />

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="border-border bg-muted/30 rounded-lg border p-4">
                                        <div className="text-sm font-semibold">1. Describe</div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Start here with your idea and style hints.
                                        </p>
                                    </div>
                                    <Link
                                        href={`/${lang}/design/s/${safeUuid()}/select-product`}
                                        className="border-border bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-lg border p-4"
                                    >
                                        <div className="text-sm font-semibold">2. Select</div>
                                        <p className="mt-1 text-xs">
                                            Pick product, size and color.
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/checkout`}
                                        className="border-border bg-muted/30 hover:bg-accent hover:text-accent-foreground rounded-lg border p-4"
                                    >
                                        <div className="text-sm font-semibold">3. Checkout</div>
                                        <p className="mt-1 text-xs">Pay securely with Stripe.</p>
                                    </Link>
                                </div>

                                <div className="mt-6 grid gap-2 text-sm">
                                    <div className="text-muted-foreground">Useful links</div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href={`/${lang}//about`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            About
                                        </Link>
                                        <Link
                                            href={`/${lang}//help`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Help
                                        </Link>
                                        <Link
                                            href={`/${lang}//contact`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Contact
                                        </Link>
                                        <Link
                                            href={`/${lang}/orders`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Your orders
                                        </Link>
                                        <Link
                                            href={`/${lang}/cart`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Cart
                                        </Link>
                                        <Link
                                            href={`/${lang}/account`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Account
                                        </Link>
                                        <Link
                                            href={`/${lang}/admin`}
                                            className="underline-offset-4 hover:underline"
                                        >
                                            Admin
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-border bg-card mx-auto mt-10 max-w-4xl rounded-xl border p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-foreground text-base font-semibold">
                                Ready to track an order?
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Use your tracking code to see the latest status.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`/${lang}/orders`}
                                className="border-border bg-background hover:bg-muted rounded-md border px-4 py-2 text-sm"
                            >
                                Order history
                            </Link>
                            <Link
                                href={`/${lang}/track/TRACK123`}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm"
                            >
                                Track sample
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster />
        </div>
    )
}
