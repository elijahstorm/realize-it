'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function CancelPage() {
    const params = useParams<{ lang: string }>()
    const router = useRouter()
    const searchParams = useSearchParams()

    const lang = decodeURIComponent(params?.lang || 'en')
    const base = `/${lang}`

    const reason = searchParams.get('reason') || 'payment_canceled'
    const message = searchParams.get('message')
    const sessionId = searchParams.get('session_id')

    const [seconds, setSeconds] = useState(12)
    const [paused, setPaused] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const title = useMemo(() => {
        switch (reason) {
            case 'card_declined':
                return 'Card was declined'
            case 'incomplete':
                return 'Checkout not completed'
            case 'browser_closed':
                return 'Payment not confirmed'
            case 'network_error':
                return 'Network issue during payment'
            default:
                return 'Payment canceled'
        }
    }, [reason])

    const subtitle = useMemo(() => {
        if (message) return message
        switch (reason) {
            case 'card_declined':
                return 'Your bank declined the charge. You can try a different card or contact your bank.'
            case 'incomplete':
                return 'It looks like the checkout session wasn’t finished. You can resume and complete your order.'
            case 'browser_closed':
                return 'The payment window was closed before confirming. You can reopen checkout and finish securely.'
            case 'network_error':
                return 'There was a connection issue. Please try again in a moment.'
            default:
                return 'No charges were made. You can retry checkout or review your cart.'
        }
    }, [reason, message])

    useEffect(() => {
        if (paused) return
        timerRef.current = setInterval(() => {
            setSeconds((s) => {
                if (s <= 1) {
                    clearInterval(timerRef.current as NodeJS.Timeout)
                    router.replace(`${base}/checkout`)
                    return 0
                }
                return s - 1
            })
        }, 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [paused, router, base])

    return (
        <main className="from-background via-background to-muted/30 min-h-screen bg-gradient-to-b">
            <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
                <div className="mb-8 flex items-center justify-between">
                    <Link
                        href={base}
                        className="text-muted-foreground hover:text-foreground text-sm font-medium transition"
                    >
                        ← {lang.toUpperCase()} Home
                    </Link>
                    <nav className="text-muted-foreground hidden gap-6 text-sm sm:flex">
                        <Link
                            href={`${base}/products`}
                            className="hover:text-foreground transition"
                        >
                            Products
                        </Link>
                        <Link href={`${base}/design`} className="hover:text-foreground transition">
                            Start a Design
                        </Link>
                        <Link href={`${base}/help`} className="hover:text-foreground transition">
                            Help
                        </Link>
                        <Link href={`${base}/contact`} className="hover:text-foreground transition">
                            Contact
                        </Link>
                    </nav>
                </div>

                <section className="bg-card text-card-foreground rounded-xl border shadow-sm">
                    <div className="border-b p-6 sm:p-8">
                        <div className="bg-destructive/10 text-destructive mb-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium">
                            Checkout Interrupted
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            {title}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>

                        <Alert className="mt-6">
                            <AlertTitle>Good news</AlertTitle>
                            <AlertDescription>
                                Your order has not been submitted. You can safely try again, or edit
                                items in your cart.
                            </AlertDescription>
                        </Alert>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={`${base}/checkout`}
                                className={cn(
                                    'bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm',
                                    'focus-visible:ring-ring hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                                )}
                            >
                                Retry checkout
                            </Link>
                            <Link
                                href={`${base}/cart`}
                                className={cn(
                                    'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium',
                                    'bg-background text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                                )}
                            >
                                Edit cart
                            </Link>
                            <button
                                type="button"
                                onClick={() => setPaused((p) => !p)}
                                className={cn(
                                    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
                                    paused
                                        ? 'bg-secondary text-secondary-foreground'
                                        : 'bg-muted text-foreground',
                                    'focus-visible:ring-ring hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                                )}
                            >
                                {paused ? 'Auto-redirect paused' : 'Pause auto-redirect'}
                            </button>
                        </div>

                        <p className="text-muted-foreground mt-4 text-xs" aria-live="polite">
                            Redirecting to checkout in {seconds}s. Don’t want to wait?{' '}
                            <Link
                                href={`${base}/checkout`}
                                className="text-foreground hover:text-primary font-medium underline underline-offset-4"
                            >
                                Continue now
                            </Link>
                            .
                        </p>

                        {sessionId && (
                            <p className="text-muted-foreground mt-3 truncate text-xs">
                                Session: <span className="font-mono">{sessionId}</span>
                            </p>
                        )}
                    </div>

                    <div className="p-6 sm:p-8">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <h2 className="text-sm font-semibold">Quick links</h2>
                                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href={`${base}/products`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Browse products
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/design`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Start a new AI design
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/orders`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Order history
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/account/orders`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            My account orders
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">Need help?</h2>
                                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href={`${base}/help`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Help Center
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/contact`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Contact support
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/legal/terms`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Terms of Service
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/legal/privacy`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`${base}/legal/ip-policy`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            IP & Content Policy
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid gap-4 sm:grid-cols-3">
                            <Link
                                href={`${base}/checkout/success`}
                                className="group bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border p-4 text-sm transition"
                            >
                                <div className="text-foreground group-hover:text-accent-foreground font-medium">
                                    See success page
                                </div>
                                <p className="mt-1">Preview the confirmation experience.</p>
                            </Link>
                            <Link
                                href={`${base}/admin/orders`}
                                className="group bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border p-4 text-sm transition"
                            >
                                <div className="text-foreground group-hover:text-accent-foreground font-medium">
                                    Admin: Orders
                                </div>
                                <p className="mt-1">Manage and monitor orders.</p>
                            </Link>
                            <Link
                                href={`${base}/admin/analytics`}
                                className="group bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg border p-4 text-sm transition"
                            >
                                <div className="text-foreground group-hover:text-accent-foreground font-medium">
                                    Admin: Analytics
                                </div>
                                <p className="mt-1">Track conversions and metrics.</p>
                            </Link>
                        </div>
                    </div>
                </section>

                <footer className="text-muted-foreground mt-10 flex flex-col items-center gap-2 text-center text-xs sm:flex-row sm:justify-between">
                    <p>
                        Looking for something else? Visit{' '}
                        <Link
                            href={`${base}/about`}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            About
                        </Link>{' '}
                        or explore our{' '}
                        <Link
                            href={`${base}/products`}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            catalog
                        </Link>
                        .
                    </p>
                    <p>
                        Offline? Try{' '}
                        <Link
                            href={`/offline`}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            offline mode
                        </Link>
                        .
                    </p>
                </footer>
            </div>
        </main>
    )
}
