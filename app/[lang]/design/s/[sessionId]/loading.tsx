'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

type StatusKey =
    | 'queued'
    | 'generating_brief'
    | 'generating_images'
    | 'compositing'
    | 'preparing_print'
    | 'generating_mockups'
    | 'uploading'
    | 'ready'
    | 'failed'

const STATUS_FLOW: StatusKey[] = [
    'queued',
    'generating_brief',
    'generating_images',
    'compositing',
    'preparing_print',
    'generating_mockups',
    'uploading',
    'ready',
]

const STATUS_PROGRESS: Record<StatusKey, number> = {
    queued: 5,
    generating_brief: 15,
    generating_images: 45,
    compositing: 60,
    preparing_print: 72,
    generating_mockups: 85,
    uploading: 93,
    ready: 100,
    failed: 100,
}

function useLocaleLabels(lang: string) {
    const isKR = lang?.toLowerCase() === 'kr' || lang?.toLowerCase() === 'ko'
    return useMemo(
        () => ({
            pageTitle: isKR ? '디자인 생성 중' : 'Generating your design',
            subtitle: isKR
                ? '고품질 이미지를 생성하고 제품 목업을 준비하는 중입니다. 몇 초만 기다려주세요.'
                : 'We’re generating high-quality artwork and preparing product mockups. This usually takes under a minute.',
            tipsTitle: isKR ? '다음 단계로 이동' : 'Where you can go next',
            sessionRoot: isKR ? '세션 홈으로' : 'Back to session home',
            variations: isKR ? '변형 미리보기' : 'Preview variations',
            selectProduct: isKR ? '제품 선택' : 'Select product',
            approval: isKR ? '승인 단계로' : 'Go to approval',
            products: isKR ? '제품 둘러보기' : 'Browse products',
            cart: isKR ? '장바구니' : 'Cart',
            checkout: isKR ? '결제' : 'Checkout',
            orders: isKR ? '주문 내역' : 'Your orders',
            account: isKR ? '계정' : 'Account',
            help: isKR ? '도움말' : 'Help',
            about: isKR ? '소개' : 'About',
            admin: isKR ? '관리자' : 'Admin',
            legal: isKR ? '이용약관' : 'Terms',
            privacy: isKR ? '개인정보 처리방침' : 'Privacy',
            statusLabels: {
                queued: isKR ? '대기 중' : 'Queued',
                generating_brief: isKR ? '디자인 브리핑 분석' : 'Deriving design brief',
                generating_images: isKR ? '이미지 생성' : 'Generating images',
                compositing: isKR ? '템플릿 합성' : 'Compositing to templates',
                preparing_print: isKR ? '인쇄 파일 준비' : 'Preparing print files',
                generating_mockups: isKR ? '목업 생성' : 'Generating mockups',
                uploading: isKR ? '업로드 중' : 'Uploading assets',
                ready: isKR ? '완료됨' : 'Ready',
                failed: isKR ? '실패' : 'Failed',
            } as Record<StatusKey, string>,
            contextMessages: {
                queued: isKR
                    ? '요청이 접수되었습니다. 곧 시작됩니다.'
                    : 'Your request is in line. We’ll begin shortly.',
                generating_brief: isKR
                    ? '요청 내용을 분석하고 색상/스타일을 정리 중입니다.'
                    : 'Analyzing your prompt to extract palette, style, and text.',
                generating_images: isKR
                    ? '고해상도 이미지를 생성하는 중입니다.'
                    : 'Creating high-resolution artwork.',
                compositing: isKR
                    ? '생성된 이미지를 제품 템플릿에 맞게 배치 중입니다.'
                    : 'Placing artwork into product-safe templates.',
                preparing_print: isKR
                    ? '인쇄용 PNG를 권장 해상도와 DPI로 내보내는 중입니다.'
                    : 'Exporting print-ready PNGs at recommended sizes and DPI.',
                generating_mockups: isKR
                    ? '고객 미리보기를 위한 목업을 만드는 중입니다.'
                    : 'Building product mockups for your preview.',
                uploading: isKR
                    ? '자산을 안전하게 저장소로 업로드 중입니다.'
                    : 'Uploading assets securely to storage.',
                ready: isKR
                    ? '디자인이 준비되었습니다. 계속 진행해 주세요.'
                    : 'Your design is ready. Continue when you’re ready.',
                failed: isKR
                    ? '문제가 발생했습니다. 세션으로 돌아가 다시 시도해 주세요.'
                    : 'Something went wrong. Return to your session to retry.',
            } as Record<StatusKey, string>,
            etaLabel: isKR ? '예상 남은 시간' : 'Estimated time remaining',
            elapsedLabel: isKR ? '경과 시간' : 'Elapsed',
            loadingHint: isKR
                ? '페이지를 떠나도 처리는 계속됩니다. 준비되면 아래 링크로 이동하세요.'
                : 'You can navigate elsewhere; processing continues. Use the links below to continue when ready.',
            failureTitle: isKR ? '처리 실패' : 'Processing failed',
            failureCta: isKR ? '세션으로 돌아가기' : 'Return to session',
        }),
        [isKR]
    )
}

function formatSeconds(total: number) {
    const m = Math.floor(total / 60)
    const s = total % 60
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

export default function LoadingDesignSession() {
    const params = useParams<{ lang: string; sessionId: string }>()
    const search = useSearchParams()
    const lang = (params?.lang || 'en') as string
    const sessionId = params?.sessionId as string
    const labels = useLocaleLabels(lang)

    const [status, setStatus] = useState<StatusKey>(() => {
        const q = (search?.get('stage') || search?.get('status') || '').toLowerCase()
        if (STATUS_FLOW.includes(q as StatusKey)) return q as StatusKey
        return 'queued'
    })
    const [message, setMessage] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [progress, setProgress] = useState<number>(STATUS_PROGRESS[status])
    const [elapsed, setElapsed] = useState<number>(0)
    const hinted = Number(search?.get('eta'))
    const expectedSeconds = useRef<number>(
        !Number.isNaN(hinted) && hinted > 5 && hinted < 600 ? hinted : 75
    )

    const supabase = useMemo(() => supabaseBrowser, [])

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed((t) => t + 1)
            setProgress((p) => {
                const target = STATUS_PROGRESS[status] ?? 95
                const maxDrift = status === 'ready' || status === 'failed' ? 100 : 96
                const next = Math.min(
                    Math.max(p + Math.random() * 2.0, p + 0.3),
                    Math.max(target - 0.5, maxDrift)
                )
                return status === 'ready' || status === 'failed' ? target : next
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [status])

    useEffect(() => {
        const channel = supabase
            .channel('design_sessions_loading')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'design_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload: any) => {
                    const row = payload?.new || {}
                    const s: string = (row.status || row.stage || '').toLowerCase()
                    const msg: string = row.message || row.note || ''
                    const err: string = row.error || row.failure_reason || ''
                    const prog: number | undefined =
                        typeof row.progress === 'number' ? row.progress : undefined

                    if (s && (STATUS_FLOW.includes(s as StatusKey) || s === 'failed')) {
                        setStatus(s as StatusKey)
                    }
                    if (msg) setMessage(msg)
                    if (err) setError(err)
                    if (typeof prog === 'number' && prog >= 0 && prog <= 100) {
                        setProgress(prog)
                    }
                }
            )
            .subscribe((status) => {
                // no-op; channel established
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, sessionId])

    const currentIndex = useMemo(() => Math.max(STATUS_FLOW.indexOf(status), 0), [status])

    const etaRemaining = useMemo(() => {
        if (status === 'ready') return 0
        if (status === 'failed') return 0
        const pct = Math.min(Math.max(progress, 1), 99)
        const total = expectedSeconds.current
        const estElapsed = (pct / 100) * total
        const base = Math.max(total - estElapsed, 0)
        // add small jitter so it feels alive
        return Math.max(Math.round(base + (Math.random() - 0.5) * 4), 0)
    }, [progress, status])

    const pulseColor =
        status === 'failed' ? 'bg-destructive' : status === 'ready' ? 'bg-primary' : 'bg-accent'

    return (
        <div className="flex min-h-[70vh] w-full items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                <div className="bg-card text-card-foreground relative overflow-hidden rounded-2xl border shadow-sm">
                    <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden>
                        <div className="bg-primary/20 absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl" />
                        <div className="bg-accent/20 absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl" />
                    </div>

                    <div className="grid gap-6 p-6 md:p-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                                    {labels.pageTitle}
                                </h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {labels.subtitle}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
                                    <span className="bg-primary inline-flex h-2 w-2 animate-pulse rounded-full" />
                                    <span>#{sessionId?.slice(0, 8)}</span>
                                </span>
                                <Separator orientation="vertical" className="h-6" />
                                <Link
                                    href={`/${lang}/design/s/${sessionId}`}
                                    className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-xs transition hover:opacity-90"
                                >
                                    {labels.sessionRoot}
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    'relative grid h-14 w-14 place-items-center rounded-full',
                                    'shadow-inner'
                                )}
                                aria-hidden
                            >
                                <div
                                    className={cn(
                                        'border-muted absolute inset-0 rounded-full border-4',
                                        ''
                                    )}
                                />
                                <div
                                    className={cn(
                                        'absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent',
                                        status === 'failed'
                                            ? 'border-destructive'
                                            : 'border-primary',
                                        'animate-spin'
                                    )}
                                />
                                <div
                                    className={cn(
                                        'h-4 w-4 rounded-full',
                                        pulseColor,
                                        'animate-pulse'
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                                    <span>{labels.statusLabels[status]}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-500',
                                            status === 'failed' ? 'bg-destructive' : 'bg-primary'
                                        )}
                                        style={{
                                            width: `${Math.max(Math.min(progress, 100), 0)}%`,
                                        }}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={Math.round(progress)}
                                        role="progressbar"
                                        aria-label="Progress"
                                    />
                                </div>
                                <p className="text-muted-foreground mt-2 text-xs">
                                    {message || labels.contextMessages[status]}
                                </p>
                            </div>
                        </div>

                        {status !== 'failed' ? (
                            <div className="text-muted-foreground grid gap-2 text-xs">
                                <div className="flex items-center gap-3">
                                    <span className="text-foreground font-medium">
                                        {labels.elapsedLabel}:
                                    </span>
                                    <span className="tabular-nums">{formatSeconds(elapsed)}</span>
                                    <Separator orientation="vertical" className="h-4" />
                                    <span className="text-foreground font-medium">
                                        {labels.etaLabel}:
                                    </span>
                                    <span className="tabular-nums">
                                        {formatSeconds(etaRemaining)}
                                    </span>
                                </div>
                                <p>{labels.loadingHint}</p>
                            </div>
                        ) : (
                            <Alert variant="destructive" className="mt-2">
                                <AlertTitle>{labels.failureTitle}</AlertTitle>
                                <AlertDescription>
                                    {error || labels.contextMessages.failed}
                                </AlertDescription>
                            </Alert>
                        )}

                        <Separator />

                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <ol className="grid gap-3">
                                    {STATUS_FLOW.map((step, idx) => {
                                        const done = idx < currentIndex || status === 'ready'
                                        const current = idx === currentIndex
                                        return (
                                            <li key={step} className={cn('flex items-start gap-3')}>
                                                <span
                                                    className={cn(
                                                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                                                        done
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : current
                                                              ? 'bg-accent text-accent-foreground border-accent'
                                                              : 'border-muted'
                                                    )}
                                                    aria-hidden
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                    >
                                                        {done ? (
                                                            <path d="M20 6L9 17l-5-5" />
                                                        ) : current ? (
                                                            <circle cx="12" cy="12" r="4" />
                                                        ) : (
                                                            <circle cx="12" cy="12" r="1" />
                                                        )}
                                                    </svg>
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">
                                                        {labels.statusLabels[step]}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {labels.contextMessages[step]}
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ol>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="mb-2 text-sm font-medium">
                                        {labels.tipsTitle}
                                    </div>
                                    <div className="grid gap-2">
                                        <Link
                                            href={`/${lang}/design/s/${sessionId}`}
                                            className="bg-secondary text-secondary-foreground inline-flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition hover:opacity-90"
                                        >
                                            <span>{labels.sessionRoot}</span>
                                            <span aria-hidden>↩</span>
                                        </Link>
                                        <Link
                                            href={`/${lang}/design/s/${sessionId}/variations`}
                                            className="bg-primary text-primary-foreground inline-flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition hover:opacity-90"
                                        >
                                            <span>{labels.variations}</span>
                                            <span aria-hidden>→</span>
                                        </Link>
                                        <Link
                                            href={`/${lang}/design/s/${sessionId}/select-product`}
                                            className="bg-accent text-accent-foreground inline-flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition hover:opacity-90"
                                        >
                                            <span>{labels.selectProduct}</span>
                                            <span aria-hidden>→</span>
                                        </Link>
                                        <Link
                                            href={`/${lang}/design/s/${sessionId}/approval`}
                                            className="hover:bg-muted/50 inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition"
                                        >
                                            <span>{labels.approval}</span>
                                            <span aria-hidden>→</span>
                                        </Link>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href={`/${lang}/products`}
                                            className="bg-muted hover:bg-muted/70 text-foreground rounded-md px-3 py-2 text-center text-xs transition"
                                        >
                                            {labels.products}
                                        </Link>
                                        <Link
                                            href={`/${lang}/cart`}
                                            className="bg-muted hover:bg-muted/70 text-foreground rounded-md px-3 py-2 text-center text-xs transition"
                                        >
                                            {labels.cart}
                                        </Link>
                                        <Link
                                            href={`/${lang}/checkout`}
                                            className="bg-muted hover:bg-muted/70 text-foreground rounded-md px-3 py-2 text-center text-xs transition"
                                        >
                                            {labels.checkout}
                                        </Link>
                                        <Link
                                            href={`/${lang}/account/orders`}
                                            className="bg-muted hover:bg-muted/70 text-foreground rounded-md px-3 py-2 text-center text-xs transition"
                                        >
                                            {labels.orders}
                                        </Link>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href={`/${lang}/help`}
                                        className="text-muted-foreground hover:text-foreground text-xs transition"
                                    >
                                        {labels.help}
                                    </Link>
                                    <Link
                                        href={`/${lang}/about`}
                                        className="text-muted-foreground hover:text-foreground text-right text-xs transition"
                                    >
                                        {labels.about}
                                    </Link>
                                    <Link
                                        href={`/${lang}/legal/terms`}
                                        className="text-muted-foreground hover:text-foreground text-xs transition"
                                    >
                                        {labels.legal}
                                    </Link>
                                    <Link
                                        href={`/${lang}/legal/privacy`}
                                        className="text-muted-foreground hover:text-foreground text-right text-xs transition"
                                    >
                                        {labels.privacy}
                                    </Link>
                                    <Link
                                        href={`/${lang}/admin`}
                                        className="text-muted-foreground hover:text-foreground col-span-2 text-center text-xs transition"
                                    >
                                        {labels.admin}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <Separator className="my-2" />
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                    <Skeleton className="h-4 w-2/3" />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <Skeleton className="h-24 w-full rounded-xl" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
