'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

export default function NotFound() {
    const params = useParams<{ lang?: string; productSlug?: string }>()
    const langParam = params?.lang
    const lang = Array.isArray(langParam) ? langParam[0] : langParam || 'en'
    const slugParam = params?.productSlug
    const productSlug = Array.isArray(slugParam) ? slugParam[0] : slugParam || ''

    const base = `/${lang}`

    const primaryLinks = [
        { href: `${base}/products`, label: 'Browse products' },
        { href: `${base}/design`, label: 'Start a new AI design' },
        { href: `${base}`, label: 'Go to homepage' },
    ]

    const quickLinks = [
        { href: `${base}/cart`, label: 'View cart', emoji: '🛒' },
        { href: `${base}/checkout`, label: 'Checkout', emoji: '💳' },
        { href: `${base}/help`, label: 'Help center', emoji: '🆘' },
        { href: `${base}/about`, label: 'About', emoji: 'ℹ️' },
        { href: `${base}/contact`, label: 'Contact', emoji: '✉️' },
        { href: `${base}/legal/terms`, label: 'Terms', emoji: '📜' },
        { href: `${base}/legal/privacy`, label: 'Privacy', emoji: '🔒' },
        { href: `${base}/legal/ip-policy`, label: 'IP Policy', emoji: '⚖️' },
    ]

    const accountLinks = [
        { href: `${base}/sign-in`, label: 'Sign in' },
        { href: `${base}/sign-up`, label: 'Create account' },
        { href: `${base}/forgot-password`, label: 'Forgot password' },
        { href: `${base}/account`, label: 'Account overview' },
        { href: `${base}/account/orders`, label: 'Your orders' },
        { href: `${base}/account/settings`, label: 'Settings' },
        { href: `${base}/orders`, label: 'Order lookup' },
    ]

    const adminLinks = [
        { href: `${base}/admin`, label: 'Admin dashboard' },
        { href: `${base}/admin/orders`, label: 'Admin orders' },
        { href: `${base}/admin/products-mapping`, label: 'Products mapping' },
        { href: `${base}/admin/logs`, label: 'Logs' },
        { href: `${base}/admin/analytics`, label: 'Analytics' },
        { href: `${base}/admin/costs`, label: 'Costs' },
        { href: `${base}/admin/health`, label: 'API health' },
        { href: `${base}/admin/retries`, label: 'Manual retries' },
    ]

    return (
        <main className="bg-background text-foreground flex min-h-[80vh] w-full items-center justify-center px-4 py-16">
            <div className="w-full max-w-5xl">
                <div className="border-border bg-card text-card-foreground relative overflow-hidden rounded-2xl border shadow-sm">
                    <div className="from-primary/10 to-accent/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent" />

                    <div className="relative p-8 md:p-12">
                        <div className="text-muted-foreground flex items-center gap-3">
                            <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-full text-lg">
                                🧭
                            </span>
                            <span className="text-xs font-medium tracking-wide uppercase">
                                Error 404
                            </span>
                        </div>

                        <h1 className="mt-4 text-3xl leading-tight font-semibold md:text-4xl">
                            We couldn’t find that product
                        </h1>
                        <p className="text-muted-foreground mt-3 text-sm md:text-base">
                            The product you’re looking for doesn’t exist or may have been moved.
                            {productSlug ? (
                                <>
                                    {' '}
                                    Searched for:{' '}
                                    <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                                        {productSlug}
                                    </code>
                                </>
                            ) : null}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {primaryLinks.map((l) => (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center gap-2 rounded-lg px-4 py-2.5 shadow-sm transition focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    <span>{l.label}</span>
                                </Link>
                            ))}
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 shadow-sm transition focus-visible:ring-2 focus-visible:outline-none"
                            >
                                Go back
                            </button>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {quickLinks.map((q) => (
                                <Link
                                    key={q.href}
                                    href={q.href}
                                    className="group border-border bg-background hover:bg-accent hover:text-accent-foreground rounded-xl border p-4 shadow-sm transition"
                                >
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <span className="text-lg leading-none">{q.emoji}</span>
                                        <span className="truncate">{q.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                            <section>
                                <h2 className="text-muted-foreground text-sm font-semibold">
                                    Explore
                                </h2>
                                <nav className="mt-3 grid gap-2 text-sm">
                                    <Link
                                        className="text-foreground/90 hover:text-primary"
                                        href={base}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        className="text-foreground/90 hover:text-primary"
                                        href={`${base}/products`}
                                    >
                                        All products
                                    </Link>
                                    <Link
                                        className="text-foreground/90 hover:text-primary"
                                        href={`${base}/design`}
                                    >
                                        AI design studio
                                    </Link>
                                    <Link
                                        className="text-foreground/90 hover:text-primary"
                                        href={`${base}/cart`}
                                    >
                                        Cart
                                    </Link>
                                    <Link
                                        className="text-foreground/90 hover:text-primary"
                                        href={`${base}/checkout`}
                                    >
                                        Checkout
                                    </Link>
                                </nav>
                            </section>

                            <section>
                                <h2 className="text-muted-foreground text-sm font-semibold">
                                    Your account
                                </h2>
                                <nav className="mt-3 grid gap-2 text-sm">
                                    {accountLinks.map((l) => (
                                        <Link
                                            key={l.href}
                                            className="text-foreground/90 hover:text-primary"
                                            href={l.href}
                                        >
                                            {l.label}
                                        </Link>
                                    ))}
                                </nav>
                            </section>

                            <section>
                                <h2 className="text-muted-foreground text-sm font-semibold">
                                    Admin
                                </h2>
                                <nav className="mt-3 grid gap-2 text-sm">
                                    {adminLinks.map((l) => (
                                        <Link
                                            key={l.href}
                                            className="text-foreground/90 hover:text-primary"
                                            href={l.href}
                                        >
                                            {l.label}
                                        </Link>
                                    ))}
                                </nav>
                            </section>
                        </div>

                        <div className="border-border bg-muted/30 mt-10 rounded-lg border p-4">
                            <p className="text-muted-foreground text-sm">
                                Still stuck?{' '}
                                <Link
                                    className="hover:text-primary underline underline-offset-4"
                                    href={`${base}/contact`}
                                >
                                    Contact us
                                </Link>{' '}
                                or visit the{' '}
                                <Link
                                    className="hover:text-primary underline underline-offset-4"
                                    href={`${base}/help`}
                                >
                                    Help Center
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
