import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { supabaseServer } from '@/utils/supabase/client-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: { lang: string; orderId: string }
    searchParams?: { [key: string]: string | string[] | undefined }
}

interface OrderItem {
    id?: string
    name?: string
    title?: string
    variant?: string
    color?: string
    size?: string
    quantity?: number
    price?: number
    currency?: string
    image_url?: string
}

interface OrderRecord {
    id: string
    created_at?: string
    status?: string
    payment_status?: string
    printify_status?: string
    currency?: string
    subtotal_amount?: number
    shipping_amount?: number
    tax_amount?: number
    total_amount?: number
    tracking_code?: string
    tracking_url?: string
    public_token?: string
    user_id?: string
    items?: OrderItem[] | null
    shipping_name?: string
    shipping_phone?: string
    shipping_address?: any
}

interface OrderEvent {
    id: string
    order_id: string
    type: string
    message?: string | null
    created_at: string
}

function formatCurrency(amount?: number | null, currency?: string) {
    if (amount == null) return '—'
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount / 100)
    } catch {
        return `${(amount / 100).toFixed(2)} ${currency || ''}`.trim()
    }
}

function formatDate(d?: string) {
    if (!d) return '—'
    try {
        return new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(d))
    } catch {
        return d
    }
}

function statusPipeline(order?: OrderRecord) {
    const raw = (order?.status || order?.printify_status || '').toLowerCase()
    const isCanceled = ['canceled', 'cancelled', 'refunded'].includes(raw)
    const steps = [
        { key: 'created', label: 'Created' },
        { key: 'paid', label: 'Paid' },
        { key: 'submitted', label: 'Submitted to Production' },
        { key: 'in_production', label: 'In Production' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'delivered', label: 'Delivered' },
    ]

    const map: Record<string, number> = {
        created: 0,
        pending: 0,
        unpaid: 0,
        paid: 1,
        authorized: 1,
        submitted: 2,
        submitted_to_printify: 2,
        in_production: 3,
        production: 3,
        shipped: 4,
        fulfilled: 4,
        delivered: 5,
    }

    const current = isCanceled ? -1 : (map[raw] ?? 0)

    return { steps, current, isCanceled, raw }
}

function Badge({
    children,
    variant = 'default',
}: {
    children: React.ReactNode
    variant?: 'default' | 'success' | 'warning' | 'destructive'
}) {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
    const styles =
        variant === 'success'
            ? 'bg-green-600/15 text-green-700 dark:text-green-400 border border-green-600/20'
            : variant === 'warning'
              ? 'bg-yellow-600/15 text-yellow-700 dark:text-yellow-400 border border-yellow-600/20'
              : variant === 'destructive'
                ? 'bg-destructive/15 text-destructive border border-destructive/20'
                : 'bg-primary/15 text-primary border border-primary/20'
    return <span className={`${base} ${styles}`}>{children}</span>
}

export default async function Page({ params, searchParams }: PageProps) {
    const { lang, orderId } = params
    const tokenParam = (searchParams?.token || searchParams?.t || '') as string
    const supabase = await supabaseServer()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    let order: OrderRecord | null = null
    let orderError: string | null = null

    try {
        if (user) {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .maybeSingle()

            if (error) throw error
            if (data) order = data as unknown as OrderRecord

            if (!order && tokenParam) {
                const { data: byToken, error: tokenErr } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .eq('public_token', tokenParam)
                    .maybeSingle()
                if (tokenErr) throw tokenErr
                if (byToken) order = byToken as unknown as OrderRecord
            }
        } else if (tokenParam) {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .eq('public_token', tokenParam)
                .maybeSingle()
            if (error) throw error
            if (data) order = data as unknown as OrderRecord
        }
    } catch (e: any) {
        orderError = e?.message || 'Unable to load order.'
    }

    let events: OrderEvent[] = []
    try {
        const { data } = await supabase
            .from('order_events')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true })
        if (data) events = data as unknown as OrderEvent[]
    } catch {}

    const { steps, current, isCanceled, raw } = statusPipeline(order || undefined)
    const canViewAccountOrder = Boolean(user && order)

    const trackingUrl =
        order?.tracking_url ||
        (order?.tracking_code ? `/${lang}/track/${encodeURIComponent(order.tracking_code)}` : '')

    return (
        <div className="bg-background min-h-[calc(100vh-4rem)] w-full">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
                <div className="mb-6 flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Order Status</h1>
                        <p className="text-muted-foreground text-sm">
                            Track your order and access next steps.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${lang}/orders`}
                            className="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm shadow-sm"
                        >
                            View all public orders
                        </Link>
                        <Link
                            href={`/${lang}/products`}
                            className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm shadow hover:opacity-90"
                        >
                            Browse products
                        </Link>
                    </div>
                </div>

                {!order && (
                    <div className="space-y-6">
                        <Alert className="border-destructive/30 bg-destructive/10">
                            <AlertTitle>Order not available</AlertTitle>
                            <AlertDescription>
                                {orderError ? (
                                    <span className="text-sm">{orderError}</span>
                                ) : (
                                    <span className="text-sm">
                                        This order could not be found or you do not have permission.
                                        Sign in to view your orders or use a valid secure link.
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={`/${lang}/sign-in?next=/${lang}/orders/${encodeURIComponent(orderId)}`}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm shadow hover:opacity-90"
                            >
                                Sign in to view order
                            </Link>
                            <Link
                                href={`/${lang}/help`}
                                className="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm shadow-sm"
                            >
                                Visit Help Center
                            </Link>
                            <Link
                                href={`/${lang}/contact`}
                                className="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm shadow-sm"
                            >
                                Contact support
                            </Link>
                        </div>

                        <Separator className="my-4" />

                        <QuickNav lang={lang} />
                    </div>
                )}

                {order && (
                    <div className="space-y-8">
                        {user && (
                            <Alert className="border-primary/30 bg-primary/10">
                                <AlertTitle className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            isCanceled
                                                ? 'destructive'
                                                : current >= 5
                                                  ? 'success'
                                                  : 'default'
                                        }
                                    >
                                        {isCanceled ? 'Canceled' : order.status || 'Processing'}
                                    </Badge>
                                    <span className="text-muted-foreground text-sm">
                                        Order {order.id}
                                    </span>
                                </AlertTitle>
                                <AlertDescription className="mt-1 text-sm">
                                    You&apos;re signed in. For full details, manage this order in
                                    your account.
                                </AlertDescription>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Link
                                        href={`/${lang}/account/orders/${encodeURIComponent(order.id)}`}
                                        className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm shadow hover:opacity-90"
                                    >
                                        View in your account
                                    </Link>
                                    <Link
                                        href={`/${lang}/account/orders`}
                                        className="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm shadow-sm"
                                    >
                                        Your orders
                                    </Link>
                                </div>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <section className="border-border bg-card rounded-lg border p-4 shadow-sm md:col-span-2">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-semibold">Order summary</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Placed {formatDate(order.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge
                                            variant={
                                                isCanceled
                                                    ? 'destructive'
                                                    : current >= 5
                                                      ? 'success'
                                                      : 'default'
                                            }
                                        >
                                            {isCanceled ? 'Canceled' : order.status || 'Processing'}
                                        </Badge>
                                        {raw && !isCanceled && (
                                            <span className="text-muted-foreground text-xs">
                                                Stage: {raw}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="mb-6">
                                    <ol className="relative grid grid-cols-2 gap-4 sm:grid-cols-6">
                                        {steps.map((s, idx) => {
                                            const active = idx <= current && !isCanceled
                                            const done = idx < current && !isCanceled
                                            return (
                                                <li
                                                    key={s.key}
                                                    className="flex flex-col items-center text-center"
                                                >
                                                    <div
                                                        className={[
                                                            'h-2 w-full rounded-full',
                                                            active ? 'bg-primary' : 'bg-muted',
                                                            done
                                                                ? 'opacity-100'
                                                                : active
                                                                  ? 'opacity-100'
                                                                  : 'opacity-50',
                                                        ].join(' ')}
                                                    />
                                                    <span
                                                        className={`mt-2 text-xs ${active ? 'text-foreground' : 'text-muted-foreground'}`}
                                                    >
                                                        {s.label}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ol>
                                </div>

                                <div className="border-border overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">Item</TableHead>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="hidden sm:table-cell">
                                                    Variant
                                                </TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(order.items || []).map((it, idx) => (
                                                <TableRow key={it.id || idx}>
                                                    <TableCell>
                                                        {it.image_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={it.image_url}
                                                                alt=""
                                                                className="h-10 w-10 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="bg-muted h-10 w-10 rounded" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">
                                                                {it.title || it.name || 'Item'}
                                                            </span>
                                                            {(it.color || it.size) && (
                                                                <span className="text-muted-foreground text-xs">
                                                                    {[it.color, it.size]
                                                                        .filter(Boolean)
                                                                        .join(' · ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                                                        {it.variant || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {it.quantity || 1}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {formatCurrency(
                                                            it.price ?? 0,
                                                            it.currency || order.currency
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {(!order.items || order.items.length === 0) && (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={5}
                                                        className="text-muted-foreground py-6 text-center text-sm"
                                                    >
                                                        No items found on this order.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>

                            <aside className="flex flex-col gap-6">
                                <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
                                    <h3 className="text-base font-semibold">Payment</h3>
                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>
                                                {formatCurrency(
                                                    order.subtotal_amount,
                                                    order.currency
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span>
                                                {formatCurrency(
                                                    order.shipping_amount,
                                                    order.currency
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span>
                                                {formatCurrency(order.tax_amount, order.currency)}
                                            </span>
                                        </div>
                                        <Separator />
                                        <div className="flex items-center justify-between font-medium">
                                            <span>Total</span>
                                            <span>
                                                {formatCurrency(order.total_amount, order.currency)}
                                            </span>
                                        </div>
                                        {order.payment_status && (
                                            <div className="pt-2">
                                                <Badge
                                                    variant={
                                                        order.payment_status === 'paid'
                                                            ? 'success'
                                                            : order.payment_status === 'refunded'
                                                              ? 'destructive'
                                                              : 'default'
                                                    }
                                                >
                                                    Payment: {order.payment_status}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
                                    <h3 className="text-base font-semibold">Shipping</h3>
                                    <div className="mt-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {order.shipping_name || '—'}
                                            </p>
                                            <div className="text-muted-foreground">
                                                {(() => {
                                                    const a = order.shipping_address || {}
                                                    const lines = [
                                                        a.address1,
                                                        a.address2,
                                                        a.city,
                                                        a.state,
                                                        a.postal_code,
                                                        a.country,
                                                    ].filter(Boolean)
                                                    return lines.length ? (
                                                        <div className="space-y-0.5">
                                                            {a.address1 && <p>{a.address1}</p>}
                                                            {a.address2 && <p>{a.address2}</p>}
                                                            {(a.city ||
                                                                a.state ||
                                                                a.postal_code) && (
                                                                <p>
                                                                    {[
                                                                        a.city,
                                                                        a.state,
                                                                        a.postal_code,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(', ')}
                                                                </p>
                                                            )}
                                                            {a.country && <p>{a.country}</p>}
                                                        </div>
                                                    ) : (
                                                        <p>—</p>
                                                    )
                                                })()}
                                            </div>
                                            {order.shipping_phone && (
                                                <p className="text-muted-foreground">
                                                    {order.shipping_phone}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            {trackingUrl ? (
                                                <div className="space-y-2">
                                                    <Link
                                                        href={trackingUrl}
                                                        className="bg-secondary text-secondary-foreground inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm hover:opacity-90"
                                                        target={
                                                            trackingUrl.startsWith('http')
                                                                ? '_blank'
                                                                : undefined
                                                        }
                                                    >
                                                        Track shipment
                                                    </Link>
                                                    {order.tracking_code && !order.tracking_url && (
                                                        <p className="text-muted-foreground text-center text-xs">
                                                            Tracking code: {order.tracking_code}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-sm">
                                                    Tracking will appear here when available.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
                                    <h3 className="text-base font-semibold">Next steps</h3>
                                    <div className="mt-3 grid grid-cols-1 gap-2">
                                        <Link
                                            href={`/${lang}/design`}
                                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                        >
                                            Start a new design
                                        </Link>
                                        <Link
                                            href={`/${lang}/products`}
                                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                        >
                                            Explore products
                                        </Link>
                                        <Link
                                            href={`/${lang}/cart`}
                                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                        >
                                            View cart
                                        </Link>
                                        <Link
                                            href={`/${lang}/checkout`}
                                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                        >
                                            Go to checkout
                                        </Link>
                                        <Link
                                            href={`/${lang}/help`}
                                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                        >
                                            Help Center
                                        </Link>
                                    </div>
                                </section>
                            </aside>
                        </div>

                        <section className="border-border bg-card rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold">Activity</h3>
                                <Link
                                    href={`/${lang}/orders/${encodeURIComponent(order.id)}${tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : ''}`}
                                    className="text-primary text-sm hover:underline"
                                >
                                    Refresh
                                </Link>
                            </div>
                            {events.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No recent events.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {events.map((ev) => (
                                        <li key={ev.id} className="flex items-start gap-3">
                                            <div className="bg-primary mt-1 h-2 w-2 flex-none rounded-full" />
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {ev.type.replace(/_/g, ' ')}
                                                </p>
                                                {ev.message && (
                                                    <p className="text-muted-foreground text-xs">
                                                        {ev.message}
                                                    </p>
                                                )}
                                                <p className="text-muted-foreground text-xs">
                                                    {formatDate(ev.created_at)}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <FooterLinks lang={lang} />
                    </div>
                )}
            </div>
        </div>
    )
}

function QuickNav({ lang }: { lang: string }) {
    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <Link
                href={`/${lang}`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                Home
            </Link>
            <Link
                href={`/${lang}/about`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                About
            </Link>
            <Link
                href={`/${lang}/products`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                Products
            </Link>
            <Link
                href={`/${lang}/design`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                AI Design
            </Link>
            <Link
                href={`/${lang}/cart`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                Cart
            </Link>
            <Link
                href={`/${lang}/checkout`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                Checkout
            </Link>
            <Link
                href={`/${lang}/sign-in`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                Sign in
            </Link>
            <Link
                href={`/${lang}/sign-up`}
                className="border-input bg-card hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
            >
                Create account
            </Link>
        </div>
    )
}

function FooterLinks({ lang }: { lang: string }) {
    return (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            <Link
                href={`/${lang}/orders`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Public Orders
            </Link>
            <Link
                href={`/${lang}/account/orders`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Your Orders
            </Link>
            <Link
                href={`/${lang}/account`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Account
            </Link>
            <Link
                href={`/${lang}/account/addresses`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Addresses
            </Link>
            <Link
                href={`/${lang}/account/billing`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Billing
            </Link>
            <Link
                href={`/${lang}/account/settings`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Settings
            </Link>
            <Link
                href={`/${lang}/help`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Help
            </Link>
            <Link
                href={`/${lang}/contact`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Contact
            </Link>
            <Link
                href={`/${lang}/legal/terms`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Terms
            </Link>
            <Link
                href={`/${lang}/legal/privacy`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Privacy
            </Link>
            <Link
                href={`/${lang}/legal/ip-policy`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                IP Policy
            </Link>
            <Link
                href={`/${lang}/admin`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
                Admin
            </Link>
        </div>
    )
}
