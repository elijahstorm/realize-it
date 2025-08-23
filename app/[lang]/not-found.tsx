'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import React from 'react'

export default function NotFound() {
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()

    const rawLang = String(params?.lang ?? 'en').toLowerCase()
    const isKorean = rawLang === 'kr' || rawLang === 'ko' || rawLang.startsWith('ko')
    const lang = isKorean ? (rawLang.startsWith('ko') ? 'ko' : 'kr') : 'en'
    const otherLang = isKorean ? 'en' : 'kr'

    const switchLocalePath = React.useMemo(() => {
        try {
            const parts = (pathname || '/' + lang).split('/')
            if (parts.length > 1) {
                parts[1] = otherLang
                return parts.join('/') || `/${otherLang}`
            }
            return `/${otherLang}`
        } catch {
            return `/${otherLang}`
        }
    }, [pathname, otherLang, lang])

    const t = isKorean
        ? {
              title: '페이지를 찾을 수 없어요',
              description:
                  '요청하신 주소가 변경되었거나 존재하지 않습니다. 아래 빠른 링크로 이동해 보세요.',
              ctaDesign: 'AI 디자인 시작하기',
              ctaProducts: '제품 둘러보기',
              ctaHome: '홈으로',
              tryThese: '자주 찾는 페이지',
              searchTracking: '배송 조회',
              trackingPlaceholder: '트래킹 코드 입력',
              trackingGo: '조회',
              back: '이전 페이지',
              more: '더 많은 링크',
              or: '또는',
              localeSwitch: '영어로 보기',
          }
        : {
              title: "We can't find that page",
              description:
                  "The page you’re looking for may have moved or doesn't exist. Try one of these destinations.",
              ctaDesign: 'Start an AI Design',
              ctaProducts: 'Browse Products',
              ctaHome: 'Go Home',
              tryThese: 'Popular destinations',
              searchTracking: 'Track a shipment',
              trackingPlaceholder: 'Enter tracking code',
              trackingGo: 'Track',
              back: 'Go Back',
              more: 'More links',
              or: 'or',
              localeSwitch: 'View in Korean',
          }

    const base = `/${lang}`

    const primaryLinks = [
        { href: base, label: t.ctaHome },
        { href: `${base}/design`, label: t.ctaDesign },
        { href: `${base}/products`, label: t.ctaProducts },
    ]

    const moreLinks = [
        { href: `${base}/about`, label: isKorean ? '소개' : 'About' },
        { href: `${base}/help`, label: isKorean ? '도움말' : 'Help' },
        { href: `${base}/contact`, label: isKorean ? '문의하기' : 'Contact' },
        { href: `${base}/cart`, label: isKorean ? '장바구니' : 'Cart' },
        { href: `${base}/checkout`, label: isKorean ? '결제' : 'Checkout' },
        { href: `${base}/orders`, label: isKorean ? '주문내역' : 'Orders' },
        { href: `${base}/account`, label: isKorean ? '내 계정' : 'Account' },
        { href: `${base}/sign-in`, label: isKorean ? '로그인' : 'Sign in' },
        { href: `${base}/sign-up`, label: isKorean ? '회원가입' : 'Sign up' },
        { href: `${base}/legal/terms`, label: isKorean ? '이용약관' : 'Terms' },
        { href: `${base}/legal/privacy`, label: isKorean ? '개인정보처리방침' : 'Privacy' },
        { href: `${base}/legal/ip-policy`, label: isKorean ? 'IP 정책' : 'IP Policy' },
        { href: `${base}/admin`, label: isKorean ? '관리자' : 'Admin' },
        { href: `${base}/admin/orders`, label: isKorean ? '관리자: 주문' : 'Admin: Orders' },
        { href: `${base}/admin/analytics`, label: isKorean ? '관리자: 분석' : 'Admin: Analytics' },
    ]

    const [tracking, setTracking] = React.useState('')

    function onTrackSubmit(e: React.FormEvent) {
        e.preventDefault()
        const code = tracking.trim()
        if (!code) return
        router.push(`${base}/track/${encodeURIComponent(code)}`)
    }

    return (
        <main className="bg-background text-foreground flex min-h-[100svh] items-center">
            <div className="container mx-auto px-6 py-16">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="border-border bg-muted text-muted-foreground inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs">
                        404
                    </p>
                    <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
                        <span className="from-primary to-chart-3 bg-gradient-to-r bg-clip-text text-transparent">
                            {t.title}
                        </span>
                    </h1>
                    <p className="text-muted-foreground mt-4 text-base sm:text-lg">
                        {t.description}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={primaryLinks[1].href}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 shadow-sm transition-colors focus:ring-2 focus:outline-none"
                        >
                            {primaryLinks[1].label}
                        </Link>
                        <Link
                            href={primaryLinks[2].href}
                            className="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring inline-flex items-center gap-2 rounded-lg border px-4 py-2 shadow-sm transition-colors focus:ring-2 focus:outline-none"
                        >
                            {primaryLinks[2].label}
                        </Link>
                        <Link
                            href={primaryLinks[0].href}
                            className="border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring inline-flex items-center gap-2 rounded-lg border px-4 py-2 shadow-sm transition-colors focus:ring-2 focus:outline-none"
                        >
                            {primaryLinks[0].label}
                        </Link>
                    </div>

                    <div className="text-muted-foreground mt-8 text-sm">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            ← {t.back}
                        </button>
                        <span className="px-2">{t.or}</span>
                        <Link
                            href={switchLocalePath}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            {t.localeSwitch}
                        </Link>
                    </div>
                </div>

                <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
                    <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
                        <h2 className="text-base font-medium">{t.tryThese}</h2>
                        <ul className="mt-4 space-y-2">
                            <li>
                                <Link
                                    href={`${base}/design`}
                                    className="group hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                >
                                    <span>
                                        {isKorean ? '나만의 제품 만들기' : 'Create your product'}
                                    </span>
                                    <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                        →
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`${base}/products`}
                                    className="group hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                >
                                    <span>{isKorean ? '전체 제품 보기' : 'See all products'}</span>
                                    <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                        →
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`${base}/help`}
                                    className="group hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                >
                                    <span>{isKorean ? '도움말 센터' : 'Help Center'}</span>
                                    <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                        →
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`${base}/orders`}
                                    className="group hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                                >
                                    <span>{isKorean ? '내 주문 확인' : 'View my orders'}</span>
                                    <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                        →
                                    </span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
                        <h2 className="text-base font-medium">{t.searchTracking}</h2>
                        <form onSubmit={onTrackSubmit} className="mt-4 flex gap-2">
                            <input
                                value={tracking}
                                onChange={(e) => setTracking(e.target.value)}
                                inputMode="text"
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                placeholder={t.trackingPlaceholder}
                                aria-label={t.trackingPlaceholder}
                            />
                            <button
                                type="submit"
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-ring inline-flex shrink-0 items-center rounded-lg px-4 py-2 transition-colors focus:ring-2 focus:outline-none"
                            >
                                {t.trackingGo}
                            </button>
                        </form>
                        <p className="text-muted-foreground mt-3 text-xs">
                            {isKorean
                                ? '결제 완료 후 발급된 트래킹 코드로 배송 상태를 확인하세요.'
                                : 'Use the tracking code from your order to check shipping status.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            <Link
                                href={`${base}/contact`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                {isKorean ? '지원팀에 문의' : 'Contact Support'}
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href={`${base}/about`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                {isKorean ? '회사 소개' : 'About us'}
                            </Link>
                        </div>
                    </div>
                </div>

                <section className="border-border bg-card mx-auto mt-12 max-w-5xl rounded-xl border p-6 shadow-sm">
                    <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                        {t.more}
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {moreLinks.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="group hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                            >
                                <span className="truncate">{l.label}</span>
                                <span className="text-muted-foreground group-hover:text-accent-foreground transition-colors">
                                    →
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}
