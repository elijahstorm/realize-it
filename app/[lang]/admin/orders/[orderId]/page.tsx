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
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'

interface Order {
    id: string
    status: string | null
    currency: string | null
    total_amount: number | null
    subtotal_amount: number | null
    tax_amount: number | null
    shipping_amount: number | null
    customer_id: string | null
    stripe_payment_intent_id: string | null
    printify_order_id: string | null
    language: string | null
    created_at: string
    updated_at: string | null
    consent_accepted_at: string | null
    design_session_id?: string | null
}

interface Profile {
    id: string
    email?: string | null
    full_name?: string | null
    is_admin?: boolean | null
    is_merchant?: boolean | null
    role?: string | null
}

interface OrderItem {
    id: string
    product_name?: string | null
    variant_name?: string | null
    quantity?: number | null
    unit_price?: number | null
    product_slug?: string | null
    printify_variant_id?: string | null
}

interface OrderEvent {
    id: string
    type?: string | null
    source?: string | null
    message?: string | null
    meta?: any | null
    created_at: string
}

interface OrderAsset {
    id: string
    type?: string | null // mockup | print | proof
    url?: string | null
    mime_type?: string | null
    created_at: string
}

function formatCurrency(amount: number | null | undefined, currency?: string | null) {
    if (amount == null) return '-'
    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount / 100)
    } catch {
        return (amount / 100).toFixed(2) + (currency ? ` ${currency}` : '')
    }
}

function formatDate(d?: string | null) {
    if (!d) return '-'
    try {
        return new Date(d).toLocaleString()
    } catch {
        return d
    }
}

function statusColor(status?: string | null) {
    const s = (status || '').toLowerCase()
    if (['paid', 'submitted', 'fulfilled', 'delivered', 'succeeded'].some((k) => s.includes(k)))
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    if (['requires_action', 'pending', 'processing', 'in_production'].some((k) => s.includes(k)))
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
    if (['canceled', 'failed', 'error'].some((k) => s.includes(k)))
        return 'bg-destructive/10 text-destructive'
    return 'bg-muted text-muted-foreground'
}

export default function AdminOrderDetailPage() {
    const params = useParams<{ lang: string; orderId: string }>()
    const router = useRouter()
    const { toast } = useToast()
    const lang = params?.lang || 'en'
    const orderId = params?.orderId || ''

    const [authChecked, setAuthChecked] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [profile, setProfile] = useState<Profile | null>(null)

    const [loading, setLoading] = useState(true)
    const [order, setOrder] = useState<Order | null>(null)
    const [items, setItems] = useState<OrderItem[]>([])
    const [events, setEvents] = useState<OrderEvent[]>([])
    const [assets, setAssets] = useState<OrderAsset[]>([])
    const [error, setError] = useState<string | null>(null)

    const sb = useMemo(() => supabaseBrowser, [])

    useEffect(() => {
        let mounted = true

        ;(async () => {
            try {
                const { data: authData, error: authError } = await sb.auth.getUser()
                if (authError || !authData?.user) {
                    setAuthChecked(true)
                    setIsAdmin(false)
                    return
                }
                const { data: profileData } = await sb
                    .from('profiles')
                    .select('id,email,full_name,is_admin,is_merchant,role')
                    .eq('id', authData.user.id)
                    .maybeSingle()

                if (mounted) {
                    setProfile(profileData as any)
                    const adminish = Boolean(
                        (profileData as any)?.is_admin ||
                            (profileData as any)?.is_merchant ||
                            ['admin', 'owner', 'merchant'].includes(
                                ((profileData as any)?.role || '').toLowerCase()
                            )
                    )
                    setIsAdmin(adminish)
                    setAuthChecked(true)
                }
            } catch (e) {
                setAuthChecked(true)
                setIsAdmin(false)
            }
        })()

        return () => {
            mounted = false
        }
    }, [sb])

    const loadData = useCallback(async () => {
        if (!orderId) return
        setLoading(true)
        setError(null)
        try {
            const [orderRes, itemsRes, eventsRes, assetsRes] = await Promise.all([
                sb
                    .from('orders')
                    .select(
                        'id,status,currency,total_amount,subtotal_amount,tax_amount,shipping_amount,customer_id,stripe_payment_intent_id,printify_order_id,language,created_at,updated_at,consent_accepted_at,design_session_id'
                    )
                    .eq('id', orderId)
                    .maybeSingle(),
                sb
                    .from('order_items')
                    .select(
                        'id,product_name,variant_name,quantity,unit_price,product_slug,printify_variant_id'
                    )
                    .eq('order_id', orderId)
                    .order('id', { ascending: true }),
                sb
                    .from('order_events')
                    .select('id,type,source,message,meta,created_at')
                    .eq('order_id', orderId)
                    .order('created_at', { ascending: false }),
                sb
                    .from('order_assets')
                    .select('id,type,url,mime_type,created_at')
                    .eq('order_id', orderId)
                    .order('created_at', { ascending: false }),
            ])

            if (orderRes.error) throw orderRes.error
            if (!orderRes.data) throw new Error('Order not found')

            setOrder(orderRes.data as any)
            setItems((itemsRes.data || []) as any)
            setEvents((eventsRes.data || []) as any)
            setAssets((assetsRes.data || []) as any)
        } catch (e: any) {
            setError(e?.message || 'Failed to load order')
        } finally {
            setLoading(false)
        }
    }, [sb, orderId])

    useEffect(() => {
        if (!authChecked) return
        if (!isAdmin) return
        loadData()
    }, [authChecked, isAdmin, loadData])

    const queueJob = useCallback(
        async (type: string, payload: Record<string, any> = {}) => {
            try {
                const { error: insertErr } = await sb.from('jobs').insert({
                    type,
                    payload: { order_id: orderId, ...payload },
                    status: 'queued',
                })
                if (insertErr) throw insertErr
                toast({ title: 'Queued', description: `${type} scheduled successfully.` })
            } catch (e: any) {
                toast({
                    title: 'Action failed',
                    description: e?.message || 'Unable to queue job',
                    variant: 'destructive' as any,
                })
            }
        },
        [sb, orderId, toast]
    )

    const retryPrintify = () => queueJob('order.printify.submit')
    const cancelPrintify = () => queueJob('order.printify.cancel')
    const resyncPrintify = () => queueJob('order.printify.sync')
    const resyncStripe = () => queueJob('order.stripe.sync')
    const rebuildMockups = () => queueJob('design.mockups.rebuild')
    const regenVariations = () => queueJob('design.variations.regenerate')
    const rerunReasoning = () => queueJob('solar.reasoning.summarize')

    const headerActions = (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={retryPrintify}
                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Submit/Retry Printify
            </button>
            <button
                onClick={cancelPrintify}
                className="bg-destructive text-destructive-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Cancel Printify
            </button>
            <button
                onClick={resyncPrintify}
                className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Resync Printify
            </button>
            <button
                onClick={resyncStripe}
                className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Resync Stripe
            </button>
            <button
                onClick={rebuildMockups}
                className="bg-accent text-accent-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Rebuild Mockups
            </button>
            <button
                onClick={regenVariations}
                className="bg-accent text-accent-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Regenerate Variations
            </button>
            <button
                onClick={rerunReasoning}
                className="bg-muted text-muted-foreground inline-flex items-center rounded-md px-3 py-2 hover:opacity-90"
            >
                Re-run Reasoning Summary
            </button>
        </div>
    )

    if (!authChecked) {
        return (
            <div className="p-6">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="mx-auto max-w-3xl p-6">
                <Alert className="border-destructive text-destructive">
                    <AlertTitle>Access restricted</AlertTitle>
                    <AlertDescription>
                        You need admin or merchant access to view this page.
                        <div className="mt-3 flex gap-3">
                            <Link href={`/${lang}/(auth)/sign-in`} className="underline">
                                Sign in
                            </Link>
                            <Link href={`/${lang}`} className="underline">
                                Go to Home
                            </Link>
                            <Link href={`/${lang}/help`} className="underline">
                                Help
                            </Link>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="px-4 py-6 md:px-8 lg:px-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <div className="text-muted-foreground text-sm">
                        <Link href={`/${lang}/admin`} className="hover:underline">
                            Admin
                        </Link>
                        <span className="mx-2">/</span>
                        <Link href={`/${lang}/admin/orders`} className="hover:underline">
                            Orders
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground font-medium">{orderId}</span>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Order Detail</h1>
                </div>
                {headerActions}
            </div>

            {error && (
                <div className="mb-6">
                    <Alert className="border-destructive text-destructive">
                        <AlertTitle>Failed to load</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
                        <div className="flex items-start justify-between gap-4 p-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                                            statusColor(order?.status)
                                        )}
                                    >
                                        {order?.status || 'unknown'}
                                    </span>
                                    {order?.language && (
                                        <span className="text-muted-foreground text-xs">
                                            Locale: {order.language.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="text-muted-foreground mt-2 text-sm">Order ID</div>
                                <div className="font-mono text-sm">{orderId}</div>
                            </div>
                            <div className="min-w-[200px] space-y-1 text-right">
                                <div className="text-muted-foreground text-sm">Total</div>
                                <div className="text-2xl font-semibold">
                                    {formatCurrency(order?.total_amount, order?.currency)}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    Subtotal{' '}
                                    {formatCurrency(order?.subtotal_amount, order?.currency)} · Tax{' '}
                                    {formatCurrency(order?.tax_amount, order?.currency)} · Shipping{' '}
                                    {formatCurrency(order?.shipping_amount, order?.currency)}
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 gap-4 p-5 text-sm md:grid-cols-3">
                            <div>
                                <div className="text-muted-foreground">Created</div>
                                <div>{formatDate(order?.created_at)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Updated</div>
                                <div>{formatDate(order?.updated_at)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Consent</div>
                                <div>
                                    {order?.consent_accepted_at
                                        ? `Accepted ${formatDate(order?.consent_accepted_at)}`
                                        : 'Not recorded'}
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 gap-4 p-5 text-sm md:grid-cols-3">
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Customer</div>
                                {profile?.email ? (
                                    <div className="truncate" title={profile.email}>
                                        {profile.email}
                                    </div>
                                ) : (
                                    <div>-</div>
                                )}
                                <div className="flex gap-2 text-xs">
                                    <Link
                                        className="underline"
                                        href={`/${lang}/account/orders/${orderId}`}
                                    >
                                        Account view
                                    </Link>
                                    <span>·</span>
                                    <Link className="underline" href={`/${lang}/orders/${orderId}`}>
                                        Customer view
                                    </Link>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Stripe</div>
                                <div className="font-mono text-xs break-all">
                                    {order?.stripe_payment_intent_id || '-'}
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        onClick={() => {
                                            if (!order?.stripe_payment_intent_id) return
                                            navigator.clipboard.writeText(
                                                order?.stripe_payment_intent_id
                                            )
                                            toast({
                                                title: 'Copied',
                                                description: 'Payment intent ID copied',
                                            })
                                        }}
                                        className="text-muted-foreground hover:text-foreground underline"
                                    >
                                        Copy
                                    </button>
                                    <span>·</span>
                                    <button
                                        onClick={resyncStripe}
                                        className="text-muted-foreground hover:text-foreground underline"
                                    >
                                        Resync
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Printify</div>
                                <div className="font-mono text-xs break-all">
                                    {order?.printify_order_id || '-'}
                                </div>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        onClick={() => {
                                            if (!order?.printify_order_id) return
                                            navigator.clipboard.writeText(order?.printify_order_id)
                                            toast({
                                                title: 'Copied',
                                                description: 'Printify order ID copied',
                                            })
                                        }}
                                        className="text-muted-foreground hover:text-foreground underline"
                                    >
                                        Copy
                                    </button>
                                    <span>·</span>
                                    <button
                                        onClick={resyncPrintify}
                                        className="text-muted-foreground hover:text-foreground underline"
                                    >
                                        Resync
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between p-5">
                            <div className="font-medium">Items</div>
                            <div className="text-muted-foreground text-xs">
                                {items.length} item(s)
                            </div>
                        </div>
                        <Separator />
                        <div className="overflow-x-auto p-5">
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-8 w-2/3" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Variant</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead className="text-right">Unit</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((it) => (
                                            <TableRow key={it.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {it.product_name || '-'}
                                                        </span>
                                                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                                            {it.product_slug ? (
                                                                <Link
                                                                    className="underline"
                                                                    href={`/${lang}/products/${it.product_slug}`}
                                                                >
                                                                    View product
                                                                </Link>
                                                            ) : null}
                                                            {order?.design_session_id ? (
                                                                <>
                                                                    <span>·</span>
                                                                    <Link
                                                                        className="underline"
                                                                        href={`/${lang}/design/s/${order.design_session_id}/approval`}
                                                                    >
                                                                        Design approval
                                                                    </Link>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {it.variant_name || '-'}
                                                    </div>
                                                    <div className="text-muted-foreground text-[11px]">
                                                        {it.printify_variant_id
                                                            ? `Variant ${it.printify_variant_id}`
                                                            : ''}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{it.quantity ?? 1}</TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        it.unit_price ?? 0,
                                                        order?.currency
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        (it.unit_price || 0) * (it.quantity || 1),
                                                        order?.currency
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableCaption>
                                        Need to adjust mappings? Visit {''}
                                        <Link
                                            className="underline"
                                            href={`/${lang}/admin/products-mapping`}
                                        >
                                            Admin · Product Mappings
                                        </Link>
                                    </TableCaption>
                                </Table>
                            )}
                        </div>
                    </div>

                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between p-5">
                            <div className="font-medium">Logs & Events</div>
                            <div className="text-muted-foreground text-xs">
                                <Link className="underline" href={`/${lang}/admin/logs`}>
                                    Global logs
                                </Link>
                            </div>
                        </div>
                        <Separator />
                        <div className="p-5">
                            <Collapsible defaultOpen>
                                <CollapsibleTrigger className="w-full text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">
                                            Solar Pro2 Reasoning Summary
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            Expand/Collapse
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="bg-muted text-muted-foreground mt-3 rounded-md p-4 text-sm">
                                        {renderReasoningSummary(events)}
                                    </div>
                                    <div className="mt-3">
                                        <button
                                            onClick={rerunReasoning}
                                            className="bg-muted text-foreground inline-flex items-center rounded-md px-3 py-2 text-sm hover:opacity-90"
                                        >
                                            Re-run summary
                                        </button>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Separator className="my-4" />

                            <Collapsible defaultOpen>
                                <CollapsibleTrigger className="w-full text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">
                                            Image Generation Steps
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            Expand/Collapse
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="mt-3 space-y-3">
                                        {renderImageSteps(events)}
                                        <div>
                                            <button
                                                onClick={regenVariations}
                                                className="bg-accent text-accent-foreground inline-flex items-center rounded-md px-3 py-2 text-sm hover:opacity-90"
                                            >
                                                Regenerate variations
                                            </button>
                                            <span className="mx-2" />
                                            <button
                                                onClick={rebuildMockups}
                                                className="bg-accent text-accent-foreground inline-flex items-center rounded-md px-3 py-2 text-sm hover:opacity-90"
                                            >
                                                Rebuild mockups
                                            </button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            <Separator className="my-4" />

                            <Collapsible defaultOpen>
                                <CollapsibleTrigger className="w-full text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium">All Events</div>
                                        <div className="text-muted-foreground text-xs">
                                            {events.length} entries
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="mt-3 overflow-x-auto">
                                        {loading ? (
                                            <div className="space-y-2">
                                                <Skeleton className="h-8 w-full" />
                                                <Skeleton className="h-8 w-5/6" />
                                                <Skeleton className="h-8 w-2/3" />
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[160px]">
                                                            Time
                                                        </TableHead>
                                                        <TableHead className="w-[120px]">
                                                            Source
                                                        </TableHead>
                                                        <TableHead className="w-[160px]">
                                                            Type
                                                        </TableHead>
                                                        <TableHead>Message</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {events.map((ev) => (
                                                        <TableRow key={ev.id}>
                                                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                                {formatDate(ev.created_at)}
                                                            </TableCell>
                                                            <TableCell className="text-xs">
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px]',
                                                                        badgeBySource(ev.source)
                                                                    )}
                                                                >
                                                                    {ev.source || 'system'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-xs font-medium">
                                                                {ev.type || '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-sm">
                                                                    {ev.message || '-'}
                                                                </div>
                                                                {ev.meta ? (
                                                                    <pre className="bg-muted text-muted-foreground mt-1 max-h-40 overflow-auto rounded p-2 text-[11px]">
                                                                        {JSON.stringify(
                                                                            ev.meta,
                                                                            null,
                                                                            2
                                                                        )}
                                                                    </pre>
                                                                ) : null}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                                <TableCaption>
                                                    Need to investigate further? Check {''}
                                                    <Link
                                                        className="underline"
                                                        href={`/${lang}/admin/health`}
                                                    >
                                                        Admin · Health
                                                    </Link>{' '}
                                                    or {''}
                                                    <Link
                                                        className="underline"
                                                        href={`/${lang}/admin/retries`}
                                                    >
                                                        Admin · Retries
                                                    </Link>
                                                    .
                                                </TableCaption>
                                            </Table>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between p-5">
                            <div className="font-medium">Assets</div>
                            <div className="text-muted-foreground text-xs">
                                {assets.length} file(s)
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 gap-4 p-5">
                            {loading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-24 w-full" />
                                    <Skeleton className="h-24 w-full" />
                                </div>
                            ) : assets.length === 0 ? (
                                <div className="text-muted-foreground text-sm">
                                    No assets available.
                                </div>
                            ) : (
                                assets.map((a) => (
                                    <div key={a.id} className="bg-background rounded-md border p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {a.type || 'asset'}
                                                </div>
                                                <div className="text-muted-foreground text-xs">
                                                    {formatDate(a.created_at)}
                                                </div>
                                            </div>
                                            {a.url ? (
                                                <Link
                                                    target="_blank"
                                                    href={a.url}
                                                    className="bg-secondary text-secondary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-xs hover:opacity-90"
                                                >
                                                    Open
                                                </Link>
                                            ) : null}
                                        </div>
                                        {a.url && a.mime_type?.startsWith('image/') ? (
                                            <div className="mt-3 overflow-hidden rounded">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={a.url}
                                                    alt={`${a.type || 'asset'}`}
                                                    className="h-auto w-full object-cover"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between p-5">
                            <div className="font-medium">Operational Controls</div>
                            <div className="text-muted-foreground text-xs">
                                Queue jobs & actions
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3 p-5">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={retryPrintify}
                                    className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                >
                                    Submit/Retry Printify
                                </button>
                                <button
                                    onClick={cancelPrintify}
                                    className="bg-destructive text-destructive-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                >
                                    Cancel Printify
                                </button>
                                <button
                                    onClick={resyncPrintify}
                                    className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                >
                                    Resync Printify
                                </button>
                                <button
                                    onClick={resyncStripe}
                                    className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                >
                                    Resync Stripe
                                </button>
                                <button
                                    onClick={rebuildMockups}
                                    className="bg-accent text-accent-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                >
                                    Rebuild Mockups
                                </button>
                                <button
                                    onClick={regenVariations}
                                    className="bg-accent text-accent-foreground rounded-md px-3 py-2 text-sm hover:opacity-90"
                                >
                                    Regenerate Variations
                                </button>
                            </div>
                            <div className="text-muted-foreground text-xs">
                                Review global {''}
                                <Link className="underline" href={`/${lang}/admin/analytics`}>
                                    Analytics
                                </Link>{' '}
                                and {''}
                                <Link className="underline" href={`/${lang}/admin/costs`}>
                                    Costs
                                </Link>{' '}
                                to monitor impact.
                            </div>
                        </div>
                    </div>

                    <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
                        <div className="p-5">
                            <div className="font-medium">Quick Navigation</div>
                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                                <Link className="underline" href={`/${lang}/orders/${orderId}`}>
                                    Customer order view
                                </Link>
                                <Link
                                    className="underline"
                                    href={`/${lang}/account/orders/${orderId}`}
                                >
                                    Account order view
                                </Link>
                                <Link className="underline" href={`/${lang}/admin/orders`}>
                                    Admin orders
                                </Link>
                                <Link className="underline" href={`/${lang}/admin/logs`}>
                                    Admin logs
                                </Link>
                                <Link className="underline" href={`/${lang}/admin/health`}>
                                    Admin health
                                </Link>
                                <Link className="underline" href={`/${lang}/admin/retries`}>
                                    Admin retries
                                </Link>
                                <Link className="underline" href={`/${lang}/admin/analytics`}>
                                    Admin analytics
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function renderReasoningSummary(events: OrderEvent[]) {
    const summaries = events.filter(
        (e) =>
            (e.source || '').toLowerCase().includes('solar') &&
            ((e.type || '').toLowerCase().includes('summary') ||
                (e.type || '').toLowerCase().includes('brief'))
    )
    if (summaries.length === 0) {
        return (
            <div className="text-muted-foreground text-sm">
                No reasoning summaries recorded yet.
            </div>
        )
    }
    const latest = summaries[0]
    const text = latest.message || JSON.stringify(latest.meta || {}, null, 2)
    return (
        <div className="space-y-2">
            <div className="text-muted-foreground text-xs">
                Latest at {formatDate(latest.created_at)}
            </div>
            <pre className="text-sm leading-relaxed break-words whitespace-pre-wrap">{text}</pre>
        </div>
    )
}

function renderImageSteps(events: OrderEvent[]) {
    const gens = events.filter(
        (e) =>
            ['image', 'design'].some((k) => (e.source || '').toLowerCase().includes(k)) ||
            ['image.generated', 'image.queued', 'mockup.built', 'design.prompt'].some((k) =>
                (e.type || '').toLowerCase().includes(k)
            )
    )
    if (gens.length === 0) {
        return <div className="text-muted-foreground text-sm">No image generation steps found.</div>
    }
    return (
        <ol className="space-y-3">
            {gens.map((g) => (
                <li key={g.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{g.type || 'step'}</div>
                        <div className="text-muted-foreground text-xs">
                            {formatDate(g.created_at)}
                        </div>
                    </div>
                    {g.message ? <div className="mt-1 text-sm">{g.message}</div> : null}
                    {g.meta ? (
                        <pre className="bg-muted text-muted-foreground mt-2 max-h-48 overflow-auto rounded p-2 text-[11px]">
                            {JSON.stringify(g.meta, null, 2)}
                        </pre>
                    ) : null}
                </li>
            ))}
        </ol>
    )
}

function badgeBySource(source?: string | null) {
    const s = (source || '').toLowerCase()
    if (s.includes('solar')) return 'bg-chart-1/20 text-chart-1'
    if (s.includes('image') || s.includes('gen')) return 'bg-chart-2/20 text-chart-2'
    if (s.includes('printify')) return 'bg-chart-3/20 text-chart-3'
    if (s.includes('stripe')) return 'bg-chart-4/20 text-chart-4'
    return 'bg-muted text-muted-foreground'
}
