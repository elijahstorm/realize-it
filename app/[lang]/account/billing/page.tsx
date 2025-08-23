'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption,
} from '@/components/ui/table'
import { toast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'

export default function BillingPage() {
    const params = useParams<{ lang: string }>()
    const lang = Array.isArray(params?.lang) ? params?.lang?.[0] : params?.lang || 'en'
    const router = useRouter()
    const supabase = React.useMemo(() => supabaseBrowser, [])

    const [session, setSession] = React.useState<Session | null>(null)
    const [loadingPortal, setLoadingPortal] = React.useState(false)
    const [orderLookup, setOrderLookup] = React.useState('')
    const [trackingLookup, setTrackingLookup] = React.useState('')

    React.useEffect(() => {
        let isMounted = true
        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return
            setSession(data.session ?? null)
        })
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession)
        })
        return () => {
            isMounted = false
            authListener?.subscription.unsubscribe()
        }
    }, [supabase])

    const handleOpenPortal = async () => {
        setLoadingPortal(true)
        try {
            const res = await fetch('/api/billing/portal', { method: 'POST' })
            if (!res.ok) throw new Error('Unable to create Stripe portal session')
            const data = (await res.json()) as { url?: string }
            if (data?.url) {
                window.location.href = data.url
                return
            }
            throw new Error('Portal URL missing')
        } catch (err) {
            console.error(err)
            toast({
                variant: 'destructive',
                title: 'Couldn’t open billing portal',
                description:
                    'Please try again in a few moments. If the issue persists, manage your account from Settings or contact support.',
            })
        } finally {
            setLoadingPortal(false)
        }
    }

    const handleFindOrder = (e: React.FormEvent) => {
        e.preventDefault()
        const id = orderLookup.trim()
        if (!id) return
        router.push(`/${lang}/orders/${encodeURIComponent(id)}`)
    }

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault()
        const code = trackingLookup.trim()
        if (!code) return
        router.push(`/${lang}/track/${encodeURIComponent(code)}`)
    }

    const isAuthed = !!session?.user
    const billingEmail = session?.user?.email ?? '—'

    return (
        <div className="bg-background text-foreground min-h-screen">
            <div className="bg-primary/5 relative isolate overflow-hidden">
                <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                                Billing & Payment Methods
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                View billing details and manage payments. Orders and receipts are
                                available from your order history.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/${lang}/account/orders`}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors"
                            >
                                View orders
                            </Link>
                            <Link
                                href={`/${lang}/account/settings`}
                                className="bg-muted text-muted-foreground hover:bg-muted/80 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow-sm transition-colors"
                            >
                                Account settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6 lg:px-8">
                {!isAuthed ? (
                    <Alert className="border-destructive/30 bg-destructive/10 text-destructive mb-6">
                        <AlertTitle>Sign in required</AlertTitle>
                        <AlertDescription>
                            Please
                            <Link
                                href={`/${lang}/(auth)/sign-in`}
                                className="mx-1 underline underline-offset-4"
                            >
                                sign in
                            </Link>
                            to view your billing information. New here? {''}
                            <Link
                                href={`/${lang}/(auth)/sign-up`}
                                className="ml-1 underline underline-offset-4"
                            >
                                Create an account
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="border-border bg-card col-span-2 rounded-xl border p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-card-foreground text-lg font-medium">
                                    Billing overview
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    Billing is handled securely by Stripe. We do not store card
                                    details on our servers.
                                </p>
                            </div>
                            <span className="bg-primary/10 text-primary ring-primary/20 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset">
                                Stripe hosted
                            </span>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="border-border/60 bg-background rounded-lg border p-4">
                                <div className="text-muted-foreground text-xs uppercase">
                                    Billing email
                                </div>
                                <div className="mt-1 text-sm font-medium">{billingEmail}</div>
                                <div className="text-muted-foreground mt-3 text-xs">
                                    Need to change your email? Update it in {''}
                                    <Link
                                        className="underline underline-offset-4"
                                        href={`/${lang}/account/settings`}
                                    >
                                        Account settings
                                    </Link>
                                    .
                                </div>
                            </div>

                            <div className="border-border/60 bg-background rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-muted-foreground text-xs uppercase">
                                            Payment methods
                                        </div>
                                        <div className="mt-1 text-sm font-medium">
                                            Managed via Stripe
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleOpenPortal}
                                        disabled={!isAuthed || loadingPortal}
                                        className={cn(
                                            'bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium shadow-sm transition-colors',
                                            'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'
                                        )}
                                    >
                                        {loadingPortal ? 'Opening…' : 'Open billing portal'}
                                    </button>
                                </div>
                                <div className="text-muted-foreground mt-3 text-xs">
                                    Add, remove, or update cards in the secure Stripe Customer
                                    Portal.
                                </div>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="border-border/60 bg-background rounded-lg border">
                            <Table className="">
                                <TableCaption className="text-left">Quick links</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/4">Area</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="w-1/4 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Order history</TableCell>
                                        <TableCell>
                                            View all orders, statuses, and receipts.
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/${lang}/account/orders`}
                                                className="text-primary hover:text-primary/80 underline underline-offset-4"
                                            >
                                                Go to orders
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">
                                            Shipping addresses
                                        </TableCell>
                                        <TableCell>
                                            Manage your default and saved shipping destinations.
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/${lang}/account/addresses`}
                                                className="text-primary hover:text-primary/80 underline underline-offset-4"
                                            >
                                                Manage addresses
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">New purchase</TableCell>
                                        <TableCell>
                                            Design a product and check out instantly with Stripe.
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-3">
                                                <Link
                                                    href={`/${lang}/design`}
                                                    className="text-primary hover:text-primary/80 underline underline-offset-4"
                                                >
                                                    Start designing
                                                </Link>
                                                <Link
                                                    href={`/${lang}/checkout`}
                                                    className="text-primary/70 hover:text-primary underline underline-offset-4"
                                                >
                                                    Go to checkout
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <h3 className="text-card-foreground text-sm font-semibold">
                                Receipts & invoices
                            </h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Receipts are attached to each order. Open an order to download its
                                receipt.
                            </p>
                            <div className="mt-4">
                                <form onSubmit={handleFindOrder} className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="text"
                                        placeholder="Enter order ID"
                                        value={orderLookup}
                                        onChange={(e) => setOrderLookup(e.target.value)}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                        aria-label="Order ID"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
                                    >
                                        Find receipt
                                    </button>
                                </form>
                                <div className="text-muted-foreground mt-3 text-xs">
                                    Or browse all from {''}
                                    <Link
                                        className="underline underline-offset-4"
                                        href={`/${lang}/account/orders`}
                                    >
                                        Order history
                                    </Link>
                                    .
                                </div>
                            </div>
                        </section>

                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <h3 className="text-card-foreground text-sm font-semibold">
                                Track a package
                            </h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Use your tracking code to view delivery status.
                            </p>
                            <form onSubmit={handleTrack} className="mt-4 flex gap-2">
                                <input
                                    type="text"
                                    inputMode="text"
                                    placeholder="Tracking code"
                                    value={trackingLookup}
                                    onChange={(e) => setTrackingLookup(e.target.value)}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                    aria-label="Tracking code"
                                />
                                <button
                                    type="submit"
                                    className="bg-accent text-accent-foreground hover:bg-accent/80 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap shadow-sm transition-colors"
                                >
                                    Track
                                </button>
                            </form>
                            <div className="text-muted-foreground mt-3 text-xs">
                                You can also open the tracking link from your {''}
                                <Link
                                    href={`/${lang}/account/orders`}
                                    className="underline underline-offset-4"
                                >
                                    order details
                                </Link>
                                .
                            </div>
                        </section>

                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <h3 className="text-card-foreground text-sm font-semibold">
                                Need help?
                            </h3>
                            <ul className="mt-3 space-y-2 text-sm">
                                <li>
                                    <Link
                                        className="text-primary hover:text-primary/80 underline underline-offset-4"
                                        href={`/${lang}/(marketing)/help`}
                                    >
                                        Billing & payments FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        className="text-primary hover:text-primary/80 underline underline-offset-4"
                                        href={`/${lang}/(marketing)/contact`}
                                    >
                                        Contact support
                                    </Link>
                                </li>
                            </ul>
                            <Separator className="my-4" />
                            <div className="text-muted-foreground space-y-1 text-xs">
                                <div>
                                    <Link
                                        href={`/${lang}/(marketing)/legal/terms`}
                                        className="underline underline-offset-4"
                                    >
                                        Terms of Service
                                    </Link>
                                </div>
                                <div>
                                    <Link
                                        href={`/${lang}/(marketing)/legal/privacy`}
                                        className="underline underline-offset-4"
                                    >
                                        Privacy Policy
                                    </Link>
                                </div>
                                <div>
                                    <Link
                                        href={`/${lang}/(marketing)/legal/ip-policy`}
                                        className="underline underline-offset-4"
                                    >
                                        IP Policy
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <h3 className="text-card-foreground text-sm font-semibold">
                                Continue shopping
                            </h3>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <Link
                                    href={`/${lang}/products`}
                                    className="border-border bg-background text-foreground hover:bg-muted rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors"
                                >
                                    Browse products
                                </Link>
                                <Link
                                    href={`/${lang}/design`}
                                    className="border-border bg-background text-foreground hover:bg-muted rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors"
                                >
                                    New design
                                </Link>
                                <Link
                                    href={`/${lang}/cart`}
                                    className="border-border bg-background text-foreground hover:bg-muted rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors"
                                >
                                    View cart
                                </Link>
                                <Link
                                    href={`/${lang}/checkout`}
                                    className="border-border bg-background text-foreground hover:bg-muted rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors"
                                >
                                    Checkout
                                </Link>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    )
}
