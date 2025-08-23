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
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type SessionRecord = Record<string, any> | null

type AssetRecord = {
    id?: string
    preview_url?: string | null
    mockup_urls?: string[] | null
    title?: string | null
    notes?: string | null
    [key: string]: any
} | null

export default function ApprovalPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const lang = String(params?.lang || 'en')
    const sessionId = String(params?.sessionId || '')

    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [session, setSession] = React.useState<SessionRecord>(null)
    const [asset, setAsset] = React.useState<AssetRecord>(null)
    const [consent, setConsent] = React.useState(false)

    const locale = React.useMemo(() => {
        if (['ko', 'kr', 'ko-KR'].includes(lang)) return 'ko-KR'
        return 'en-US'
    }, [lang])

    const currency = React.useMemo(() => {
        const c = (session?.currency as string) || (locale === 'ko-KR' ? 'KRW' : 'USD')
        return c
    }, [session?.currency, locale])

    const formatMoney = React.useCallback(
        (amount: number) => {
            try {
                return new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency,
                    currencyDisplay: 'symbol',
                    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
                }).format(amount)
            } catch {
                return `${amount.toFixed(2)} ${currency}`
            }
        },
        [locale, currency]
    )

    React.useEffect(() => {
        let active = true

        async function load() {
            setLoading(true)
            setError(null)
            try {
                const sb = supabaseBrowser
                const { data: sessionRow, error: sErr } = await sb
                    .from('design_sessions')
                    .select('*')
                    .eq('id', sessionId)
                    .single()
                if (sErr) throw sErr
                if (!active) return
                setSession(sessionRow)

                const selectedAssetId = sessionRow?.selected_asset_id || sessionRow?.asset_id
                if (selectedAssetId) {
                    const { data: assetRow, error: aErr } = await sb
                        .from('design_assets')
                        .select('*')
                        .eq('id', selectedAssetId)
                        .single()
                    if (aErr) {
                        // Not fatal
                        console.warn('design_assets fetch error', aErr)
                    }
                    if (!active) return
                    setAsset(assetRow || null)
                }
            } catch (e: any) {
                console.error(e)
                if (!active) return
                setError(e?.message || 'Failed to load session.')
            } finally {
                if (active) setLoading(false)
            }
        }

        if (sessionId) load()
        return () => {
            active = false
        }
    }, [sessionId])

    const productSlug: string | null = React.useMemo(() => {
        return (session?.product_slug as string) || null
    }, [session?.product_slug])

    const qty = Number(session?.quantity || 1)
    const baseCost = Number(session?.cost_printify ?? session?.base_cost ?? session?.unit_cost ?? 0)
    const markupPercent = Number(session?.markup_percent ?? 20)
    const retailEach = Number(
        session?.retail_price_each ??
            session?.retail_each ??
            (baseCost ? baseCost * (1 + markupPercent / 100) : 0)
    )
    const subtotal = retailEach * qty

    const mockups: string[] = React.useMemo(() => {
        const arr = (asset?.mockup_urls as string[] | null) || []
        const preview = asset?.preview_url ? [asset.preview_url] : []
        // Ensure unique and non-empty
        const all = [...arr, ...preview].filter(Boolean)
        return Array.from(new Set(all))
    }, [asset?.mockup_urls, asset?.preview_url])

    const designTitle: string = String(
        asset?.title || session?.design_title || session?.title || 'Design Preview'
    )

    const handleProceed = async () => {
        if (!consent) {
            toast({
                title: locale === 'ko-KR' ? '동의 필요' : 'Consent required',
                description:
                    locale === 'ko-KR'
                        ? '체크아웃을 진행하려면 이용 약관과 IP 정책에 동의해야 합니다.'
                        : 'You must agree to the Terms and IP Policy before continuing.',
                variant: 'destructive',
            })
            return
        }
        setSaving(true)
        try {
            const sb = supabaseBrowser
            const { error: upErr } = await sb
                .from('design_sessions')
                .update({
                    consent_accepted: true,
                    consent_accepted_at: new Date().toISOString(),
                    status:
                        session?.status === 'configuring'
                            ? 'approved'
                            : session?.status || 'approved',
                })
                .eq('id', sessionId)
            if (upErr) throw upErr

            // Preserve sessionId for checkout if needed
            const url = `/${lang}/checkout${searchParams?.toString() ? `?${searchParams!.toString()}` : `?sessionId=${encodeURIComponent(sessionId)}`}`
            router.push(url)
        } catch (e: any) {
            console.error(e)
            toast({
                title: locale === 'ko-KR' ? '체크아웃 오류' : 'Checkout Error',
                description:
                    e?.message ||
                    (locale === 'ko-KR'
                        ? '진행 중 문제가 발생했습니다.'
                        : 'Something went wrong while proceeding to checkout.'),
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const editHref = productSlug
        ? `/${lang}/design/s/${encodeURIComponent(sessionId)}/configure/${encodeURIComponent(productSlug)}`
        : `/${lang}/design/s/${encodeURIComponent(sessionId)}/select-product`

    return (
        <main className="bg-background text-foreground min-h-[calc(100vh-4rem)]">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {locale === 'ko-KR' ? '최종 승인' : 'Final Approval'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {locale === 'ko-KR'
                                ? '디자인과 상품을 확인하고 결제 단계로 진행하세요.'
                                : 'Review your design and product configuration before checkout.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Link
                            href={`/${lang}/products`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {locale === 'ko-KR' ? '제품' : 'Products'}
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <Link
                            href={`/${lang}/help`.replace('/', '')}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {locale === 'ko-KR' ? '도움말' : 'Help'}
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <Link
                            href={`/${lang}/cart`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {locale === 'ko-KR' ? '장바구니' : 'Cart'}
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <Link
                            href={`/${lang}/account`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {locale === 'ko-KR' ? '계정' : 'Account'}
                        </Link>
                    </div>
                </div>

                <nav aria-label="Progress" className="mb-6">
                    <ol className="grid grid-cols-4 gap-2 text-xs">
                        <li>
                            <Link
                                href={`/${lang}/design/s/${encodeURIComponent(sessionId)}/variations`}
                                className="border-border bg-card text-muted-foreground hover:text-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                {locale === 'ko-KR' ? '디자인 선택' : 'Variations'}
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`/${lang}/design/s/${encodeURIComponent(sessionId)}/select-product`}
                                className="border-border bg-card text-muted-foreground hover:text-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                {locale === 'ko-KR' ? '상품 선택' : 'Select Product'}
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={editHref}
                                className="border-border bg-card text-muted-foreground hover:text-foreground block rounded-md border px-3 py-2 text-center"
                            >
                                {locale === 'ko-KR' ? '구성' : 'Configure'}
                            </Link>
                        </li>
                        <li>
                            <span className="border-primary bg-primary text-primary-foreground block rounded-md border px-3 py-2 text-center">
                                {locale === 'ko-KR' ? '승인' : 'Approval'}
                            </span>
                        </li>
                    </ol>
                </nav>

                {error ? (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>
                            {locale === 'ko-KR' ? '불러오기 실패' : 'Failed to load'}
                        </AlertTitle>
                        <AlertDescription>
                            {error}
                            <div className="mt-2 text-sm">
                                <Link
                                    href={`/${lang}/contact`.replace('/', '')}
                                    className="underline"
                                >
                                    {locale === 'ko-KR' ? '지원팀에 문의' : 'Contact support'}
                                </Link>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <section className="lg:col-span-7">
                        <div className="border-border bg-card rounded-lg border">
                            <div className="flex items-center justify-between px-5 py-4">
                                <div>
                                    <h2 className="text-lg font-medium">{designTitle}</h2>
                                    <p className="text-muted-foreground text-xs">
                                        {locale === 'ko-KR'
                                            ? '생성된 디자인 미리보기'
                                            : 'AI-generated design preview'}
                                    </p>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                    <Link
                                        href={`/${lang}/design/s/${encodeURIComponent(sessionId)}/variations`}
                                        className="hover:underline"
                                    >
                                        {locale === 'ko-KR'
                                            ? '다른 버전 보기'
                                            : 'View alternatives'}
                                    </Link>
                                </div>
                            </div>
                            <Separator />
                            <div className="p-5">
                                {loading ? (
                                    <div className="bg-muted aspect-square w-full overflow-hidden rounded-md">
                                        <Skeleton className="h-full w-full" />
                                    </div>
                                ) : mockups.length > 0 ? (
                                    <div className="relative">
                                        <Carousel className="w-full">
                                            <CarouselContent>
                                                {mockups.map((url, idx) => (
                                                    <CarouselItem key={idx}>
                                                        <div className="border-border bg-background aspect-square overflow-hidden rounded-md border">
                                                            {/* Use img instead of next/image to avoid remote config issues */}
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={url}
                                                                alt={designTitle}
                                                                className="h-full w-full object-contain"
                                                                loading={
                                                                    idx === 0 ? 'eager' : 'lazy'
                                                                }
                                                            />
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="left-2" />
                                            <CarouselNext className="right-2" />
                                        </Carousel>
                                    </div>
                                ) : (
                                    <div className="border-border bg-muted/40 aspect-square w-full overflow-hidden rounded-md border border-dashed text-center">
                                        <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2">
                                            <span className="text-sm">
                                                {locale === 'ko-KR'
                                                    ? '미리보기가 없습니다'
                                                    : 'No preview available'}
                                            </span>
                                            <Link
                                                href={`/${lang}/design/s/${encodeURIComponent(sessionId)}/variations`}
                                                className="text-xs underline"
                                            >
                                                {locale === 'ko-KR'
                                                    ? '다른 디자인 선택'
                                                    : 'Choose a different design'}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="border-border bg-card rounded-lg border p-5">
                                <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                                    {locale === 'ko-KR' ? '상품 정보' : 'Product'}
                                </h3>
                                {loading ? (
                                    <>
                                        <Skeleton className="mb-2 h-4 w-40" />
                                        <Skeleton className="h-4 w-24" />
                                    </>
                                ) : (
                                    <div className="text-sm">
                                        <p className="font-medium">
                                            {session?.product_title ||
                                                session?.product_name ||
                                                (productSlug
                                                    ? productSlug.replace(/-/g, ' ')
                                                    : locale === 'ko-KR'
                                                      ? '상품 미지정'
                                                      : 'Unspecified product')}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {(session?.variant_name as string) ||
                                                [session?.color, session?.size, session?.variant_id]
                                                    .filter(Boolean)
                                                    .join(' • ') ||
                                                (locale === 'ko-KR'
                                                    ? '옵션 미지정'
                                                    : 'Options not set')}
                                        </p>
                                        <div className="text-muted-foreground mt-2 text-xs">
                                            <Link href={editHref} className="underline">
                                                {locale === 'ko-KR'
                                                    ? '구성 수정'
                                                    : 'Edit configuration'}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-border bg-card rounded-lg border p-5">
                                <h3 className="text-muted-foreground mb-2 text-sm font-medium">
                                    {locale === 'ko-KR' ? '디자인 메모' : 'Design Notes'}
                                </h3>
                                {loading ? (
                                    <>
                                        <Skeleton className="mb-2 h-4 w-full" />
                                        <Skeleton className="mb-2 h-4 w-3/4" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </>
                                ) : (
                                    <p className="text-muted-foreground text-sm">
                                        {asset?.notes ||
                                            session?.design_brief ||
                                            (locale === 'ko-KR'
                                                ? '제안된 색상, 문구, 스타일은 디자인 브리프에 따라 생성되었습니다.'
                                                : 'Proposed colors, text, and style were generated from your brief.')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <aside className="lg:col-span-5">
                        <div className="border-border bg-card sticky top-6 rounded-lg border p-5">
                            <h2 className="text-base font-semibold">
                                {locale === 'ko-KR' ? '주문 요약' : 'Order Summary'}
                            </h2>
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '수량' : 'Quantity'}
                                    </span>
                                    <span className="font-medium">{qty}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '단가' : 'Price (each)'}
                                    </span>
                                    <span className="font-medium">
                                        {loading ? (
                                            <Skeleton className="h-4 w-20" />
                                        ) : (
                                            formatMoney(retailEach || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR'
                                            ? '공급가 (Printify)'
                                            : 'Base cost (Printify)'}
                                    </span>
                                    <span className="font-medium">
                                        {loading ? (
                                            <Skeleton className="h-4 w-20" />
                                        ) : (
                                            formatMoney(baseCost || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '마진' : 'Margin'}
                                    </span>
                                    <span className="font-medium">
                                        {loading ? (
                                            <Skeleton className="h-4 w-12" />
                                        ) : (
                                            `${markupPercent}%`
                                        )}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between text-base">
                                    <span className="font-medium">
                                        {locale === 'ko-KR' ? '소계' : 'Subtotal'}
                                    </span>
                                    <span className="font-semibold">
                                        {loading ? (
                                            <Skeleton className="h-5 w-24" />
                                        ) : (
                                            formatMoney(subtotal || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '배송비' : 'Shipping'}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR'
                                            ? '결제 시 계산'
                                            : 'Calculated at checkout'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '세금' : 'Taxes'}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR'
                                            ? '결제 시 계산'
                                            : 'Calculated at checkout'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-border bg-muted/20 text-muted-foreground mt-5 rounded-md border border-dashed p-4 text-xs">
                                {locale === 'ko-KR'
                                    ? '결제 완료 후 주문은 자동으로 Printify에 제출되며, 진행 상황은 주문 내역에서 추적할 수 있습니다.'
                                    : 'After payment, your order is automatically submitted to Printify. You can track status in your orders.'}
                                <div className="mt-2">
                                    <Link href={`/${lang}/orders`} className="underline">
                                        {locale === 'ko-KR' ? '주문 내역 보기' : 'View your orders'}
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        className="border-input text-primary ring-offset-background focus-visible:ring-ring mt-0.5 h-4 w-4 cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                    />
                                    <span className="text-foreground text-sm">
                                        {locale === 'ko-KR'
                                            ? '주문을 진행함으로써 '
                                            : 'By proceeding, you agree to the '}
                                        <Link href={`/${lang}/legal/terms`} className="underline">
                                            {locale === 'ko-KR' ? '이용 약관' : 'Terms'}
                                        </Link>
                                        {locale === 'ko-KR' ? ' 및 ' : ' and '}
                                        <Link
                                            href={`/${lang}/legal/ip-policy`}
                                            className="underline"
                                        >
                                            {locale === 'ko-KR' ? 'IP 정책' : 'IP Policy'}
                                        </Link>
                                        {locale === 'ko-KR'
                                            ? '에 동의하며, 디자인이 AI에 의해 생성되었음을 인정합니다.'
                                            : ', and acknowledge the design is AI-generated.'}
                                    </span>
                                </label>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button
                                    onClick={handleProceed}
                                    disabled={!consent || saving || loading}
                                    className={cn(
                                        'bg-primary text-primary-foreground focus:ring-ring inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus:ring-2 focus:ring-offset-2 focus:outline-none sm:w-auto',
                                        (!consent || saving || loading) &&
                                            'cursor-not-allowed opacity-60'
                                    )}
                                >
                                    {saving
                                        ? locale === 'ko-KR'
                                            ? '진행 중...'
                                            : 'Processing...'
                                        : locale === 'ko-KR'
                                          ? '결제 진행'
                                          : 'Proceed to Checkout'}
                                </button>
                                <Link
                                    href={editHref}
                                    className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring inline-flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition focus:ring-2 focus:ring-offset-2 focus:outline-none sm:w-auto"
                                >
                                    {locale === 'ko-KR' ? '구성 수정' : 'Edit Configuration'}
                                </Link>
                            </div>

                            <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                                <Link href={`/${lang}/products`} className="hover:underline">
                                    {locale === 'ko-KR' ? '다른 제품 탐색' : 'Explore products'}
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/about`.replace('/', '')}
                                    className="hover:underline"
                                >
                                    {locale === 'ko-KR' ? '회사 소개' : 'About'}
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/contact`.replace('/', '')}
                                    className="hover:underline"
                                >
                                    {locale === 'ko-KR' ? '문의하기' : 'Contact'}
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    )
}
