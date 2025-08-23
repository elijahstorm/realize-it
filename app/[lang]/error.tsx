'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type ErrorProps = {
    error: Error & { digest?: string }
    reset: () => void
}

const dict = {
    en: {
        title: 'Something went wrong',
        subtitle: 'An unexpected error occurred. You can try the following steps to recover.',
        primaryActions: {
            tryAgain: 'Try again',
            goHome: 'Go to Home',
            help: 'Help Center',
        },
        recovery: {
            header: 'Quick recovery steps',
            steps: [
                'Retry the last action.',
                'Return to the homepage and navigate again.',
                'Check your orders to ensure nothing was double-submitted.',
                'If you completed payment, verify your receipt in Billing or Orders.',
                'Visit Help Center or Contact us if the issue persists.',
            ],
        },
        explore: {
            header: 'Explore the app',
        },
        technical: {
            header: 'Technical details',
            show: 'Show details',
            hide: 'Hide details',
            copy: 'Copy details',
            copied: 'Copied!',
        },
        links: {
            products: 'Browse Products',
            design: 'Start a Design',
            cart: 'View Cart',
            checkout: 'Checkout',
            account: 'My Account',
            orders: 'My Orders',
            billing: 'Billing',
            help: 'Help Center',
            contact: 'Contact Support',
            about: 'About',
            terms: 'Terms',
            privacy: 'Privacy',
            ip: 'IP Policy',
            admin: 'Admin Dashboard',
            adminHealth: 'System Health',
            adminOrders: 'Admin Orders',
            adminLogs: 'Logs',
            adminAnalytics: 'Analytics',
        },
        note: 'If this keeps happening, include the reference code below when contacting support.',
        back: 'Go back',
        refresh: 'Refresh',
    },
    ko: {
        title: '문제가 발생했습니다',
        subtitle: '예기치 않은 오류가 발생했습니다. 아래 방법으로 복구를 시도해 보세요.',
        primaryActions: {
            tryAgain: '다시 시도',
            goHome: '홈으로 가기',
            help: '도움말 센터',
        },
        recovery: {
            header: '빠른 복구 단계',
            steps: [
                '방금 시도한 작업을 다시 시도하세요.',
                '홈으로 돌아가 다시 이동해 보세요.',
                '주문 내역에서 중복 제출이 없는지 확인하세요.',
                '결제를 완료했다면 결제 내역 또는 주문에서 영수증을 확인하세요.',
                '문제가 지속되면 도움말 센터 또는 문의하기로 연락하세요.',
            ],
        },
        explore: {
            header: '다른 페이지로 이동',
        },
        technical: {
            header: '기술 정보',
            show: '자세히 보기',
            hide: '숨기기',
            copy: '내용 복사',
            copied: '복사됨!',
        },
        links: {
            products: '제품 둘러보기',
            design: '디자인 시작하기',
            cart: '장바구니',
            checkout: '결제하기',
            account: '내 계정',
            orders: '주문 내역',
            billing: '결제/청구',
            help: '도움말 센터',
            contact: '문의하기',
            about: '회사 소개',
            terms: '이용약관',
            privacy: '개인정보 처리방침',
            ip: 'IP 정책',
            admin: '관리자 대시보드',
            adminHealth: '시스템 상태',
            adminOrders: '관리자 주문',
            adminLogs: '로그',
            adminAnalytics: '분석',
        },
        note: '이 문제가 계속되면 아래 참조 코드를 포함하여 문의해 주세요.',
        back: '뒤로 가기',
        refresh: '새로고침',
    },
    kr: undefined as any, // alias handled at runtime
}

export default function Error({ error, reset }: ErrorProps) {
    const params = useParams()
    const router = useRouter()
    const langParam = String((params as any)?.lang ?? 'en').toLowerCase()
    const locale =
        langParam === 'kr' ? 'ko' : langParam in dict ? (langParam as keyof typeof dict) : 'en'
    const t = (dict as any)[locale] as typeof dict.en

    const [copied, setCopied] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        // Surface the error to the console for observability.
        // External monitoring can hook into window.onerror in production.
        // Avoid exposing full stack to users.
        console.error(error)
    }, [error])

    const reference = useMemo(() => error?.digest || undefined, [error])

    const details = useMemo(() => {
        const parts: string[] = []
        parts.push(`Message: ${error?.message ?? 'Unknown error'}`)
        if (reference) parts.push(`Reference: ${reference}`)
        if (typeof window !== 'undefined') {
            parts.push(`URL: ${window.location.href}`)
            parts.push(`User Agent: ${navigator.userAgent}`)
            parts.push(`Time: ${new Date().toISOString()}`)
            parts.push(`Locale: ${locale}`)
        }
        return parts.join('\n')
    }, [error?.message, reference, locale])

    const base = `/${langParam}`

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(details)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div className="bg-background text-foreground flex min-h-[100dvh] items-center justify-center p-6">
            <div className="from-primary/15 pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent" />

            <div className="relative z-10 w-full max-w-4xl">
                <div className="border-border bg-card text-card-foreground overflow-hidden rounded-xl border shadow-xl">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {t.title}
                                </h1>
                                <p className="text-muted-foreground mt-2">{t.subtitle}</p>
                            </div>
                            <Link
                                href={base}
                                className="bg-primary text-primary-foreground focus-visible:ring-ring hidden items-center rounded-lg px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none sm:inline-flex"
                            >
                                {t.primaryActions.goHome}
                            </Link>
                        </div>

                        <Alert className="mt-6">
                            <AlertTitle> {error?.name || 'Error'} </AlertTitle>
                            <AlertDescription className="mt-1 line-clamp-3">
                                {error?.message || 'An unknown error occurred.'}
                            </AlertDescription>
                        </Alert>

                        <div className="mt-6 grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                                    {t.recovery.header}
                                </h2>
                                <ul className="mt-3 space-y-2 text-sm">
                                    {t.recovery.steps.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 rounded-full" />
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => reset()}
                                        className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        {t.primaryActions.tryAgain}
                                    </button>
                                    <button
                                        onClick={() => router.back()}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        {t.back}
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        {t.refresh}
                                    </button>
                                    <Link
                                        href={`${base}/help`}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        {t.primaryActions.help}
                                    </Link>
                                </div>

                                <Collapsible open={open} onOpenChange={setOpen} className="mt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                {t.technical.header}
                                            </h3>
                                            {reference ? (
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Ref: {reference}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleCopy}
                                                className={cn(
                                                    'border-input inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium',
                                                    copied
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                                )}
                                            >
                                                {copied ? t.technical.copied : t.technical.copy}
                                            </button>
                                            <CollapsibleTrigger asChild>
                                                <button className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium">
                                                    {open ? t.technical.hide : t.technical.show}
                                                </button>
                                            </CollapsibleTrigger>
                                        </div>
                                    </div>
                                    <CollapsibleContent>
                                        <pre className="bg-muted text-muted-foreground mt-3 max-h-56 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                                            {details}
                                        </pre>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>

                            <div className="lg:col-span-1">
                                <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                                    {t.explore.header}
                                </h2>
                                <div className="mt-3 grid grid-cols-1 gap-2">
                                    <NavLink href={`${base}/products`} label={t.links.products} />
                                    <NavLink href={`${base}/design`} label={t.links.design} />
                                    <NavLink href={`${base}/cart`} label={t.links.cart} />
                                    <NavLink href={`${base}/checkout`} label={t.links.checkout} />
                                    <NavLink href={`${base}/account`} label={t.links.account} />
                                    <NavLink href={`${base}/orders`} label={t.links.orders} />
                                    <NavLink
                                        href={`${base}/account/billing`}
                                        label={t.links.billing}
                                    />
                                    <NavLink href={`${base}/help`} label={t.links.help} />
                                    <NavLink href={`${base}/contact`} label={t.links.contact} />
                                </div>

                                <Separator className="my-4" />

                                <div className="grid grid-cols-1 gap-2">
                                    <NavLink href={`${base}/about`} label={t.links.about} />
                                    <NavLink href={`${base}/legal/terms`} label={t.links.terms} />
                                    <NavLink
                                        href={`${base}/legal/privacy`}
                                        label={t.links.privacy}
                                    />
                                    <NavLink href={`${base}/legal/ip-policy`} label={t.links.ip} />
                                </div>

                                <Separator className="my-4" />

                                <div className="grid grid-cols-1 gap-2">
                                    <NavLink href={`${base}/admin`} label={t.links.admin} />
                                    <NavLink
                                        href={`${base}/admin/health`}
                                        label={t.links.adminHealth}
                                    />
                                    <NavLink
                                        href={`${base}/admin/orders`}
                                        label={t.links.adminOrders}
                                    />
                                    <NavLink
                                        href={`${base}/admin/logs`}
                                        label={t.links.adminLogs}
                                    />
                                    <NavLink
                                        href={`${base}/admin/analytics`}
                                        label={t.links.adminAnalytics}
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-muted-foreground mt-6 text-xs">{t.note}</p>
                    </div>

                    <div className="bg-muted/50 p-4 sm:p-6">
                        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                            <div className="text-muted-foreground text-sm">
                                <Link href={base} className="font-medium hover:underline">
                                    RealizeIt
                                </Link>{' '}
                                · POC
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href={base}
                                    className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-xs font-medium hover:opacity-95"
                                >
                                    {t.primaryActions.goHome}
                                </Link>
                                <Link
                                    href={`${base}/help`}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-xs font-medium"
                                >
                                    {t.primaryActions.help}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function NavLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
            <span>{label}</span>
            <span className="bg-secondary text-secondary-foreground ml-2 grid h-5 w-5 place-items-center rounded-full transition-transform group-hover:translate-x-0.5">
                →
            </span>
        </Link>
    )
}
