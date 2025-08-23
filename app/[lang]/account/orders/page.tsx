'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption,
} from '@/components/ui/table'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 10

type Order = {
    id: string
    created_at: string
    status: string | null
    number: string | null
    total_amount: number | null
    currency: string | null
    tracking_code: string | null
    tracking_url: string | null
    items_count: number | null
    payment_status?: string | null
    fulfillment_status?: string | null
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_production', label: 'In Production' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'refunded', label: 'Refunded' },
]

function statusColorClasses(status?: string | null) {
    switch ((status || '').toLowerCase()) {
        case 'pending':
            return 'bg-muted text-foreground'
        case 'processing':
        case 'submitted':
            return 'bg-secondary text-secondary-foreground'
        case 'in_production':
            return 'bg-accent text-accent-foreground'
        case 'shipped':
            return 'bg-primary/15 text-primary'
        case 'delivered':
            return 'bg-chart-2/20 text-chart-2'
        case 'refunded':
        case 'canceled':
            return 'bg-destructive/15 text-destructive'
        default:
            return 'bg-muted text-foreground'
    }
}

function formatCurrency(
    amount: number | null | undefined,
    currency: string | null | undefined,
    locale: string
) {
    const safeAmount = typeof amount === 'number' ? amount / 100 : 0 // assume stored in cents
    const safeCurrency = currency || (locale.startsWith('ko') ? 'KRW' : 'USD')
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: safeCurrency }).format(
            safeAmount
        )
    } catch {
        return `${safeAmount.toFixed(2)} ${safeCurrency}`
    }
}

export default function OrdersPage() {
    const params = useParams()
    const router = useRouter()
    const { lang } = params as { lang: string }
    const locale = lang === 'kr' || lang === 'ko' ? 'ko-KR' : 'en-US'

    const searchParams = useSearchParams()
    const initialQuery = searchParams.get('q') || ''
    const initialStatus = searchParams.get('status') || 'all'

    const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string>('')
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [q, setQ] = useState(initialQuery)
    const [status, setStatus] = useState(initialStatus)

    const updateQueryString = useCallback(
        (next: { q?: string; status?: string }) => {
            const sp = new URLSearchParams(searchParams?.toString())
            if (typeof next.q !== 'undefined') {
                if (next.q) sp.set('q', next.q)
                else sp.delete('q')
            }
            if (typeof next.status !== 'undefined') {
                if (next.status) sp.set('status', next.status)
                else sp.delete('status')
            }
            router.replace(`/${lang}/account/orders?${sp.toString()}`)
        },
        [lang, router, searchParams]
    )

    useEffect(() => {
        const sb = supabaseBrowser
        sb.auth
            .getUser()
            .then(({ data }) => {
                setIsAuthed(!!data.user)
            })
            .catch(() => setIsAuthed(false))
    }, [])

    const fetchOrders = useCallback(
        async (pageIndex: number, append = false) => {
            setError('')
            if (append) setLoadingMore(true)
            else setLoading(true)

            try {
                const sb = supabaseBrowser

                let queryBuilder = sb
                    .from('orders')
                    .select(
                        'id, created_at, status, total_amount, currency, number, tracking_code, tracking_url, items_count, payment_status, fulfillment_status',
                        { count: 'exact' }
                    )
                    .order('created_at', { ascending: false })

                if (status && status !== 'all') {
                    queryBuilder = queryBuilder.eq('status', status)
                }

                if (q && q.trim().length > 0) {
                    const like = q.trim().replace(/%/g, '\\%')
                    queryBuilder = queryBuilder.or(
                        `number.ilike.%${like}%,tracking_code.ilike.%${like}%`
                    )
                }

                const from = pageIndex * PAGE_SIZE
                const to = from + PAGE_SIZE - 1
                const { data, error: qError, count } = await queryBuilder.range(from, to)
                if (qError) throw qError

                const rows = (data || []) as Order[]
                setOrders((prev) => (append ? [...prev, ...rows] : rows))
                const total = typeof count === 'number' ? count : rows.length
                setHasMore((append ? orders.length + rows.length : rows.length) < total)
            } catch (e: any) {
                setError(e?.message || 'Failed to load orders. Please try again.')
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [q, orders.length, status]
    )

    useEffect(() => {
        if (isAuthed === false) return
        if (isAuthed === null) return
        setPage(0)
        fetchOrders(0, false)
    }, [isAuthed, fetchOrders])

    const onSubmitSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateQueryString({ q })
        setPage(0)
        fetchOrders(0, false)
    }

    const onChangeStatus = (value: string) => {
        setStatus(value)
        updateQueryString({ status: value })
        setPage(0)
        fetchOrders(0, false)
    }

    const loadMore = () => {
        const next = page + 1
        setPage(next)
        fetchOrders(next, true)
    }

    const headerActions = (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Link href={`/${lang}/account`} className="hover:text-foreground transition-colors">
                    Account
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">Orders</span>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
                <Link
                    href={`/${lang}/products`}
                    className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap shadow hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none"
                >
                    Browse Products
                </Link>
                <Link
                    href={`/${lang}/design`}
                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap"
                >
                    Start a Design
                </Link>
            </div>
        </div>
    )

    const quickNav = (
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <Link href={`/${lang}/account/addresses`} className="hover:text-foreground">
                Addresses
            </Link>
            <span className="text-border">|</span>
            <Link href={`/${lang}/account/billing`} className="hover:text-foreground">
                Billing
            </Link>
            <span className="text-border">|</span>
            <Link href={`/${lang}/account/settings`} className="hover:text-foreground">
                Settings
            </Link>
            <span className="text-border">|</span>
            <Link href={`/${lang}/help`} className="hover:text-foreground">
                Help
            </Link>
            <span className="text-border">|</span>
            <Link href={`/${lang}/orders`} className="hover:text-foreground">
                Public Orders
            </Link>
        </div>
    )

    if (isAuthed === false) {
        return (
            <main className="mx-auto w-full max-w-6xl px-4 py-8">
                {headerActions}
                <Separator className="my-4" />
                <Alert className="bg-card text-card-foreground border-input">
                    <AlertTitle>Sign in required</AlertTitle>
                    <AlertDescription>
                        Please sign in to view your order history. You can also create a new account
                        if you don&apos;t have one.
                        <div className="mt-4 flex gap-2">
                            <Link
                                href={`/${lang}/sign-in`}
                                className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
                            >
                                Sign In
                            </Link>
                            <Link
                                href={`/${lang}/sign-up`}
                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
                            >
                                Create Account
                            </Link>
                        </div>
                    </AlertDescription>
                </Alert>
                <div className="mt-6">{quickNav}</div>
            </main>
        )
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
            {headerActions}
            <Separator className="my-4" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <form
                    onSubmit={onSubmitSearch}
                    className="flex w-full items-center gap-2 sm:max-w-md"
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by order # or tracking code"
                        className="border-input bg-background ring-offset-background focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                        aria-label="Search orders"
                    />
                    <button
                        type="submit"
                        className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
                    >
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2 overflow-x-auto">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => onChangeStatus(opt.value)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs whitespace-nowrap transition-colors',
                                status === opt.value
                                    ? 'bg-primary text-primary-foreground border-transparent'
                                    : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-input'
                            )}
                            aria-pressed={status === opt.value}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-border bg-card mt-6 rounded-lg border">
                <Table>
                    <TableCaption className="text-muted-foreground">
                        Your recent orders
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[160px]">Order</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tracking</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading &&
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={`s-${i}`}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Skeleton className="mx-auto h-4 w-8" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-16" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="ml-auto h-8 w-24" />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {!loading && orders.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div>No orders found.</div>
                                        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                                            <Link
                                                href={`/${lang}/design`}
                                                className="bg-primary text-primary-foreground rounded-md px-3 py-2"
                                            >
                                                Create your first design
                                            </Link>
                                            <Link
                                                href={`/${lang}/products`}
                                                className="border-input hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2"
                                            >
                                                Explore products
                                            </Link>
                                            <Link href={`/${lang}/help`} className="underline">
                                                Need help?
                                            </Link>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            orders.map((order) => {
                                const orderLabel = order.number
                                    ? `#${order.number}`
                                    : `Order ${order.id.slice(0, 8)}`
                                const date = new Date(order.created_at)
                                const dateStr = new Intl.DateTimeFormat(locale, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                }).format(date)
                                const totalStr = formatCurrency(
                                    order.total_amount,
                                    order.currency,
                                    locale
                                )
                                const trackingInternal = order.tracking_code
                                    ? `/${lang}/track/${order.tracking_code}`
                                    : null

                                return (
                                    <TableRow key={order.id} className="hover:bg-accent/50">
                                        <TableCell>
                                            <Link
                                                href={`/${lang}/account/orders/${order.id}`}
                                                className="font-medium underline-offset-2 hover:underline"
                                            >
                                                {orderLabel}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {dateStr}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {order.items_count ?? '-'}
                                        </TableCell>
                                        <TableCell>{totalStr}</TableCell>
                                        <TableCell>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                                                    statusColorClasses(order.status)
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'mr-1 inline-block h-2 w-2 rounded-full',
                                                        order.status
                                                            ? 'bg-current'
                                                            : 'bg-muted-foreground'
                                                    )}
                                                />
                                                {order.status
                                                    ? order.status.replace(/_/g, ' ')
                                                    : 'Unknown'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {order.tracking_code ? (
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={trackingInternal!}
                                                        className="underline underline-offset-2"
                                                    >
                                                        {order.tracking_code}
                                                    </Link>
                                                    {order.tracking_url && (
                                                        <a
                                                            href={order.tracking_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-muted-foreground hover:text-foreground text-xs"
                                                        >
                                                            External
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <Link
                                                    href={`/${lang}/account/orders/${order.id}`}
                                                    className="border-input hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                                >
                                                    View
                                                </Link>
                                                {order.tracking_code && (
                                                    <Link
                                                        href={`/${lang}/track/${order.tracking_code}`}
                                                        className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                                    >
                                                        Track
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                    </TableBody>
                </Table>
            </div>

            {error && (
                <div className="mt-4">
                    <Alert className="bg-destructive/10 border-destructive text-destructive-foreground">
                        <AlertTitle>Could not load orders</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            {!loading && orders.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                        Showing {orders.length} {orders.length === 1 ? 'order' : 'orders'}.{' '}
                        {hasMore ? 'More available.' : 'End of list.'}
                    </div>
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className={cn(
                                'bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow',
                                loadingMore ? 'cursor-not-allowed opacity-70' : 'hover:opacity-90'
                            )}
                        >
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    )}
                </div>
            )}

            <div className="mt-10">
                {quickNav}
                <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/${lang}/checkout`} className="hover:text-foreground">
                        Checkout
                    </Link>
                    <span className="text-border">|</span>
                    <Link href={`/${lang}/cart`} className="hover:text-foreground">
                        Cart
                    </Link>
                    <span className="text-border">|</span>
                    <Link href={`/${lang}/about`} className="hover:text-foreground">
                        About
                    </Link>
                    <span className="text-border">|</span>
                    <Link href={`/${lang}/contact`} className="hover:text-foreground">
                        Contact
                    </Link>
                    <span className="text-border">|</span>
                    <Link href={`/${lang}/legal/terms`} className="hover:text-foreground">
                        Terms
                    </Link>
                    <span className="text-border">|</span>
                    <Link href={`/${lang}/legal/privacy`} className="hover:text-foreground">
                        Privacy
                    </Link>
                </div>
            </div>
        </main>
    )
}
