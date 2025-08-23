'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Lang = 'en' | 'kr' | string

interface DesignSession {
    id: string
    prompt?: string
    lang?: Lang
    user_id?: string
    max_regenerations?: number | null
    max_upscales?: number | null
    regeneration_count?: number | null
    upscale_count?: number | null
    state?: string | null
    created_at?: string | null
}

interface DesignVariation {
    id: string
    session_id: string
    image_url: string | null
    thumb_url?: string | null
    status: 'ready' | 'pending' | 'failed' | 'upscaling' | 'queued'
    quality?: 'base' | 'upscaled' | null
    seed?: string | null
    created_at?: string | null
}

const t = (lang: Lang) =>
    (
        ({
            en: {
                title: 'Design Variations',
                subtitle: 'Refine your concept. Generate more options or upscale your favorites.',
                backToSession: 'Back to Session',
                selectProduct: 'Select Product',
                generateMore: 'Generate More',
                upscaling: 'Upscaling',
                upscale: 'Upscale',
                variations: 'Variations',
                pending: 'Pending',
                failed: 'Failed',
                ready: 'Ready',
                queued: 'Queued',
                selectThis: 'Use this design',
                limitReached: 'Limit reached',
                regenLeft: (used: number, max: number) => `${max - used} regenerations left`,
                upscaleLeft: (used: number, max: number) => `${max - used} upscales left`,
                noneYet: 'No variations yet.',
                createFirst: 'Create your first set of variations to get started.',
                generating: 'Generation requested',
                upsampleRequested: 'Upscale requested',
                viewProducts: 'Browse Products',
                goCart: 'Cart',
                goCheckout: 'Checkout',
                myOrders: 'My Orders',
                help: 'Help',
                admin: 'Admin',
                learnMore: 'Learn more',
                sessionNotFound: 'Design session not found.',
                errorLoading: "We couldn't load this session right now.",
                tryAgain: 'Try again',
                openSession: 'Open Session',
                legal: {
                    terms: 'Terms',
                    privacy: 'Privacy',
                    ip: 'IP Policy',
                    contact: 'Contact',
                },
            },
            kr: {
                title: '디자인 변형',
                subtitle: '아이디어를 다듬으세요. 더 생성하거나 마음에 드는 것을 업스케일하세요.',
                backToSession: '세션으로 돌아가기',
                selectProduct: '제품 선택',
                generateMore: '더 생성',
                upscaling: '업스케일 중',
                upscale: '업스케일',
                variations: '변형',
                pending: '대기 중',
                failed: '실패',
                ready: '완료',
                queued: '큐 대기',
                selectThis: '이 디자인 사용',
                limitReached: '한도 도달',
                regenLeft: (used: number, max: number) => `${max - used}회 추가 생성 가능`,
                upscaleLeft: (used: number, max: number) => `${max - used}회 업스케일 가능`,
                noneYet: '아직 변형이 없습니다.',
                createFirst: '처음 변형 세트를 생성해 시작하세요.',
                generating: '생성이 요청되었습니다',
                upsampleRequested: '업스케일이 요청되었습니다',
                viewProducts: '제품 보기',
                goCart: '장바구니',
                goCheckout: '결제',
                myOrders: '주문 내역',
                help: '도움말',
                admin: '관리자',
                learnMore: '자세히',
                sessionNotFound: '디자인 세션을 찾을 수 없습니다.',
                errorLoading: '현재 이 세션을 불러올 수 없습니다.',
                tryAgain: '다시 시도',
                openSession: '세션 열기',
                legal: {
                    terms: '이용 약관',
                    privacy: '개인정보 처리방침',
                    ip: 'IP 정책',
                    contact: '문의하기',
                },
            },
        }) as const
    )[lang as 'en' | 'kr']

const LOCAL_KEY = (sid: string) => ({
    regen: `realizeit:${sid}:regenUsed`,
    upscale: `realizeit:${sid}:upscaleUsed`,
})

function getLocalCount(key: string) {
    if (typeof window === 'undefined') return 0
    const raw = window.localStorage.getItem(key)
    const val = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(val) ? Math.max(0, val) : 0
}
function setLocalCount(key: string, value: number) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, String(Math.max(0, value)))
}

export default function VariationsPage() {
    const params = useParams<{ lang: Lang; sessionId: string }>()
    const lang = params?.lang || 'en'
    const sessionId = params?.sessionId || ''
    const { toast } = useToast()
    const router = useRouter()
    const supabase = useMemo(() => supabaseBrowser, [])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [session, setSession] = useState<DesignSession | null>(null)
    const [variations, setVariations] = useState<DesignVariation[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [regenBatch, setRegenBatch] = useState<number>(3)
    const [pendingLocal, setPendingLocal] = useState<DesignVariation[]>([])
    const realtimeRef = useRef<{ v?: any; s?: any }>({})

    const tt = t(lang)

    const limits = useMemo(() => {
        return {
            maxRegenerations: session?.max_regenerations ?? 3,
            maxUpscales: session?.max_upscales ?? 2,
        }
    }, [session])

    const localKeys = useMemo(() => LOCAL_KEY(sessionId), [sessionId])
    const regenUsed = getLocalCount(localKeys.regen)
    const upscaleUsed = getLocalCount(localKeys.upscale)

    const canRegen = regenUsed < limits.maxRegenerations
    const canUpscale = upscaleUsed < limits.maxUpscales

    const readyVariations = useMemo(
        () => variations.filter((v) => v.status === 'ready'),
        [variations]
    )

    const loadData = useCallback(async () => {
        if (!sessionId) return
        setLoading(true)
        setError(null)
        try {
            const { data: s, error: se } = await supabase
                .from('design_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (se && se.code !== 'PGRST116') throw se // ignore row not found code known; let s be null
            if (!s) {
                setSession(null)
            } else {
                setSession(s as DesignSession)
            }

            const { data: v, error: ve } = await supabase
                .from('design_variations')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false })

            if (ve) throw ve
            setVariations((v as DesignVariation[]) || [])
        } catch (err: any) {
            console.error('loadData error', err)
            setError(tt.errorLoading)
        } finally {
            setLoading(false)
        }
    }, [sessionId, supabase, tt.errorLoading])

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId])

    useEffect(() => {
        if (!sessionId) return
        const channelV = supabase
            .channel(`variations:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'design_variations',
                    filter: `session_id=eq.${sessionId}`,
                },
                () => {
                    loadData()
                }
            )
            .subscribe()

        const channelS = supabase
            .channel(`session:${sessionId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'design_sessions',
                    filter: `id=eq.${sessionId}`,
                },
                (payload) => {
                    setSession(payload.new as DesignSession)
                }
            )
            .subscribe()

        realtimeRef.current = { v: channelV, s: channelS }

        return () => {
            if (realtimeRef.current.v) supabase.removeChannel(realtimeRef.current.v)
            if (realtimeRef.current.s) supabase.removeChannel(realtimeRef.current.s)
        }
    }, [sessionId, supabase, loadData])

    const queueLocalPlaceholders = useCallback(
        (count: number) => {
            const now = Date.now()
            const placeholders: DesignVariation[] = Array.from({ length: count }).map((_, i) => ({
                id: `local-${now}-${i}`,
                session_id: sessionId,
                image_url: null,
                thumb_url: null,
                status: 'queued',
                quality: 'base',
                seed: null,
                created_at: new Date().toISOString(),
            }))
            setPendingLocal((prev) => [...placeholders, ...prev])
            return placeholders
        },
        [sessionId]
    )

    const requestRegenerate = useCallback(async () => {
        if (!canRegen) return
        const count = Math.max(1, Math.min(3, regenBatch))
        const placeholders = queueLocalPlaceholders(count)

        try {
            const { error: e1 } = await supabase
                .from('design_jobs')
                .insert({ session_id: sessionId, type: 'regenerate', count, status: 'queued' })

            if (e1) throw e1

            toast({ title: tt.generating })
            setLocalCount(localKeys.regen, regenUsed + count)
        } catch (err: any) {
            console.warn('regenerate insert failed, attempting fallback', err)
            try {
                // Fallback: attempt to call a function or alternative table name
                const { error: e2 } = await supabase
                    .from('generation_requests')
                    .insert({ session_id: sessionId, action: 'regenerate', count })
                if (e2) throw e2
                toast({ title: tt.generating })
                setLocalCount(localKeys.regen, regenUsed + count)
            } catch (err2) {
                console.error('regenerate fallback failed', err2)
                toast({
                    title: tt.errorLoading,
                    description: "We couldn't queue a generation job. Please try again.",
                    variant: 'destructive' as any,
                })
                // remove placeholders on hard failure
                setPendingLocal((prev) =>
                    prev.filter((p) => !placeholders.some((ph) => ph.id === p.id))
                )
            }
        }
    }, [
        canRegen,
        regenBatch,
        queueLocalPlaceholders,
        supabase,
        sessionId,
        toast,
        tt.generating,
        tt.errorLoading,
        localKeys.regen,
        regenUsed,
    ])

    const requestUpscale = useCallback(
        async (variation: DesignVariation) => {
            if (!canUpscale || !variation?.id) return
            const localQueued: DesignVariation = {
                ...variation,
                id: `local-upscale-${variation.id}-${Date.now()}`,
                status: 'queued',
                quality: 'upscaled',
                created_at: new Date().toISOString(),
            }
            setPendingLocal((prev) => [localQueued, ...prev])
            try {
                const { error: e1 } = await supabase.from('design_jobs').insert({
                    variation_id: variation.id,
                    session_id: sessionId,
                    type: 'upscale',
                    status: 'queued',
                })
                if (e1) throw e1
                toast({ title: tt.upsampleRequested })
                setLocalCount(localKeys.upscale, upscaleUsed + 1)
            } catch (err) {
                console.warn('upscale insert failed, attempting fallback', err)
                try {
                    const { error: e2 } = await supabase.from('generation_requests').insert({
                        variation_id: variation.id,
                        session_id: sessionId,
                        action: 'upscale',
                    })
                    if (e2) throw e2
                    toast({ title: tt.upsampleRequested })
                    setLocalCount(localKeys.upscale, upscaleUsed + 1)
                } catch (err2) {
                    console.error('upscale fallback failed', err2)
                    toast({
                        title: tt.errorLoading,
                        description: "We couldn't queue an upscale. Please try again.",
                        variant: 'destructive' as any,
                    })
                    setPendingLocal((prev) => prev.filter((p) => p.id !== localQueued.id))
                }
            }
        },
        [
            canUpscale,
            supabase,
            sessionId,
            toast,
            tt.upsampleRequested,
            tt.errorLoading,
            localKeys.upscale,
            upscaleUsed,
        ]
    )

    const allVariations = useMemo(() => {
        // merge server-side with local pending placeholders
        const mergedMap = new Map<string, DesignVariation>()
        ;[...pendingLocal, ...variations].forEach((v) => {
            mergedMap.set(v.id, v)
        })
        return Array.from(mergedMap.values()).sort((a, b) => {
            const da = a.created_at ? new Date(a.created_at).getTime() : 0
            const db = b.created_at ? new Date(b.created_at).getTime() : 0
            return db - da
        })
    }, [pendingLocal, variations])

    const sessionRootHref = `/${lang}/design/s/${sessionId}`
    const selectProductHref = (vid?: string) =>
        `/${lang}/design/s/${sessionId}/select-product${vid ? `?variationId=${encodeURIComponent(vid)}` : ''}`

    const renderStatusBadge = (v: DesignVariation) => {
        const label =
            v.status === 'ready'
                ? tt.ready
                : v.status === 'failed'
                  ? tt.failed
                  : v.status === 'queued'
                    ? tt.queued
                    : tt.pending
        const base =
            v.status === 'ready'
                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                : v.status === 'failed'
                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                    base
                )}
            >
                {label}
                {v.quality === 'upscaled' && (
                    <span className="bg-primary/10 text-primary ml-1 rounded-full px-1.5 text-[10px]">
                        4x
                    </span>
                )}
            </span>
        )
    }

    const headerNav = (
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/${lang}/products`} className="hover:text-foreground transition-colors">
                Products
            </Link>
            <span className="text-border">/</span>
            <Link href={`/${lang}/cart`} className="hover:text-foreground transition-colors">
                {tt.goCart}
            </Link>
            <span className="text-border">/</span>
            <Link href={`/${lang}/checkout`} className="hover:text-foreground transition-colors">
                {tt.goCheckout}
            </Link>
            <span className="text-border">/</span>
            <Link
                href={`/${lang}/account/orders`}
                className="hover:text-foreground transition-colors"
            >
                {tt.myOrders}
            </Link>
            <span className="text-border">/</span>
            <Link
                href={`/${lang}/(marketing)/help`}
                className="hover:text-foreground transition-colors"
            >
                {tt.help}
            </Link>
            <span className="text-border">/</span>
            <Link href={`/${lang}/admin`} className="hover:text-foreground transition-colors">
                {tt.admin}
            </Link>
        </div>
    )

    return (
        <div className="bg-background min-h-[calc(100dvh-0px)]">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={sessionRootHref}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm"
                        >
                            ← {tt.backToSession}
                        </Link>
                        <Separator orientation="vertical" className="mx-2 h-6" />
                        {headerNav}
                    </div>
                    <Link
                        href={selectProductHref(selectedId || readyVariations[0]?.id)}
                        className={cn(
                            'bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95',
                            !(selectedId || readyVariations[0]?.id) &&
                                'pointer-events-none opacity-50'
                        )}
                    >
                        {tt.selectProduct} →
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="mb-4">
                            <h1 className="text-2xl font-semibold tracking-tight">{tt.title}</h1>
                            <p className="text-muted-foreground mt-1 text-sm">{tt.subtitle}</p>
                        </div>
                        <div className="bg-card rounded-xl border p-4">
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-1/3" />
                                    <div className="relative">
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className="rounded-lg border p-2">
                                                    <Skeleton className="h-40 w-full rounded-md" />
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <Skeleton className="h-4 w-16" />
                                                        <Skeleton className="h-8 w-20" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : error ? (
                                <Alert variant="destructive" className="border-destructive/50">
                                    <AlertTitle>{tt.sessionNotFound}</AlertTitle>
                                    <AlertDescription className="mt-2">
                                        {tt.errorLoading}
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={() => loadData()}
                                                className="bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
                                            >
                                                {tt.tryAgain}
                                            </button>
                                            <Link
                                                href={sessionRootHref}
                                                className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-sm"
                                            >
                                                {tt.openSession}
                                            </Link>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ) : allVariations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                                    <div className="bg-accent/50 rounded-full p-6 text-3xl">✨</div>
                                    <div>
                                        <p className="text-lg font-medium">{tt.noneYet}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {tt.createFirst}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={requestRegenerate}
                                            disabled={!canRegen}
                                            className={cn(
                                                'bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium',
                                                !canRegen && 'opacity-50'
                                            )}
                                        >
                                            {tt.generateMore}
                                        </button>
                                        <Link
                                            href={`/${lang}/products`}
                                            className="bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm"
                                        >
                                            {tt.viewProducts}
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Carousel className="w-full">
                                        <CarouselContent className="-ml-2">
                                            {allVariations.map((v) => (
                                                <CarouselItem
                                                    key={v.id}
                                                    className="pl-2 sm:basis-1/2 lg:basis-1/3"
                                                >
                                                    <div
                                                        className={cn(
                                                            'group bg-background relative flex h-full flex-col overflow-hidden rounded-lg border'
                                                        )}
                                                    >
                                                        <div className="bg-muted relative aspect-square w-full overflow-hidden">
                                                            {v.image_url ? (
                                                                // @ts-expect-warning @next/next/no-img/element - using img to avoid Next Image domain config issues
                                                                <img
                                                                    src={v.thumb_url || v.image_url}
                                                                    alt="Variation preview"
                                                                    className={cn(
                                                                        'h-full w-full object-cover transition-transform duration-300',
                                                                        v.status !== 'ready' &&
                                                                            'opacity-80 blur-[1px]'
                                                                    )}
                                                                />
                                                            ) : (
                                                                <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                                                                    —
                                                                </div>
                                                            )}
                                                            <div className="absolute top-2 left-2 flex items-center gap-2">
                                                                {renderStatusBadge(v)}
                                                            </div>
                                                            <div className="absolute top-2 right-2">
                                                                <input
                                                                    type="radio"
                                                                    name="selected-variation"
                                                                    checked={selectedId === v.id}
                                                                    onChange={() =>
                                                                        setSelectedId(v.id)
                                                                    }
                                                                    className="accent-primary h-4 w-4 cursor-pointer"
                                                                    aria-label="Select variation"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2 p-3">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        requestUpscale(v)
                                                                    }
                                                                    disabled={
                                                                        !canUpscale ||
                                                                        v.status !== 'ready'
                                                                    }
                                                                    className={cn(
                                                                        'rounded-md border px-3 py-1.5 text-xs font-medium',
                                                                        v.status === 'ready'
                                                                            ? 'hover:bg-accent'
                                                                            : 'opacity-50',
                                                                        !canUpscale && 'opacity-50'
                                                                    )}
                                                                >
                                                                    {tt.upscale}
                                                                </button>
                                                                <button
                                                                    onClick={requestRegenerate}
                                                                    disabled={!canRegen}
                                                                    className={cn(
                                                                        'hover:bg-accent rounded-md border px-3 py-1.5 text-xs font-medium',
                                                                        !canRegen && 'opacity-50'
                                                                    )}
                                                                >
                                                                    + {tt.variations}
                                                                </button>
                                                            </div>
                                                            <Link
                                                                href={selectProductHref(v.id)}
                                                                className={cn(
                                                                    'bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium',
                                                                    v.status !== 'ready' &&
                                                                        'pointer-events-none opacity-50'
                                                                )}
                                                            >
                                                                {tt.selectThis}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <div className="mt-3 flex items-center justify-between">
                                            <CarouselPrevious className="relative" />
                                            <CarouselNext className="relative" />
                                        </div>
                                    </Carousel>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="lg:col-span-1">
                        <div className="sticky top-4 space-y-6">
                            <div className="bg-card rounded-xl border p-4">
                                <h2 className="text-muted-foreground text-sm font-semibold tracking-wide">
                                    Controls
                                </h2>
                                <div className="mt-3 space-y-4">
                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="font-medium">{tt.generateMore}</span>
                                            <span className="text-muted-foreground">
                                                {tt.regenLeft(regenUsed, limits.maxRegenerations)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3].map((n) => (
                                                <button
                                                    key={n}
                                                    onClick={() => setRegenBatch(n)}
                                                    className={cn(
                                                        'flex h-9 w-9 items-center justify-center rounded-md border text-sm',
                                                        regenBatch === n
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'hover:bg-accent'
                                                    )}
                                                    aria-label={`Set generate count to ${n}`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                            <button
                                                onClick={requestRegenerate}
                                                disabled={!canRegen}
                                                className={cn(
                                                    'bg-primary text-primary-foreground ml-auto rounded-md px-3 py-2 text-sm font-medium',
                                                    !canRegen && 'opacity-50'
                                                )}
                                            >
                                                {tt.generateMore}
                                            </button>
                                        </div>
                                        {!canRegen && (
                                            <p className="text-muted-foreground mt-2 text-xs">
                                                {tt.limitReached}
                                            </p>
                                        )}
                                    </div>

                                    <Separator />

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm">
                                            <span className="font-medium">{tt.upscaling}</span>
                                            <span className="text-muted-foreground">
                                                {tt.upscaleLeft(upscaleUsed, limits.maxUpscales)}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-xs">
                                            Select a finished variation and click Upscale to
                                            increase resolution for printing.
                                        </p>
                                        {!canUpscale && (
                                            <p className="text-muted-foreground mt-2 text-xs">
                                                {tt.limitReached}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card rounded-xl border p-4">
                                <h2 className="text-muted-foreground text-sm font-semibold tracking-wide">
                                    Navigate
                                </h2>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <Link
                                        href={sessionRootHref}
                                        className="hover:bg-accent rounded-md border px-3 py-2"
                                    >
                                        {tt.backToSession}
                                    </Link>
                                    <Link
                                        href={selectProductHref(
                                            selectedId || readyVariations[0]?.id
                                        )}
                                        className="hover:bg-accent rounded-md border px-3 py-2"
                                    >
                                        {tt.selectProduct}
                                    </Link>
                                    <Link
                                        href={`/${lang}/products`}
                                        className="hover:bg-accent rounded-md border px-3 py-2"
                                    >
                                        Products
                                    </Link>
                                    <Link
                                        href={`/${lang}/account`}
                                        className="hover:bg-accent rounded-md border px-3 py-2"
                                    >
                                        Account
                                    </Link>
                                    <Link
                                        href={`/${lang}/orders`}
                                        className="hover:bg-accent rounded-md border px-3 py-2"
                                    >
                                        Orders
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/about`}
                                        className="hover:bg-accent rounded-md border px-3 py-2"
                                    >
                                        About
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-card rounded-xl border p-4">
                                <h2 className="text-muted-foreground text-sm font-semibold tracking-wide">
                                    Legal
                                </h2>
                                <div className="text-muted-foreground mt-3 flex flex-wrap gap-3 text-xs">
                                    <Link
                                        className="hover:text-foreground"
                                        href={`/${lang}/(marketing)/legal/terms`}
                                    >
                                        {tt.legal.terms}
                                    </Link>
                                    <Link
                                        className="hover:text-foreground"
                                        href={`/${lang}/(marketing)/legal/privacy`}
                                    >
                                        {tt.legal.privacy}
                                    </Link>
                                    <Link
                                        className="hover:text-foreground"
                                        href={`/${lang}/(marketing)/legal/ip-policy`}
                                    >
                                        {tt.legal.ip}
                                    </Link>
                                    <Link
                                        className="hover:text-foreground"
                                        href={`/${lang}/(marketing)/contact`}
                                    >
                                        {tt.legal.contact}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
