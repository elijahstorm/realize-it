'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

// Types are flexible to handle unknown schema variants.
interface LogEntry {
    id?: string | number
    created_at?: string
    timestamp?: string
    type?: string
    provider?: string
    model?: string
    status?: string
    latency_ms?: number
    duration_ms?: number
    elapsed_ms?: number
    cost_usd?: number
    usd_cost?: number
    cost?: number
    session_id?: string
    order_id?: string
    error_code?: string
    error_message?: string
    message?: string
    details?: string
    trace_id?: string
    metadata?: any
    [key: string]: any
}

type Filters = {
    type: string
    status: string
    provider: string
    model: string
    sessionId: string
    orderId: string
    search: string
    errorsOnly: boolean
    start: string // ISO date (YYYY-MM-DD) from input type="date"
    end: string // ISO date (YYYY-MM-DD)
}

const DEFAULT_PAGE_SIZE = 25

const candidateTables = [
    'api_logs',
    'logs',
    'request_logs',
    'event_logs',
    'llm_logs',
    'image_logs',
] as const
const candidateTimeCols = ['timestamp', 'created_at'] as const

function toISOEndOfDay(dateStr: string) {
    const d = new Date(dateStr)
    d.setHours(23, 59, 59, 999)
    return d.toISOString()
}

function toISOStartOfDay(dateStr: string) {
    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
}

function safeDate(v?: string): string | undefined {
    if (!v) return undefined
    const d = new Date(v)
    return isNaN(d.getTime()) ? undefined : d.toISOString()
}

function formatDateTime(v?: string, locale?: string): string {
    const iso = v ?? ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    try {
        return new Intl.DateTimeFormat(locale || undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(d)
    } catch {
        return d.toISOString()
    }
}

function formatCurrencyUSD(n?: number): string {
    const v = Number(n || 0)
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 5,
        }).format(v)
    } catch {
        return `$${v.toFixed(4)}`
    }
}

function formatMs(n?: number): string {
    if (typeof n !== 'number' || isNaN(n)) return '—'
    if (n < 1000) return `${Math.round(n)} ms`
    return `${(n / 1000).toFixed(2)} s`
}

function getLatency(row: LogEntry): number | undefined {
    return row.latency_ms ?? row.duration_ms ?? row.elapsed_ms
}

function getCost(row: LogEntry): number {
    const c = row.cost_usd ?? row.usd_cost ?? row.cost
    return typeof c === 'number' ? c : 0
}

function getTime(row: LogEntry): string | undefined {
    return row.timestamp ?? row.created_at
}

function getId(row: LogEntry): string {
    const id = row.id
    return typeof id === 'number' ? String(id) : id || ''
}

function getError(row: LogEntry): string | undefined {
    return row.error_message ?? row.message ?? row.details
}

function truncate(s?: string, len = 120): string {
    if (!s) return ''
    return s.length > len ? s.slice(0, len - 1) + '…' : s
}

export default function AdminLogsPage() {
    const params = useParams<{ lang: string }>()
    const lang = params?.lang || 'en'
    const searchParams = useSearchParams()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [rows, setRows] = useState<LogEntry[]>([])
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
    const [totalCount, setTotalCount] = useState<number | null>(null)
    const [activeTable, setActiveTable] = useState<string | null>(null)
    const [activeTimeCol, setActiveTimeCol] = useState<string | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [canView, setCanView] = useState<boolean | null>(null)

    const [filters, setFilters] = useState<Filters>(() => ({
        type: (searchParams.get('type') || '').toUpperCase(),
        status: (searchParams.get('status') || '').toLowerCase(),
        provider: searchParams.get('provider') || '',
        model: searchParams.get('model') || '',
        sessionId: searchParams.get('sessionId') || '',
        orderId: searchParams.get('orderId') || '',
        search: searchParams.get('q') || '',
        errorsOnly: searchParams.get('errorsOnly') === '1',
        start: searchParams.get('start') || '',
        end: searchParams.get('end') || '',
    }))

    // Sync filters into URL for shareability
    useEffect(() => {
        const sp = new URLSearchParams()
        if (filters.type) sp.set('type', filters.type)
        if (filters.status) sp.set('status', filters.status)
        if (filters.provider) sp.set('provider', filters.provider)
        if (filters.model) sp.set('model', filters.model)
        if (filters.sessionId) sp.set('sessionId', filters.sessionId)
        if (filters.orderId) sp.set('orderId', filters.orderId)
        if (filters.search) sp.set('q', filters.search)
        if (filters.errorsOnly) sp.set('errorsOnly', '1')
        if (filters.start) sp.set('start', filters.start)
        if (filters.end) sp.set('end', filters.end)
        const qs = sp.toString()
        router.replace(`/${lang}/admin/logs${qs ? `?${qs}` : ''}`)
    }, [filters, lang, router])

    const summary = useMemo(() => {
        const success = rows.filter((r) => (r.status || '').toLowerCase() === 'success').length
        const failures = rows.filter((r) => (r.status || '').toLowerCase() !== 'success').length
        const totalCost = rows.reduce((acc, r) => acc + getCost(r), 0)
        const latencies = rows.map(getLatency).filter((n): n is number => typeof n === 'number')
        const avgLatency = latencies.length
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0
        const providers = rows.reduce<Record<string, number>>((acc, r) => {
            const p = (r.provider || 'unknown').toLowerCase()
            acc[p] = (acc[p] || 0) + 1
            return acc
        }, {})
        return { success, failures, totalCost, avgLatency, providers }
    }, [rows])

    const resetFilters = () => {
        setFilters({
            type: '',
            status: '',
            provider: '',
            model: '',
            sessionId: '',
            orderId: '',
            search: '',
            errorsOnly: false,
            start: '',
            end: '',
        })
        setPage(1)
    }

    const pickQuickRange = (days: number) => {
        const end = new Date()
        const start = new Date()
        start.setDate(end.getDate() - (days - 1))
        const s = start.toISOString().slice(0, 10)
        const e = end.toISOString().slice(0, 10)
        setFilters((prev) => ({ ...prev, start: s, end: e }))
        setPage(1)
    }

    const exportCSV = () => {
        const headers = [
            'id',
            'time',
            'type',
            'provider',
            'model',
            'status',
            'latency_ms',
            'cost_usd',
            'session_id',
            'order_id',
            'error_code',
            'error_message',
        ]
        const rowsCsv = rows.map((r) => {
            const values = [
                JSON.stringify(getId(r)),
                JSON.stringify(getTime(r) || ''),
                JSON.stringify(r.type || ''),
                JSON.stringify(r.provider || ''),
                JSON.stringify(r.model || ''),
                JSON.stringify(r.status || ''),
                JSON.stringify(getLatency(r) ?? null),
                JSON.stringify(getCost(r)),
                JSON.stringify(r.session_id || ''),
                JSON.stringify(r.order_id || ''),
                JSON.stringify(r.error_code || ''),
                JSON.stringify(getError(r) || ''),
            ]
            return values.join(',')
        })
        const csv = [headers.join(','), ...rowsCsv].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logs_page_${page}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const copyToClipboard = (text: string) => {
        if (!text) return
        navigator.clipboard?.writeText(text).catch(() => {})
    }

    // Access control check
    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const sb = supabaseBrowser
                const {
                    data: { user },
                } = await sb.auth.getUser()
                if (!user) {
                    if (mounted) setCanView(false)
                    return
                }
                // Try to check a profile role flag if exists
                const { data: profile } = await sb
                    .from('profiles')
                    .select('id, role, is_admin, is_merchant')
                    .eq('id', user.id)
                    .maybeSingle()
                const allowed =
                    profile?.is_admin ||
                    profile?.is_merchant ||
                    profile?.role === 'admin' ||
                    profile?.role === 'merchant'
                if (mounted) setCanView(Boolean(allowed))
            } catch {
                // If we can't confirm, allow but data may be filtered by RLS
                if (mounted) setCanView(true)
            }
        })()
        return () => {
            mounted = false
        }
    }, [])

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        setError(null)
        setExpandedId(null)

        const sb = supabaseBrowser
        const from = (table: string) => sb.from(table)

        const offset = (page - 1) * pageSize

        // Build dynamic OR filter string for search
        const buildSearchOr = (q: string) => {
            const term = q.replaceAll(',', '').trim()
            const like = `%${term}%`
            const cols = [
                'provider',
                'model',
                'type',
                'status',
                'session_id',
                'order_id',
                'trace_id',
                'error_message',
                'error_code',
                'message',
                'details',
            ]
            // or syntax: col.ilike.value,another.ilike.value
            return cols.map((c) => `${c}.ilike.${like}`).join(',')
        }

        // Attempt across candidate tables and time columns
        for (const table of candidateTables) {
            for (const timeCol of candidateTimeCols) {
                try {
                    let q = from(table).select('*', { count: 'exact' })

                    if (filters.type) q = q.eq('type', filters.type)
                    if (filters.status) q = q.eq('status', filters.status)
                    if (filters.provider) q = q.ilike('provider', `%${filters.provider}%`)
                    if (filters.model) q = q.ilike('model', `%${filters.model}%`)
                    if (filters.sessionId) q = q.eq('session_id', filters.sessionId)
                    if (filters.orderId) q = q.eq('order_id', filters.orderId)
                    if (filters.errorsOnly) {
                        q = q.or(
                            'status.eq.error,status.eq.failed,error_message.not.is.null,error_code.not.is.null'
                        )
                    }
                    if (filters.search) {
                        q = q.or(buildSearchOr(filters.search))
                    }
                    if (filters.start) q = q.gte(timeCol, toISOStartOfDay(filters.start))
                    if (filters.end) q = q.lte(timeCol, toISOEndOfDay(filters.end))

                    q = q.order(timeCol, { ascending: false }).range(offset, offset + pageSize - 1)

                    const { data, count, error } = await q
                    if (error) throw error

                    setRows(data as LogEntry[])
                    setTotalCount(typeof count === 'number' ? count : null)
                    setActiveTable(table)
                    setActiveTimeCol(timeCol)
                    setLoading(false)
                    return
                } catch (e) {
                    // Try next time column or table
                    continue
                }
            }
            // Fallback simple query without time filters
            try {
                let q = from(table)
                    .select('*', { count: 'exact' })
                    .range(offset, offset + pageSize - 1)
                if (filters.type) q = q.eq('type', filters.type)
                if (filters.status) q = q.eq('status', filters.status)
                if (filters.provider) q = q.ilike('provider', `%${filters.provider}%`)
                if (filters.model) q = q.ilike('model', `%${filters.model}%`)
                if (filters.sessionId) q = q.eq('session_id', filters.sessionId)
                if (filters.orderId) q = q.eq('order_id', filters.orderId)
                if (filters.errorsOnly) {
                    q = q.or(
                        'status.eq.error,status.eq.failed,error_message.not.is.null,error_code.not.is.null'
                    )
                }
                if (filters.search) {
                    q = q.or(buildSearchOr(filters.search))
                }
                const { data, count } = await q
                if (data) {
                    setRows(data as LogEntry[])
                    setTotalCount(typeof count === 'number' ? count : null)
                    setActiveTable(table)
                    setActiveTimeCol(null)
                    setLoading(false)
                    return
                }
            } catch {
                // continue
            }
        }

        setLoading(false)
        setError('No logs available or insufficient permissions.')
        setRows([])
        setTotalCount(0)
    }, [filters, page, pageSize])

    useEffect(() => {
        if (canView === false) return
        fetchLogs()
    }, [fetchLogs, canView])

    const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        setPage(1)
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    const statusBadge = (status?: string) => {
        const s = (status || '').toLowerCase()
        const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
        if (s === 'success')
            return (
                <span className={cn(base, 'bg-green-500/15 text-green-600 dark:text-green-400')}>
                    success
                </span>
            )
        if (s === 'queued')
            return (
                <span className={cn(base, 'bg-blue-500/15 text-blue-600 dark:text-blue-400')}>
                    queued
                </span>
            )
        if (s === 'running')
            return <span className={cn(base, 'bg-primary/15 text-primary')}>running</span>
        return (
            <span className={cn(base, 'bg-destructive/15 text-destructive')}>{s || 'error'}</span>
        )
    }

    const typeBadge = (type?: string, provider?: string) => {
        const t = (type || '').toUpperCase()
        const pv = (provider || '').toLowerCase()
        const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border'
        let cls = 'border-muted bg-muted/40 text-muted-foreground'
        const label =
            t || (pv.includes('stripe') ? 'STRIPE' : pv.includes('printify') ? 'PRINTIFY' : 'EVENT')
        if (label.includes('LLM') || pv.includes('openai') || pv.includes('solar'))
            cls = 'border-primary/40 bg-primary/10 text-primary'
        if (label.includes('IMAGE') || pv.includes('stability') || pv.includes('sd'))
            cls = 'border-accent/40 bg-accent/10 text-accent-foreground'
        return <span className={cn(base, cls)}>{label}</span>
    }

    if (canView === false) {
        return (
            <div className="mx-auto max-w-6xl p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Admin Access Required</h1>
                    <Link
                        href={`/${lang}/sign-in`}
                        className="bg-primary text-primary-foreground rounded-md px-3 py-2 hover:opacity-90"
                    >
                        Sign in
                    </Link>
                </div>
                <Alert className="bg-destructive/10 border-destructive/40">
                    <AlertTitle>Restricted</AlertTitle>
                    <AlertDescription>
                        You don&apos;t have permission to view logs. If you believe this is an
                        error, contact support on the Help page.
                        <div className="mt-2 flex gap-3">
                            <Link href={`/${lang}//help`} className="underline">
                                Help
                            </Link>
                            <Link href={`/${lang}//contact`} className="underline">
                                Contact
                            </Link>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-[1400px] p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold">Logs</h1>
                        <span className="text-muted-foreground text-sm">
                            Consolidated LLM, image, and integration events
                        </span>
                    </div>
                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
                        <Link href={`/${lang}/admin`} className="hover:text-foreground underline">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Logs</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={`/${lang}/admin/costs`}
                        className="bg-card border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                    >
                        View Costs
                    </Link>
                    <Link
                        href={`/${lang}/admin/analytics`}
                        className="bg-card border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                    >
                        Analytics
                    </Link>
                    <Link
                        href={`/${lang}/admin/health`}
                        className="bg-card border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                    >
                        Health
                    </Link>
                    <Link
                        href={`/${lang}/admin/retries`}
                        className="bg-card border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                    >
                        Retries
                    </Link>
                    <Link
                        href={`/${lang}/admin/orders`}
                        className="bg-card border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                    >
                        Orders
                    </Link>
                </div>
            </div>

            <div className="border-border bg-card rounded-lg border">
                <div className="p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => updateFilter('type', e.target.value)}
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            >
                                <option value="">All</option>
                                <option value="LLM">LLM</option>
                                <option value="IMAGE">IMAGE</option>
                                <option value="STRIPE">STRIPE</option>
                                <option value="PRINTIFY">PRINTIFY</option>
                                <option value="WEBHOOK">WEBHOOK</option>
                                <option value="SYSTEM">SYSTEM</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => updateFilter('status', e.target.value)}
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            >
                                <option value="">All</option>
                                <option value="success">success</option>
                                <option value="running">running</option>
                                <option value="queued">queued</option>
                                <option value="error">error</option>
                                <option value="failed">failed</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Provider</label>
                            <input
                                value={filters.provider}
                                onChange={(e) => updateFilter('provider', e.target.value)}
                                placeholder="e.g., solar, stability, stripe"
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Model</label>
                            <input
                                value={filters.model}
                                onChange={(e) => updateFilter('model', e.target.value)}
                                placeholder="e.g., solar-pro2, sdxl"
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Session ID</label>
                            <input
                                value={filters.sessionId}
                                onChange={(e) => updateFilter('sessionId', e.target.value)}
                                placeholder="design session"
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Order ID</label>
                            <input
                                value={filters.orderId}
                                onChange={(e) => updateFilter('orderId', e.target.value)}
                                placeholder="order id"
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
                        <div className="flex flex-col gap-1 lg:col-span-2">
                            <label className="text-muted-foreground text-xs">Search</label>
                            <input
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="Search message, error, model, session, order"
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">Start date</label>
                            <input
                                type="date"
                                value={filters.start}
                                onChange={(e) => updateFilter('start', e.target.value)}
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-muted-foreground text-xs">End date</label>
                            <input
                                type="date"
                                value={filters.end}
                                onChange={(e) => updateFilter('end', e.target.value)}
                                className="border-input bg-background w-full rounded-md border px-2 py-2 text-sm"
                            />
                        </div>
                        <div className="flex items-end gap-3">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={filters.errorsOnly}
                                    onChange={(e) => updateFilter('errorsOnly', e.target.checked)}
                                    className="border-input bg-background h-4 w-4 rounded"
                                />
                                Errors only
                            </label>
                        </div>
                        <div className="flex items-end justify-end gap-2 lg:col-span-1">
                            <button
                                onClick={() => fetchLogs()}
                                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                            >
                                Apply
                            </button>
                            <button
                                onClick={resetFilters}
                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span>Quick ranges:</span>
                        <button
                            onClick={() => pickQuickRange(1)}
                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-full border px-2 py-1"
                        >
                            24h
                        </button>
                        <button
                            onClick={() => pickQuickRange(7)}
                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-full border px-2 py-1"
                        >
                            7d
                        </button>
                        <button
                            onClick={() => pickQuickRange(30)}
                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-full border px-2 py-1"
                        >
                            30d
                        </button>
                        <span className="ml-auto">
                            {activeTable ? `Source: ${activeTable}` : ''}{' '}
                            {activeTimeCol ? `· time: ${activeTimeCol}` : ''}
                        </span>
                    </div>
                </div>
                <Separator />

                <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4">
                    <div className="border-border bg-background rounded-lg border p-4 lg:col-span-3">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-muted-foreground text-sm">
                                {totalCount !== null ? (
                                    <span>
                                        Showing{' '}
                                        <span className="text-foreground font-medium">
                                            {rows.length}
                                        </span>{' '}
                                        of{' '}
                                        <span className="text-foreground font-medium">
                                            {totalCount}
                                        </span>{' '}
                                        logs
                                    </span>
                                ) : (
                                    <span>Showing {rows.length} logs</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value))
                                        setPage(1)
                                    }}
                                    className="border-input bg-background rounded-md border px-2 py-1 text-xs"
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                    <option value={100}>100 / page</option>
                                </select>
                                <button
                                    onClick={exportCSV}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md border px-2 py-1 text-xs"
                                >
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="border-border overflow-auto rounded-md border">
                            <Table className="min-w-[900px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[160px]">Time</TableHead>
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead className="w-[140px]">Provider</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead className="w-[110px]">Status</TableHead>
                                        <TableHead className="w-[100px]">Latency</TableHead>
                                        <TableHead className="w-[110px]">Cost</TableHead>
                                        <TableHead className="w-[140px]">Session</TableHead>
                                        <TableHead className="w-[120px]">Order</TableHead>
                                        <TableHead className="w-[200px]">Message</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading &&
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <TableRow key={`sk-${i}`}>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-36" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-16" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-24" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-40" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-16" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-16" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-16" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-24" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-20" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-48" />
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                    {!loading && rows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={10}
                                                className="text-muted-foreground py-10 text-center"
                                            >
                                                {error ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span>{error}</span>
                                                        <div className="flex gap-3 text-sm">
                                                            <Link
                                                                href={`/${lang}/admin/health`}
                                                                className="underline"
                                                            >
                                                                Check Health
                                                            </Link>
                                                            <Link
                                                                href={`/${lang}/admin/retries`}
                                                                className="underline"
                                                            >
                                                                View Retries
                                                            </Link>
                                                            <Link
                                                                href={`/${lang}/admin/costs`}
                                                                className="underline"
                                                            >
                                                                Costs
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span>No logs match your filters.</span>
                                                        <button
                                                            onClick={resetFilters}
                                                            className="text-sm underline"
                                                        >
                                                            Reset filters
                                                        </button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading &&
                                        rows.map((r) => {
                                            const id = getId(r)
                                            const time = getTime(r)
                                            const latency = getLatency(r)
                                            const cost = getCost(r)
                                            const msg = getError(r) || r.message || r.details || ''
                                            const expanded = expandedId === id
                                            return (
                                                <React.Fragment key={id || Math.random()}>
                                                    <TableRow
                                                        className={cn(expanded && 'bg-muted/10')}
                                                        onDoubleClick={() =>
                                                            setExpandedId(expanded ? null : id)
                                                        }
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="whitespace-nowrap">
                                                                    {formatDateTime(time, lang)}
                                                                </span>
                                                                {id && (
                                                                    <button
                                                                        onClick={() =>
                                                                            copyToClipboard(
                                                                                String(id)
                                                                            )
                                                                        }
                                                                        title="Copy ID"
                                                                        className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded border px-1.5 py-0.5 text-[10px]"
                                                                    >
                                                                        copy id
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {typeBadge(r.type, r.provider)}
                                                        </TableCell>
                                                        <TableCell className="capitalize">
                                                            {r.provider || '—'}
                                                        </TableCell>
                                                        <TableCell>{r.model || '—'}</TableCell>
                                                        <TableCell>
                                                            {statusBadge(r.status)}
                                                        </TableCell>
                                                        <TableCell>{formatMs(latency)}</TableCell>
                                                        <TableCell>
                                                            {formatCurrencyUSD(cost)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.session_id ? (
                                                                <Link
                                                                    className="text-primary underline"
                                                                    href={`/${lang}/design/s/${r.session_id}`}
                                                                >
                                                                    {truncate(r.session_id, 12)}
                                                                </Link>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {r.order_id ? (
                                                                <div className="flex flex-col">
                                                                    <Link
                                                                        className="text-primary underline"
                                                                        href={`/${lang}/admin/orders/${r.order_id}`}
                                                                    >
                                                                        admin
                                                                    </Link>
                                                                    <Link
                                                                        className="text-muted-foreground underline"
                                                                        href={`/${lang}/orders/${r.order_id}`}
                                                                    >
                                                                        customer
                                                                    </Link>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Collapsible
                                                                open={expanded}
                                                                onOpenChange={(o) =>
                                                                    setExpandedId(o ? id : null)
                                                                }
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <span
                                                                        className={cn(
                                                                            'truncate',
                                                                            msg
                                                                                ? 'text-foreground'
                                                                                : 'text-muted-foreground'
                                                                        )}
                                                                    >
                                                                        {truncate(
                                                                            msg || 'No message'
                                                                        )}
                                                                    </span>
                                                                    <CollapsibleTrigger asChild>
                                                                        <button className="border-input hover:bg-accent hover:text-accent-foreground ml-auto rounded border px-2 py-1 text-xs">
                                                                            {expanded
                                                                                ? 'Hide'
                                                                                : 'Details'}
                                                                        </button>
                                                                    </CollapsibleTrigger>
                                                                </div>
                                                                <CollapsibleContent>
                                                                    <div className="border-border bg-muted/10 mt-2 rounded-md border p-2 text-xs">
                                                                        <pre className="break-all whitespace-pre-wrap">
                                                                            {JSON.stringify(
                                                                                r,
                                                                                null,
                                                                                2
                                                                            )}
                                                                        </pre>
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            <Link
                                                                                href={`/${lang}/admin/retries`}
                                                                                className="border-border hover:bg-accent hover:text-accent-foreground rounded border px-2 py-1 text-xs"
                                                                            >
                                                                                Retry queue
                                                                            </Link>
                                                                            <Link
                                                                                href={`/${lang}/admin/costs`}
                                                                                className="border-border hover:bg-accent hover:text-accent-foreground rounded border px-2 py-1 text-xs"
                                                                            >
                                                                                Costs
                                                                            </Link>
                                                                            <Link
                                                                                href={`/${lang}/admin/health`}
                                                                                className="border-border hover:bg-accent hover:text-accent-foreground rounded border px-2 py-1 text-xs"
                                                                            >
                                                                                Health
                                                                            </Link>
                                                                        </div>
                                                                    </div>
                                                                </CollapsibleContent>
                                                            </Collapsible>
                                                        </TableCell>
                                                    </TableRow>
                                                </React.Fragment>
                                            )
                                        })}
                                </TableBody>
                                <TableCaption className="text-muted-foreground text-xs">
                                    Need to adjust Printify mappings? Visit{' '}
                                    <Link
                                        className="underline"
                                        href={`/${lang}/admin/products-mapping`}
                                    >
                                        Products Mapping
                                    </Link>
                                    . Explore product catalog at{' '}
                                    <Link className="underline" href={`/${lang}/products`}>
                                        Products
                                    </Link>{' '}
                                    or start a new design at{' '}
                                    <Link className="underline" href={`/${lang}/design`}>
                                        Design
                                    </Link>
                                    .
                                </TableCaption>
                            </Table>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={cn(
                                        'border-input rounded-md border px-3 py-1 disabled:opacity-50',
                                        page === 1
                                            ? 'cursor-not-allowed'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={
                                        totalCount !== null
                                            ? page * pageSize >= totalCount
                                            : rows.length < pageSize
                                    }
                                    className={cn(
                                        'border-input rounded-md border px-3 py-1 disabled:opacity-50',
                                        (
                                            totalCount !== null
                                                ? page * pageSize >= totalCount
                                                : rows.length < pageSize
                                        )
                                            ? 'cursor-not-allowed'
                                            : 'hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    Next
                                </button>
                                <span className="text-muted-foreground ml-2">Page {page}</span>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-3">
                                <Link href={`/${lang}/admin`} className="underline">
                                    Admin Home
                                </Link>
                                <Link href={`/${lang}/admin/analytics`} className="underline">
                                    Analytics
                                </Link>
                                <Link href={`/${lang}/orders`} className="underline">
                                    All Orders
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="border-border bg-background rounded-lg border p-4 lg:col-span-1">
                        <h2 className="mb-2 text-sm font-semibold">Summary</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Success</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    {summary.success}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Failures</span>
                                <span className="text-destructive font-medium">
                                    {summary.failures}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Avg latency</span>
                                <span className="font-medium">{formatMs(summary.avgLatency)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Cost (page)</span>
                                <span className="font-medium">
                                    {formatCurrencyUSD(summary.totalCost)}
                                </span>
                            </div>
                        </div>
                        <Separator className="my-3" />
                        <h3 className="text-muted-foreground mb-2 text-xs font-medium">
                            Providers
                        </h3>
                        <div className="space-y-1 text-xs">
                            {Object.entries(summary.providers)
                                .slice(0, 8)
                                .map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                updateFilter('provider', k)
                                            }}
                                            className="hover:text-foreground truncate text-left underline decoration-dotted"
                                        >
                                            {k}
                                        </button>
                                        <span className="text-muted-foreground">{v}</span>
                                    </div>
                                ))}
                            {Object.keys(summary.providers).length === 0 && (
                                <div className="text-muted-foreground">No providers</div>
                            )}
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-xs">
                            <Link
                                href={`/${lang}/admin/costs`}
                                className="border-border bg-card hover:bg-accent hover:text-accent-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                Open Costs
                            </Link>
                            <Link
                                href={`/${lang}/admin/retries`}
                                className="border-border bg-card hover:bg-accent hover:text-accent-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                Open Retries
                            </Link>
                            <Link
                                href={`/${lang}/admin/health`}
                                className="border-border bg-card hover:bg-accent hover:text-accent-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                Open Health
                            </Link>
                            <Link
                                href={`/${lang}/admin/orders`}
                                className="border-border bg-card hover:bg-accent hover:text-accent-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                Manage Orders
                            </Link>
                            <Link
                                href={`/${lang}/admin/products-mapping`}
                                className="border-border bg-card hover:bg-accent hover:text-accent-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                Product Mapping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-muted-foreground mt-6 grid grid-cols-1 gap-4 text-sm lg:grid-cols-3">
                <div className="border-border bg-card rounded-lg border p-4">
                    <h4 className="text-foreground mb-2 font-medium">Tips</h4>
                    <ul className="list-disc pl-5">
                        <li>
                            Filter by session to investigate a specific design flow. Try the Design
                            page at{' '}
                            <Link className="underline" href={`/${lang}/design`}>
                                /{lang}/design
                            </Link>
                            .
                        </li>
                        <li>
                            Open the Costs view to analyze spend by provider. Visit{' '}
                            <Link className="underline" href={`/${lang}/admin/costs`}>
                                /{lang}/admin/costs
                            </Link>
                            .
                        </li>
                        <li>
                            If an order failed after payment, inspect{' '}
                            <Link className="underline" href={`/${lang}/admin/retries`}>
                                /{lang}/admin/retries
                            </Link>{' '}
                            to requeue or cancel.
                        </li>
                    </ul>
                </div>
                <div className="border-border bg-card rounded-lg border p-4">
                    <h4 className="text-foreground mb-2 font-medium">Customer Views</h4>
                    <ul className="list-disc pl-5">
                        <li>
                            Customer order history:{' '}
                            <Link className="underline" href={`/${lang}/account/orders`}>
                                /{lang}/account/orders
                            </Link>
                        </li>
                        <li>
                            Track shipments:{' '}
                            <Link className="underline" href={`/${lang}/orders`}>
                                /{lang}/orders
                            </Link>{' '}
                            and{' '}
                            <Link className="underline" href={`/${lang}/track/ABC123`}>
                                tracking
                            </Link>
                        </li>
                        <li>
                            Account settings:{' '}
                            <Link className="underline" href={`/${lang}/account/settings`}>
                                /{lang}/account/settings
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="border-border bg-card rounded-lg border p-4">
                    <h4 className="text-foreground mb-2 font-medium">Explore</h4>
                    <ul className="list-disc pl-5">
                        <li>
                            Browse products:{' '}
                            <Link className="underline" href={`/${lang}/products`}>
                                /{lang}/products
                            </Link>
                        </li>
                        <li>
                            Start a new design:{' '}
                            <Link className="underline" href={`/${lang}/design`}>
                                /{lang}/design
                            </Link>
                        </li>
                        <li>
                            Cart & Checkout:{' '}
                            <Link className="underline" href={`/${lang}/cart`}>
                                /{lang}/cart
                            </Link>
                            ,{' '}
                            <Link className="underline" href={`/${lang}/checkout`}>
                                /{lang}/checkout
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
