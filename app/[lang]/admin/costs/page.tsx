'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
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
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

type ControlRow = {
    id?: number | string
    updated_at?: string | null
    daily_cap_usd_solar?: number | null
    daily_cap_usd_image?: number | null
    soft_warning_percent?: number | null
    hard_stop_enabled?: boolean | null
    alert_email?: string | null
}

type ProviderCost = {
    date: string // YYYY-MM-DD
    provider: string // e.g., "solar_pro2" | "image_api"
    spend_usd: number
    calls?: number | null
}

const currency = (v: number, locale: string = 'en-US', currency: string = 'USD') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(v)

const fmtDate = (d: string, locale: string = 'en-US') =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(d))

export default function AdminCostsPage() {
    const params = useParams<{ lang: string }>()
    const lang = params?.lang || 'en'
    const { toast } = useToast()

    const [controls, setControls] = React.useState<ControlRow | null>(null)
    const [saving, setSaving] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [costs, setCosts] = React.useState<ProviderCost[]>([])
    const [alerts, setAlerts] = React.useState<
        { id: string | number; created_at: string; message: string; severity: string }[]
    >([])
    const [errors, setErrors] = React.useState<{
        controls?: string
        costs?: string
        alerts?: string
    }>({})

    const startDateISO = React.useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() - 29)
        return d.toISOString().slice(0, 10)
    }, [])

    const locale = lang === 'kr' || lang === 'ko' ? 'ko-KR' : 'en-US'

    React.useEffect(() => {
        const supabase = supabaseBrowser

        const loadControls = async () => {
            try {
                const { data, error } = await supabase
                    .from('cost_controls')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                if (error) throw error
                const row: ControlRow | undefined = data?.[0]
                if (row) {
                    setControls(row)
                } else {
                    setControls({
                        daily_cap_usd_solar: 50,
                        daily_cap_usd_image: 50,
                        soft_warning_percent: 80,
                        hard_stop_enabled: true,
                        alert_email: '',
                    })
                }
            } catch (e: any) {
                setErrors((prev) => ({
                    ...prev,
                    controls: e?.message || 'Failed to load controls',
                }))
                // Create sensible defaults so UI still works
                setControls({
                    daily_cap_usd_solar: 50,
                    daily_cap_usd_image: 50,
                    soft_warning_percent: 80,
                    hard_stop_enabled: true,
                    alert_email: '',
                })
            }
        }

        const loadCosts = async () => {
            try {
                const { data, error } = await supabase
                    .from('provider_costs_daily')
                    .select('date,provider,spend_usd,calls')
                    .gte('date', startDateISO)
                    .order('date', { ascending: true })
                if (error) throw error
                setCosts(data || [])
            } catch (e: any) {
                setErrors((prev) => ({ ...prev, costs: e?.message || 'Failed to load costs' }))
                setCosts([])
            }
        }

        const loadAlerts = async () => {
            try {
                const since = new Date()
                since.setDate(since.getDate() - 7)
                const { data, error } = await supabase
                    .from('cost_alerts')
                    .select('id, created_at, message, severity')
                    .gte('created_at', since.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(20)
                if (error) throw error
                setAlerts(data || [])
            } catch (e: any) {
                setErrors((prev) => ({ ...prev, alerts: e?.message || 'Failed to load alerts' }))
                setAlerts([])
            }
        }

        ;(async () => {
            setLoading(true)
            await Promise.all([loadControls(), loadCosts(), loadAlerts()])
            setLoading(false)
        })()
    }, [startDateISO, lang])

    const chartData = React.useMemo(() => {
        // Aggregate costs by date and provider
        const byDate: Record<string, { date: string; solar: number; image: number }> = {}
        for (const row of costs) {
            const key = row.date
            if (!byDate[key]) byDate[key] = { date: key, solar: 0, image: 0 }
            const p = row.provider?.toLowerCase() || ''
            if (p.includes('solar')) byDate[key].solar += row.spend_usd || 0
            else if (p.includes('image')) byDate[key].image += row.spend_usd || 0
        }
        const arr = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
        return arr
    }, [costs])

    const kpis = React.useMemo(() => {
        const totalSolar = costs
            .filter((c) => (c.provider || '').toLowerCase().includes('solar'))
            .reduce(
                (acc, cur) => {
                    acc.spend += cur.spend_usd || 0
                    acc.calls += cur.calls || 0
                    return acc
                },
                { spend: 0, calls: 0 }
            )
        const totalImage = costs
            .filter((c) => (c.provider || '').toLowerCase().includes('image'))
            .reduce(
                (acc, cur) => {
                    acc.spend += cur.spend_usd || 0
                    acc.calls += cur.calls || 0
                    return acc
                },
                { spend: 0, calls: 0 }
            )
        const total = totalSolar.spend + totalImage.spend
        return {
            solarSpend: totalSolar.spend,
            solarCalls: totalSolar.calls,
            imageSpend: totalImage.spend,
            imageCalls: totalImage.calls,
            totalSpend: total,
        }
    }, [costs])

    const handleSave = async () => {
        if (!controls) return
        setSaving(true)
        try {
            const supabase = supabaseBrowser
            const payload: ControlRow = {
                daily_cap_usd_solar: Number(controls.daily_cap_usd_solar || 0),
                daily_cap_usd_image: Number(controls.daily_cap_usd_image || 0),
                soft_warning_percent: Number(controls.soft_warning_percent || 0),
                hard_stop_enabled: !!controls.hard_stop_enabled,
                alert_email: (controls.alert_email || '').trim(),
            }

            let ok = false
            if (controls.id !== undefined && controls.id !== null) {
                const { error } = await supabase
                    .from('cost_controls')
                    .update(payload)
                    .eq('id', controls.id)
                if (error) throw error
                ok = true
            } else {
                const { data, error } = await supabase
                    .from('cost_controls')
                    .insert(payload)
                    .select('*')
                    .single()
                if (error) throw error
                setControls({ ...payload, id: (data as any)?.id })
                ok = true
            }

            if (ok) {
                toast({ title: 'Saved', description: 'Cost controls updated successfully.' })
            }
        } catch (e: any) {
            toast({
                title: 'Save failed',
                description: e?.message || 'Unable to persist cost controls',
                variant: 'destructive' as any,
            })
        } finally {
            setSaving(false)
        }
    }

    const exportCSV = () => {
        const rows = [
            ['date', 'solar_spend_usd', 'image_spend_usd'],
            ...chartData.map((r) => [r.date, r.solar.toFixed(2), r.image.toFixed(2)]),
        ]
        const csv = rows.map((r) => r.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `provider-costs-${startDateISO}-to-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-[calc(100dvh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="text-muted-foreground text-sm">
                            <nav className="flex items-center gap-2" aria-label="Breadcrumb">
                                <Link href={`/${lang}/admin`} className="hover:underline">
                                    Admin
                                </Link>
                                <span>/</span>
                                <span className="text-foreground">Costs</span>
                            </nav>
                        </div>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                            Usage & Cost Controls
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Monitor Solar Pro2 and image API spend, set caps and alerts. Drill into
                            logs or view analytics for deeper insights.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/${lang}/admin/logs`}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                        >
                            View Logs
                        </Link>
                        <Link
                            href={`/${lang}/admin/analytics`}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                        >
                            Analytics
                        </Link>
                        <Link
                            href={`/${lang}/admin/health`}
                            className="bg-muted text-foreground hover:bg-muted/80 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                        >
                            API Health
                        </Link>
                    </div>
                </div>

                {(errors.controls || errors.costs || errors.alerts) && (
                    <Alert variant="destructive" className="border-destructive/50">
                        <AlertTitle>Some data could not be loaded</AlertTitle>
                        <AlertDescription>
                            {errors.controls && <div>Controls: {errors.controls}</div>}
                            {errors.costs && <div>Costs: {errors.costs}</div>}
                            {errors.alerts && <div>Alerts: {errors.alerts}</div>}
                            <div className="mt-2 text-xs">
                                If this is a first-time setup, ensure tables provider_costs_daily,
                                cost_controls and cost_alerts exist. You can still adjust settings
                                below.
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        <div className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-6">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-semibold">30-Day Spend</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Daily spend for Solar Pro2 and Image API
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={exportCSV}
                                        className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                    >
                                        Export CSV
                                    </button>
                                    <Link
                                        href={`/${lang}/admin/logs?scope=costs&since=30d`}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        Drill into logs
                                    </Link>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="h-72 w-full">
                                <ChartContainer
                                    config={{
                                        solar: {
                                            label: 'Solar Pro2',
                                            color: 'hsl(var(--chart-1))',
                                        },
                                        image: { label: 'Image API', color: 'hsl(var(--chart-2))' },
                                    }}
                                >
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={chartData}
                                            margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="stroke-muted"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(d) => fmtDate(d, locale)}
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                            />
                                            <YAxis
                                                tickFormatter={(v) =>
                                                    currency(v as number, locale).replace(
                                                        /\$.*/,
                                                        ''
                                                    )
                                                }
                                                stroke="hsl(var(--muted-foreground))"
                                                fontSize={12}
                                                width={70}
                                            />
                                            <ChartTooltip
                                                content={<ChartTooltipContent hideLabel />}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="solar"
                                                stroke="var(--color-solar)"
                                                strokeWidth={2}
                                                dot={false}
                                                name="Solar Pro2"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="image"
                                                stroke="var(--color-image)"
                                                strokeWidth={2}
                                                dot={false}
                                                name="Image API"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <KPI label="MTD Total" value={currency(kpis.totalSpend, locale)} />
                                <KPI
                                    label="Solar Spend"
                                    value={currency(kpis.solarSpend, locale)}
                                    sub={`${kpis.solarCalls.toLocaleString()} calls`}
                                />
                                <KPI
                                    label="Image Spend"
                                    value={currency(kpis.imageSpend, locale)}
                                    sub={`${kpis.imageCalls.toLocaleString()} calls`}
                                />
                                <KPI
                                    label="Avg Daily Spend"
                                    value={currency(
                                        chartData.reduce((a, c) => a + c.solar + c.image, 0) /
                                            Math.max(1, chartData.length),
                                        locale
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-4">
                        <div className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-6">
                            <h2 className="text-base font-semibold">Caps & Alerts</h2>
                            <p className="text-muted-foreground text-sm">
                                Set daily spend limits and alert thresholds.
                            </p>
                            <Separator className="my-4" />

                            {/* Solar cap */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Solar Pro2 daily cap
                                    </label>
                                    <div className="text-sm tabular-nums">
                                        {currency(
                                            Number(controls?.daily_cap_usd_solar || 0),
                                            locale
                                        )}
                                    </div>
                                </div>
                                <Slider
                                    value={[Number(controls?.daily_cap_usd_solar || 0)]}
                                    onValueChange={(v) =>
                                        setControls((c) => ({
                                            ...(c || {}),
                                            daily_cap_usd_solar: clamp(v?.[0] ?? 0, 0, 1000),
                                        }))
                                    }
                                    max={1000}
                                    step={5}
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={100000}
                                    step={1}
                                    value={Number(controls?.daily_cap_usd_solar || 0)}
                                    onChange={(e) =>
                                        setControls((c) => ({
                                            ...(c || {}),
                                            daily_cap_usd_solar: clamp(
                                                Number(e.target.value || 0),
                                                0,
                                                100000
                                            ),
                                        }))
                                    }
                                    className="border-input bg-background focus:ring-ring mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                                />
                            </div>

                            <Separator className="my-4" />

                            {/* Image cap */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Image API daily cap
                                    </label>
                                    <div className="text-sm tabular-nums">
                                        {currency(
                                            Number(controls?.daily_cap_usd_image || 0),
                                            locale
                                        )}
                                    </div>
                                </div>
                                <Slider
                                    value={[Number(controls?.daily_cap_usd_image || 0)]}
                                    onValueChange={(v) =>
                                        setControls((c) => ({
                                            ...(c || {}),
                                            daily_cap_usd_image: clamp(v?.[0] ?? 0, 0, 1000),
                                        }))
                                    }
                                    max={1000}
                                    step={5}
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={100000}
                                    step={1}
                                    value={Number(controls?.daily_cap_usd_image || 0)}
                                    onChange={(e) =>
                                        setControls((c) => ({
                                            ...(c || {}),
                                            daily_cap_usd_image: clamp(
                                                Number(e.target.value || 0),
                                                0,
                                                100000
                                            ),
                                        }))
                                    }
                                    className="border-input bg-background focus:ring-ring mt-2 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                                />
                            </div>

                            <Separator className="my-4" />

                            {/* Warning threshold */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Soft warning at</label>
                                    <div className="text-sm tabular-nums">
                                        {Number(controls?.soft_warning_percent || 0)}%
                                    </div>
                                </div>
                                <Slider
                                    value={[Number(controls?.soft_warning_percent || 0)]}
                                    onValueChange={(v) =>
                                        setControls((c) => ({
                                            ...(c || {}),
                                            soft_warning_percent: clamp(v?.[0] ?? 0, 0, 100),
                                        }))
                                    }
                                    max={100}
                                    step={1}
                                />
                            </div>

                            <Separator className="my-4" />

                            {/* Hard stop toggle */}
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm font-medium">Auto-pause at cap</div>
                                    <div className="text-muted-foreground text-xs">
                                        When enabled, design generation halts when the cap is
                                        reached.
                                    </div>
                                </div>
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={!!controls?.hard_stop_enabled}
                                        onChange={(e) =>
                                            setControls((c) => ({
                                                ...(c || {}),
                                                hard_stop_enabled: e.target.checked,
                                            }))
                                        }
                                    />
                                    <div className="peer bg-muted after:bg-background peer-checked:bg-primary h-5 w-9 rounded-full after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-4" />
                                </label>
                            </div>

                            <Separator className="my-4" />

                            {/* Alert email */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" htmlFor="alert-email">
                                    Alert email
                                </label>
                                <input
                                    id="alert-email"
                                    type="email"
                                    placeholder="alerts@your-company.com"
                                    value={controls?.alert_email || ''}
                                    onChange={(e) =>
                                        setControls((c) => ({
                                            ...(c || {}),
                                            alert_email: e.target.value,
                                        }))
                                    }
                                    className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                                />
                                <p className="text-muted-foreground text-xs">
                                    We will notify this email when soft/hard thresholds are crossed.
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-2">
                                <Link
                                    href={`/${lang}/admin/retries`}
                                    className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm"
                                >
                                    View Retries
                                </Link>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        <div className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold">Recent Cost Alerts</h2>
                                <Link
                                    href={`/${lang}/admin/logs?scope=alerts&since=7d`}
                                    className="text-primary text-sm hover:underline"
                                >
                                    Open in Logs
                                </Link>
                            </div>
                            <Separator className="my-4" />
                            {loading ? (
                                <div className="space-y-2">
                                    <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
                                    <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
                                    <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="text-muted-foreground text-sm">
                                    No alerts in the past 7 days.
                                </div>
                            ) : (
                                <div className="border-border overflow-hidden rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[110px]">When</TableHead>
                                                <TableHead>Message</TableHead>
                                                <TableHead className="w-[90px]">Severity</TableHead>
                                                <TableHead className="w-[90px] text-right">
                                                    Action
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {alerts.map((a) => (
                                                <TableRow key={a.id} className="hover:bg-muted/40">
                                                    <TableCell className="text-muted-foreground align-top text-xs">
                                                        {new Date(a.created_at).toLocaleString(
                                                            locale
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="align-top text-sm">
                                                        {a.message}
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <span
                                                            className={
                                                                'inline-flex rounded-full px-2 py-0.5 text-xs ' +
                                                                (a.severity === 'critical'
                                                                    ? 'bg-destructive/10 text-destructive'
                                                                    : a.severity === 'warning'
                                                                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                      : 'bg-secondary text-secondary-foreground')
                                                            }
                                                        >
                                                            {a.severity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right align-top">
                                                        <Link
                                                            href={`/${lang}/admin/logs?scope=alerts&id=${a.id}`}
                                                            className="text-primary text-xs hover:underline"
                                                        >
                                                            Details
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold">Operational Links</h2>
                            <p className="text-muted-foreground text-sm">
                                Quick access to admin tools for investigation and reporting.
                            </p>
                        </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <LinkCard
                            href={`/${lang}/admin/logs?provider=solar`}
                            title="Solar Pro2 Logs"
                            subtitle="Latency, retries, prompt usage"
                        />
                        <LinkCard
                            href={`/${lang}/admin/logs?provider=image`}
                            title="Image API Logs"
                            subtitle="Generation costs, quality checks"
                        />
                        <LinkCard
                            href={`/${lang}/admin/analytics`}
                            title="Analytics Dashboard"
                            subtitle="Conversion, AOV, fulfillment times"
                        />
                        <LinkCard
                            href={`/${lang}/admin/orders`}
                            title="Orders Queue"
                            subtitle="Statuses, exceptions, actions"
                        />
                        <LinkCard
                            href={`/${lang}/admin/products-mapping`}
                            title="Products Mapping"
                            subtitle="Templates, SKUs, variants"
                        />
                        <LinkCard
                            href={`/${lang}/admin/retries`}
                            title="Manual Retries"
                            subtitle="Re-run failed jobs safely"
                        />
                    </div>
                </section>

                <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                        Need help? Visit{' '}
                        <Link href={`/${lang}//help`} className="text-primary hover:underline">
                            Help
                        </Link>{' '}
                        or{' '}
                        <Link href={`/${lang}//contact`} className="text-primary hover:underline">
                            Contact
                        </Link>
                        .
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/${lang}//legal/terms`} className="hover:underline">
                            Terms
                        </Link>
                        <Link href={`/${lang}//legal/privacy`} className="hover:underline">
                            Privacy
                        </Link>
                        <Link href={`/${lang}//legal/ip-policy`} className="hover:underline">
                            IP Policy
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}

function KPI({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="border-border bg-background rounded-lg border p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
            {sub ? <div className="text-muted-foreground text-xs">{sub}</div> : null}
        </div>
    )
}

function LinkCard({ href, title, subtitle }: { href: string; title: string; subtitle?: string }) {
    return (
        <Link
            href={href}
            className="group border-border bg-background hover:bg-accent block rounded-lg border p-4 transition-colors"
        >
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{title}</div>
                <span className="text-muted-foreground group-hover:text-foreground text-xs">→</span>
            </div>
            {subtitle && <div className="text-muted-foreground mt-1 text-xs">{subtitle}</div>}
        </Link>
    )
}

function clamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max)
}
