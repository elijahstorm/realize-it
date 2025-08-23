'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

type FAQ = {
    id: string
    category:
        | 'Payments'
        | 'Shipping'
        | 'Returns'
        | 'Orders'
        | 'Design'
        | 'Account'
        | 'Legal'
        | 'Pricing'
    q: { en: string; ko: string }
    aText: { en: string; ko: string }
    render: (lang: string) => React.ReactNode
}

export default function HelpPage() {
    const params = useParams()
    const langParam =
        (Array.isArray(params?.lang) ? params.lang[0] : (params?.lang as string)) || 'en'
    const isKR = ['ko', 'kr', 'ko-kr', 'kr-kr'].includes(String(langParam).toLowerCase())
    const lang = isKR ? 'ko' : 'en'
    const l = (path: string) => `/${langParam}${path}`

    const title = isKR ? '도움말 및 자주 묻는 질문' : 'Help & Frequently Asked Questions'
    const subtitle = isKR
        ? '결제, 한국 배송, 반품 정책 등 주요 질문에 대한 답변을 확인하세요.'
        : 'Find answers about payments, shipping to Korea, returns, and more.'

    const faqs: FAQ[] = [
        {
            id: 'payments-1',
            category: 'Payments',
            q: {
                en: 'What payment methods do you accept?',
                ko: '어떤 결제 수단을 지원하나요?',
            },
            aText: {
                en: 'We use Stripe for secure checkout. Most major cards are accepted.',
                ko: '안전한 결제를 위해 Stripe를 사용하며 대부분의 주요 카드를 지원합니다.',
            },
            render: (lng) => (
                <div className="space-y-3">
                    <p className="text-muted-foreground text-sm">
                        {lng === 'ko'
                            ? '안전한 결제를 위해 Stripe(스트라이프)를 사용합니다. Visa, MasterCard, American Express 등 주요 신용/체크카드를 지원하며, 결제 정보는 암호화되어 처리됩니다.'
                            : 'We process payments securely with Stripe. We accept major credit/debit cards including Visa, MasterCard, and American Express. Your payment details are encrypted and never stored on our servers.'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {lng === 'ko' ? (
                            <>
                                결제 단계에서 문제가 발생하면{' '}
                                <Link
                                    href={l('/contact')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    고객센터에 문의
                                </Link>
                                해주세요.
                            </>
                        ) : (
                            <>
                                If you run into issues at checkout, please{' '}
                                <Link
                                    href={l('/contact')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    contact support
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'payments-2',
            category: 'Payments',
            q: {
                en: 'Which currency is charged?',
                ko: '어떤 통화로 결제되나요?',
            },
            aText: {
                en: 'Stripe will charge in your selected currency when available; otherwise USD.',
                ko: '가능한 경우 선택한 통화로 결제되며, 그렇지 않으면 USD로 결제됩니다.',
            },
            render: (lng) => (
                <p className="text-muted-foreground text-sm">
                    {lng === 'ko'
                        ? '가능한 경우 현지 통화로 결제되며, 지원되지 않는 경우 USD로 처리됩니다. 최종 환율 및 수수료는 카드 발급사 정책에 따릅니다.'
                        : 'When supported, we charge in your local currency; otherwise, payment is processed in USD. Your bank or card provider determines the final exchange rate and any fees.'}
                </p>
            ),
        },
        {
            id: 'pricing-1',
            category: 'Pricing',
            q: {
                en: 'How are prices calculated?',
                ko: '가격은 어떻게 계산되나요?',
            },
            aText: {
                en: 'We apply a default 20% retail markup over supplier (Printify) cost plus taxes and shipping.',
                ko: '공급가(프린티파이) 기준에 20% 리테일 마진과 세금/배송비가 포함됩니다.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko'
                            ? '표시 가격은 Printify 공급가에 20% 마진을 적용한 금액이며, 결제 단계에서 세금과 배송비가 더해질 수 있습니다.'
                            : 'Displayed prices include a default 20% retail markup over Printify supplier costs. Taxes and shipping may be added at checkout.'}
                    </p>
                    <p>
                        {lng === 'ko' ? (
                            <>
                                자세한 내용은{' '}
                                <Link
                                    href={l('/legal/terms')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    이용약관
                                </Link>
                                을 참고하세요.
                            </>
                        ) : (
                            <>
                                See our{' '}
                                <Link
                                    href={l('/legal/terms')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Terms of Service
                                </Link>{' '}
                                for details.
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'shipping-1',
            category: 'Shipping',
            q: {
                en: 'Do you ship to South Korea?',
                ko: '대한민국으로 배송하나요?',
            },
            aText: {
                en: 'Yes. We ship to South Korea via Printify fulfillment partners.',
                ko: '네. Printify 협력사를 통해 대한민국으로 배송합니다.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko'
                            ? '대한민국 대부분의 지역으로 배송됩니다. 상품/제작소 위치에 따라 통상 7~15 영업일이 소요됩니다.'
                            : 'We deliver to most regions in Korea. Typical delivery time is 7–15 business days depending on product and provider location.'}
                    </p>
                    <p>
                        {lng === 'ko' ? (
                            <>
                                주문 상태는{' '}
                                <Link
                                    href={l('/orders')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    주문 내역
                                </Link>
                                에서 확인하거나, 발송 후 제공되는 운송장 링크로 추적하세요.
                            </>
                        ) : (
                            <>
                                Track progress in your{' '}
                                <Link
                                    href={l('/orders')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Orders
                                </Link>{' '}
                                page or via the tracking link provided after shipment.
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'shipping-2',
            category: 'Shipping',
            q: {
                en: 'How much is shipping and duties to KR?',
                ko: '한국 배송비와 관세는 어떻게 되나요?',
            },
            aText: {
                en: 'Shipping is calculated at checkout. Duties/taxes may apply per Korean customs rules.',
                ko: '배송비는 결제 시 산정되며, 관세/부가세는 한국 관세 규정에 따라 부과될 수 있습니다.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko'
                            ? '배송비는 품목과 목적지에 따라 달라지며 결제 단계에서 확인할 수 있습니다. 해외 직배송 특성상 관세/부가세가 별도 부과될 수 있습니다.'
                            : 'Shipping fees vary by item and destination and are shown at checkout. Cross-border shipments may incur duties or VAT per KR customs policy.'}
                    </p>
                    <p>
                        {lng === 'ko' ? (
                            <>
                                도움이 필요하시면{' '}
                                <Link
                                    href={l('/contact')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    문의하기
                                </Link>
                                를 통해 연락 주세요.
                            </>
                        ) : (
                            <>
                                Need help estimating costs?{' '}
                                <Link
                                    href={l('/contact')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Contact us
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'returns-1',
            category: 'Returns',
            q: {
                en: 'What is your return/refund policy?',
                ko: '반품/환불 정책은 어떻게 되나요?',
            },
            aText: {
                en: 'Made-to-order items are final sale. Defects or printing issues are eligible for replacement or refund.',
                ko: '주문 제작 상품은 단순 변심 반품이 불가합니다. 불량 또는 인쇄 문제는 교환/환불 대상입니다.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko'
                            ? 'AI 생성 디자인의 주문 제작 특성상 단순 변심으로 인한 반품/환불은 불가합니다. 상품 하자, 오배송, 심각한 인쇄 결함 등은 사진 증빙과 함께 접수해 주시면 교환 또는 환불해 드립니다.'
                            : 'Because items are made-to-order with AI-generated artwork, we cannot accept returns for change of mind. If your item arrives damaged, incorrect, or with significant print defects, contact us with photos for a replacement or refund.'}
                    </p>
                    <p>
                        {lng === 'ko' ? (
                            <>
                                자세한 약관은{' '}
                                <Link
                                    href={l('/legal/terms')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    이용약관
                                </Link>
                                을 확인하세요.
                            </>
                        ) : (
                            <>
                                See our{' '}
                                <Link
                                    href={l('/legal/terms')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Terms
                                </Link>{' '}
                                for full policy details.
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'orders-1',
            category: 'Orders',
            q: {
                en: 'Can I cancel or change my order?',
                ko: '주문 취소/변경이 가능한가요?',
            },
            aText: {
                en: 'Orders are auto-submitted to production after payment. We can sometimes catch it if you contact support immediately.',
                ko: '결제 후 주문이 즉시 제작으로 넘어갑니다. 즉시 고객센터로 연락하시면 제한적으로 조치가 가능할 수 있습니다.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko'
                            ? '결제 직후 자동으로 제작이 시작되기 때문에 취소/변경이 어려울 수 있습니다. 가능 여부는 제작 상태에 따라 다르며, 최대한 빨리 문의해 주세요.'
                            : "We auto-submit to production right after payment, so cancellations/changes are limited and depend on production status. Message us immediately and we'll try our best."}
                    </p>
                    <p>
                        {lng === 'ko' ? (
                            <>
                                주문 관리는{' '}
                                <Link
                                    href={l('/orders')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    주문 내역
                                </Link>
                                에서 확인하세요.
                            </>
                        ) : (
                            <>
                                Manage your orders on the{' '}
                                <Link
                                    href={l('/orders')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Orders page
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'orders-2',
            category: 'Orders',
            q: {
                en: 'How do I track my shipment?',
                ko: '배송은 어떻게 조회하나요?',
            },
            aText: {
                en: 'We provide a tracking link when your order ships. You can also check the Orders page.',
                ko: '발송 시 추적 링크를 제공하며, 주문 내역 페이지에서도 확인할 수 있습니다.',
            },
            render: (lng) => (
                <p className="text-muted-foreground text-sm">
                    {lng === 'ko' ? (
                        <>
                            주문이 발송되면 이메일과{' '}
                            <Link
                                href={l('/orders')}
                                className="text-primary underline underline-offset-4"
                            >
                                주문 내역
                            </Link>
                            에 추적 링크가 표시됩니다.
                        </>
                    ) : (
                        <>
                            Once shipped, we send you a tracking link and display it in your{' '}
                            <Link
                                href={l('/orders')}
                                className="text-primary underline underline-offset-4"
                            >
                                Orders
                            </Link>{' '}
                            page.
                        </>
                    )}
                </p>
            ),
        },
        {
            id: 'design-1',
            category: 'Design',
            q: {
                en: 'Can I upload my own design?',
                ko: '내 이미지를 업로드할 수 있나요?',
            },
            aText: {
                en: 'This POC enforces AI-only generation. Customer uploads are not supported.',
                ko: '현재 POC는 AI 전용 생성만 허용하며, 고객 업로드는 지원하지 않습니다.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko'
                            ? '현재 버전은 자연어 프롬프트로 AI가 디자인을 생성하는 방식만 지원합니다.'
                            : 'At this stage, only AI-generated designs are supported from your text prompts.'}
                    </p>
                    <p>
                        {lng === 'ko' ? (
                            <>
                                새 디자인을 시작하려면{' '}
                                <Link
                                    href={l('/design')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    디자인 시작하기
                                </Link>
                                를 눌러 주세요.
                            </>
                        ) : (
                            <>
                                To start, head to{' '}
                                <Link
                                    href={l('/design')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Start Designing
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'design-2',
            category: 'Design',
            q: {
                en: 'How many design options will I see?',
                ko: '디자인 옵션은 몇 개가 생성되나요?',
            },
            aText: {
                en: 'You get 3 AI-generated options per request, with live mockups.',
                ko: '요청당 AI가 3개의 옵션을 생성하며, 목업 미리보기를 제공합니다.',
            },
            render: (lng) => (
                <p className="text-muted-foreground text-sm">
                    {lng === 'ko'
                        ? '각 요청마다 3개의 디자인을 제안하며, 제품 목업으로 바로 확인할 수 있습니다. 마음에 드는 옵션을 선택하고 사이즈/색상을 구성한 뒤 장바구니에 담으세요.'
                        : 'Each request returns 3 design options with instant product mockups. Choose your favorite, configure size/color, and add to cart.'}
                </p>
            ),
        },
        {
            id: 'account-1',
            category: 'Account',
            q: {
                en: 'Do I need an account?',
                ko: '계정이 꼭 필요한가요?',
            },
            aText: {
                en: "You can browse and design without an account, but you'll need one to track orders and manage addresses.",
                ko: '계정 없이도 둘러보고 디자인할 수 있지만, 주문 추적과 주소 관리를 위해서는 계정이 필요합니다.',
            },
            render: (lng) => (
                <p className="text-muted-foreground text-sm">
                    {lng === 'ko' ? (
                        <>
                            {''}계정을 만들거나 로그인하려면{' '}
                            <Link
                                href={l('/(auth)/sign-in').replace('/(auth)', '')}
                                className="text-primary underline underline-offset-4"
                            >
                                로그인
                            </Link>{' '}
                            또는{' '}
                            <Link
                                href={l('/(auth)/sign-up').replace('/(auth)', '')}
                                className="text-primary underline underline-offset-4"
                            >
                                가입하기
                            </Link>
                            를 이용하세요. 프로필과 배송지는{' '}
                            <Link
                                href={l('/account/settings')}
                                className="text-primary underline underline-offset-4"
                            >
                                계정 설정
                            </Link>
                            에서 관리할 수 있습니다.
                        </>
                    ) : (
                        <>
                            To sign in or create an account, visit{' '}
                            <Link
                                href={l('/(auth)/sign-in').replace('/(auth)', '')}
                                className="text-primary underline underline-offset-4"
                            >
                                Sign in
                            </Link>{' '}
                            or{' '}
                            <Link
                                href={l('/(auth)/sign-up').replace('/(auth)', '')}
                                className="text-primary underline underline-offset-4"
                            >
                                Sign up
                            </Link>
                            . Manage profile and addresses in{' '}
                            <Link
                                href={l('/account/settings')}
                                className="text-primary underline underline-offset-4"
                            >
                                Account Settings
                            </Link>
                            .
                        </>
                    )}
                </p>
            ),
        },
        {
            id: 'legal-1',
            category: 'Legal',
            q: {
                en: 'Who owns the rights to AI-generated designs?',
                ko: 'AI 생성 디자인의 권리는 누구에게 있나요?',
            },
            aText: {
                en: 'See our IP policy for ownership and usage terms.',
                ko: '소유권 및 사용 조건은 당사 IP 정책을 참고하세요.',
            },
            render: (lng) => (
                <div className="text-muted-foreground space-y-2 text-sm">
                    <p>
                        {lng === 'ko' ? (
                            <>
                                자세한 내용은{' '}
                                <Link
                                    href={l('/legal/ip-policy')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    지식재산권 정책
                                </Link>
                                과{' '}
                                <Link
                                    href={l('/legal/terms')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    이용약관
                                </Link>
                                을 확인하세요.
                            </>
                        ) : (
                            <>
                                For ownership, licensing, and permitted use, please review our{' '}
                                <Link
                                    href={l('/legal/ip-policy')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    IP Policy
                                </Link>{' '}
                                and{' '}
                                <Link
                                    href={l('/legal/terms')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Terms of Service
                                </Link>
                                .
                            </>
                        )}
                    </p>
                </div>
            ),
        },
        {
            id: 'checkout-1',
            category: 'Payments',
            q: {
                en: 'How do I complete checkout?',
                ko: '결제는 어떻게 완료하나요?',
            },
            aText: {
                en: 'Add a product to cart and proceed to checkout. After payment, your order is auto-submitted.',
                ko: '상품을 장바구니에 담고 결제로 이동하세요. 결제 완료 후 주문은 자동으로 접수됩니다.',
            },
            render: (lng) => (
                <p className="text-muted-foreground text-sm">
                    {lng === 'ko' ? (
                        <>
                            {''}
                            <Link
                                href={l('/cart')}
                                className="text-primary underline underline-offset-4"
                            >
                                장바구니
                            </Link>
                            에서 품목을 확인한 뒤{' '}
                            <Link
                                href={l('/checkout')}
                                className="text-primary underline underline-offset-4"
                            >
                                결제하기
                            </Link>
                            로 진행하세요.
                        </>
                    ) : (
                        <>
                            Review items in your{' '}
                            <Link
                                href={l('/cart')}
                                className="text-primary underline underline-offset-4"
                            >
                                Cart
                            </Link>{' '}
                            and proceed to{' '}
                            <Link
                                href={l('/checkout')}
                                className="text-primary underline underline-offset-4"
                            >
                                Checkout
                            </Link>
                            .
                        </>
                    )}
                </p>
            ),
        },
    ]

    const categories = Array.from(new Set(faqs.map((f) => f.category)))
    const [query, setQuery] = React.useState('')
    const [activeCategory, setActiveCategory] = React.useState<string | 'all'>('all')
    const [openSet, setOpenSet] = React.useState<Set<string>>(new Set())

    const filtered = faqs.filter((f) => {
        const inCategory = activeCategory === 'all' || f.category === activeCategory
        const text = `${f.q.en} ${f.q.ko} ${f.aText.en} ${f.aText.ko}`.toLowerCase()
        const matches = text.includes(query.toLowerCase())
        return inCategory && matches
    })

    const toggleAll = (open: boolean) => {
        if (open) {
            setOpenSet(new Set(filtered.map((f) => f.id)))
        } else {
            setOpenSet(new Set())
        }
    }

    const isOpen = (id: string) => openSet.has(id)
    const setItemOpen = (id: string, open: boolean) => {
        setOpenSet((prev) => {
            const next = new Set(prev)
            if (open) next.add(id)
            else next.delete(id)
            return next
        })
    }

    return (
        <div className="bg-background text-foreground min-h-[calc(100vh-4rem)]">
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                {title}
                            </h1>
                            <p className="text-muted-foreground mt-2">{subtitle}</p>
                        </div>
                        <Link
                            href={l('/contact')}
                            className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none"
                        >
                            {isKR ? '도움 요청' : 'Get help'}
                        </Link>
                    </div>

                    <Alert className="border-border mt-6">
                        <AlertTitle>{isKR ? '한국 배송 안내' : 'Shipping to Korea'}</AlertTitle>
                        <AlertDescription className="text-muted-foreground mt-1">
                            {isKR ? (
                                <>
                                    대부분의 주문은 7~15 영업일 내 도착합니다. 관세/부가세는 별도
                                    부과될 수 있습니다. 자세한 내용은{' '}
                                    <Link
                                        href={l('/orders')}
                                        className="text-primary underline underline-offset-4"
                                    >
                                        주문 내역
                                    </Link>
                                    에서 추적 정보를 확인하거나, 문제가 있을 경우{' '}
                                    <Link
                                        href={l('/contact')}
                                        className="text-primary underline underline-offset-4"
                                    >
                                        고객센터
                                    </Link>
                                    로 문의해 주세요.
                                </>
                            ) : (
                                <>
                                    Most orders arrive within 7–15 business days. Duties/VAT may
                                    apply. Check tracking in your{' '}
                                    <Link
                                        href={l('/orders')}
                                        className="text-primary underline underline-offset-4"
                                    >
                                        Orders
                                    </Link>{' '}
                                    or{' '}
                                    <Link
                                        href={l('/contact')}
                                        className="text-primary underline underline-offset-4"
                                    >
                                        contact support
                                    </Link>
                                    .
                                </>
                            )}
                        </AlertDescription>
                    </Alert>
                </header>

                <section className="border-border bg-card text-card-foreground mb-8 rounded-lg border p-4 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                            <label htmlFor="faq-search" className="sr-only">
                                {isKR ? 'FAQ 검색' : 'Search FAQs'}
                            </label>
                            <div className="relative">
                                <input
                                    id="faq-search"
                                    type="text"
                                    placeholder={
                                        isKR
                                            ? '키워드로 검색 (예: 결제, 배송, 반품)'
                                            : 'Search by keyword (e.g., payments, shipping, returns)'
                                    }
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-4 py-2 text-sm outline-none focus-visible:ring-2"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveCategory('all')}
                                className={cn(
                                    'rounded-md border px-3 py-1.5 text-sm',
                                    activeCategory === 'all'
                                        ? 'bg-primary text-primary-foreground border-transparent'
                                        : 'bg-background border-border hover:bg-muted'
                                )}
                            >
                                {isKR ? '전체' : 'All'}
                            </button>
                            {categories.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setActiveCategory(c)}
                                    className={cn(
                                        'rounded-md border px-3 py-1.5 text-sm',
                                        activeCategory === c
                                            ? 'bg-primary text-primary-foreground border-transparent'
                                            : 'bg-background border-border hover:bg-muted'
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                            <Separator orientation="vertical" className="mx-2 h-6" />
                            <button
                                type="button"
                                onClick={() => toggleAll(true)}
                                className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                            >
                                {isKR ? '모두 펼치기' : 'Expand all'}
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleAll(false)}
                                className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                            >
                                {isKR ? '모두 접기' : 'Collapse all'}
                            </button>
                        </div>
                    </div>
                    <div className="text-muted-foreground mt-3 text-xs">
                        {isKR ? `${filtered.length}개 결과` : `${filtered.length} results`}
                    </div>
                </section>

                <section className="space-y-3">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="border-border bg-card text-card-foreground rounded-lg border p-4 sm:p-5"
                        >
                            <Collapsible
                                open={isOpen(item.id)}
                                onOpenChange={(o) => setItemOpen(item.id, o)}
                            >
                                <CollapsibleTrigger className="w-full text-left">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="inline-flex items-center gap-2">
                                                <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
                                                    {item.category}
                                                </span>
                                                <h3 className="text-sm font-medium sm:text-base">
                                                    {lang === 'ko' ? item.q.ko : item.q.en}
                                                </h3>
                                            </div>
                                        </div>
                                        <span className="border-border bg-background text-muted-foreground ml-auto shrink-0 rounded-md border px-2 py-1 text-xs">
                                            {isOpen(item.id)
                                                ? isKR
                                                    ? '접기'
                                                    : 'Hide'
                                                : isKR
                                                  ? '보기'
                                                  : 'View'}
                                        </span>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3">
                                    {item.render(lang)}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-8 text-center">
                            {isKR
                                ? '검색 결과가 없습니다. 다른 키워드로 시도해 보세요.'
                                : 'No results found. Try a different keyword.'}
                        </div>
                    )}
                </section>

                <section className="mt-10">
                    <Separator />
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <QuickLink
                            href={l('/design')}
                            label={isKR ? '디자인 시작하기' : 'Start a Design'}
                            desc={
                                isKR ? '텍스트로 3가지 옵션 생성' : 'Generate 3 options from text'
                            }
                            emoji="🎨"
                        />
                        <QuickLink
                            href={l('/products')}
                            label={isKR ? '제품 보기' : 'Browse Products'}
                            desc={isKR ? '티셔츠/머그 등 카탈로그' : 'T-shirts, mugs, more'}
                            emoji="🛍️"
                        />
                        <QuickLink
                            href={l('/cart')}
                            label={isKR ? '장바구니' : 'Cart'}
                            desc={isKR ? '담은 상품 확인' : 'Review your items'}
                            emoji="🧺"
                        />
                        <QuickLink
                            href={l('/checkout')}
                            label={isKR ? '결제하기' : 'Checkout'}
                            desc={isKR ? 'Stripe 보안 결제' : 'Secure Stripe payment'}
                            emoji="💳"
                        />
                        <QuickLink
                            href={l('/orders')}
                            label={isKR ? '주문 내역' : 'Your Orders'}
                            desc={isKR ? '상태/배송 조회' : 'Status & tracking'}
                            emoji="📦"
                        />
                        <QuickLink
                            href={l('/account/settings')}
                            label={isKR ? '계정 설정' : 'Account Settings'}
                            desc={isKR ? '프로필/주소 관리' : 'Profile & addresses'}
                            emoji="👤"
                        />
                        <QuickLink
                            href={l('/legal/terms')}
                            label={isKR ? '이용약관' : 'Terms'}
                            desc={isKR ? '환불/정책 안내' : 'Refunds & policies'}
                            emoji="📃"
                        />
                        <QuickLink
                            href={l('/legal/ip-policy')}
                            label={isKR ? 'IP 정책' : 'IP Policy'}
                            desc={isKR ? '권리/사용 조건' : 'Rights & usage'}
                            emoji="🧠"
                        />
                        <QuickLink
                            href={l('/admin')}
                            label={isKR ? '관리자 대시보드' : 'Admin'}
                            desc={isKR ? '판매자/머천트용' : 'For merchants'}
                            emoji="🛠️"
                        />
                    </div>
                </section>

                <section className="mt-12">
                    <div className="border-border bg-card rounded-lg border p-6">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {isKR
                                        ? '원하는 답을 찾지 못하셨나요?'
                                        : "Didn't find what you need?"}
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {isKR
                                        ? '24시간 이내 회신을 목표로 합니다. 문의해 주세요.'
                                        : 'Reach out and we aim to respond within 24 hours.'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href={l('/contact')}
                                    className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none"
                                >
                                    {isKR ? '문의하기' : 'Contact us'}
                                </Link>
                                <Link
                                    href={l('/about')}
                                    className="border-border bg-background hover:bg-muted inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                                >
                                    {isKR ? '회사 소개' : 'About us'}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

function QuickLink({
    href,
    label,
    desc,
    emoji,
}: {
    href: string
    label: string
    desc: string
    emoji: string
}) {
    return (
        <Link
            href={href}
            className="group border-border bg-card hover:border-primary/40 flex items-start gap-3 rounded-lg border p-4 transition hover:shadow-sm"
        >
            <div className="text-xl">{emoji}</div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="group-hover:text-primary text-sm font-medium">{label}</span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">{desc}</p>
            </div>
            <span className="text-muted-foreground group-hover:text-primary ml-auto transition">
                →
            </span>
        </Link>
    )
}
