'use client'

import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function Loading() {
    const params = useParams()
    const lang = (params?.lang as string) || 'en'

    const steps = useMemo(
        () => [
            'Connecting to secure Stripe checkout…',
            'Validating session and cart…',
            'Reserving inventory and pricing…',
            'Preparing payment and taxes…',
            'Finalizing order handoff to Printify…',
        ],
        []
    )

    const [stepIndex, setStepIndex] = useState(0)
    const [progress, setProgress] = useState(10)
    const [seconds, setSeconds] = useState(0)

    useEffect(() => {
        const stepTimer = setInterval(() => {
            setStepIndex((i) => (i + 1) % steps.length)
        }, 1400)

        const progressTimer = setInterval(() => {
            setProgress((p) => (p < 92 ? p + Math.max(1, Math.floor((100 - p) / 12)) : p))
            setSeconds((s) => s + 1)
        }, 1000)

        return () => {
            clearInterval(stepTimer)
            clearInterval(progressTimer)
        }
    }, [steps.length])

    const cartHref = `/${lang}/cart`
    const helpHref = `/${lang}/help`
    const contactHref = `/${lang}/contact`
    const ordersHref = `/${lang}/account/orders`
    const productsHref = `/${lang}/products`
    const designHref = `/${lang}/design`
    const cancelHref = `/${lang}/checkout/cancel`

    return (
        <div className="bg-background text-foreground flex min-h-[100dvh] items-center justify-center p-6">
            <div className="w-full max-w-xl">
                <div
                    className={cn(
                        'bg-card border-border overflow-hidden rounded-xl border shadow-sm'
                    )}
                >
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center gap-4">
                            <div className="relative flex h-11 w-11 items-center justify-center">
                                <svg
                                    className="text-primary/80 h-8 w-8 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    role="status"
                                    aria-live="assertive"
                                    aria-label="Loading"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    ></path>
                                </svg>
                                <span className="sr-only">Preparing checkout…</span>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                                    Preparing secure checkout
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {steps[stepIndex]}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                    aria-hidden
                                />
                            </div>
                            <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                                <span>Do not refresh this page</span>
                                <span>{seconds}s</span>
                            </div>
                        </div>

                        <div className="text-muted-foreground mt-6 grid gap-2 text-sm">
                            <p>
                                You’ll be redirected automatically once your payment session is
                                ready. After payment, your order is auto-submitted to production
                                with Printify.
                            </p>
                            <p>
                                If nothing happens after ~30 seconds, use one of the options below.
                            </p>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <Link
                                href={cartHref}
                                className="border-input bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Return to cart
                            </Link>
                            <Link
                                href={cancelHref}
                                className="border-input bg-background hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Cancel and go back
                            </Link>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Link
                                href={ordersHref}
                                className="border-input bg-card hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-xs font-medium transition-colors"
                            >
                                View my orders
                            </Link>
                            <Link
                                href={productsHref}
                                className="border-input bg-card hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-xs font-medium transition-colors"
                            >
                                Continue browsing products
                            </Link>
                        </div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <Link
                                href={designHref}
                                className="border-input bg-card hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-xs font-medium transition-colors"
                            >
                                Back to AI design
                            </Link>
                            <div className="text-muted-foreground flex items-center justify-center gap-3 text-xs">
                                <Link
                                    href={helpHref}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Help Center
                                </Link>
                                <span aria-hidden>•</span>
                                <Link
                                    href={contactHref}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Contact Support
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/40 border-border text-muted-foreground border-t px-6 py-4 text-xs sm:px-8">
                        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                            <span>
                                Secured by Stripe • Orders fulfilled via Printify • KR/EN checkout
                            </span>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/${lang}/legal/terms`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Terms
                                </Link>
                                <Link
                                    href={`/${lang}/legal/privacy`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href={`/${lang}/legal/ip-policy`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    IP Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
