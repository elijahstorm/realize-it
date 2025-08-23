'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type Locale = 'en' | 'ko'

const DICT: Record<Locale, any> = {
    en: {
        brand: 'RealizeIt',
        tagline: 'Turn your idea into a real product — automatically',
        sub: 'Describe what you want. We generate the design, prepare print files, take payment, and auto-place your Printify order to Korea.',
        primary: 'Start designing',
        secondary: 'Browse catalog',
        signIn: 'Sign in',
        cart: 'Cart',
        products: 'Products',
        about: 'About',
        help: 'Help',
        contact: 'Contact',
        howTitle: 'How it works',
        howDesc: 'From prompt to shipped product in minutes — no uploads, no design tools.',
        steps: [
            {
                t: 'Tell us your idea',
                d: 'Write a short prompt in English or Korean — style, vibe, colors, or any required text.',
            },
            {
                t: 'AI creates designs',
                d: 'Solar Pro2 crafts a design brief and we generate high‑res artwork with multiple variations.',
            },
            {
                t: 'Preview on products',
                d: 'See mockups on tees, hoodies, mugs, totes, and more. No manual editing required.',
            },
            {
                t: 'Pick and customize',
                d: 'Choose size, color, and variant. Localized pricing with a transparent 20% margin.',
            },
            {
                t: 'Secure checkout',
                d: 'Pay with Stripe. We immediately create and submit your Printify order for production.',
            },
            {
                t: 'Track to delivery',
                d: 'Real‑time order status and tracking updates for shipments to South Korea.',
            },
        ],
        ctas: {
            design: 'Create your first design',
            products: 'Explore products',
            account: 'Manage your account',
            orders: 'View your orders',
            checkout: 'Go to checkout',
        },
        badges: {
            aiOnly: 'AI‑only generation',
            kr: 'KR‑ready fulfillment',
            stripe: 'Stripe secure',
            printify: 'Powered by Printify',
        },
        track: {
            title: 'Track an order',
            placeholder: 'Enter tracking code',
            button: 'Track',
            invalid: 'Please enter a valid tracking code.',
        },
        legal: {
            terms: 'Terms',
            privacy: 'Privacy',
            ip: 'IP Policy',
        },
        quickLinks: 'Quick links',
    },
    ko: {
        brand: 'RealizeIt',
        tagline: '아이디어를 실제 제품으로 — 자동으로 완료',
        sub: '원하는 제품을 설명하세요. 우리는 디자인을 생성하고, 인쇄 파일을 준비하고, 결제를 처리하며, Printify 주문을 한국으로 자동 제출합니다.',
        primary: '디자인 시작하기',
        secondary: '카탈로그 보기',
        signIn: '로그인',
        cart: '장바구니',
        products: '제품',
        about: '소개',
        help: '도움말',
        contact: '문의',
        howTitle: '진행 방식',
        howDesc: '프롬프트부터 배송까지 몇 분이면 충분 — 업로드도, 디자인 도구도 필요 없습니다.',
        steps: [
            {
                t: '아이디어 입력',
                d: '원하는 스타일, 분위기, 색상, 포함할 문구 등을 한국어 또는 영어로 간단히 작성하세요.',
            },
            {
                t: 'AI 디자인 생성',
                d: 'Solar Pro2가 디자인 브리프를 만들고 고해상도 아트워크를 여러 버전으로 생성합니다.',
            },
            {
                t: '제품 미리보기',
                d: '티셔츠, 후디, 머그컵, 토트백 등 다양한 제품에 실시간 목업을 보여드립니다.',
            },
            {
                t: '선택 및 옵션 설정',
                d: '사이즈, 색상, 버전을 선택하세요. Printify 원가에 20% 마진이 투명하게 적용됩니다.',
            },
            {
                t: '안전한 결제',
                d: 'Stripe로 결제 후 즉시 Printify 주문이 생성되어 생산에 들어갑니다.',
            },
            {
                t: '배송 추적',
                d: '대한민국 배송을 위한 실시간 주문 상태 및 운송장 추적을 제공합니다.',
            },
        ],
        ctas: {
            design: '첫 디자인 만들기',
            products: '제품 살펴보기',
            account: '내 계정 관리',
            orders: '주문 내역 보기',
            checkout: '결제 진행하기',
        },
        badges: {
            aiOnly: 'AI 전용 생성',
            kr: '대한민국 배송 지원',
            stripe: 'Stripe 보안 결제',
            printify: 'Printify 연동',
        },
        track: {
            title: '주문 추적',
            placeholder: '운송장(추적) 코드를 입력하세요',
            button: '조회',
            invalid: '올바른 추적 코드를 입력해 주세요.',
        },
        legal: {
            terms: '이용약관',
            privacy: '개인정보처리방침',
            ip: 'IP 정책',
        },
        quickLinks: '바로가기',
    },
}

export default function Page({ params }: { params: { lang: string } }) {
    const router = useRouter()
    const pathname = usePathname()
    const { lang: langParam } = useParams()
    const lang: Locale = langParam === 'ko' || langParam === 'kr' ? 'ko' : 'en'
    const t = DICT[lang]

    const [tracking, setTracking] = useState('')
    const [trackError, setTrackError] = useState<string | null>(null)

    const base = useMemo(() => `/${lang}`, [lang])

    const submitTrack = (e: React.FormEvent) => {
        e.preventDefault()
        const code = tracking.trim()
        if (!code || code.length < 4) {
            setTrackError(t.track.invalid)
            return
        }
        setTrackError(null)
        router.push(`${base}/track/${encodeURIComponent(code)}`)
    }

    return (
        <div className="bg-background text-foreground flex min-h-screen flex-col">
            {/* Hero */}
            <section className="relative isolate overflow-hidden">
                <div className="from-muted/40 via-background to-background absolute inset-0 -z-10 bg-gradient-to-b" />
                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                        <div>
                            <div className="border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>{t.badges.aiOnly}</span>
                                <span className="mx-1">•</span>
                                <span>{t.badges.kr}</span>
                                <span className="mx-1">•</span>
                                <span>{t.badges.printify}</span>
                            </div>
                            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                                <span className="from-foreground to-foreground/70 bg-gradient-to-b bg-clip-text text-transparent">
                                    {t.tagline}
                                </span>
                            </h1>
                            <p className="text-muted-foreground mt-4 max-w-xl text-base sm:text-lg">
                                {t.sub}
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={`${base}/design`}
                                    className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium shadow transition-shadow hover:shadow-md"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 19V5" />
                                        <path d="M5 12l7-7 7 7" />
                                    </svg>
                                    {t.primary}
                                </Link>
                                <Link
                                    href={`${base}/products`}
                                    className="border-input bg-background hover:bg-muted/60 inline-flex items-center justify-center rounded-md border px-5 py-3 text-sm font-medium transition-colors"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="4" width="18" height="12" rx="2" />
                                        <path d="M2 20h20" />
                                    </svg>
                                    {t.secondary}
                                </Link>
                            </div>
                            <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <Link
                                    href={`${base}/(auth)/sign-in`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    {t.signIn}
                                </Link>
                                <span>·</span>
                                <Link
                                    href={`${base}/orders`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    {lang === 'en' ? 'Order history' : '주문 내역'}
                                </Link>
                                <span>·</span>
                                <Link
                                    href={`${base}/checkout`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    {lang === 'en' ? 'Checkout' : '결제'}
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="border-border bg-card/70 rounded-xl border p-4 shadow-sm backdrop-blur sm:p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <FeatureCard
                                        icon="palette"
                                        title={
                                            lang === 'en' ? 'Generative design' : '생성형 디자인'
                                        }
                                        desc={
                                            lang === 'en'
                                                ? 'High‑res PNGs and mockups, optimized for print.'
                                                : '인쇄에 최적화된 고해상도 PNG와 목업.'
                                        }
                                    />
                                    <FeatureCard
                                        icon="shirt"
                                        title={
                                            lang === 'en' ? 'Apparel & more' : '의류 및 다양한 상품'
                                        }
                                        desc={
                                            lang === 'en'
                                                ? 'Tees, hoodies, mugs, totes, stickers, and more.'
                                                : '티셔츠, 후디, 머그컵, 토트백, 스티커 등.'
                                        }
                                    />
                                    <FeatureCard
                                        icon="wand"
                                        title={lang === 'en' ? 'No uploads' : '업로드 불필요'}
                                        desc={
                                            lang === 'en'
                                                ? 'AI‑only generation with smart brief orchestration.'
                                                : 'AI 전용 생성 및 자동 브리프 구성.'
                                        }
                                    />
                                    <FeatureCard
                                        icon="shield"
                                        title={lang === 'en' ? 'Stripe secure' : '보안 결제'}
                                        desc={
                                            lang === 'en'
                                                ? 'Live capture with instant order submission.'
                                                : '실시간 결제와 즉시 주문 제출.'
                                        }
                                    />
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <Link
                                        href={`${base}/products`}
                                        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                                    >
                                        {lang === 'en' ? 'See all products' : '전체 제품 보기'}
                                    </Link>
                                    <Link
                                        href={`${base}/(marketing)/about`}
                                        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                                    >
                                        {lang === 'en' ? 'Learn more about us' : '서비스 소개'}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="bg-muted/30 py-14">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <h2 className="text-2xl font-semibold sm:text-3xl">{t.howTitle}</h2>
                        <p className="text-muted-foreground mt-2">{t.howDesc}</p>
                    </div>
                    <ol className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {t.steps.map((s: any, i: number) => (
                            <li
                                key={i}
                                className="group border-border bg-card relative rounded-xl border p-5 shadow-sm"
                            >
                                <div className="bg-primary text-primary-foreground absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shadow">
                                    {i + 1}
                                </div>
                                <div className="mt-2 flex items-start gap-3">
                                    <StepIcon index={i} />
                                    <div>
                                        <h3 className="font-medium">{s.t}</h3>
                                        <p className="text-muted-foreground mt-1 text-sm">{s.d}</p>
                                    </div>
                                </div>
                                <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
                                    {i === 0 && (
                                        <Link
                                            href={`${base}/design`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            {lang === 'en' ? 'Try a prompt' : '프롬프트 작성'}
                                        </Link>
                                    )}
                                    {i === 2 && (
                                        <Link
                                            href={`${base}/products`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            {lang === 'en' ? 'Browse templates' : '템플릿 보기'}
                                        </Link>
                                    )}
                                    {i === 4 && (
                                        <Link
                                            href={`${base}/checkout`}
                                            className="hover:text-foreground underline underline-offset-4"
                                        >
                                            {lang === 'en' ? 'Proceed to checkout' : '결제 진행'}
                                        </Link>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>

                    {/* Tracking form */}
                    <div className="mt-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
                        <div className="border-border bg-card rounded-xl border p-5">
                            <h3 className="font-medium">{t.track.title}</h3>
                            <form
                                onSubmit={submitTrack}
                                className="mt-3 flex flex-col gap-2 sm:flex-row"
                            >
                                <input
                                    type="text"
                                    value={tracking}
                                    onChange={(e) => setTracking(e.target.value)}
                                    placeholder={t.track.placeholder}
                                    className="border-input bg-background focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm ring-0 outline-none focus-visible:ring-2"
                                />
                                <button
                                    type="submit"
                                    className="bg-secondary text-secondary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
                                >
                                    {t.track.button}
                                </button>
                            </form>
                            {trackError && (
                                <p className="text-destructive mt-2 text-sm">{trackError}</p>
                            )}
                            <div className="text-muted-foreground mt-3 text-xs">
                                <Link
                                    href={`${base}/orders`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    {lang === 'en' ? 'See my orders' : '내 주문 보기'}
                                </Link>
                            </div>
                        </div>
                        <div className="border-border bg-card rounded-xl border p-5">
                            <h3 className="font-medium">
                                {lang === 'en' ? 'Quick links' : t.quickLinks}
                            </h3>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <LinkTile href={`${base}/design`} label={t.ctas.design} />
                                <LinkTile href={`${base}/products`} label={t.ctas.products} />
                                <LinkTile href={`${base}/(auth)/sign-in`} label={t.signIn} />
                                <LinkTile href={`${base}/account`} label={t.ctas.account} />
                                <LinkTile href={`${base}/orders`} label={t.ctas.orders} />
                                <LinkTile href={`${base}/cart`} label={t.cart} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Secondary CTA */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="border-border from-primary/10 via-accent/10 to-secondary/10 relative overflow-hidden rounded-2xl border bg-gradient-to-r p-8 sm:p-10">
                        <div className="max-w-2xl">
                            <h3 className="text-2xl font-semibold">
                                {lang === 'en'
                                    ? 'Ready to see your idea on a product?'
                                    : '당신의 아이디어를 제품으로 만나보세요'}
                            </h3>
                            <p className="text-muted-foreground mt-2">
                                {lang === 'en'
                                    ? 'No uploads or editors — just your words. We handle Printify, Stripe, and tracking.'
                                    : '업로드와 편집기 없이 텍스트만 입력하세요. Printify, Stripe, 배송 추적까지 모두 처리합니다.'}
                            </p>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={`${base}/design`}
                                    className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-medium shadow transition-shadow hover:shadow-md"
                                >
                                    {t.primary}
                                </Link>
                                <Link
                                    href={`${base}/(marketing)/help`}
                                    className="border-input bg-background hover:bg-muted/60 inline-flex items-center justify-center rounded-md border px-5 py-3 text-sm font-medium transition-colors"
                                >
                                    {lang === 'en' ? 'Need help?' : '도움이 필요하신가요?'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

function FeatureCard({
    icon,
    title,
    desc,
}: {
    icon: 'palette' | 'shirt' | 'wand' | 'shield'
    title: string
    desc: string
}) {
    return (
        <div className="border-border bg-background flex items-start gap-3 rounded-lg border p-4">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                {icon === 'palette' && (
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22a10 10 0 1 0-10-10c0 3 2 2 4 2a3 3 0 0 1 3 3c0 2 1 3 3 3h0" />
                        <circle cx="7.5" cy="10.5" r="1" />
                        <circle cx="12" cy="7.5" r="1" />
                        <circle cx="16.5" cy="10.5" r="1" />
                    </svg>
                )}
                {icon === 'shirt' && (
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M16 3H8l-2 3-3 1 3 5v7h12v-7l3-5-3-1-2-3z" />
                    </svg>
                )}
                {icon === 'wand' && (
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M15 4V2" />
                        <path d="M15 8V6" />
                        <path d="M3 15l6 6" />
                        <path d="M13 13l6 6" />
                        <path d="M8 3l1.88 1.88" />
                        <path d="M14.12 9.12L16 11" />
                    </svg>
                )}
                {icon === 'shield' && (
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                )}
            </div>
            <div>
                <p className="leading-none font-medium">{title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
            </div>
        </div>
    )
}

function StepIcon({ index }: { index: number }) {
    const iconIndex = index % 6
    switch (iconIndex) {
        case 0:
            return (
                <svg
                    className="text-primary mt-0.5 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M4 21v-7a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v7" />
                    <path d="M9 10V5a3 3 0 1 1 6 0v5" />
                </svg>
            )
        case 1:
            return (
                <svg
                    className="text-primary mt-0.5 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="18" height="14" rx="2" />
                    <path d="M8 21h8" />
                </svg>
            )
        case 2:
            return (
                <svg
                    className="text-primary mt-0.5 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15V6a2 2 0 0 0-2-2h-3l-1-1h-6l-1 1H4a2 2 0 0 0-2 2v9" />
                    <path d="M3 21h18" />
                    <path d="M16 13a4 4 0 0 1-8 0" />
                </svg>
            )
        case 3:
            return (
                <svg
                    className="text-primary mt-0.5 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 1v22" />
                    <path d="M5 8l7-7 7 7" />
                </svg>
            )
        case 4:
            return (
                <svg
                    className="text-primary mt-0.5 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M2 10h20" />
                </svg>
            )
        default:
            return (
                <svg
                    className="text-primary mt-0.5 h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M20 21v-8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8" />
                    <circle cx="12" cy="7" r="3" />
                </svg>
            )
    }
}

function LinkTile({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group border-border bg-background hover:bg-muted/60 flex items-center justify-between rounded-lg border p-3 transition-colors"
        >
            <span>{label}</span>
            <svg
                className="text-muted-foreground group-hover:text-foreground h-4 w-4"
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
        </Link>
    )
}
