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
import { supabaseServer } from '@/utils/supabase/client-server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'not_configured'

type HealthStatus = {
    key: string
    label: string
    status: ServiceStatus
    latencyMs?: number
    checkedAt: string
    details?: string
    docsUrl?: string
    retryLink?: string
}

const timeoutFetch = async (url: string, init: RequestInit = {}, timeoutMs = 8000) => {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
        return res
    } finally {
        clearTimeout(id)
    }
}

const msNow = () => Date.now()
const fmtIso = (d: number) => new Date(d).toISOString()

const assessLatency = (ms?: number): ServiceStatus => {
    if (ms === undefined) return 'degraded'
    if (ms < 1500) return 'operational'
    if (ms < 4000) return 'degraded'
    return 'down'
}

async function checkStripe(): Promise<HealthStatus> {
    const key = process.env.STRIPE_SECRET_KEY
    const start = msNow()
    if (!key) {
        return {
            key: 'stripe',
            label: 'Stripe',
            status: 'not_configured',
            checkedAt: fmtIso(start),
            details: 'Missing STRIPE_SECRET_KEY',
            docsUrl: 'https://stripe.com/docs/keys',
        }
    }
    try {
        const res = await timeoutFetch(
            'https://api.stripe.com/v1/charges?limit=1',
            {
                headers: { Authorization: `Bearer ${key}` },
            },
            8000
        )
        const latency = msNow() - start
        if (res.ok) {
            return {
                key: 'stripe',
                label: 'Stripe',
                status: assessLatency(latency),
                latencyMs: latency,
                checkedAt: fmtIso(msNow()),
                details: 'List charges successful',
                docsUrl: 'https://status.stripe.com/',
            }
        }
        const text = await res.text().catch(() => '')
        return {
            key: 'stripe',
            label: 'Stripe',
            status: res.status >= 500 ? 'down' : 'degraded',
            latencyMs: latency,
            checkedAt: fmtIso(msNow()),
            details: `HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
            docsUrl: 'https://status.stripe.com/',
        }
    } catch (e: any) {
        return {
            key: 'stripe',
            label: 'Stripe',
            status: 'down',
            checkedAt: fmtIso(msNow()),
            details: e?.message || 'Network/timeout error',
            docsUrl: 'https://status.stripe.com/',
        }
    }
}

async function checkPrintify(): Promise<HealthStatus> {
    const key = process.env.PRINTIFY_API_KEY
    const start = msNow()
    if (!key) {
        return {
            key: 'printify',
            label: 'Printify',
            status: 'not_configured',
            checkedAt: fmtIso(start),
            details: 'Missing PRINTIFY_API_KEY',
            docsUrl: 'https://developers.printify.com/',
        }
    }
    try {
        const res = await timeoutFetch(
            'https://api.printify.com/v1/shops.json',
            {
                headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            },
            8000
        )
        const latency = msNow() - start
        if (res.ok) {
            const json = (await res.json().catch(() => [])) as any[]
            return {
                key: 'printify',
                label: 'Printify',
                status: assessLatency(latency),
                latencyMs: latency,
                checkedAt: fmtIso(msNow()),
                details: `Shops accessible (${Array.isArray(json) ? json.length : 0})`,
                docsUrl: 'https://status.printify.com/',
            }
        }
        const text = await res.text().catch(() => '')
        return {
            key: 'printify',
            label: 'Printify',
            status: res.status >= 500 ? 'down' : 'degraded',
            latencyMs: latency,
            checkedAt: fmtIso(msNow()),
            details: `HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
            docsUrl: 'https://status.printify.com/',
        }
    } catch (e: any) {
        return {
            key: 'printify',
            label: 'Printify',
            status: 'down',
            checkedAt: fmtIso(msNow()),
            details: e?.message || 'Network/timeout error',
            docsUrl: 'https://status.printify.com/',
        }
    }
}

async function checkSupabase(): Promise<HealthStatus> {
    const start = msNow()
    try {
        const sb = await supabaseServer()
        const { error } = await sb.auth.getSession()
        const latency = msNow() - start
        if (!error) {
            return {
                key: 'supabase',
                label: 'Supabase',
                status: assessLatency(latency),
                latencyMs: latency,
                checkedAt: fmtIso(msNow()),
                details: 'Auth service reachable',
                docsUrl: 'https://status.supabase.com/',
            }
        }
        return {
            key: 'supabase',
            label: 'Supabase',
            status: 'degraded',
            latencyMs: latency,
            checkedAt: fmtIso(msNow()),
            details: error.message,
            docsUrl: 'https://status.supabase.com/',
        }
    } catch (e: any) {
        return {
            key: 'supabase',
            label: 'Supabase',
            status: 'down',
            checkedAt: fmtIso(msNow()),
            details: e?.message || 'Network/timeout error',
            docsUrl: 'https://status.supabase.com/',
        }
    }
}

async function checkStability(): Promise<HealthStatus> {
    const key = process.env.STABILITY_API_KEY
    const start = msNow()
    if (!key) {
        return {
            key: 'stability',
            label: 'Stability.ai',
            status: 'not_configured',
            checkedAt: fmtIso(start),
            details: 'Missing STABILITY_API_KEY',
            docsUrl: 'https://platform.stability.ai/',
        }
    }
    try {
        const res = await timeoutFetch(
            'https://api.stability.ai/v1/user/balance',
            {
                headers: { Authorization: `Bearer ${key}` },
            },
            8000
        )
        const latency = msNow() - start
        if (res.ok) {
            return {
                key: 'stability',
                label: 'Stability.ai',
                status: assessLatency(latency),
                latencyMs: latency,
                checkedAt: fmtIso(msNow()),
                details: 'Balance endpoint reachable',
                docsUrl: 'https://status.stability.ai/',
            }
        }
        const text = await res.text().catch(() => '')
        return {
            key: 'stability',
            label: 'Stability.ai',
            status: res.status >= 500 ? 'down' : 'degraded',
            latencyMs: latency,
            checkedAt: fmtIso(msNow()),
            details: `HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
            docsUrl: 'https://status.stability.ai/',
        }
    } catch (e: any) {
        return {
            key: 'stability',
            label: 'Stability.ai',
            status: 'down',
            checkedAt: fmtIso(msNow()),
            details: e?.message || 'Network/timeout error',
            docsUrl: 'https://status.stability.ai/',
        }
    }
}

async function checkOpenAI(): Promise<HealthStatus> {
    const key = process.env.OPENAI_API_KEY
    const start = msNow()
    if (!key) {
        return {
            key: 'openai',
            label: 'OpenAI Images',
            status: 'not_configured',
            checkedAt: fmtIso(start),
            details: 'Missing OPENAI_API_KEY',
            docsUrl: 'https://platform.openai.com/',
        }
    }
    try {
        const res = await timeoutFetch(
            'https://api.openai.com/v1/models',
            {
                headers: { Authorization: `Bearer ${key}` },
            },
            8000
        )
        const latency = msNow() - start
        if (res.ok) {
            return {
                key: 'openai',
                label: 'OpenAI Images',
                status: assessLatency(latency),
                latencyMs: latency,
                checkedAt: fmtIso(msNow()),
                details: 'Models endpoint reachable',
                docsUrl: 'https://status.openai.com/',
            }
        }
        const text = await res.text().catch(() => '')
        return {
            key: 'openai',
            label: 'OpenAI Images',
            status: res.status >= 500 ? 'down' : 'degraded',
            latencyMs: latency,
            checkedAt: fmtIso(msNow()),
            details: `HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
            docsUrl: 'https://status.openai.com/',
        }
    } catch (e: any) {
        return {
            key: 'openai',
            label: 'OpenAI Images',
            status: 'down',
            checkedAt: fmtIso(msNow()),
            details: e?.message || 'Network/timeout error',
            docsUrl: 'https://status.openai.com/',
        }
    }
}

async function checkReplicate(): Promise<HealthStatus> {
    const key = process.env.REPLICATE_API_TOKEN
    const start = msNow()
    if (!key) {
        return {
            key: 'replicate',
            label: 'Replicate',
            status: 'not_configured',
            checkedAt: fmtIso(start),
            details: 'Missing REPLICATE_API_TOKEN',
            docsUrl: 'https://replicate.com/',
        }
    }
    try {
        const res = await timeoutFetch(
            'https://api.replicate.com/v1/models?limit=1',
            {
                headers: { Authorization: `Token ${key}` },
            },
            8000
        )
        const latency = msNow() - start
        if (res.ok) {
            return {
                key: 'replicate',
                label: 'Replicate',
                status: assessLatency(latency),
                latencyMs: latency,
                checkedAt: fmtIso(msNow()),
                details: 'Models endpoint reachable',
                docsUrl: 'https://status.replicate.com/',
            }
        }
        const text = await res.text().catch(() => '')
        return {
            key: 'replicate',
            label: 'Replicate',
            status: res.status >= 500 ? 'down' : 'degraded',
            latencyMs: latency,
            checkedAt: fmtIso(msNow()),
            details: `HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`,
            docsUrl: 'https://status.replicate.com/',
        }
    } catch (e: any) {
        return {
            key: 'replicate',
            label: 'Replicate',
            status: 'down',
            checkedAt: fmtIso(msNow()),
            details: e?.message || 'Network/timeout error',
            docsUrl: 'https://status.replicate.com/',
        }
    }
}

function statusColor(s: ServiceStatus) {
    switch (s) {
        case 'operational':
            return 'bg-green-500/15 text-green-700 dark:text-green-300 ring-1 ring-green-500/30'
        case 'degraded':
            return 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-200 ring-1 ring-yellow-500/30'
        case 'down':
            return 'bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/30'
        default:
            return 'bg-muted text-muted-foreground ring-1 ring-border'
    }
}

function Dot({ className = '' }: { className?: string }) {
    return <span className={`inline-block size-2 rounded-full ${className}`} />
}

function Pill({ status, children }: { status: ServiceStatus; children: React.ReactNode }) {
    const colors = statusColor(status)
    const dotColor =
        status === 'operational'
            ? 'bg-green-500'
            : status === 'degraded'
              ? 'bg-yellow-500'
              : status === 'down'
                ? 'bg-red-500'
                : 'bg-muted-foreground'
    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ${colors}`}
        >
            <Dot className={dotColor} />
            {children}
        </span>
    )
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="border-border bg-card text-card-foreground rounded-lg border shadow-sm">
            {children}
        </div>
    )
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between p-4">
            <h2 className="text-base font-semibold">{title}</h2>
            {action}
        </div>
    )
}

function CardBody({ children }: { children: React.ReactNode }) {
    return <div className="p-4 pt-0">{children}</div>
}

export default async function Page({ params }: { params: { lang: string } }) {
    const { lang } = params
    const [stripe, printify, supabase, stability, openai, replicate] = await Promise.all([
        checkStripe(),
        checkPrintify(),
        checkSupabase(),
        checkStability(),
        checkOpenAI(),
        checkReplicate(),
    ])

    const imageProviders = [stability, openai, replicate]
    const coreServices = [printify, stripe, supabase]

    const failing = [...coreServices, ...imageProviders].filter((s) => s.status === 'down')
    const degraded = [...coreServices, ...imageProviders].filter((s) => s.status === 'degraded')

    const overall: ServiceStatus =
        failing.length > 0 ? 'down' : degraded.length > 0 ? 'degraded' : 'operational'

    const now = new Date().toLocaleString()

    const link = (p: string) => `/${lang}${p}`

    return (
        <div className="min-h-[calc(100vh-4rem)] w-full">
            <div className="border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
                <div className="mx-auto max-w-6xl px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="bg-primary text-primary-foreground inline-flex size-8 items-center justify-center rounded-md font-bold">
                                R
                            </span>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-lg font-semibold tracking-tight">
                                        Admin Health
                                    </h1>
                                    <Pill status={overall}>
                                        {overall === 'operational'
                                            ? 'All systems operational'
                                            : overall === 'degraded'
                                              ? 'Degraded performance'
                                              : 'Incidents detected'}
                                    </Pill>
                                </div>
                                <p className="text-muted-foreground text-xs">Last checked {now}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href={link('/admin/health?ts=' + Date.now())}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
                            >
                                Re-run checks
                            </Link>
                            <Link
                                href={link('/admin')}
                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
                            >
                                Admin Home
                            </Link>
                        </div>
                    </div>
                    <div className="text-muted-foreground mt-3 flex flex-wrap gap-2 text-xs">
                        <Link
                            href={link('/admin/orders')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Orders queue
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/admin/retries')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Retries
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/admin/logs')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Logs
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/admin/analytics')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Analytics
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/admin/products-mapping')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Products Mapping
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/products')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Browse Products
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/design')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Start a Design
                        </Link>
                        <span>•</span>
                        <Link
                            href={link('/account/settings')}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Account Settings
                        </Link>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
                {(failing.length > 0 || degraded.length > 0) && (
                    <Alert className="border-destructive/40 bg-destructive/10">
                        <AlertTitle className="flex items-center gap-2">
                            <span className="text-destructive">Attention required</span>
                        </AlertTitle>
                        <AlertDescription>
                            <div className="mt-1 text-sm">
                                {failing.length > 0 && (
                                    <div className="mb-2">
                                        <span className="font-medium">Down:</span>{' '}
                                        {failing.map((s) => s.label).join(', ')}
                                    </div>
                                )}
                                {degraded.length > 0 && (
                                    <div className="mb-2">
                                        <span className="font-medium">Degraded:</span>{' '}
                                        {degraded.map((s) => s.label).join(', ')}
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Link
                                        href={link(`/admin/retries?from=health`)}
                                        className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium hover:opacity-90"
                                    >
                                        Open Retries
                                    </Link>
                                    <Link
                                        href={link(`/admin/logs?from=health`)}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                    >
                                        View Logs
                                    </Link>
                                    <Link
                                        href={link(`/admin/orders?status=pending`)}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                    >
                                        Review Pending Orders
                                    </Link>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card>
                        <CardHeader title="Core Services" />
                        <CardBody>
                            <div className="space-y-3">
                                {coreServices.map((s) => (
                                    <div
                                        key={s.key}
                                        className="border-border/60 bg-card flex items-start justify-between rounded-md border p-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium">{s.label}</div>
                                                <Pill status={s.status}>{s.status}</Pill>
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-xs break-words">
                                                {s.details || ''}
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-[10px]">
                                                Checked {new Date(s.checkedAt).toLocaleString()}
                                            </div>
                                            {s.docsUrl && (
                                                <div className="mt-2 text-xs">
                                                    <a
                                                        href={s.docsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-foreground underline underline-offset-4 hover:opacity-80"
                                                    >
                                                        Provider status
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pl-3 text-right">
                                            <div className="font-mono text-sm tabular-nums">
                                                {s.latencyMs ? `${s.latencyMs} ms` : '—'}
                                            </div>
                                            {(s.status === 'down' || s.status === 'degraded') && (
                                                <Link
                                                    href={link(`/admin/retries?service=${s.key}`)}
                                                    className="bg-primary text-primary-foreground mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-90"
                                                >
                                                    Retries
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Image Providers" />
                        <CardBody>
                            <div className="space-y-3">
                                {imageProviders.map((s) => (
                                    <div
                                        key={s.key}
                                        className="border-border/60 bg-card flex items-start justify-between rounded-md border p-3"
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium">{s.label}</div>
                                                <Pill status={s.status}>{s.status}</Pill>
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-xs break-words">
                                                {s.details || ''}
                                            </div>
                                            <div className="text-muted-foreground mt-1 text-[10px]">
                                                Checked {new Date(s.checkedAt).toLocaleString()}
                                            </div>
                                            {s.docsUrl && (
                                                <div className="mt-2 text-xs">
                                                    <a
                                                        href={s.docsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-foreground underline underline-offset-4 hover:opacity-80"
                                                    >
                                                        Provider status
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="pl-3 text-right">
                                            <div className="font-mono text-sm tabular-nums">
                                                {s.latencyMs ? `${s.latencyMs} ms` : '—'}
                                            </div>
                                            {(s.status === 'down' || s.status === 'degraded') && (
                                                <Link
                                                    href={link(`/admin/retries?service=${s.key}`)}
                                                    className="bg-primary text-primary-foreground mt-2 inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-90"
                                                >
                                                    Retries
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader title="Actions" />
                        <CardBody>
                            <div className="space-y-3">
                                <Link
                                    href={link('/admin/retries')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">Open Retries</span>
                                    <span className="text-muted-foreground text-xs">
                                        Resolve failed tasks
                                    </span>
                                </Link>
                                <Link
                                    href={link('/admin/logs')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">View Logs</span>
                                    <span className="text-muted-foreground text-xs">
                                        Errors & traces
                                    </span>
                                </Link>
                                <Link
                                    href={link('/admin/orders')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">Orders Queue</span>
                                    <span className="text-muted-foreground text-xs">
                                        Pending & in-flight
                                    </span>
                                </Link>
                                <Link
                                    href={link('/admin/costs')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">Costs</span>
                                    <span className="text-muted-foreground text-xs">
                                        LLM & image spend
                                    </span>
                                </Link>
                                <Link
                                    href={link('/admin/analytics')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">Analytics</span>
                                    <span className="text-muted-foreground text-xs">
                                        Conversion & AOV
                                    </span>
                                </Link>
                                <Separator className="my-3" />
                                <Link
                                    href={link('/products')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">Browse Products</span>
                                    <span className="text-muted-foreground text-xs">
                                        Test shopping flow
                                    </span>
                                </Link>
                                <Link
                                    href={link('/design')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <span className="text-sm font-medium">Start a Design</span>
                                    <span className="text-muted-foreground text-xs">
                                        Generate mockups
                                    </span>
                                </Link>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardHeader
                        title="Service Metrics"
                        action={
                            <Link
                                href={link('/admin/health?ts=' + Date.now())}
                                className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                            >
                                Refresh
                            </Link>
                        }
                    />
                    <CardBody>
                        <Table className="">
                            <TableCaption>Latency and status snapshots at {now}</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Latency</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...coreServices, ...imageProviders].map((s) => (
                                    <TableRow key={s.key} className="">
                                        <TableCell className="font-medium">{s.label}</TableCell>
                                        <TableCell>
                                            <Pill status={s.status}>{s.status}</Pill>
                                        </TableCell>
                                        <TableCell className="font-mono tabular-nums">
                                            {s.latencyMs ? `${s.latencyMs} ms` : '—'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-[520px] truncate text-xs">
                                            {s.details || ''}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(s.status === 'down' ||
                                                    s.status === 'degraded') && (
                                                    <Link
                                                        href={link(
                                                            `/admin/retries?service=${s.key}`
                                                        )}
                                                        className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium hover:opacity-90"
                                                    >
                                                        Retries
                                                    </Link>
                                                )}
                                                {s.docsUrl && (
                                                    <a
                                                        href={s.docsUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium"
                                                    >
                                                        Status
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardBody>
                </Card>

                <div className="text-muted-foreground text-xs">
                    Tip: If outages caused failed order submissions or asset generation, use{' '}
                    <Link
                        href={link('/admin/retries')}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Retries
                    </Link>{' '}
                    to requeue, and monitor{' '}
                    <Link
                        href={link('/admin/logs')}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Logs
                    </Link>{' '}
                    for errors.
                </div>
            </main>
        </div>
    )
}
