'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'

export default function NotFound() {
    const pathname = usePathname()
    const router = useRouter()

    const lang = React.useMemo(() => {
        const segments = pathname?.split('/').filter(Boolean) ?? []
        const candidate = segments[0] ?? 'en'
        const allowed = ['en', 'kr', 'ko']
        return allowed.includes(candidate.toLowerCase()) ? candidate : 'en'
    }, [pathname])

    const href = (p: string) => `/${lang}${p.startsWith('/') ? p : `/${p}`}`

    return (
        <main className="from-background to-muted/30 text-foreground min-h-[100dvh] bg-gradient-to-b">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-16">
                <div className="border-border bg-card w-full rounded-xl border p-8 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Session not found
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                The design session you tried to open is invalid or has expired.
                            </p>
                        </div>
                        <span
                            aria-hidden
                            className="bg-destructive/10 text-destructive inline-flex h-10 w-10 items-center justify-center rounded-lg"
                        >
                            404
                        </span>
                    </div>

                    <Alert variant="destructive" className="mt-6">
                        <AlertTitle>We couldn’t locate that design session</AlertTitle>
                        <AlertDescription>
                            This can happen if the link is incorrect, the session timed out, or the
                            design was already finalized at checkout.
                        </AlertDescription>
                    </Alert>

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Link
                            href={href('/design')}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow focus:ring-2 focus:outline-none"
                            aria-label="Start a new design"
                        >
                            Start a new design
                        </Link>

                        <Link
                            href={href('/account/orders')}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring/50 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none"
                            aria-label="View your drafts and orders"
                        >
                            View drafts & orders
                        </Link>

                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring/50 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none"
                            aria-label="Go back"
                        >
                            Go back
                        </button>

                        <Link
                            href={href('/products')}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring/50 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none"
                            aria-label="Browse products"
                        >
                            Browse products
                        </Link>
                    </div>

                    <Separator className="my-8" />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="border-border bg-card rounded-lg border p-4">
                            <h2 className="text-sm font-medium">Why this happened</h2>
                            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                                <li>The session link is malformed or incomplete.</li>
                                <li>The session expired after inactivity.</li>
                                <li>The design was approved and submitted at checkout.</li>
                            </ul>
                        </div>

                        <div className="border-border bg-card rounded-lg border p-4">
                            <h2 className="text-sm font-medium">Get help</h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Need assistance? Visit our Help Center or contact support.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={href('/help')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium"
                                >
                                    Help Center
                                </Link>
                                <Link
                                    href={href('/contact')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium"
                                >
                                    Contact us
                                </Link>
                                <Link
                                    href={href('/about')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium"
                                >
                                    About
                                </Link>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-8" />

                    <div>
                        <h3 className="text-sm font-medium">Quick links</h3>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <Link href={href('/design')} className="chip-link">
                                New design
                            </Link>
                            <Link href={href('/products')} className="chip-link">
                                All products
                            </Link>
                            <Link href={href('/cart')} className="chip-link">
                                Cart
                            </Link>
                            <Link href={href('/checkout')} className="chip-link">
                                Checkout
                            </Link>
                            <Link href={href('/orders')} className="chip-link">
                                Order lookup
                            </Link>
                            <Link href={href('/account')} className="chip-link">
                                Account
                            </Link>
                            <Link href={href('/account/orders')} className="chip-link">
                                My orders
                            </Link>
                            <Link href={href('/account/addresses')} className="chip-link">
                                Addresses
                            </Link>
                            <Link href={href('/account/settings')} className="chip-link">
                                Settings
                            </Link>
                            <Link href={href('/sign-in')} className="chip-link">
                                Sign in
                            </Link>
                            <Link href={href('/sign-up')} className="chip-link">
                                Create account
                            </Link>
                            <Link href={href('/legal/terms')} className="chip-link">
                                Terms
                            </Link>
                            <Link href={href('/legal/privacy')} className="chip-link">
                                Privacy
                            </Link>
                            <Link href={href('/legal/ip-policy')} className="chip-link">
                                IP policy
                            </Link>
                            <Link href={href('/admin')} className="chip-link">
                                Admin
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-muted-foreground mt-6 text-center text-xs">
                    <p>
                        You can always start over at{' '}
                        <Link
                            href={href('/design')}
                            className="underline underline-offset-2"
                        >{`/${lang}/design`}</Link>
                        .
                    </p>
                </div>
            </div>

            <style jsx global>{`
                .chip-link {
                    @apply border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors;
                }
            `}</style>
        </main>
    )
}
