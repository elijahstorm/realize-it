'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type PageProps = {
    params: { lang: string; orderId: string }
}

type OrderItem = {
    id: string | number
    product_slug?: string | null
    product_name?: string | null
    variant_name?: string | null
    quantity?: number | null
    unit_price?: number | null
    currency?: string | null
    preview_image_url?: string | null
    options?: Record<string, any> | null
    printify_variant_id?: string | number | null
}

type OrderRecord = {
    id: string
    status?: string | null
    printify_status?: string | null
    payment_status?: string | null
    total_amount?: number | null
    subtotal_amount?: number | null
    shipping_amount?: number | null
    tax_amount?: number | null
    discount_amount?: number | null
    currency?: string | null
    created_at?: string | null
    shipping_address?: any
    tracking_code?: string | null
    tracking_url?: string | null
    invoice_url?: string | null
    printify_order_id?: string | null
    items?: OrderItem[] | null
}

export default function OrderDetailPage({ params }: PageProps) {
    const { orderId, lang } = params
    const router = useRouter()
    const { toast } = useToast()

    const [loading, setLoading] = useState(true)
    const [authChecking, setAuthChecking] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [order, setOrder] = useState<OrderRecord | null>(null)
    const [error, setError] = useState<string | null>(null)

    const supabase = useMemo(() => supabaseBrowser, [])

    useEffect(() => {
        let isMounted = true

        async function init() {
            setAuthChecking(true)
            const { data: authData, error: authError } = await supabase.auth.getUser()
            if (authError) {
                if (!isMounted) return
                setAuthChecking(false)
                setUserId(null)
                setError('Authentication error. Please sign in again.')
                return
            }
            if (!authData.user) {
                if (!isMounted) return
                setAuthChecking(false)
                setUserId(null)
                return
            }
            if (!isMounted) return
            setUserId(authData.user.id)
            setAuthChecking(false)
        }

        init()
        return () => {
            isMounted = false
        }
    }, [supabase])

    useEffect(() => {
        let aborted = false

        async function fetchOrder() {
            if (!userId) return
            setLoading(true)
            setError(null)
            try {
                // Try primary relation alias mapping
                let { data, error: qErr } = await supabase
                    .from('orders')
                    .select('*, items:order_items(*)')
                    .eq('id', orderId)
                    .maybeSingle()

                if (qErr || !data) {
                    // Try alternative relation name
                    const alt = await supabase
                        .from('orders')
                        .select('*, items(*)')
                        .eq('id', orderId)
                        .maybeSingle()
                    data = alt.data as any
                    qErr = alt.error as any
                    if ((qErr || !data) && (!qErr?.code || qErr.code !== 'PGRST116')) {
                        // Try orders_view if exists
                        const altView = await supabase
                            .from('orders_view')
                            .select('*, items(*)')
                            .eq('id', orderId)
                            .maybeSingle()
                        data = altView.data as any
                        qErr = altView.error as any
                    }
                }

                if (qErr) {
                    throw qErr
                }

                if (!data) {
                    setOrder(null)
                    setError('Order not found.')
                    return
                }

                if (!aborted) {
                    // Ensure items array exists
                    const normalized: OrderRecord = {
                        ...data,
                        items: Array.isArray(data.items) ? data.items : [],
                    }
                    setOrder(normalized)
                }
            } catch (e: any) {
                if (!aborted) {
                    setError(e?.message || 'Unable to load order details.')
                }
            } finally {
                if (!aborted) setLoading(false)
            }
        }

        fetchOrder()

        return () => {
            aborted = true
        }
    }, [supabase, orderId, userId])

    const currency = order?.currency || 'USD'
    const fmt = useMemo(
        () => new Intl.NumberFormat(undefined, { style: 'currency', currency }),
        [currency]
    )

    function statusClass(variant: 'ok' | 'warn' | 'info' | 'error' | 'muted') {
        const map: Record<string, string> = {
            ok: 'bg-emerald-500 text-emerald-50',
            warn: 'bg-amber-500 text-amber-950',
            info: 'bg-blue-500 text-blue-50',
            error: 'bg-destructive text-destructive-foreground',
            muted: 'bg-muted text-muted-foreground',
        }
        return cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            map[variant]
        )
    }

    function mapPaymentStatus(s?: string | null) {
        const t = (s || '').toLowerCase()
        if (['paid', 'succeeded', 'captured'].includes(t))
            return { label: 'Paid', cls: statusClass('ok') }
        if (['requires_payment_method', 'requires_action', 'processing'].includes(t))
            return { label: 'Processing', cls: statusClass('info') }
        if (['refunded', 'partially_refunded'].includes(t))
            return { label: 'Refunded', cls: statusClass('warn') }
        if (['failed', 'canceled', 'cancelled'].includes(t))
            return { label: 'Failed', cls: statusClass('error') }
        return { label: s ? s : 'Unknown', cls: statusClass('muted') }
    }

    function mapFulfillmentStatus(s?: string | null) {
        const t = (s || '').toLowerCase()
        if (['queued', 'submitted', 'on-hold'].includes(t))
            return { label: 'Submitted', cls: statusClass('info') }
        if (['in-production', 'processing'].includes(t))
            return { label: 'In production', cls: statusClass('info') }
        if (['shipped', 'fulfilled'].includes(t))
            return { label: 'Shipped', cls: statusClass('ok') }
        if (['delivered'].includes(t)) return { label: 'Delivered', cls: statusClass('ok') }
        if (['canceled', 'cancelled', 'failed'].includes(t))
            return { label: 'Canceled', cls: statusClass('error') }
        return { label: s ? s : 'Pending', cls: statusClass('muted') }
    }

    function ShippingAddressView({ address }: { address: any }) {
        if (!address)
            return <p className="text-muted-foreground text-sm">No shipping address available.</p>
        const lines: string[] = []
        const name =
            address.name || address.full_name || address.recipient_name || address.customer || null
        if (name) lines.push(String(name))
        const l1 = address.line1 || address.address1 || address.address_line1 || null
        const l2 = address.line2 || address.address2 || address.address_line2 || null
        const city = address.city || address.locality || null
        const state = address.state || address.region || address.province || null
        const postal = address.postal_code || address.zip || address.postcode || null
        const country = address.country || address.country_code || null
        const phone = address.phone || null
        const parts = [l1, l2, city, state, postal, country].filter(Boolean).join(', ')
        return (
            <div className="text-sm leading-relaxed">
                {lines.length > 0 && <div>{lines.join(' ')}</div>}
                {parts && <div className="text-muted-foreground">{parts}</div>}
                {phone && <div className="text-muted-foreground">{phone}</div>}
            </div>
        )
    }

    function onReorder() {
        if (!order) return
        try {
            const items = (order.items || []).map((it) => ({
                product_slug: it.product_slug || null,
                product_name: it.product_name || null,
                variant_name: it.variant_name || null,
                quantity: it.quantity || 1,
                unit_price: it.unit_price || null,
                currency: it.currency || order.currency || null,
                printify_variant_id: it.printify_variant_id || null,
                options: it.options || null,
            }))
            const payload = { source: 'order', orderId: order.id, items }
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart:reorder', JSON.stringify(payload))
            }
            toast({
                title: 'Added to cart',
                description: 'Your previous items were added. You can review them in your cart.',
            })
            router.push(`/${lang}/cart?reorder=${encodeURIComponent(order.id)}`)
        } catch (e) {
            toast({
                title: 'Unable to reorder',
                description: 'Please try again or contact support.',
                variant: 'destructive' as any,
            })
        }
    }

    function copyTracking(code: string) {
        if (!code) return
        navigator.clipboard.writeText(code).then(() => {
            toast({ title: 'Copied', description: 'Tracking code copied to clipboard.' })
        })
    }

    function dateFmt(d?: string | null) {
        if (!d) return '—'
        try {
            return new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
            }).format(new Date(d))
        } catch {
            return d
        }
    }

    if (authChecking) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        )
    }

    if (!userId) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16">
                <Alert className="border-border border">
                    <AlertTitle className="text-base font-semibold">Sign in required</AlertTitle>
                    <AlertDescription className="text-muted-foreground text-sm">
                        Please
                        <Link
                            href={`/${lang}/(auth)/sign-in`}
                            className="text-primary mx-1 underline underline-offset-4"
                        >
                            sign in
                        </Link>
                        to view order details.
                    </AlertDescription>
                </Alert>
                <div className="text-muted-foreground mt-6 flex items-center gap-3 text-sm">
                    <Link
                        href={`/${lang}/(marketing)/help`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Help
                    </Link>
                    <span>•</span>
                    <Link
                        href={`/${lang}/(marketing)/contact`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Contact support
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <nav aria-label="Breadcrumb" className="text-muted-foreground mb-6 text-sm">
                <ol className="flex flex-wrap items-center gap-1">
                    <li>
                        <Link
                            href={`/${lang}/account`}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Account
                        </Link>
                    </li>
                    <li className="px-1">/</li>
                    <li>
                        <Link
                            href={`/${lang}/account/orders`}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Orders
                        </Link>
                    </li>
                    <li className="px-1">/</li>
                    <li className="text-foreground">{orderId}</li>
                </ol>
            </nav>

            <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Order #{orderId}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Placed on {dateFmt(order?.created_at)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onReorder}
                        className="bg-primary text-primary-foreground focus:ring-primary inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-90 focus:ring-2 focus:outline-none"
                    >
                        Reorder
                    </button>
                    <Link
                        href={`/${lang}/(marketing)/contact?order=${encodeURIComponent(orderId)}`}
                        className="bg-secondary text-secondary-foreground focus:ring-secondary inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-90 focus:ring-2 focus:outline-none"
                    >
                        Contact support
                    </Link>
                    {order?.invoice_url ? (
                        <a
                            href={order.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            View invoice
                        </a>
                    ) : (
                        <Link
                            href={`/${lang}/account/billing`}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                        >
                            Billing
                        </Link>
                    )}
                </div>
            </header>

            {error && (
                <div className="mb-6">
                    <Alert variant="destructive" className="border-destructive/40 border">
                        <AlertTitle>Unable to load order</AlertTitle>
                        <AlertDescription>
                            {error} If this persists, please
                            <Link
                                href={`/${lang}/(marketing)/contact`}
                                className="ml-1 underline underline-offset-4"
                            >
                                contact support
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="border-border bg-card rounded-lg border p-4 md:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Items</h2>
                        <Link
                            href={`/${lang}/products`}
                            className="text-primary hover:text-primary/80 text-sm underline underline-offset-4"
                        >
                            Continue shopping
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : order?.items && order.items.length > 0 ? (
                        <div className="border-border overflow-hidden rounded-md border">
                            <Table className="w-full">
                                <TableHeader className="bg-muted/40">
                                    <TableRow>
                                        <TableHead className="w-16">Item</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Variant</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.items.map((it) => (
                                        <TableRow
                                            key={String(it.id)}
                                            className="hover:bg-accent/40"
                                        >
                                            <TableCell>
                                                {it.preview_image_url ? (
                                                    <div className="border-border bg-muted relative h-12 w-12 overflow-hidden rounded-md border">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={it.preview_image_url}
                                                            alt={it.product_name || 'Item preview'}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="border-border bg-muted h-12 w-12 rounded-md border border-dashed" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {it.product_slug ? (
                                                    <Link
                                                        href={`/${lang}/products/${it.product_slug}`}
                                                        className="hover:text-foreground font-medium underline underline-offset-4"
                                                    >
                                                        {it.product_name || it.product_slug}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium">
                                                        {it.product_name || 'Product'}
                                                    </span>
                                                )}
                                                {it.options ? (
                                                    <div className="text-muted-foreground mt-1 text-xs">
                                                        {Object.entries(it.options).map(
                                                            ([k, v]) => (
                                                                <span key={k} className="mr-2">
                                                                    {k}: {String(v)}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {it.variant_name || '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {it.quantity ?? 1}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {it.unit_price != null
                                                    ? fmt.format(it.unit_price / 100)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {it.unit_price != null
                                                    ? fmt.format(
                                                          ((it.quantity ?? 1) *
                                                              (it.unit_price || 0)) /
                                                              100
                                                      )
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="border-border text-muted-foreground rounded-md border border-dashed p-6 text-sm">
                            No items found for this order.{' '}
                            <Link
                                href={`/${lang}/design`}
                                className="hover:text-foreground ml-1 underline underline-offset-4"
                            >
                                Start a new design
                            </Link>
                            .
                        </div>
                    )}
                </div>

                <aside className="space-y-6 md:col-span-1">
                    <div className="border-border bg-card rounded-lg border p-4">
                        <h3 className="mb-3 text-base font-semibold">Status</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Payment</span>
                                <span className={mapPaymentStatus(order?.payment_status).cls}>
                                    {mapPaymentStatus(order?.payment_status).label}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Fulfillment</span>
                                <span className={mapFulfillmentStatus(order?.printify_status).cls}>
                                    {mapFulfillmentStatus(order?.printify_status).label}
                                </span>
                            </div>
                            {order?.printify_order_id && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Printify ID</span>
                                    <span className="font-mono text-xs">
                                        {order.printify_order_id}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Placed</span>
                                <span>{dateFmt(order?.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-border bg-card rounded-lg border p-4">
                        <h3 className="mb-3 text-base font-semibold">Shipping</h3>
                        <div className="space-y-3">
                            <ShippingAddressView address={order?.shipping_address} />
                            <div className="border-border rounded-md border p-3">
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tracking</span>
                                    {order?.tracking_code ? (
                                        <button
                                            onClick={() => copyTracking(order.tracking_code!)}
                                            className="text-primary hover:text-primary/80 text-xs underline underline-offset-4"
                                        >
                                            Copy
                                        </button>
                                    ) : null}
                                </div>
                                {order?.tracking_code ? (
                                    <div className="space-y-1">
                                        <div className="font-medium">{order.tracking_code}</div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            <Link
                                                href={`/${lang}/track/${encodeURIComponent(order.tracking_code)}`}
                                                className="text-primary hover:text-primary/80 underline underline-offset-4"
                                            >
                                                Track in app
                                            </Link>
                                            {order.tracking_url ? (
                                                <a
                                                    href={order.tracking_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="hover:text-foreground underline underline-offset-4"
                                                >
                                                    Carrier site
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-sm">
                                        Not available yet. We’ll email you when tracking is ready.
                                        See
                                        <Link
                                            href={`/${lang}/(marketing)/help`}
                                            className="hover:text-foreground ml-1 underline underline-offset-4"
                                        >
                                            Help
                                        </Link>
                                        .
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-border bg-card rounded-lg border p-4">
                        <h3 className="mb-3 text-base font-semibold">Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>
                                    {order?.subtotal_amount != null
                                        ? fmt.format((order.subtotal_amount || 0) / 100)
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>
                                    {order?.shipping_amount != null
                                        ? fmt.format((order.shipping_amount || 0) / 100)
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span>
                                    {order?.tax_amount != null
                                        ? fmt.format((order.tax_amount || 0) / 100)
                                        : '—'}
                                </span>
                            </div>
                            {order?.discount_amount != null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Discounts</span>
                                    <span>-{fmt.format((order.discount_amount || 0) / 100)}</span>
                                </div>
                            )}
                            <div className="border-border my-2 border-t"></div>
                            <div className="flex items-center justify-between text-base font-semibold">
                                <span>Total</span>
                                <span>
                                    {order?.total_amount != null
                                        ? fmt.format((order.total_amount || 0) / 100)
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            <section className="border-border bg-card mt-10 rounded-lg border p-4">
                <h3 className="mb-3 text-base font-semibold">Need help?</h3>
                <p className="text-muted-foreground text-sm">
                    Visit our
                    <Link
                        href={`/${lang}/(marketing)/help`}
                        className="hover:text-foreground mx-1 underline underline-offset-4"
                    >
                        Help Center
                    </Link>
                    or
                    <Link
                        href={`/${lang}/(marketing)/contact?order=${encodeURIComponent(orderId)}`}
                        className="hover:text-foreground ml-1 underline underline-offset-4"
                    >
                        contact support
                    </Link>
                    . You can also review your
                    <Link
                        href={`/${lang}/account/orders`}
                        className="hover:text-foreground ml-1 underline underline-offset-4"
                    >
                        orders
                    </Link>
                    or update
                    <Link
                        href={`/${lang}/account/settings`}
                        className="hover:text-foreground ml-1 underline underline-offset-4"
                    >
                        settings
                    </Link>
                    .
                </p>
            </section>
        </div>
    )
}
