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
} from '@/components/ui/table'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'

type KPIStats = {
    ordersCount: number
    conversionRate: number // 0..1
    averageOrderValue: number // in currency minor units or major? We'll assume major units
    llmCalls: number
    avgFulfillmentTimeHours: number
    revenue: number
}

function useAdminAccess() {
    const [loading, setLoading] = React.useState(true)
    const [allowed, setAllowed] = React.useState(false)
    const [email, setEmail] = React.useState<string | null>(null)
    const supabase = React.useMemo(() => supabaseBrowser, [])

    React.useEffect(() => {
        let isMounted = true
        ;(async () => {
            try {
                const { data: sessionData } = await supabase.auth.getUser()
                const user = sessionData.user || null
                if (!isMounted || !user) return

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('is_admin, is_merchant, display_name, language, locale, phone')
                    .eq('user_id', user.id)
                    .single()

                console.log(profile)

                if (error) {
                    console.error('Error fetching profile:', error)
                } else {
                    console.log('Profile:', profile)
                }

                setEmail(user?.email ?? null)
                setAllowed(!!user && profile?.is_admin)
            } catch (_e) {
                setAllowed(false)
            } finally {
                if (isMounted) setLoading(false)
            }
        })()
        return () => {
            isMounted = false
        }
    }, [supabase])

    return { loading, allowed, email }
}

function useKPIs(lang: string) {
    const supabase = React.useMemo(() => supabaseBrowser, [])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const [kpis, setKpis] = React.useState<KPIStats | null>(null)
    const [recentOrders, setRecentOrders] = React.useState<any[]>([])

    React.useEffect(() => {
        let isMounted = true

        const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        async function safeCount(table: string, filters?: (q: any) => any): Promise<number> {
            try {
                let q = supabase.from(table).select('*', { count: 'exact', head: true })
                if (filters) q = filters(q)
                const { count, error } = await q
                if (error) throw error
                return count || 0
            } catch {
                return 0
            }
        }

        async function safeSelect(table: string, select: string, filters?: (q: any) => any) {
            try {
                let q = supabase.from(table).select(select)
                if (filters) q = filters(q)
                const { data, error } = await q
                if (error) throw error
                return data || []
            } catch {
                return [] as any[]
            }
        }

        function sum(arr: number[]) {
            return arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
        }

        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                // Orders count last 30 days
                const ordersCount = await safeCount('orders', (q) =>
                    q.gte('created_at', dateFrom.toISOString())
                )

                // Fetch orders for revenue and AOV computation
                const ordersRows = await safeSelect(
                    'orders',
                    'id, created_at, paid_at, status, total_amount, total, amount, currency, fulfilled_at, submitted_at, shipped_at',
                    (q) =>
                        q
                            .gte('created_at', dateFrom.toISOString())
                            .order('created_at', { ascending: false })
                            .limit(1000)
                )

                const amounts = ordersRows.map((o: any) => {
                    const val = o.total_amount ?? o.total ?? o.amount ?? 0
                    const n = typeof val === 'number' ? val : parseFloat(val || '0')
                    return Number.isFinite(n) ? n : 0
                })

                const revenue = sum(amounts)
                const paidOrders = ordersRows.filter((o: any) => {
                    const status: string = (o?.status || '').toString().toLowerCase()
                    return (
                        !!o?.paid_at ||
                        status === 'paid' ||
                        status === 'succeeded' ||
                        status === 'completed' ||
                        status === 'fulfilled'
                    )
                }).length

                const averageOrderValue = paidOrders > 0 ? revenue / paidOrders : 0

                // Conversion rate: orders / design sessions (fallback to 1 if design_sessions missing)
                const designSessions = await (async () => {
                    const tablesToTry = ['design_sessions', 'sessions', 'ai_sessions', 'funnels']
                    for (const t of tablesToTry) {
                        const c = await safeCount(t, (q) =>
                            q.gte('created_at', dateFrom.toISOString())
                        )
                        if (c > 0) return c
                    }
                    return 0
                })()
                const conversionRate = designSessions > 0 ? paidOrders / designSessions : 1

                // LLM calls from logs tables
                const llmCalls = await (async () => {
                    const tables = [
                        'llm_logs',
                        'solar_logs',
                        'ai_logs',
                        'model_calls',
                        'observability_logs',
                    ]
                    for (const t of tables) {
                        const c = await safeCount(t, (q) =>
                            q.gte('created_at', dateFrom.toISOString())
                        )
                        if (c > 0) return c
                    }
                    return 0
                })()

                // Fulfillment time: avg(fulfilled_at - submitted_at or created_at)
                const fulfillCandidates = ordersRows.filter(
                    (o: any) => o?.fulfilled_at || o?.shipped_at
                )
                const diffsHours = fulfillCandidates.map((o: any) => {
                    const end = new Date(o.fulfilled_at || o.shipped_at)
                    const start = o.submitted_at ? new Date(o.submitted_at) : new Date(o.created_at)
                    const ms = end.getTime() - start.getTime()
                    return ms > 0 ? ms / 1000 / 3600 : 0
                })
                const avgFulfillmentTimeHours = diffsHours.length
                    ? sum(diffsHours) / diffsHours.length
                    : 0

                // Recent orders
                let recent = ordersRows.slice(0, 5)
                if (recent.length === 0) {
                    // Fallback try another shape
                    recent = await safeSelect(
                        'orders',
                        'id, created_at, status, currency, total_amount, total, amount',
                        (q) => q.order('created_at', { ascending: false }).limit(5)
                    )
                }

                if (!isMounted) return
                setKpis({
                    ordersCount,
                    conversionRate,
                    averageOrderValue,
                    llmCalls,
                    avgFulfillmentTimeHours,
                    revenue,
                })
                setRecentOrders(recent)
            } catch (e: any) {
                if (!isMounted) return
                setError(e?.message || 'Failed to load KPIs.')
            } finally {
                if (isMounted) setLoading(false)
            }
        })()

        return () => {
            isMounted = false
        }
    }, [supabase, lang])

    return { loading, error, kpis, recentOrders }
}

function useLocale(lang: string) {
    const locale = React.useMemo(() => {
        const lower = (lang || 'en').toLowerCase()
        if (lower.startsWith('ko') || lower.startsWith('kr')) return 'ko-KR'
        return 'en-US'
    }, [lang])
    return locale
}

function formatCurrency(value: number, locale: string, currency = 'USD') {
    try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value || 0)
    } catch {
        return `${value?.toFixed ? value.toFixed(2) : value}`
    }
}

function formatNumber(value: number, locale: string) {
    try {
        return new Intl.NumberFormat(locale).format(value || 0)
    } catch {
        return String(value || 0)
    }
}

function formatPercent(value: number, locale: string) {
    try {
        return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }).format(
            value || 0
        )
    } catch {
        return `${Math.round((value || 0) * 100)}%`
    }
}

export default function AdminDashboardPage() {
    const params = useParams<{ lang: string }>()
    const lang = (params?.lang as string) || 'en'
    const locale = useLocale(lang)
    const router = useRouter()

    const { loading: authLoading, allowed, email } = useAdminAccess()
    const { loading, error, kpis, recentOrders } = useKPIs(lang)

    const currency = React.useMemo(() => (locale.startsWith('ko') ? 'KRW' : 'USD'), [locale])

    const quickLinks: { href: string; title: string; desc: string }[] = [
        { href: `/${lang}/admin/orders`, title: 'Orders Queue', desc: 'Review, manage, track' },
        {
            href: `/${lang}/admin/products-mapping`,
            title: 'Product Mapping',
            desc: 'Printify SKUs & variants',
        },
        { href: `/${lang}/admin/logs`, title: 'Logs', desc: 'Solar Pro2, generation, webhooks' },
        { href: `/${lang}/admin/costs`, title: 'Costs', desc: 'Spend & margins' },
        { href: `/${lang}/admin/health`, title: 'Health', desc: 'API status & uptime' },
        { href: `/${lang}/admin/retries`, title: 'Retries', desc: 'Failed jobs & resubmits' },
        { href: `/${lang}/admin/analytics`, title: 'Analytics', desc: 'Conversion & trends' },
    ]

    const globalLinks: { href: string; label: string }[] = [
        { href: `/${lang}/products`, label: 'Catalog' },
        { href: `/${lang}/design`, label: 'New Design' },
        { href: `/${lang}/orders`, label: 'My Orders' },
        { href: `/${lang}/account`, label: 'Account' },
        { href: `/${lang}/(marketing)/about`, label: 'About' },
        { href: `/${lang}/(marketing)/help`, label: 'Help' },
        { href: `/${lang}/(marketing)/legal/terms`, label: 'Terms' },
    ]

    return (
        <div className="bg-background text-foreground min-h-[calc(100vh-4rem)]">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
                        <p className="text-muted-foreground">
                            Overview of operations, performance, and health.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {globalLinks.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="border-border bg-secondary/30 text-foreground hover:bg-secondary hover:text-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm transition-colors"
                            >
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {authLoading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="border-border bg-card rounded-lg border p-4">
                                <Skeleton className="h-4 w-24" />
                                <div className="mt-3">
                                    <Skeleton className="h-8 w-32" />
                                </div>
                                <div className="mt-2">
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !allowed ? (
                    <div className="max-w-2xl">
                        <Alert className="border-destructive/50">
                            <AlertTitle className="font-semibold">Access restricted</AlertTitle>
                            <AlertDescription>
                                {email ? (
                                    <span>
                                        Your account ({email}) doesn&apos;t have admin privileges.
                                        Visit your{' '}
                                        <Link
                                            href={`/${lang}/account/settings`}
                                            className="hover:text-primary underline underline-offset-4"
                                        >
                                            account settings
                                        </Link>{' '}
                                        or return to the{' '}
                                        <Link
                                            href={`/${lang}/products`}
                                            className="hover:text-primary underline underline-offset-4"
                                        >
                                            catalog
                                        </Link>
                                        .
                                    </span>
                                ) : (
                                    <span>
                                        Please{' '}
                                        <Link
                                            href={`/${lang}/(auth)/sign-in`}
                                            className="hover:text-primary underline underline-offset-4"
                                        >
                                            sign in
                                        </Link>{' '}
                                        to continue.
                                    </span>
                                )}
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <>
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <KpiCard
                                label="Orders (30d)"
                                value={
                                    loading || !kpis ? null : formatNumber(kpis.ordersCount, locale)
                                }
                                href={`/${lang}/admin/orders`}
                                caption="Placed via Stripe"
                            />
                            <KpiCard
                                label="Conversion"
                                value={
                                    loading || !kpis
                                        ? null
                                        : formatPercent(kpis.conversionRate, locale)
                                }
                                href={`/${lang}/admin/analytics`}
                                caption="Design → Purchase"
                            />
                            <KpiCard
                                label="AOV"
                                value={
                                    loading || !kpis
                                        ? null
                                        : formatCurrency(kpis.averageOrderValue, locale, currency)
                                }
                                href={`/${lang}/admin/costs`}
                                caption="Average order value"
                            />
                            <KpiCard
                                label="Solar Pro2 Calls"
                                value={
                                    loading || !kpis ? null : formatNumber(kpis.llmCalls, locale)
                                }
                                href={`/${lang}/admin/logs`}
                                caption="Last 30 days"
                            />
                            <KpiCard
                                label="Fulfillment Time"
                                value={
                                    loading || !kpis
                                        ? null
                                        : `${(kpis.avgFulfillmentTimeHours || 0).toFixed(1)}h`
                                }
                                href={`/${lang}/admin/health`}
                                caption="Avg to ship"
                            />
                        </section>

                        {error ? (
                            <div className="mt-4 max-w-2xl">
                                <Alert className="border-destructive/50">
                                    <AlertTitle className="font-semibold">Data issue</AlertTitle>
                                    <AlertDescription>
                                        {error}. View{' '}
                                        <Link
                                            href={`/${lang}/admin/logs`}
                                            className="hover:text-primary underline underline-offset-4"
                                        >
                                            logs
                                        </Link>{' '}
                                        or{' '}
                                        <Link
                                            href={`/${lang}/admin/health`}
                                            className="hover:text-primary underline underline-offset-4"
                                        >
                                            health
                                        </Link>
                                        .
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : null}

                        <section className="mt-8">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Admin Sections</h2>
                                <Link
                                    href={`/${lang}/admin/analytics`}
                                    className="text-primary hover:text-primary/80 text-sm underline underline-offset-4"
                                >
                                    Go to Analytics →
                                </Link>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {quickLinks.map((q) => (
                                    <Link
                                        key={q.href}
                                        href={q.href}
                                        className={cn(
                                            'group border-border bg-card rounded-lg border p-4 transition-all',
                                            'hover:-translate-y-0.5 hover:shadow-md'
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-base font-medium">{q.title}</div>
                                            <div className="text-primary transition-transform group-hover:translate-x-0.5">
                                                →
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-sm">
                                            {q.desc}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        <section className="mt-10">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Recent Orders</h2>
                                <Link
                                    href={`/${lang}/admin/orders`}
                                    className="text-primary text-sm underline underline-offset-4"
                                >
                                    View all →
                                </Link>
                            </div>
                            <div className="border-border bg-card overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[10rem]">Order</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <Skeleton className="h-4 w-40" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-4 w-24" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-4 w-28" />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Skeleton className="ml-auto h-4 w-16" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : recentOrders && recentOrders.length > 0 ? (
                                            recentOrders.map((o: any) => {
                                                const id = o?.id || ''
                                                const date = o?.created_at
                                                    ? new Date(o.created_at)
                                                    : null
                                                const status = (o?.status || '').toString()
                                                const total =
                                                    o?.total_amount ?? o?.total ?? o?.amount ?? 0
                                                return (
                                                    <TableRow key={id}>
                                                        <TableCell>
                                                            <Link
                                                                href={`/${lang}/admin/orders/${encodeURIComponent(id)}`}
                                                                className="text-primary underline underline-offset-4"
                                                            >
                                                                #{String(id).slice(0, 8)}...
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={cn(
                                                                    'inline-flex items-center rounded-full px-2 py-1 text-xs',
                                                                    statusClass(status)
                                                                )}
                                                            >
                                                                {status || '—'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {date
                                                                ? date.toLocaleString(locale)
                                                                : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(
                                                                Number(total) || 0,
                                                                locale,
                                                                currency
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="text-muted-foreground py-8 text-center"
                                                >
                                                    No recent orders. Start with a{' '}
                                                    <Link
                                                        href={`/${lang}/design`}
                                                        className="text-primary underline underline-offset-4"
                                                    >
                                                        new design
                                                    </Link>{' '}
                                                    or review the{' '}
                                                    <Link
                                                        href={`/${lang}/admin/products-mapping`}
                                                        className="text-primary underline underline-offset-4"
                                                    >
                                                        product mapping
                                                    </Link>
                                                    .
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>

                        <section className="mt-10">
                            <div className="mb-3">
                                <h2 className="text-lg font-semibold">Operational Shortcuts</h2>
                                <p className="text-muted-foreground text-sm">
                                    Keep your flows healthy and cost-effective.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <ActionCard
                                    title="Webhook Health"
                                    desc="Stripe & Printify sync"
                                    href={`/${lang}/admin/health`}
                                />
                                <ActionCard
                                    title="Retry Failed Orders"
                                    desc="Auto-submit & resync"
                                    href={`/${lang}/admin/retries`}
                                />
                                <ActionCard
                                    title="Cost Controls"
                                    desc="LLM and image budget"
                                    href={`/${lang}/admin/costs`}
                                />
                            </div>
                        </section>
                    </>
                )}

                <Separator className="my-10" />
                <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>RealizeIt Admin • POC</div>
                    <div className="flex gap-3">
                        <Link
                            href={`/${lang}/(marketing)/legal/privacy`}
                            className="hover:text-foreground"
                        >
                            Privacy
                        </Link>
                        <Link
                            href={`/${lang}/(marketing)/legal/terms`}
                            className="hover:text-foreground"
                        >
                            Terms
                        </Link>
                        <Link
                            href={`/${lang}/(marketing)/legal/ip-policy`}
                            className="hover:text-foreground"
                        >
                            IP Policy
                        </Link>
                        <Link
                            href={`/${lang}/(marketing)/contact`}
                            className="hover:text-foreground"
                        >
                            Contact
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}

function KpiCard({
    label,
    value,
    caption,
    href,
}: {
    label: string
    value: string | null
    caption?: string
    href: string
}) {
    return (
        <div className="group border-border bg-card relative rounded-lg border p-4">
            <div className="text-muted-foreground text-sm">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
                {value === null ? <Skeleton className="h-8 w-28" /> : value}
            </div>
            {caption ? <div className="text-muted-foreground mt-1 text-xs">{caption}</div> : null}
            <Link
                href={href}
                className="bg-secondary/40 text-foreground hover:bg-secondary absolute top-3 right-3 inline-flex items-center rounded-md px-2 py-1 text-xs transition-colors"
            >
                View →
            </Link>
        </div>
    )
}

function ActionCard({ title, desc, href }: { title: string; desc: string; href: string }) {
    return (
        <Link
            href={href}
            className={cn(
                'group border-border bg-card rounded-lg border p-4 transition-all',
                'hover:-translate-y-0.5 hover:shadow-md'
            )}
        >
            <div className="flex items-center justify-between">
                <div className="font-medium">{title}</div>
                <div className="text-primary transition-transform group-hover:translate-x-0.5">
                    →
                </div>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
        </Link>
    )
}

function statusClass(status: string) {
    const s = (status || '').toLowerCase()
    if (
        s.includes('paid') ||
        s.includes('fulfilled') ||
        s.includes('completed') ||
        s.includes('succeeded')
    ) {
        return 'bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20'
    }
    if (
        s.includes('canceled') ||
        s.includes('cancelled') ||
        s.includes('failed') ||
        s.includes('refunded')
    ) {
        return 'bg-destructive/10 text-destructive ring-1 ring-destructive/20'
    }
    if (s.includes('processing') || s.includes('pending')) {
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 ring-1 ring-yellow-500/20'
    }
    return 'bg-muted text-foreground ring-1 ring-border'
}
