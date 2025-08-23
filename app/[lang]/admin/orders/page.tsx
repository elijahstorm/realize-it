'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'

interface OrderRow {
    id: string
    status?: string | null
    created_at?: string | null
    updated_at?: string | null
    customer_email?: string | null
    currency?: string | null
    total_amount?: number | null
    failure_reason?: string | null
    printify_order_id?: string | null
}

const STATUS_OPTIONS = [
    'pending',
    'processing',
    'submitted',
    'production',
    'fulfilled',
    'shipped',
    'delivered',
    'canceled',
    'failed',
    'retry_queued',
] as const

type Status = (typeof STATUS_OPTIONS)[number]

function formatCurrency(amount?: number | null, currency?: string | null) {
    const value = typeof amount === 'number' ? amount : 0
    const curr = currency || 'USD'
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: curr }).format(
            value / (value > 10000 ? 100 : 1)
        )
    } catch {
        return `${(value / 100).toFixed(2)} ${curr}`
    }
}

function formatDate(iso?: string | null) {
    if (!iso) return '-'
    try {
        const d = new Date(iso)
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(d)
    } catch {
        return iso
    }
}

function statusColor(status?: string | null) {
    switch ((status || '').toLowerCase()) {
        case 'pending':
            return 'bg-muted text-foreground'
        case 'processing':
            return 'bg-secondary text-secondary-foreground'
        case 'submitted':
            return 'bg-accent text-accent-foreground'
        case 'production':
            return 'bg-chart-3 text-white'
        case 'fulfilled':
            return 'bg-primary text-primary-foreground'
        case 'shipped':
            return 'bg-chart-1 text-white'
        case 'delivered':
            return 'bg-chart-2 text-white'
        case 'canceled':
            return 'bg-destructive text-destructive-foreground'
        case 'failed':
            return 'bg-destructive/80 text-destructive-foreground'
        case 'retry_queued':
            return 'bg-muted text-foreground'
        default:
            return 'bg-border text-foreground'
    }
}

function titleCase(s?: string | null) {
    if (!s) return '-'
    return s
        .split('_')
        .join(' ')
        .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase())
}

export default function AdminOrdersPage() {
    const params = useParams()
    const lang = (params?.lang as string) || 'en'
    const { toast } = useToast()

    const [orders, setOrders] = useState<OrderRow[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState('')
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')
    const [selectedStatuses, setSelectedStatuses] = useState<Set<Status>>(new Set())
    const [failuresOnly, setFailuresOnly] = useState(false)
    const [sortDesc, setSortDesc] = useState(true)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const client = supabaseBrowser

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const { data, error: err } = await client
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(500)
                if (err) throw err
                setOrders(Array.isArray(data) ? (data as OrderRow[]) : [])
            } catch (e: any) {
                setError(e?.message || 'Failed to load orders')
            } finally {
                setLoading(false)
            }
        }

        load()

        const channel = client
            .channel('orders-admin-feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
                // Refresh on any change
                const { data } = await client
                    .from('orders')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(500)
                setOrders((data as OrderRow[]) || [])
            })
            .subscribe()

        return () => {
            client.removeChannel(channel)
        }
    }, [])

    const filtered = useMemo(() => {
        let list = [...orders]

        if (query.trim()) {
            const q = query.trim().toLowerCase()
            list = list.filter((o) => {
                return (
                    o.id?.toLowerCase().includes(q) ||
                    (o.customer_email || '').toLowerCase().includes(q) ||
                    (o.printify_order_id || '').toLowerCase().includes(q) ||
                    (o.status || '').toLowerCase().includes(q)
                )
            })
        }

        if (fromDate) {
            const start = new Date(fromDate)
            list = list.filter((o) => (o.created_at ? new Date(o.created_at) >= start : true))
        }

        if (toDate) {
            const end = new Date(toDate)
            list = list.filter((o) => (o.created_at ? new Date(o.created_at) <= end : true))
        }

        if (selectedStatuses.size > 0) {
            list = list.filter((o) => selectedStatuses.has((o.status || '') as Status))
        }

        if (failuresOnly) {
            list = list.filter(
                (o) => (o.status || '').toLowerCase() === 'failed' || !!o.failure_reason
            )
        }

        list.sort((a, b) => {
            const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
            const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
            return sortDesc ? bTime - aTime : aTime - bTime
        })

        return list
    }, [orders, query, fromDate, toDate, selectedStatuses, failuresOnly, sortDesc])

    const countsByStatus = useMemo(() => {
        const map = new Map<string, number>()
        for (const s of STATUS_OPTIONS) map.set(s, 0)
        for (const o of orders) {
            const s = (o.status || '').toLowerCase()
            map.set(s, (map.get(s) || 0) + 1)
        }
        return map
    }, [orders])

    function toggleStatus(s: Status) {
        setSelectedStatuses((prev) => {
            const next = new Set(prev)
            if (next.has(s)) next.delete(s)
            else next.add(s)
            return next
        })
    }

    function clearFilters() {
        setQuery('')
        setFromDate('')
        setToDate('')
        setSelectedStatuses(new Set())
        setFailuresOnly(false)
    }

    async function retryOrder(orderId: string) {
        const client = supabaseBrowser
        try {
            const { error: err } = await client
                .from('orders')
                .update({ status: 'retry_queued', failure_reason: null })
                .eq('id', orderId)
            if (err) throw err
            toast({ title: 'Retry queued', description: `Order ${orderId} will be retried.` })
        } catch (e: any) {
            toast({
                title: 'Retry failed',
                description: e?.message || 'Unable to retry order',
                variant: 'destructive' as any,
            })
        }
    }

    async function cancelOrder(orderId: string) {
        const client = supabaseBrowser
        try {
            const { error: err } = await client
                .from('orders')
                .update({ status: 'canceled' })
                .eq('id', orderId)
            if (err) throw err
            toast({ title: 'Order canceled', description: `Order ${orderId} marked as canceled.` })
        } catch (e: any) {
            toast({
                title: 'Cancel failed',
                description: e?.message || 'Unable to cancel order',
                variant: 'destructive' as any,
            })
        }
    }

    function exportCSV() {
        const rows = [
            [
                'id',
                'status',
                'created_at',
                'updated_at',
                'customer_email',
                'currency',
                'total_amount',
                'failure_reason',
                'printify_order_id',
            ],
            ...filtered.map((o) => [
                o.id,
                o.status || '',
                o.created_at || '',
                o.updated_at || '',
                o.customer_email || '',
                o.currency || '',
                String(o.total_amount ?? ''),
                (o.failure_reason || '').replace(/\n/g, ' '),
                o.printify_order_id || '',
            ]),
        ]
        const csv = rows
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `admin-orders-${new Date().toISOString()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="bg-background text-foreground min-h-[100dvh]">
            <header className="bg-card/80 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30 w-full border-b backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/${lang}/admin`}
                                className="text-muted-foreground hover:text-foreground text-sm"
                            >
                                Admin
                            </Link>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold">Orders</span>
                            <span className="bg-muted text-muted-foreground ml-3 rounded-full px-2.5 py-0.5 text-xs">
                                {orders.length} total
                            </span>
                        </div>
                        <nav className="hidden items-center gap-2 md:flex">
                            <Link
                                href={`/${lang}/admin/orders`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Orders
                            </Link>
                            <Link
                                href={`/${lang}/admin/retries`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Retries
                            </Link>
                            <Link
                                href={`/${lang}/admin/products-mapping`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Products
                            </Link>
                            <Link
                                href={`/${lang}/admin/logs`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Logs
                            </Link>
                            <Link
                                href={`/${lang}/admin/costs`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Costs
                            </Link>
                            <Link
                                href={`/${lang}/admin/health`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Health
                            </Link>
                            <Link
                                href={`/${lang}/admin/analytics`}
                                className="hover:bg-accent hover:text-accent-foreground rounded-md px-2.5 py-1.5 text-sm"
                            >
                                Analytics
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by order ID, email, Printify ID, or status"
                            className="border-input bg-background focus:border-ring h-9 w-72 rounded-md border px-3 text-sm ring-0 outline-none focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                            />
                        </div>
                        <label className="bg-muted text-muted-foreground inline-flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs">
                            <input
                                type="checkbox"
                                checked={failuresOnly}
                                onChange={(e) => setFailuresOnly(e.target.checked)}
                                className="accent-primary h-3.5 w-3.5"
                            />
                            Failures only
                        </label>
                        <button
                            onClick={clearFilters}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md border px-3 text-sm"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSortDesc((s) => !s)}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md border px-3 text-sm"
                            title="Toggle sort order"
                        >
                            Sort: {sortDesc ? 'Newest' : 'Oldest'}
                        </button>
                        <button
                            onClick={exportCSV}
                            className="bg-primary text-primary-foreground h-9 rounded-md px-3 text-sm hover:opacity-90"
                        >
                            Export CSV
                        </button>
                        <Link
                            href={`/${lang}/orders`}
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md border px-3 text-sm"
                        >
                            Customer Orders
                        </Link>
                    </div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {STATUS_OPTIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => toggleStatus(s)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs',
                                selectedStatuses.has(s)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                            title={`${countsByStatus.get(s) || 0} orders`}
                        >
                            {titleCase(s)}
                            <span className="bg-muted text-muted-foreground ml-2 rounded-full px-1.5 py-0.5 text-[10px]">
                                {countsByStatus.get(s) || 0}
                            </span>
                        </button>
                    ))}
                    <span className="text-muted-foreground ml-auto text-xs">
                        Auto-refresh: Realtime enabled
                    </span>
                </div>

                {error ? (
                    <Alert className="border-destructive/50 bg-destructive/10 text-destructive-foreground mb-4">
                        <AlertTitle>Failed to load</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : null}

                <div className="border-border bg-card rounded-lg border">
                    <Table className="w-full">
                        <TableCaption className="py-3 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="text-muted-foreground text-sm">
                                    Showing {filtered.length} of {orders.length} orders
                                </div>
                                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                                    <Link
                                        href={`/${lang}/admin/health`}
                                        className="hover:text-foreground"
                                    >
                                        System Health
                                    </Link>
                                    <span>•</span>
                                    <Link
                                        href={`/${lang}/admin/logs`}
                                        className="hover:text-foreground"
                                    >
                                        Generation Logs
                                    </Link>
                                    <span>•</span>
                                    <Link
                                        href={`/${lang}/admin/costs`}
                                        className="hover:text-foreground"
                                    >
                                        Costs
                                    </Link>
                                </div>
                            </div>
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Order</TableHead>
                                <TableHead className="w-[140px]">Status</TableHead>
                                <TableHead className="w-[200px]">Customer</TableHead>
                                <TableHead className="w-[140px]">Total</TableHead>
                                <TableHead className="w-[220px]">Created</TableHead>
                                <TableHead>Failure</TableHead>
                                <TableHead className="w-[220px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={`s-${i}`} className="animate-pulse">
                                        <TableCell>
                                            <div className="bg-muted h-4 w-24 rounded" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-muted h-6 w-20 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-muted h-4 w-40 rounded" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-muted h-4 w-16 rounded" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-muted h-4 w-28 rounded" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="bg-muted h-4 w-48 rounded" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="bg-muted ml-auto h-8 w-36 rounded" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-muted-foreground py-10 text-center"
                                    >
                                        No orders found. Try adjusting filters or visit{' '}
                                        <Link
                                            href={`/${lang}/products`}
                                            className="text-primary underline underline-offset-4"
                                        >
                                            Products
                                        </Link>{' '}
                                        or{' '}
                                        <Link
                                            href={`/${lang}/design`}
                                            className="text-primary underline underline-offset-4"
                                        >
                                            Start a Design
                                        </Link>
                                        .
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((o) => {
                                    const canCancel = ![
                                        'canceled',
                                        'shipped',
                                        'delivered',
                                    ].includes((o.status || '').toLowerCase())
                                    const isFailed = (o.status || '').toLowerCase() === 'failed'
                                    return (
                                        <TableRow key={o.id} className="group">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/${lang}/admin/orders/${o.id}`}
                                                        className="text-primary font-medium underline-offset-4 hover:underline"
                                                    >
                                                        {o.id}
                                                    </Link>
                                                    {o.printify_order_id ? (
                                                        <span className="text-muted-foreground text-xs">
                                                            Printify: {o.printify_order_id}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                                                        statusColor(o.status)
                                                    )}
                                                >
                                                    {titleCase(o.status)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {o.customer_email || '—'}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        Updated: {formatDate(o.updated_at)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {formatCurrency(
                                                        o.total_amount ?? undefined,
                                                        o.currency ?? undefined
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {formatDate(o.created_at)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {o.failure_reason ? (
                                                    <div className="text-destructive max-w-[420px] truncate text-xs">
                                                        {o.failure_reason}
                                                    </div>
                                                ) : isFailed ? (
                                                    <span className="text-destructive text-xs">
                                                        Failed
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/${lang}/admin/orders/${o.id}`}
                                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-2.5 py-1.5 text-xs"
                                                        title="View order details"
                                                    >
                                                        View
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            const ok = window.confirm(
                                                                `Queue retry for order ${o.id}?`
                                                            )
                                                            if (!ok) return
                                                            startTransition(() => {
                                                                retryOrder(o.id)
                                                            })
                                                        }}
                                                        disabled={isPending}
                                                        className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1.5 text-xs hover:opacity-90 disabled:opacity-50"
                                                    >
                                                        Retry
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!canCancel) return
                                                            const ok = window.confirm(
                                                                `Cancel order ${o.id}? This cannot be undone.`
                                                            )
                                                            if (!ok) return
                                                            startTransition(() => {
                                                                cancelOrder(o.id)
                                                            })
                                                        }}
                                                        disabled={!canCancel || isPending}
                                                        className={cn(
                                                            'rounded-md px-2.5 py-1.5 text-xs',
                                                            canCancel
                                                                ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                        )}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="border-border bg-card rounded-lg border p-4">
                        <h3 className="mb-2 font-medium">Helpful Links</h3>
                        <ul className="space-y-1 text-sm">
                            <li>
                                <Link
                                    href={`/${lang}/admin/logs`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Image Generation Logs
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/admin/retries`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Retry Queue
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/admin/analytics`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Analytics
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/account/orders`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Customer Order History
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/(marketing)/help`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    Help Center
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="border-border bg-card rounded-lg border p-4">
                        <h3 className="mb-2 font-medium">Status Summary</h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {STATUS_OPTIONS.map((s) => (
                                <div
                                    key={`sum-${s}`}
                                    className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm"
                                >
                                    <span>{titleCase(s)}</span>
                                    <span className="font-semibold">
                                        {countsByStatus.get(s) || 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="text-muted-foreground mx-auto max-w-7xl px-4 py-8 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/${lang}/(marketing)/about`} className="hover:text-foreground">
                        About
                    </Link>
                    <span>•</span>
                    <Link href={`/${lang}/(marketing)/contact`} className="hover:text-foreground">
                        Contact
                    </Link>
                    <span>•</span>
                    <Link
                        href={`/${lang}/(marketing)/legal/terms`}
                        className="hover:text-foreground"
                    >
                        Terms
                    </Link>
                    <span>•</span>
                    <Link
                        href={`/${lang}/(marketing)/legal/privacy`}
                        className="hover:text-foreground"
                    >
                        Privacy
                    </Link>
                    <span>•</span>
                    <Link
                        href={`/${lang}/(marketing)/legal/ip-policy`}
                        className="hover:text-foreground"
                    >
                        IP Policy
                    </Link>
                </div>
            </footer>
        </div>
    )
}
