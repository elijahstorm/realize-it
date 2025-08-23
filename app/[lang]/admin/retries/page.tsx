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
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

type AnyRecord = Record<string, any>

interface RetryItem extends AnyRecord {
    id: string | number
    status?: string
    operation_type?: string
    type?: string
    attempts?: number
    attempt_count?: number
    max_attempts?: number
    order_id?: string | number | null
    related_order_id?: string | number | null
    session_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    next_retry_at?: string | null
    last_error?: string | null
    error?: string | null
    external_ref?: string | null
    log_id?: string | number | null
}

const CANDIDATE_TABLES = [
    'retry_queue',
    'operation_retries',
    'job_retries',
    'failed_jobs',
    'failed_operations',
    'jobs_retry',
    'retries',
]

const STATUS_STYLES: Record<string, string> = {
    failed: 'bg-destructive/10 text-destructive',
    error: 'bg-destructive/10 text-destructive',
    canceled: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
    queued: 'bg-secondary text-secondary-foreground',
    pending: 'bg-secondary text-secondary-foreground',
    retrying: 'bg-primary/10 text-primary',
    succeeded: 'bg-green-600/10 text-green-600',
}

function formatDate(d?: string | null) {
    if (!d) return '—'
    try {
        return new Date(d).toLocaleString()
    } catch {
        return d
    }
}

function compactId(id: string | number | null | undefined) {
    if (id == null) return '—'
    const s = String(id)
    if (s.length <= 8) return s
    return `${s.slice(0, 4)}…${s.slice(-3)}`
}

function getStatusStyle(status?: string | null) {
    if (!status) return 'bg-muted text-muted-foreground'
    const key = status.toLowerCase()
    return STATUS_STYLES[key] ?? 'bg-muted text-muted-foreground'
}

export default function AdminRetriesPage() {
    const params = useParams<{ lang: string }>()
    const lang = (params?.lang as string) || 'en'
    const base = `/${lang}`
    const { toast } = useToast()

    const [loading, setLoading] = React.useState<boolean>(true)
    const [items, setItems] = React.useState<RetryItem[]>([])
    const [dataSource, setDataSource] = React.useState<string | null>(null)
    const [loadError, setLoadError] = React.useState<string | null>(null)

    const [query, setQuery] = React.useState<string>('')
    const [statusFilter, setStatusFilter] = React.useState<string>('')
    const [typeFilter, setTypeFilter] = React.useState<string>('')
    const [dateFrom, setDateFrom] = React.useState<string>('')
    const [dateTo, setDateTo] = React.useState<string>('')
    const [selected, setSelected] = React.useState<Set<string | number>>(new Set())

    const [page, setPage] = React.useState<number>(1)
    const pageSize = 20

    const supabase = React.useMemo(() => supabaseBrowser, [])

    const loadData = React.useCallback(async () => {
        setLoading(true)
        setLoadError(null)
        setSelected(new Set())

        for (const table of CANDIDATE_TABLES) {
            try {
                const { data, error } = await supabase.from(table).select('*').limit(200)
                if (error) {
                    continue
                }
                setItems(Array.isArray(data) ? (data as RetryItem[]) : [])
                setDataSource(table)
                setLoading(false)
                return
            } catch (e) {
                continue
            }
        }
        setItems([])
        setDataSource(null)
        setLoading(false)
        setLoadError(
            'No retry table found. Configure your database to expose a retry/failed-ops table.'
        )
    }, [supabase])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    React.useEffect(() => {
        const t = setInterval(() => {
            loadData()
        }, 15000)
        return () => clearInterval(t)
    }, [loadData])

    const filtered = React.useMemo(() => {
        let list = [...items]
        if (query) {
            const q = query.toLowerCase()
            list = list.filter((it) =>
                [
                    it.id,
                    it.operation_type,
                    it.type as any,
                    it.status,
                    it.order_id,
                    it.related_order_id,
                    it.last_error,
                    it.error,
                    it.external_ref,
                    it.session_id,
                ]
                    .map((v) => (v == null ? '' : String(v).toLowerCase()))
                    .some((s) => s.includes(q))
            )
        }
        if (statusFilter) {
            list = list.filter((it) => (it.status || '').toLowerCase() === statusFilter)
        }
        if (typeFilter) {
            list = list.filter(
                (it) => (it.operation_type || it.type || '').toLowerCase() === typeFilter
            )
        }
        if (dateFrom) {
            const from = new Date(dateFrom).getTime()
            list = list.filter((it) =>
                it.created_at ? new Date(it.created_at).getTime() >= from : true
            )
        }
        if (dateTo) {
            const to = new Date(dateTo).getTime()
            list = list.filter((it) =>
                it.created_at ? new Date(it.created_at).getTime() <= to : true
            )
        }
        list.sort((a, b) => {
            const aa = a.created_at ? new Date(a.created_at).getTime() : 0
            const bb = b.created_at ? new Date(b.created_at).getTime() : 0
            return bb - aa
        })
        return list
    }, [items, query, statusFilter, typeFilter, dateFrom, dateTo])

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const pageSlice = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filtered.slice(start, start + pageSize)
    }, [filtered, currentPage])

    function toggleSelected(id: string | number) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function clearSelection() {
        setSelected(new Set())
    }

    async function fallbackApiRetry(ids: (string | number)[]) {
        try {
            const res = await fetch(`/api/admin/retries/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            })
            if (res.ok) return true
        } catch {}
        return false
    }

    async function fallbackApiCancel(ids: (string | number)[]) {
        try {
            const res = await fetch(`/api/admin/retries/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            })
            if (res.ok) return true
        } catch {}
        return false
    }

    async function retryIds(ids: (string | number)[]) {
        if (!ids.length) return
        const ok = await fallbackApiRetry(ids)
        if (!ok && dataSource) {
            try {
                const { error } = await supabase
                    .from(dataSource)
                    .update({
                        status: 'queued',
                        next_retry_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .in('id', ids)
                if (error) throw error
            } catch (e) {
                toast({
                    title: 'Retry failed',
                    description: 'Could not queue selected items for retry.',
                    variant: 'destructive' as any,
                })
                return
            }
        }
        toast({ title: 'Retry queued', description: `${ids.length} item(s) queued for retry.` })
        await loadData()
        clearSelection()
    }

    async function cancelIds(ids: (string | number)[]) {
        if (!ids.length) return
        const ok = await fallbackApiCancel(ids)
        if (!ok && dataSource) {
            try {
                const { error } = await supabase
                    .from(dataSource)
                    .update({ status: 'canceled', updated_at: new Date().toISOString() })
                    .in('id', ids)
                if (error) throw error
            } catch (e) {
                toast({
                    title: 'Cancel failed',
                    description: 'Could not cancel selected items.',
                    variant: 'destructive' as any,
                })
                return
            }
        }
        toast({ title: 'Canceled', description: `${ids.length} item(s) canceled.` })
        await loadData()
        clearSelection()
    }

    const allStatuses = React.useMemo(() => {
        const s = new Set<string>()
        items.forEach((it) => it.status && s.add(String(it.status).toLowerCase()))
        return Array.from(s).sort()
    }, [items])

    const allTypes = React.useMemo(() => {
        const s = new Set<string>()
        items.forEach((it) => {
            const t = (it.operation_type || it.type || '').toString().toLowerCase()
            if (t) s.add(t)
        })
        return Array.from(s).sort()
    }, [items])

    return (
        <div className="bg-background text-foreground min-h-[calc(100dvh)]">
            <header className="supports-[backdrop-filter]:bg-background/60 border-border sticky top-0 z-30 border-b backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/15 text-primary flex h-8 w-8 items-center justify-center rounded font-bold">
                            R
                        </div>
                        <div>
                            <div className="text-muted-foreground text-sm">
                                <Link href={`${base}/admin`} className="hover:underline">
                                    Admin
                                </Link>
                                <span className="mx-2">/</span>
                                <span className="text-foreground">Retries</span>
                            </div>
                            <h1 className="text-lg font-semibold sm:text-xl">
                                Retries & Failed Operations
                            </h1>
                        </div>
                    </div>
                    <nav className="hidden items-center gap-2 text-sm md:flex">
                        <Link
                            href={`${base}/admin/orders`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5"
                        >
                            Orders
                        </Link>
                        <Link
                            href={`${base}/admin/products-mapping`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5"
                        >
                            Products Mapping
                        </Link>
                        <Link
                            href={`${base}/admin/logs`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5"
                        >
                            Logs
                        </Link>
                        <Link
                            href={`${base}/admin/costs`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5"
                        >
                            Costs
                        </Link>
                        <Link
                            href={`${base}/admin/health`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5"
                        >
                            Health
                        </Link>
                        <Link
                            href={`${base}/admin/analytics`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5"
                        >
                            Analytics
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4">
                    <div className="border-border bg-card rounded-xl border">
                        <div className="p-4 sm:p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="col-span-1 lg:col-span-2">
                                        <label className="text-muted-foreground text-xs">
                                            Search
                                        </label>
                                        <input
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value)
                                                setPage(1)
                                            }}
                                            placeholder="Search by id, order, type, error..."
                                            className="border-input bg-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground text-xs">
                                            Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value)
                                                setPage(1)
                                            }}
                                            className="border-input bg-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none"
                                        >
                                            <option value="">All</option>
                                            {allStatuses.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground text-xs">
                                            Type
                                        </label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => {
                                                setTypeFilter(e.target.value)
                                                setPage(1)
                                            }}
                                            className="border-input bg-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none"
                                        >
                                            <option value="">All</option>
                                            {allTypes.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-2">
                                        <div>
                                            <label className="text-muted-foreground text-xs">
                                                From
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={dateFrom}
                                                onChange={(e) => {
                                                    setDateFrom(e.target.value)
                                                    setPage(1)
                                                }}
                                                className="border-input bg-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-xs">
                                                To
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={dateTo}
                                                onChange={(e) => {
                                                    setDateTo(e.target.value)
                                                    setPage(1)
                                                }}
                                                className="border-input bg-background focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={loadData}
                                        className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow hover:opacity-90"
                                    >
                                        <span className="i-lucide-refresh-cw h-4 w-4" aria-hidden />
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => {
                                            const ids = Array.from(selected)
                                            if (!ids.length) return
                                            retryIds(ids)
                                        }}
                                        disabled={selected.size === 0}
                                        className={cn(
                                            'bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow',
                                            selected.size === 0 && 'cursor-not-allowed opacity-50'
                                        )}
                                    >
                                        Retry Selected
                                    </button>
                                    <button
                                        onClick={() => {
                                            const ids = Array.from(selected)
                                            if (!ids.length) return
                                            if (
                                                confirm(
                                                    `Cancel ${ids.length} selected item(s)? This cannot be undone.`
                                                )
                                            ) {
                                                cancelIds(ids)
                                            }
                                        }}
                                        disabled={selected.size === 0}
                                        className={cn(
                                            'bg-destructive text-destructive-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow',
                                            selected.size === 0 && 'cursor-not-allowed opacity-50'
                                        )}
                                    >
                                        Cancel Selected
                                    </button>
                                </div>
                            </div>

                            {loadError && (
                                <div className="mt-4">
                                    <Alert variant="destructive" className="border-destructive/30">
                                        <AlertTitle>Data source not found</AlertTitle>
                                        <AlertDescription>
                                            {loadError} You can still inspect recent system activity
                                            via {''}
                                            <Link
                                                href={`${base}/admin/logs`}
                                                className="underline underline-offset-4"
                                            >
                                                Logs
                                            </Link>
                                            . Or review {''}
                                            <Link
                                                href={`${base}/admin/health`}
                                                className="underline underline-offset-4"
                                            >
                                                Health
                                            </Link>{' '}
                                            and {''}
                                            <Link
                                                href={`${base}/admin/analytics`}
                                                className="underline underline-offset-4"
                                            >
                                                Analytics
                                            </Link>{' '}
                                            for broader signals.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            <div className="border-border mt-4 overflow-hidden rounded-lg border">
                                <Table className="w-full">
                                    <TableCaption className="text-muted-foreground">
                                        {dataSource ? (
                                            <span>
                                                Data source:{' '}
                                                <span className="text-foreground font-medium">
                                                    {dataSource}
                                                </span>
                                            </span>
                                        ) : (
                                            <span>Showing in-memory data</span>
                                        )}
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select all"
                                                    checked={
                                                        pageSlice.length > 0 &&
                                                        pageSlice.every((it) => selected.has(it.id))
                                                    }
                                                    onChange={(e) => {
                                                        const next = new Set(selected)
                                                        if (e.target.checked)
                                                            pageSlice.forEach((it) =>
                                                                next.add(it.id)
                                                            )
                                                        else
                                                            pageSlice.forEach((it) =>
                                                                next.delete(it.id)
                                                            )
                                                        setSelected(next)
                                                    }}
                                                />
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Operation</TableHead>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Attempts</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Next Retry</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading &&
                                            Array.from({ length: 6 }).map((_, i) => (
                                                <TableRow key={`sk-${i}`}>
                                                    <TableCell>
                                                        <Skeleton className="h-4 w-4" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-5 w-20" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-5 w-40" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-5 w-24" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-5 w-16" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-5 w-32" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-5 w-32" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Skeleton className="inline-block h-8 w-32" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        {!loading && pageSlice.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="text-muted-foreground py-8 text-center"
                                                >
                                                    No items match your filters. Check {''}
                                                    <Link
                                                        href={`${base}/admin/logs`}
                                                        className="underline underline-offset-4"
                                                    >
                                                        Logs
                                                    </Link>{' '}
                                                    or go to {''}
                                                    <Link
                                                        href={`${base}/admin/orders`}
                                                        className="underline underline-offset-4"
                                                    >
                                                        Orders
                                                    </Link>
                                                    .
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {!loading &&
                                            pageSlice.map((it) => {
                                                const type = (
                                                    it.operation_type ||
                                                    it.type ||
                                                    ''
                                                ).toString()
                                                const orderId = (it.order_id ??
                                                    it.related_order_id) as any
                                                const attempts = (it.attempt_count ??
                                                    it.attempts ??
                                                    0) as number
                                                const lastError = (it.last_error ||
                                                    it.error ||
                                                    '') as string
                                                const status = (it.status || '').toString()
                                                const statusCls = getStatusStyle(status)
                                                const adminOrderHref = orderId
                                                    ? `${base}/admin/orders/${orderId}`
                                                    : ''
                                                const userOrderHref = orderId
                                                    ? `${base}/orders/${orderId}`
                                                    : ''
                                                const logHref = `${base}/admin/logs?opId=${encodeURIComponent(String(it.id))}${it.external_ref ? `&ref=${encodeURIComponent(String(it.external_ref))}` : ''}`
                                                return (
                                                    <React.Fragment key={String(it.id)}>
                                                        <TableRow className="align-top">
                                                            <TableCell className="pt-4">
                                                                <input
                                                                    type="checkbox"
                                                                    aria-label={`Select ${it.id}`}
                                                                    checked={selected.has(it.id)}
                                                                    onChange={() =>
                                                                        toggleSelected(it.id)
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell className="pt-4">
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                                                                        statusCls
                                                                    )}
                                                                >
                                                                    {status || 'unknown'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="pt-4">
                                                                <div className="flex flex-col">
                                                                    <div className="text-sm font-medium">
                                                                        {type || '—'}
                                                                    </div>
                                                                    <div className="text-muted-foreground text-xs">
                                                                        ID {compactId(it.id)}{' '}
                                                                        {it.external_ref
                                                                            ? `• Ref ${compactId(it.external_ref)}`
                                                                            : ''}
                                                                    </div>
                                                                    {lastError ? (
                                                                        <details className="mt-1">
                                                                            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                                                                                Error
                                                                            </summary>
                                                                            <pre className="text-destructive/90 mt-1 max-w-[56ch] text-xs break-words whitespace-pre-wrap">
                                                                                {lastError}
                                                                            </pre>
                                                                        </details>
                                                                    ) : null}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="pt-4">
                                                                {orderId ? (
                                                                    <div className="flex flex-col">
                                                                        <Link
                                                                            href={adminOrderHref}
                                                                            className="text-primary text-sm font-medium hover:underline"
                                                                        >
                                                                            Order{' '}
                                                                            {compactId(orderId)}
                                                                        </Link>
                                                                        <div className="text-muted-foreground text-xs">
                                                                            <Link
                                                                                href={userOrderHref}
                                                                                className="hover:underline"
                                                                            >
                                                                                Customer view
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm">
                                                                        —
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="pt-4">
                                                                <div className="text-sm font-medium">
                                                                    {attempts}
                                                                </div>
                                                                {typeof it.max_attempts ===
                                                                    'number' && (
                                                                    <div className="text-muted-foreground text-xs">
                                                                        max {it.max_attempts}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="pt-4">
                                                                <div className="text-sm">
                                                                    {formatDate(it.created_at)}
                                                                </div>
                                                                <div className="text-muted-foreground text-xs">
                                                                    upd {formatDate(it.updated_at)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="pt-4">
                                                                <div className="text-sm">
                                                                    {formatDate(it.next_retry_at)}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="pt-3 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Link
                                                                        href={logHref}
                                                                        className="bg-accent text-accent-foreground rounded-md px-2 py-1.5 text-xs hover:opacity-90"
                                                                    >
                                                                        View logs
                                                                    </Link>
                                                                    <button
                                                                        onClick={() =>
                                                                            retryIds([it.id])
                                                                        }
                                                                        className="bg-primary text-primary-foreground rounded-md px-2 py-1.5 text-xs hover:opacity-90"
                                                                    >
                                                                        Retry
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (
                                                                                confirm(
                                                                                    'Cancel this item? This cannot be undone.'
                                                                                )
                                                                            )
                                                                                cancelIds([it.id])
                                                                        }}
                                                                        className="bg-destructive text-destructive-foreground rounded-md px-2 py-1.5 text-xs hover:opacity-90"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    </React.Fragment>
                                                )
                                            })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-muted-foreground text-sm">
                                    Page {currentPage} of {totalPages} • {filtered.length} total
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className={cn(
                                            'border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm',
                                            currentPage <= 1 && 'cursor-not-allowed opacity-50'
                                        )}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className={cn(
                                            'border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm',
                                            currentPage >= totalPages &&
                                                'cursor-not-allowed opacity-50'
                                        )}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-border bg-card rounded-xl border p-4 sm:p-5">
                        <h2 className="text-base font-semibold">What is this?</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            This queue lists failed or pending operations that can be retried
                            manually. Typical operations include generating assets, submitting
                            Printify orders, syncing tracking, and reconciling payments. For deeper
                            investigation, open the {''}
                            <Link
                                href={`${base}/admin/logs`}
                                className="underline underline-offset-4"
                            >
                                Logs
                            </Link>
                            , review {''}
                            <Link
                                href={`${base}/admin/health`}
                                className="underline underline-offset-4"
                            >
                                Health
                            </Link>
                            , or monitor {''}
                            <Link
                                href={`${base}/admin/costs`}
                                className="underline underline-offset-4"
                            >
                                Costs
                            </Link>{' '}
                            and {''}
                            <Link
                                href={`${base}/admin/analytics`}
                                className="underline underline-offset-4"
                            >
                                Analytics
                            </Link>
                            .
                        </p>
                        <Separator className="my-4" />
                        <div className="flex flex-wrap gap-2 text-sm">
                            <Link
                                href={`${base}/products`}
                                className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 hover:opacity-90"
                            >
                                Browse Products
                            </Link>
                            <Link
                                href={`${base}/design`}
                                className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 hover:opacity-90"
                            >
                                Start a Design
                            </Link>
                            <Link
                                href={`${base}/orders`}
                                className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 hover:opacity-90"
                            >
                                Customer Orders
                            </Link>
                            <Link
                                href={`${base}/account`}
                                className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 hover:opacity-90"
                            >
                                My Account
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
            <Toaster />
        </div>
    )
}
