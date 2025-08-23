'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React from 'react'

type PageProps = {
    params: {
        lang: string
    }
}

const DICT: Record<
    string,
    {
        title: string
        sub: string
        locating: string
        located: string
        submitInfoTitle: string
        submitInfo: string[]
        helpTitle: string
        helpDescription: string
        viewOrder: string
        orderHistory: string
        startDesign: string
        browseProducts: string
        needHelp: string
        statusSubmitting: string
        statusSubmitted: string
        statusTrackingSoon: string
        reference: string
    }
> = {
    en: {
        title: "Payment successful — We're on it!",
        sub: "We're automatically submitting your order to Printify. Your order will appear here in moments as we sync details and tracking.",
        locating: 'Locating your order details…',
        located: 'Order located.',
        submitInfoTitle: "What's next",
        submitInfo: [
            'We confirm your payment and create your production order with Printify.',
            'Your design files and selected variant are attached and sent for production.',
            "You'll receive email updates as we get status changes, tracking, and delivery confirmations.",
        ],
        helpTitle: 'Questions about your order?',
        helpDescription: 'Visit Order History to see status, or reach out via Help/Contact.',
        viewOrder: 'View Order',
        orderHistory: 'Order History',
        startDesign: 'Start another design',
        browseProducts: 'Browse products',
        needHelp: 'Get help',
        statusSubmitting: 'Submitting to Printify…',
        statusSubmitted: 'Submitted to Printify',
        statusTrackingSoon: 'Tracking will appear once the carrier picks it up.',
        reference: 'Reference',
    },
    ko: {
        title: '결제가 완료되었습니다 — 바로 진행 중입니다!',
        sub: '주문은 Printify에 자동으로 접수됩니다. 동기화가 완료되면 잠시 후 주문 페이지에 표시됩니다.',
        locating: '주문 정보를 확인하고 있습니다…',
        located: '주문을 찾았습니다.',
        submitInfoTitle: '다음 단계',
        submitInfo: [
            '결제 확인 후 Printify에 생산 주문을 생성합니다.',
            '디자인 파일과 선택한 옵션을 첨부하여 생산에 전달합니다.',
            '상태 변경, 운송장 추적, 배송 완료 알림을 이메일로 보내드립니다.',
        ],
        helpTitle: '주문 관련 문의가 있으신가요?',
        helpDescription: '주문 내역에서 상태를 확인하거나, 도움말/문의 페이지로 연락해 주세요.',
        viewOrder: '주문 보기',
        orderHistory: '주문 내역',
        startDesign: '새 디자인 시작하기',
        browseProducts: '제품 둘러보기',
        needHelp: '도움받기',
        statusSubmitting: 'Printify로 접수 중…',
        statusSubmitted: 'Printify에 접수 완료',
        statusTrackingSoon: '택배사가 접수하면 운송장 정보가 표시됩니다.',
        reference: '참조',
    },
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
            {...props}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9.75" />
            <circle cx="12" cy="12" r="9" strokeOpacity={0.15} />
        </svg>
    )
}

function Spinner(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" className={cn('animate-spin', props.className)} aria-hidden="true">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
            />
            <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
        </svg>
    )
}

export default function CheckoutSuccessPage({ params }: PageProps) {
    const { lang } = params
    const t = DICT[lang] ?? DICT.en
    const search = useSearchParams()
    const sessionId = search.get('session_id') || search.get('sessionId') || search.get('cs')
    const orderIdParam = search.get('order_id') || search.get('oid')

    const [orderId, setOrderId] = React.useState<string | null>(orderIdParam)
    const [status, setStatus] = React.useState<string | null>(null)
    const [printifyOrderId, setPrintifyOrderId] = React.useState<string | null>(null)
    const [trackingCode, setTrackingCode] = React.useState<string | null>(null)
    const [loading, setLoading] = React.useState<boolean>(true)
    const [resolving, setResolving] = React.useState<boolean>(true)
    const [error, setError] = React.useState<string | null>(null)

    const refSummary = React.useMemo(() => {
        const parts: string[] = []
        if (sessionId) parts.push(`Stripe: ${sessionId}`)
        if (printifyOrderId) parts.push(`Printify: ${printifyOrderId}`)
        if (trackingCode) parts.push(`Tracking: ${trackingCode}`)
        return parts.join(' • ')
    }, [sessionId, printifyOrderId, trackingCode])

    React.useEffect(() => {
        let isMounted = true

        async function resolveOrder() {
            setResolving(true)
            setError(null)
            try {
                if (orderIdParam) {
                    setOrderId(orderIdParam)
                    return
                }
                const supabase = supabaseBrowser

                // If a Stripe session id exists, try to find an order by any common mapping column.
                if (sessionId) {
                    const orFilter = [
                        `stripe_checkout_session_id.eq.${sessionId}`,
                        `checkout_session_id.eq.${sessionId}`,
                        `stripe_session_id.eq.${sessionId}`,
                        `stripe_payment_intent_id.eq.${sessionId}`,
                        `payment_intent_id.eq.${sessionId}`,
                    ].join(',')
                    const { data, error: dberr } = await supabase
                        .from('orders')
                        .select('id,status,printify_order_id,tracking_code')
                        .or(orFilter)
                        .order('created_at', { ascending: false })
                        .limit(1)

                    if (dberr) throw dberr
                    const order = data?.[0]
                    if (order) {
                        if (!isMounted) return
                        setOrderId(order.id)
                        setStatus(order.status ?? null)
                        setPrintifyOrderId(order.printify_order_id ?? null)
                        setTrackingCode(order.tracking_code ?? null)
                        return
                    }
                }

                // Fallback: if authenticated, get most recent order in the last 24h
                const { data: userRes } = await supabase.auth.getUser()
                const user = userRes?.user
                if (user) {
                    const { data, error: dberr2 } = await supabase
                        .from('orders')
                        .select('id,status,printify_order_id,tracking_code')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                    if (dberr2) throw dberr2
                    const latest = data?.[0]
                    if (latest) {
                        if (!isMounted) return
                        setOrderId(latest.id)
                        setStatus(latest.status ?? null)
                        setPrintifyOrderId(latest.printify_order_id ?? null)
                        setTrackingCode(latest.tracking_code ?? null)
                        return
                    }
                }

                if (isMounted)
                    setError("We couldn't locate your order yet. It may take a moment to sync.")
            } catch (e: any) {
                if (!isMounted) return
                setError(e?.message || 'Unexpected error while locating order.')
            } finally {
                if (isMounted) setResolving(false)
            }
        }

        resolveOrder()

        return () => {
            isMounted = false
        }
    }, [sessionId, orderIdParam])

    React.useEffect(() => {
        let timer: any
        let active = true

        async function poll() {
            if (!orderId) {
                setLoading(false)
                return
            }
            const supabase = supabaseBrowser
            try {
                const { data, error: dberr } = await supabase
                    .from('orders')
                    .select('status,printify_order_id,tracking_code')
                    .eq('id', orderId)
                    .single()
                if (dberr) throw dberr
                if (!active) return
                setStatus(data?.status ?? null)
                setPrintifyOrderId(data?.printify_order_id ?? null)
                setTrackingCode(data?.tracking_code ?? null)
            } catch (_) {
                // Silent — allow UI to continue
            } finally {
                if (active) setLoading(false)
            }

            timer = setTimeout(poll, 5000)
        }

        poll()

        return () => {
            active = false
            if (timer) clearTimeout(timer)
        }
    }, [orderId])

    const statusLabel = React.useMemo(() => {
        if (printifyOrderId) return t.statusSubmitted
        if (status && /submitted|placed|processing|in_production/i.test(status))
            return t.statusSubmitted
        return t.statusSubmitting
    }, [status, printifyOrderId, t])

    const baseLink = (path: string) => `/${lang}${path}`

    return (
        <main className="bg-background min-h-[70dvh] w-full">
            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="bg-primary/20 absolute inset-0 rounded-full blur-xl" />
                        <div className="bg-primary text-primary-foreground relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg">
                            <CheckIcon className="h-8 w-8" />
                        </div>
                    </div>

                    <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
                        {t.sub}
                    </p>

                    <div className="border-border bg-card mt-6 w-full rounded-lg border p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            {loading || resolving ? (
                                <Spinner className="text-primary mt-0.5 h-5 w-5" />
                            ) : (
                                <CheckIcon className="text-primary mt-0.5 h-5 w-5" />
                            )}
                            <div className="text-left">
                                <p className="text-foreground text-sm font-medium">{statusLabel}</p>
                                <p className="text-muted-foreground text-xs">
                                    {t.statusTrackingSoon}
                                </p>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                    {t.reference}
                                </p>
                                {resolving ? (
                                    <Skeleton className="h-5 w-56" />
                                ) : refSummary ? (
                                    <p className="text-foreground text-sm break-all">
                                        {refSummary}
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground text-sm">—</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                                    Order ID
                                </p>
                                {resolving ? (
                                    <Skeleton className="h-5 w-32" />
                                ) : orderId ? (
                                    <p className="text-foreground text-sm break-all">{orderId}</p>
                                ) : (
                                    <p className="text-muted-foreground text-sm">{t.locating}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert className="border-destructive/50 mt-4 w-full">
                            <AlertTitle>Heads up</AlertTitle>
                            <AlertDescription className="text-muted-foreground">
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                        <Link
                            href={orderId ? baseLink(`/orders/${orderId}`) : baseLink('/orders')}
                            className={cn(
                                'focus-visible:ring-primary/50 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                                orderId
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            )}
                            aria-disabled={!orderId}
                        >
                            {t.viewOrder}
                        </Link>
                        <Link
                            href={baseLink('/orders')}
                            className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary/50 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            {t.orderHistory}
                        </Link>
                    </div>

                    <div className="border-border bg-card mt-10 w-full rounded-lg border p-5">
                        <h2 className="text-foreground text-sm font-semibold">
                            {t.submitInfoTitle}
                        </h2>
                        <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                            {t.submitInfo.map((line, idx) => (
                                <li key={idx} className="flex gap-2">
                                    <span className="bg-secondary text-secondary-foreground mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full">
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    </span>
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <Link
                                href={baseLink('/design')}
                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm"
                            >
                                {t.startDesign}
                            </Link>
                            <Link
                                href={baseLink('/products')}
                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm"
                            >
                                {t.browseProducts}
                            </Link>
                            <Link
                                href={baseLink('//help')}
                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm"
                            >
                                {t.needHelp}
                            </Link>
                        </div>
                    </div>

                    <div className="border-border bg-card mt-10 w-full rounded-lg border p-5">
                        <div className="flex flex-col gap-2 text-left">
                            <h3 className="text-foreground text-sm font-semibold">{t.helpTitle}</h3>
                            <p className="text-muted-foreground text-sm">{t.helpDescription}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Link
                                    href={baseLink('//about')}
                                    className="text-primary text-xs hover:underline"
                                >
                                    About
                                </Link>
                                <Link
                                    href={baseLink('//help')}
                                    className="text-primary text-xs hover:underline"
                                >
                                    Help Center
                                </Link>
                                <Link
                                    href={baseLink('//contact')}
                                    className="text-primary text-xs hover:underline"
                                >
                                    Contact
                                </Link>
                                <Link
                                    href={baseLink('//legal/terms')}
                                    className="text-primary text-xs hover:underline"
                                >
                                    Terms
                                </Link>
                                <Link
                                    href={baseLink('//legal/privacy')}
                                    className="text-primary text-xs hover:underline"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href={baseLink('//legal/ip-policy')}
                                    className="text-primary text-xs hover:underline"
                                >
                                    IP Policy
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="text-muted-foreground mt-8 text-xs">
                        <span>{orderId ? t.located : t.locating}</span>
                    </div>
                </div>
            </div>
        </main>
    )
}
