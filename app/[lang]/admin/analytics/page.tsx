'use client'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Bar,
    BarChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Line,
    LineChart,
    Pie,
    PieChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    AreaChart,
    Area,
} from 'recharts'

type Params = { lang: string }

type DateRange = { from: Date; to: Date }

type ConversionStep = {
    step: 'design' | 'approval' | 'checkout' | 'purchase'
    count: number
}

type AovPoint = { date: string; aov: number; orders: number }

type LatencyPoint = { date: string; hours: number }

type LocaleSplit = { locale: string; orders: number; revenue: number }

interface AnalyticsData {
    totals: {
        sessions: number
        approvals: number
        checkouts: number
        purchases: number
        revenue: number
        aov: number
        orders: number
    }
    funnel: ConversionStep[]
    aovSeries: AovPoint[]
    latency: {
        avgHours: number
        p50: number
        p90: number
        series: LatencyPoint[]
    }
    localeSplit: LocaleSplit[]
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
]

function startOfDay(d: Date) {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}
function endOfDay(d: Date) {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
}
function formatISO(d: Date) {
    return d.toISOString()
}
function toInputDate(d: Date) {
    // yyyy-mm-dd in local timezone
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
function fromInputDate(s: string) {
    const [y, m, d] = s.split('-').map((n) => parseInt(n, 10))
    return new Date(y, (m || 1) - 1, d || 1)
}

function currency(n: number, lang: string) {
    const locale = lang === 'kr' || lang === 'ko' ? 'ko-KR' : 'en-US'
    const currency = lang === 'kr' || lang === 'ko' ? 'KRW' : 'USD'
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
}

const defaultAnalytics: AnalyticsData = {
    totals: {
        sessions: 0,
        approvals: 0,
        checkouts: 0,
        purchases: 0,
        revenue: 0,
        aov: 0,
        orders: 0,
    },
    funnel: [
        { step: 'design', count: 0 },
        { step: 'approval', count: 0 },
        { step: 'checkout', count: 0 },
        { step: 'purchase', count: 0 },
    ],
    aovSeries: [],
    latency: { avgHours: 0, p50: 0, p90: 0, series: [] },
    localeSplit: [],
}

export default function AnalyticsPage({ params }: { params: Params }) {
    const { lang } = params
    const router = useRouter()

    const [range, setRange] = useState<DateRange>(() => {
        const to = endOfDay(new Date())
        const from = startOfDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))
        return { from, to }
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<AnalyticsData>(defaultAnalytics)

    const supabase = useMemo(() => supabaseBrowser, [])

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: res, error: rpcError } = await supabase.rpc('admin_analytics_dashboard', {
                start_date: formatISO(startOfDay(range.from)),
                end_date: formatISO(endOfDay(range.to)),
            })

            if (rpcError) throw rpcError

            if (res) {
                const normalized: AnalyticsData = {
                    totals: {
                        sessions: Number(res?.totals?.sessions ?? 0),
                        approvals: Number(res?.totals?.approvals ?? 0),
                        checkouts: Number(res?.totals?.checkouts ?? 0),
                        purchases: Number(res?.totals?.purchases ?? 0),
                        revenue: Number(res?.totals?.revenue ?? 0),
                        aov: Number(res?.totals?.aov ?? 0),
                        orders: Number(res?.totals?.orders ?? 0),
                    },
                    funnel: (res?.funnel || defaultAnalytics.funnel).map((s: any) => ({
                        step: s.step,
                        count: Number(s.count ?? 0),
                    })),
                    aovSeries: (res?.aov_series || []).map((p: any) => ({
                        date: p.date,
                        aov: Number(p.aov ?? 0),
                        orders: Number(p.orders ?? 0),
                    })),
                    latency: {
                        avgHours: Number(res?.latency?.avg_hours ?? 0),
                        p50: Number(res?.latency?.p50 ?? 0),
                        p90: Number(res?.latency?.p90 ?? 0),
                        series: (res?.latency?.series || []).map((p: any) => ({
                            date: p.date,
                            hours: Number(p.hours ?? 0),
                        })),
                    },
                    localeSplit: (res?.locale_split || []).map((p: any) => ({
                        locale: String(p.locale ?? 'en'),
                        orders: Number(p.orders ?? 0),
                        revenue: Number(p.revenue ?? 0),
                    })),
                }
                setData(normalized)
            } else {
                setData(defaultAnalytics)
            }
        } catch (e: any) {
            // Attempt a lightweight best-effort fallback using broad table names if available
            try {
                const start = formatISO(startOfDay(range.from))
                const end = formatISO(endOfDay(range.to))

                const [ordersRes, sessionsRes] = await Promise.allSettled([
                    supabase
                        .from('orders')
                        .select('created_at,total,retryable,status,locale')
                        .gte('created_at', start)
                        .lte('created_at', end),
                    supabase
                        .from('design_sessions')
                        .select('created_at,status')
                        .gte('created_at', start)
                        .lte('created_at', end),
                ])

                let orders: any[] = []
                if (ordersRes.status === 'fulfilled' && !ordersRes.value.error) {
                    orders = ordersRes.value.data || []
                }
                let sessions: any[] = []
                if (sessionsRes.status === 'fulfilled' && !sessionsRes.value.error) {
                    sessions = sessionsRes.value.data || []
                }

                const totalsOrders = orders.length
                const revenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
                const aov = totalsOrders ? revenue / totalsOrders : 0
                const sessionsCount = sessions.length

                const dailyKey = (d: Date) =>
                    new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
                const mapAov: Record<string, { sum: number; cnt: number }> = {}
                orders.forEach((o) => {
                    const key = dailyKey(new Date(o.created_at))
                    mapAov[key] = mapAov[key] || { sum: 0, cnt: 0 }
                    mapAov[key].sum += Number(o.total) || 0
                    mapAov[key].cnt += 1
                })
                const days: string[] = []
                for (
                    let t = startOfDay(range.from).getTime();
                    t <= endOfDay(range.to).getTime();
                    t += 24 * 60 * 60 * 1000
                ) {
                    days.push(new Date(t).toISOString().slice(0, 10))
                }
                const aovSeries: AovPoint[] = days.map((d) => ({
                    date: d,
                    aov: mapAov[d] ? mapAov[d].sum / mapAov[d].cnt : 0,
                    orders: mapAov[d]?.cnt || 0,
                }))

                const localeSplitMap: Record<string, { orders: number; revenue: number }> = {}
                orders.forEach((o) => {
                    const lc = (o.locale || lang || 'en').toString()
                    if (!localeSplitMap[lc]) localeSplitMap[lc] = { orders: 0, revenue: 0 }
                    localeSplitMap[lc].orders += 1
                    localeSplitMap[lc].revenue += Number(o.total) || 0
                })
                const localeSplit: LocaleSplit[] = Object.entries(localeSplitMap).map(
                    ([lc, v]) => ({
                        locale: lc,
                        orders: v.orders,
                        revenue: v.revenue,
                    })
                )

                const approvals = sessions.filter((s) =>
                    (s.status || '').includes('approved')
                ).length
                const checkouts = orders.length // best-effort
                const purchases = orders.filter(
                    (o) =>
                        (o.status || '').toLowerCase() === 'paid' ||
                        (o.status || '').toLowerCase() === 'processing'
                ).length

                const normalized: AnalyticsData = {
                    totals: {
                        sessions: sessionsCount,
                        approvals,
                        checkouts,
                        purchases,
                        revenue,
                        aov,
                        orders: totalsOrders,
                    },
                    funnel: [
                        { step: 'design', count: sessionsCount },
                        { step: 'approval', count: approvals },
                        { step: 'checkout', count: checkouts },
                        { step: 'purchase', count: purchases },
                    ],
                    aovSeries,
                    latency: { avgHours: 0, p50: 0, p90: 0, series: [] },
                    localeSplit,
                }
                setData(normalized)
            } catch (fallbackErr: any) {
                setError(fallbackErr?.message || 'Failed to load analytics')
                setData(defaultAnalytics)
            }
        } finally {
            setLoading(false)
        }
    }, [supabase, range.from, range.to, lang])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const conversionRate = useMemo(() => {
        const sessions = data.totals.sessions || 0
        const purchases = data.totals.purchases || 0
        return sessions ? (purchases / sessions) * 100 : 0
    }, [data.totals.sessions, data.totals.purchases])

    const totalLocaleRevenue = useMemo(
        () => data.localeSplit.reduce((sum, x) => sum + x.revenue, 0),
        [data.localeSplit]
    )

    const handlePreset = (days: number) => {
        const to = endOfDay(new Date())
        const from = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000))
        setRange({ from, to })
    }

    const applyCustomDates = (fromStr: string, toStr: string) => {
        const f = startOfDay(fromInputDate(fromStr))
        const t = endOfDay(fromInputDate(toStr))
        if (f > t) return
        setRange({ from: f, to: t })
    }

    const chartConfig = {
        aov: { label: 'AOV', color: 'hsl(var(--chart-2))' },
        orders: { label: 'Orders', color: 'hsl(var(--chart-1))' },
        hours: { label: 'Hours', color: 'hsl(var(--chart-3))' },
    } as const

    return (
        <div className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-8">
            <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                        Analytics
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Conversion, revenue, fulfillment, and locale performance
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={`/${lang}/admin/orders`}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                    >
                        Orders
                    </Link>
                    <Link
                        href={`/${lang}/admin/costs`}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                    >
                        Costs
                    </Link>
                    <Link
                        href={`/${lang}/admin/logs`}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hidden items-center rounded-md px-3 py-2 text-sm font-medium md:inline-flex"
                    >
                        Logs
                    </Link>
                    <Link
                        href={`/${lang}/admin/health`}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hidden items-center rounded-md px-3 py-2 text-sm font-medium sm:inline-flex"
                    >
                        Health
                    </Link>
                    <Link
                        href={`/${lang}/admin/retries`}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 hidden items-center rounded-md px-3 py-2 text-sm font-medium lg:inline-flex"
                    >
                        Retries
                    </Link>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="text-muted-foreground text-sm">Revenue</div>
                    <div className="mt-2 text-2xl font-semibold">
                        {currency(data.totals.revenue, lang)}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        AOV {currency(data.totals.aov, lang)}
                    </div>
                </div>
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="text-muted-foreground text-sm">Orders</div>
                    <div className="mt-2 text-2xl font-semibold">{data.totals.orders}</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        <Link
                            href={`/${lang}/orders`}
                            className="text-primary underline underline-offset-2 hover:opacity-80"
                        >
                            View customer orders
                        </Link>
                    </div>
                </div>
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="text-muted-foreground text-sm">Conversion Rate</div>
                    <div className="mt-2 text-2xl font-semibold">{conversionRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        {data.totals.purchases}/{data.totals.sessions} (purchases/sessions)
                    </div>
                </div>
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="text-muted-foreground text-sm">Fulfillment Latency</div>
                    <div className="mt-2 text-2xl font-semibold">
                        {data.latency.avgHours.toFixed(1)}h avg
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        p50 {data.latency.p50.toFixed(1)}h • p90 {data.latency.p90.toFixed(1)}h
                    </div>
                </div>
            </div>

            <div className="border-border bg-card mb-6 rounded-lg border p-4 shadow-sm">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePreset(7)}
                            className="bg-muted text-foreground hover:bg-muted/80 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
                        >
                            Last 7 days
                        </button>
                        <button
                            onClick={() => handlePreset(30)}
                            className="bg-muted text-foreground hover:bg-muted/80 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
                        >
                            Last 30 days
                        </button>
                        <button
                            onClick={() => handlePreset(90)}
                            className="bg-muted text-foreground hover:bg-muted/80 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
                        >
                            Last 90 days
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <label className="text-muted-foreground">From</label>
                            <input
                                type="date"
                                defaultValue={toInputDate(range.from)}
                                onChange={(e) =>
                                    applyCustomDates(e.target.value, toInputDate(range.to))
                                }
                                className="border-input bg-background focus:ring-ring rounded-md border px-2 py-1.5 outline-none focus:ring-2"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-muted-foreground">To</label>
                            <input
                                type="date"
                                defaultValue={toInputDate(range.to)}
                                onChange={(e) =>
                                    applyCustomDates(toInputDate(range.from), e.target.value)
                                }
                                className="border-input bg-background focus:ring-ring rounded-md border px-2 py-1.5 outline-none focus:ring-2"
                            />
                        </div>
                        <button
                            onClick={() => fetchData()}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-1.5 font-medium"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="border-destructive bg-destructive/10 text-destructive-foreground mb-6 rounded-lg border p-4 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm xl:col-span-1">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Conversion Funnel</h2>
                        <Link
                            href={`/${lang}/admin/orders`}
                            className="text-primary text-sm underline underline-offset-4 hover:opacity-80"
                        >
                            Investigate
                        </Link>
                    </div>
                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <div className="h-64 w-full">
                            <ChartContainer config={{}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.funnel.map((s) => ({
                                            step: s.step,
                                            count: s.count,
                                        }))}
                                        layout="vertical"
                                        margin={{ left: 24, right: 12, top: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis type="number" hide domain={[0, 'dataMax']} />
                                        <YAxis
                                            type="category"
                                            dataKey="step"
                                            tickFormatter={(v) =>
                                                v === 'design'
                                                    ? 'Design'
                                                    : v === 'approval'
                                                      ? 'Approval'
                                                      : v === 'checkout'
                                                        ? 'Checkout'
                                                        : 'Purchase'
                                            }
                                            width={90}
                                        />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Bar
                                            dataKey="count"
                                            radius={[0, 4, 4, 0]}
                                            fill="hsl(var(--chart-1))"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="text-muted-foreground mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                                {data.funnel.map((s) => (
                                    <div key={s.step} className="bg-muted rounded-md p-2">
                                        <div className="text-foreground font-medium">{s.count}</div>
                                        <div>
                                            {s.step === 'design'
                                                ? 'Design'
                                                : s.step === 'approval'
                                                  ? 'Approval'
                                                  : s.step === 'checkout'
                                                    ? 'Checkout'
                                                    : 'Purchase'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-border bg-card rounded-lg border p-4 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">AOV & Orders</h2>
                        <Link
                            href={`/${lang}/admin/costs`}
                            className="text-primary text-sm underline underline-offset-4 hover:opacity-80"
                        >
                            Costs & margins
                        </Link>
                    </div>
                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <div className="h-64 w-full">
                            <ChartContainer config={chartConfig}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={data.aovSeries}
                                        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="fillAov"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="hsl(var(--chart-2))"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="hsl(var(--chart-2))"
                                                    stopOpacity={0.05}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} width={40} />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={{ fontSize: 12 }}
                                            width={40}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="aov"
                                            name="AOV"
                                            stroke="hsl(var(--chart-2))"
                                            fill="url(#fillAov)"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="orders"
                                            name="Orders"
                                            stroke="hsl(var(--chart-1))"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    )}
                </div>

                <div className="border-border bg-card rounded-lg border p-4 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Fulfillment Latency</h2>
                        <Link
                            href={`/${lang}/admin/health`}
                            className="text-primary text-sm underline underline-offset-4 hover:opacity-80"
                        >
                            Pipeline health
                        </Link>
                    </div>
                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        <div className="h-64 w-full">
                            <ChartContainer
                                config={{ hours: { label: 'Hours', color: 'hsl(var(--chart-3))' } }}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={data.latency.series}
                                        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} width={40} />
                                        <Tooltip content={<ChartTooltipContent />} />
                                        <Line
                                            type="monotone"
                                            dataKey="hours"
                                            name="Hours"
                                            stroke="hsl(var(--chart-3))"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            <div className="text-muted-foreground mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="bg-muted rounded-md p-2">
                                    <div className="text-foreground">
                                        {data.latency.avgHours.toFixed(1)}h
                                    </div>
                                    <div>Avg</div>
                                </div>
                                <div className="bg-muted rounded-md p-2">
                                    <div className="text-foreground">
                                        {data.latency.p50.toFixed(1)}h
                                    </div>
                                    <div>P50</div>
                                </div>
                                <div className="bg-muted rounded-md p-2">
                                    <div className="text-foreground">
                                        {data.latency.p90.toFixed(1)}h
                                    </div>
                                    <div>P90</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-border bg-card rounded-lg border p-4 shadow-sm xl:col-span-1">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Locale Split</h2>
                        <Link
                            href={`/${lang}/admin/analytics`}
                            className="text-primary text-sm underline underline-offset-4 hover:opacity-80"
                        >
                            KR vs EN
                        </Link>
                    </div>
                    {loading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : data.localeSplit.length === 0 ? (
                        <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
                            No data
                        </div>
                    ) : (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Pie
                                        data={data.localeSplit}
                                        dataKey="revenue"
                                        nameKey="locale"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                    >
                                        {data.localeSplit.map((_, i) => (
                                            <Cell
                                                key={`cell-${i}`}
                                                fill={COLORS[i % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                {data.localeSplit.map((s) => (
                                    <div
                                        key={s.locale}
                                        className="bg-muted flex items-center justify-between rounded-md px-2 py-1.5"
                                    >
                                        <span className="text-foreground font-medium uppercase">
                                            {s.locale}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {currency(s.revenue, lang)}
                                        </span>
                                    </div>
                                ))}
                                <div className="border-border col-span-2 mt-1 flex items-center justify-between rounded-md border border-dashed px-2 py-1.5 text-xs">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-medium">
                                        {currency(totalLocaleRevenue, lang)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Deep Dives</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <Link
                            href={`/${lang}/admin/orders`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Orders queue</div>
                            <div className="text-muted-foreground text-xs">
                                Filter by status and latency
                            </div>
                        </Link>
                        <Link
                            href={`/${lang}/admin/costs`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Costs & margins</div>
                            <div className="text-muted-foreground text-xs">
                                Printify costs vs retail
                            </div>
                        </Link>
                        <Link
                            href={`/${lang}/admin/products-mapping`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Product mapping</div>
                            <div className="text-muted-foreground text-xs">
                                SKUs & variant coverage
                            </div>
                        </Link>
                        <Link
                            href={`/${lang}/admin/logs`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Generation logs</div>
                            <div className="text-muted-foreground text-xs">
                                LLM & image API traces
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold">Shortcuts</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <Link
                            href={`/${lang}/products`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Browse products</div>
                            <div className="text-muted-foreground text-xs">
                                Test conversion flow
                            </div>
                        </Link>
                        <Link
                            href={`/${lang}/design`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Start a design</div>
                            <div className="text-muted-foreground text-xs">Generate previews</div>
                        </Link>
                        <Link
                            href={`/${lang}/account/orders`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">My orders</div>
                            <div className="text-muted-foreground text-xs">Customer view</div>
                        </Link>
                        <Link
                            href={`/${lang}/admin`}
                            className="border-border bg-background hover:bg-muted rounded-md border p-3"
                        >
                            <div className="text-sm font-medium">Admin home</div>
                            <div className="text-muted-foreground text-xs">Overview & nav</div>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <div className="text-muted-foreground text-xs">
                    Range: {toInputDate(range.from)} → {toInputDate(range.to)}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const rows = [
                                ['date', 'aov', 'orders'],
                                ...data.aovSeries.map((d) => [
                                    d.date,
                                    d.aov.toFixed(2),
                                    String(d.orders),
                                ]),
                            ]
                            const csv = rows.map((r) => r.join(',')).join('\n')
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `analytics_aov_${toInputDate(range.from)}_${toInputDate(range.to)}.csv`
                            a.click()
                            URL.revokeObjectURL(url)
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                    >
                        Export AOV CSV
                    </button>
                </div>
            </div>
        </div>
    )
}
