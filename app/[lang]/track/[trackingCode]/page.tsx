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
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

type ShipmentEvent = {
    status?: string | null
    description?: string | null
    location?: string | null
    timestamp?: string | null
}

type Shipment = {
    id: string
    order_id: string | null
    tracking_code: string
    carrier_code?: string | null
    carrier_name?: string | null
    carrier_tracking_url?: string | null
    latest_status?: string | null
    latest_status_at?: string | null
    events?: ShipmentEvent[] | null
    origin_country?: string | null
    destination_country?: string | null
    updated_at?: string | null
}

function statusColorVariant(status?: string | null) {
    const s = (status || '').toLowerCase()
    if (/(delivered|completed|arrival at pickup)/.test(s)) return 'bg-green-500 text-white'
    if (/(out for delivery|on the way|in transit|departed)/.test(s)) return 'bg-blue-600 text-white'
    if (/(exception|failed|return|issue|canceled|cancelled)/.test(s))
        return 'bg-destructive text-destructive-foreground'
    if (/(info received|label created|pending|processing|created)/.test(s))
        return 'bg-muted text-muted-foreground'
    return 'bg-secondary text-secondary-foreground'
}

function formatDate(input?: string | null, lang?: string) {
    if (!input) return '—'
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return input
    try {
        return new Intl.DateTimeFormat(lang || undefined, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d)
    } catch {
        return d.toLocaleString()
    }
}

function carrierCandidates(trackingCode: string) {
    const code = encodeURIComponent(trackingCode)
    return [
        {
            name: 'Korea Post',
            url: `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${code}`,
        },
        {
            name: 'CJ Logistics',
            url: `https://www.cjlogistics.com/en/tool/parcel/tracking?gnbInvcNo=${code}`,
        },
        {
            name: 'Lotte Global Logistics',
            url: `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${code}`,
        },
        {
            name: 'Hanjin',
            url: `https://www.hanjin.co.kr/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&billno=${code}`,
        },
        {
            name: 'DHL',
            url: `https://www.dhl.com/global-en/home/tracking/tracking-express.html?tracking-id=${code}`,
        },
        { name: 'FedEx', url: `https://www.fedex.com/fedextrack/?trknbr=${code}` },
        { name: 'UPS', url: `https://www.ups.com/track?loc=en_US&tracknum=${code}` },
        { name: 'USPS', url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${code}` },
    ]
}

export default function Page({
    params,
}: {
    params: Promise<{ lang: string; trackingCode: string }>
}) {
    const { lang, trackingCode } = React.use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [shipment, setShipment] = useState<Shipment | null>(null)
    const [copied, setCopied] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [manualCode, setManualCode] = useState(trackingCode || '')

    const candidates = useMemo(() => carrierCandidates(trackingCode), [trackingCode])

    useEffect(() => {
        let mounted = true

        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const sb = supabaseBrowser
                const { data, error: err } = await sb
                    .from('shipments')
                    .select('*')
                    .eq('tracking_code', trackingCode)
                    .limit(1)
                    .maybeSingle()

                if (err) {
                    throw err
                } else if (data) {
                    if (mounted) setShipment(data as unknown as Shipment)
                } else {
                    if (mounted) setShipment(null)
                }
            } catch (e: any) {
                setError(e?.message || 'Unable to load tracking information.')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchData()

        return () => {
            mounted = false
        }
    }, [trackingCode])

    const primaryCarrierUrl = useMemo(() => {
        return shipment?.carrier_tracking_url || candidates[0]?.url || ''
    }, [shipment, candidates])

    const statusVariant = statusColorVariant(shipment?.latest_status || undefined)

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(trackingCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            // ignore
        }
    }

    const onRefresh = async () => {
        setRefreshing(true)
        try {
            // simple client-side route refresh
            router.refresh?.()
        } finally {
            setTimeout(() => setRefreshing(false), 350)
        }
    }

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualCode || manualCode.trim().length < 4) return
        router.push(`/${lang}/track/${encodeURIComponent(manualCode.trim())}`)
    }

    return (
        <div className="bg-background text-foreground min-h-screen">
            {/* Top bar */}
            <header className="border-border bg-background/80 sticky top-0 z-30 w-full border-b backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <Link
                        href={`/${lang}`}
                        className="font-semibold tracking-tight hover:opacity-80"
                    >
                        RealizeIt
                    </Link>
                    <nav className="hidden gap-6 text-sm md:flex">
                        {/* <ThemeToggle className="size-5" /> */}
                        <Link
                            href={`/${lang}/products`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Products
                        </Link>
                        <Link
                            href={`/${lang}/design`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Design
                        </Link>
                        <Link
                            href={`/${lang}/orders`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Orders
                        </Link>
                        <Link
                            href={`/${lang}/help`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Help
                        </Link>
                        <Link
                            href={`/${lang}/account`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Account
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Track shipment</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRefresh}
                            className={cn(
                                'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                                refreshing && 'opacity-70'
                            )}
                            disabled={refreshing}
                            aria-label="Refresh tracking"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0114.13-3.36L23 10"></path>
                                <path d="M20.49 15A9 9 0 016.36 18.36L1 14"></path>
                            </svg>
                            Refresh
                        </button>
                        <Link
                            href={`/${lang}/help`}
                            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:opacity-90"
                        >
                            Need help?
                        </Link>
                    </div>
                </div>

                {/* Search another code */}
                <form onSubmit={onSearchSubmit} className="mb-6 flex items-center gap-2">
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Enter another tracking code"
                        className="border-input bg-background focus:border-ring focus:ring-ring flex-1 rounded-md border px-3 py-2 text-sm ring-0 outline-none focus:ring-1"
                        aria-label="Tracking code"
                    />
                    <button
                        type="submit"
                        className="bg-accent text-accent-foreground rounded-md px-3 py-2 text-sm transition hover:opacity-90"
                    >
                        Track
                    </button>
                </form>

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-40 w-full rounded-xl" />
                    </div>
                ) : error ? (
                    <Alert className="bg-destructive/10 text-destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error} Please try again later or visit our{' '}
                            <Link href={`/${lang}/help`} className="underline">
                                Help Center
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                ) : !shipment ? (
                    <Alert className="bg-muted">
                        <AlertTitle>Tracking not found</AlertTitle>
                        <AlertDescription>
                            We couldn’t find any shipment with code{' '}
                            <span className="font-mono">{trackingCode}</span>. If you just paid, it
                            can take a few minutes to generate tracking. Check your{' '}
                            <Link href={`/${lang}/orders`} className="underline">
                                orders
                            </Link>{' '}
                            or visit{' '}
                            <Link href={`/${lang}/help`} className="underline">
                                help
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-6">
                        {/* Summary card */}
                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-muted-foreground text-sm">
                                            Tracking code
                                        </span>
                                        <code className="bg-muted text-muted-foreground rounded px-2 py-1 font-mono text-xs">
                                            {shipment.tracking_code}
                                        </code>
                                        <button
                                            onClick={onCopy}
                                            title="Copy tracking code"
                                            className="border-border bg-background hover:bg-muted rounded-md border px-2 py-1 text-xs"
                                        >
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-3xl font-semibold">
                                            {shipment.latest_status
                                                ? shipment.latest_status
                                                : 'Status unavailable'}
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded-full px-2 py-1 text-xs',
                                                statusVariant
                                            )}
                                        >
                                            {shipment.latest_status ? 'Live' : 'Unknown'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        Updated{' '}
                                        {formatDate(
                                            shipment.latest_status_at || shipment.updated_at,
                                            lang
                                        )}
                                    </p>
                                </div>
                                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                                    <a
                                        href={primaryCarrierUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition hover:opacity-90"
                                    >
                                        Open carrier site
                                    </a>
                                    {shipment.order_id && (
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/${lang}/orders/${shipment.order_id}`}
                                                className="border-border bg-background hover:bg-muted inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm"
                                            >
                                                View order
                                            </Link>
                                            <Link
                                                href={`/${lang}/account/orders/${shipment.order_id}`}
                                                className="border-border bg-background hover:bg-muted inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm"
                                            >
                                                In my account
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="border-border bg-background rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs uppercase">
                                        Carrier
                                    </div>
                                    <div className="mt-1 text-sm font-medium">
                                        {shipment.carrier_name || shipment.carrier_code || '—'}
                                    </div>
                                </div>
                                <div className="border-border bg-background rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs uppercase">
                                        Destination
                                    </div>
                                    <div className="mt-1 text-sm font-medium">
                                        {shipment.destination_country || '—'}
                                    </div>
                                </div>
                                <div className="border-border bg-background rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs uppercase">
                                        Origin
                                    </div>
                                    <div className="mt-1 text-sm font-medium">
                                        {shipment.origin_country || '—'}
                                    </div>
                                </div>
                                <div className="border-border bg-background rounded-lg border p-4">
                                    <div className="text-muted-foreground text-xs uppercase">
                                        Last updated
                                    </div>
                                    <div className="mt-1 text-sm font-medium">
                                        {formatDate(
                                            shipment.updated_at || shipment.latest_status_at,
                                            lang
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Events timeline */}
                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Tracking history</h2>
                                <span className="text-muted-foreground text-xs">Newest first</span>
                            </div>
                            {shipment.events && shipment.events.length > 0 ? (
                                <div className="border-border overflow-hidden rounded-lg border">
                                    <Table className="w-full">
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[40%]">Status</TableHead>
                                                <TableHead className="w-[35%]">Location</TableHead>
                                                <TableHead className="w-[25%]">Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...shipment.events]
                                                .sort((a, b) => {
                                                    const ta = a.timestamp
                                                        ? new Date(a.timestamp).getTime()
                                                        : 0
                                                    const tb = b.timestamp
                                                        ? new Date(b.timestamp).getTime()
                                                        : 0
                                                    return tb - ta
                                                })
                                                .map((evt, idx) => (
                                                    <TableRow
                                                        key={`${evt.timestamp || idx}-${idx}`}
                                                        className="hover:bg-muted/30"
                                                    >
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                <div className="text-sm font-medium">
                                                                    {evt.status ||
                                                                        evt.description ||
                                                                        'Update'}
                                                                </div>
                                                                {evt.description &&
                                                                    evt.description !==
                                                                        evt.status && (
                                                                        <div className="text-muted-foreground text-sm">
                                                                            {evt.description}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {evt.location || '—'}
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {formatDate(evt.timestamp, lang)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <Alert className="bg-muted">
                                    <AlertTitle>No detailed events yet</AlertTitle>
                                    <AlertDescription>
                                        Your label may be created and awaiting carrier pickup. Check
                                        back soon or open the carrier site for more details.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </section>

                        {/* Other carriers */}
                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <h2 className="mb-3 text-lg font-semibold">Try other carriers</h2>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {candidates.map((c) => (
                                    <a
                                        key={c.name}
                                        href={c.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-border bg-background hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                    >
                                        <span>{c.name}</span>
                                        <svg
                                            className="text-muted-foreground h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M7 17L17 7" />
                                            <path d="M7 7h10v10" />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                            <p className="text-muted-foreground mt-3 text-xs">
                                For help with delays or incorrect tracking, see our{' '}
                                <Link href={`/${lang}/help`} className="underline">
                                    Help Center
                                </Link>{' '}
                                or contact{' '}
                                <Link href={`/${lang}/contact`} className="underline">
                                    Support
                                </Link>
                                .
                            </p>
                        </section>

                        {/* Next steps */}
                        <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                            <h2 className="mb-3 text-lg font-semibold">Explore more</h2>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={`/${lang}/products`}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    Browse products
                                </Link>
                                <Link
                                    href={`/${lang}/design`}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    Create a new design
                                </Link>
                                <Link
                                    href={`/${lang}/orders`}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    Your orders
                                </Link>
                                <Link
                                    href={`/${lang}/account/orders`}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    Orders in account
                                </Link>
                                <Link
                                    href={`/${lang}/(marketing)/legal/terms`.replace(
                                        '/(marketing)',
                                        ''
                                    )}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    Terms
                                </Link>
                                <Link
                                    href={`/${lang}/(marketing)/legal/privacy`.replace(
                                        '/(marketing)',
                                        ''
                                    )}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href={`/${lang}/(marketing)/about`.replace('/(marketing)', '')}
                                    className="border-border bg-background hover:bg-muted rounded-md border px-3 py-2 text-sm"
                                >
                                    About
                                </Link>
                            </div>
                        </section>
                    </div>
                )}
            </main>

            <footer className="text-muted-foreground mx-auto w-full max-w-5xl px-4 py-10 text-sm">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div>© {new Date().getFullYear()} RealizeIt</div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href={`/${lang}`} className="hover:text-foreground">
                            Home
                        </Link>
                        <Link href={`/${lang}/help`} className="hover:text-foreground">
                            Help
                        </Link>
                        <Link href={`/${lang}/contact`} className="hover:text-foreground">
                            Contact
                        </Link>
                        <Link href={`/${lang}/products`} className="hover:text-foreground">
                            Products
                        </Link>
                        <Link href={`/${lang}/admin`} className="hover:text-foreground">
                            Admin
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
