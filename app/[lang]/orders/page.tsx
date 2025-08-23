'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function OrdersLandingPage({ params }: { params: { lang: string } }) {
    const { lang } = params
    const router = useRouter()
    const supabase = useMemo(() => supabaseBrowser, [])

    const [checkingSession, setCheckingSession] = useState(true)
    const [trackingCode, setTrackingCode] = useState('')
    const [orderId, setOrderId] = useState('')

    useEffect(() => {
        let mounted = true
        const check = async () => {
            const { data } = await supabase.auth.getSession()
            if (!mounted) return
            if (data.session) {
                router.replace(`/${lang}/account/orders`)
                return
            }
            setCheckingSession(false)
        }
        check()

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                router.replace(`/${lang}/account/orders`)
            }
        })

        return () => {
            mounted = false
            authListener.subscription.unsubscribe()
        }
    }, [lang, router, supabase])

    const onSubmitTracking = (e: React.FormEvent) => {
        e.preventDefault()
        const code = trackingCode.trim()
        if (!code) return
        router.push(`/${lang}/track/${encodeURIComponent(code)}`)
    }

    const onSubmitOrderId = (e: React.FormEvent) => {
        e.preventDefault()
        const id = orderId.trim()
        if (!id) return
        router.push(`/${lang}/orders/${encodeURIComponent(id)}`)
    }

    return (
        <main className="bg-background text-foreground min-h-[calc(100dvh-4rem)]">
            <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14 md:px-6">
                <div className="border-border from-primary/10 via-background to-background relative overflow-hidden rounded-2xl border bg-gradient-to-br p-8 sm:p-10">
                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Orders
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                View your order history, statuses, and tracking details.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={`/${lang}/design`}
                                className="bg-secondary text-secondary-foreground inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90"
                            >
                                Start a new design
                            </Link>
                            <Link
                                href={`/${lang}/products`}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
                            >
                                Browse products
                            </Link>
                        </div>
                    </div>

                    <Separator className="my-8" />

                    {checkingSession ? (
                        <div className="text-muted-foreground flex items-center gap-3 text-sm">
                            <div className="border-muted-foreground/30 border-t-muted-foreground h-4 w-4 animate-spin rounded-full border-2" />
                            Checking your session...
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <Alert>
                                    <AlertTitle>Sign in required</AlertTitle>
                                    <AlertDescription>
                                        To view your orders, please sign in to your account. If you
                                        don’t have an account, you can create one in seconds.
                                    </AlertDescription>
                                </Alert>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    <Link
                                        href={`/${lang}/sign-in`}
                                        className="bg-primary text-primary-foreground inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
                                    >
                                        Sign in to view orders
                                    </Link>
                                    <Link
                                        href={`/${lang}/sign-up`}
                                        className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition"
                                    >
                                        Create account
                                    </Link>
                                    <Link
                                        href={`/${lang}/forgot-password`}
                                        className="border-input bg-background text-foreground hover:bg-muted inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition"
                                    >
                                        Forgot password
                                    </Link>
                                </div>
                            </div>

                            <div className="grid gap-6">
                                <form
                                    onSubmit={onSubmitTracking}
                                    className="border-border bg-card rounded-xl border p-5 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-medium">Track a shipment</h3>
                                        <span className="text-muted-foreground text-xs">
                                            via carrier code
                                        </span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            value={trackingCode}
                                            onChange={(e) => setTrackingCode(e.target.value)}
                                            placeholder="Enter tracking code"
                                            aria-label="Tracking code"
                                            className={cn(
                                                'border-input bg-background flex-1 rounded-lg border px-3 py-2 text-sm outline-none',
                                                'focus-visible:ring-ring focus-visible:ring-2'
                                            )}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-primary text-primary-foreground inline-flex shrink-0 items-center rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90"
                                        >
                                            Track
                                        </button>
                                    </div>
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        Don’t have a tracking code? You can still view order status
                                        after you sign in.
                                    </p>
                                </form>

                                <form
                                    onSubmit={onSubmitOrderId}
                                    className="border-border bg-card rounded-xl border p-5 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-medium">Find an order</h3>
                                        <span className="text-muted-foreground text-xs">
                                            by Order ID
                                        </span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <input
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value)}
                                            placeholder="Enter order ID"
                                            aria-label="Order ID"
                                            className={cn(
                                                'border-input bg-background flex-1 rounded-lg border px-3 py-2 text-sm outline-none',
                                                'focus-visible:ring-ring focus-visible:ring-2'
                                            )}
                                        />
                                        <button
                                            type="submit"
                                            className="bg-secondary text-secondary-foreground inline-flex shrink-0 items-center rounded-lg px-4 py-2 text-sm font-medium transition hover:opacity-90"
                                        >
                                            Open
                                        </button>
                                    </div>
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        Order IDs are shown in your email receipt and account
                                        history.
                                    </p>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <QuickLink
                        href={`/${lang}/products`}
                        title="Products"
                        description="Explore apparel, accessories, and more."
                    />
                    <QuickLink
                        href={`/${lang}/design`}
                        title="AI Design"
                        description="Turn your idea into a product-ready design."
                    />
                    <QuickLink
                        href={`/${lang}/cart`}
                        title="Cart"
                        description="Review items before checkout."
                    />
                    <QuickLink
                        href={`/${lang}/checkout`}
                        title="Checkout"
                        description="Secure payment via Stripe."
                    />
                    <QuickLink
                        href={`/${lang}/help`}
                        title="Help Center"
                        description="FAQs, shipping, and returns."
                    />
                    <QuickLink
                        href={`/${lang}/contact`}
                        title="Contact"
                        description="Get in touch with support."
                    />
                    <QuickLink
                        href={`/${lang}/legal/terms`}
                        title="Terms"
                        description="Service terms and conditions."
                    />
                    <QuickLink
                        href={`/${lang}/legal/privacy`}
                        title="Privacy"
                        description="How we handle your data."
                    />
                    <QuickLink
                        href={`/${lang}/legal/ip-policy`}
                        title="IP Policy"
                        description="AI design and usage policy."
                    />
                </div>

                <div className="text-muted-foreground mt-10 flex flex-wrap items-center gap-3 text-sm">
                    <span>Quick access:</span>
                    <Link className="hover:bg-muted rounded-md px-2 py-1" href={`/${lang}/about`}>
                        About
                    </Link>
                    <Link
                        className="hover:bg-muted rounded-md px-2 py-1"
                        href={`/${lang}/account/orders`}
                    >
                        My Orders
                    </Link>
                    <Link
                        className="hover:bg-muted rounded-md px-2 py-1"
                        href={`/${lang}/account/settings`}
                    >
                        Account Settings
                    </Link>
                    <Link className="hover:bg-muted rounded-md px-2 py-1" href={`/${lang}/admin`}>
                        Admin
                    </Link>
                </div>
            </section>
        </main>
    )
}

function QuickLink({
    href,
    title,
    description,
}: {
    href: string
    title: string
    description: string
}) {
    return (
        <Link
            href={href}
            className={cn(
                'group border-border bg-card relative overflow-hidden rounded-xl border p-5 transition',
                'hover:border-primary/50 hover:shadow-sm'
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-medium">{title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{description}</p>
                </div>
                <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs">
                    Open
                </span>
            </div>
            <div className="bg-primary/10 pointer-events-none absolute -top-6 -right-6 size-16 rounded-full transition-all group-hover:scale-125" />
        </Link>
    )
}
