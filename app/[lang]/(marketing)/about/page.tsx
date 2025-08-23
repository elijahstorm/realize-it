'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { ReactNode, useMemo } from 'react'

type PageProps = { params: { lang: string } }

export default function AboutPage({ params }: PageProps) {
    const { lang } = params
    const base = useMemo(() => `/${lang}`, [lang])

    const steps: { title: string; desc: string; icon: ReactNode }[] = [
        {
            title: 'Describe your idea',
            desc: 'Type a prompt in Korean or English. No uploads needed.',
            icon: <IconSpark />,
        },
        {
            title: 'AI design brief',
            desc: 'Solar Pro2 extracts intent, palette, and style into a structured brief.',
            icon: <IconBrain />,
        },
        {
            title: 'Generate variations',
            desc: 'We create multiple high‑res concepts and iterate until they pass checks.',
            icon: <IconWand />,
        },
        {
            title: 'Mockups & print files',
            desc: 'Server‑side compositing prepares DPI‑correct PNGs per Printify template.',
            icon: <IconLayers />,
        },
        {
            title: 'Select & checkout',
            desc: 'Pick size/color/variant and pay securely via Stripe.',
            icon: <IconCart />,
        },
        {
            title: 'Auto‑fulfillment',
            desc: 'We place the order at Printify and sync tracking to your account.',
            icon: <IconTruck />,
        },
    ]

    const stack = [
        {
            title: 'Next.js PWA',
            body: 'Fast, offline‑friendly frontend with App Router and modern UX.',
            tag: 'next',
        },
        {
            title: 'Supabase',
            body: 'Auth, Postgres, Storage and Realtime — secure and scalable.',
            tag: 'supabase',
        },
        {
            title: 'Solar Pro2',
            body: 'Reasoning agent that orchestrates prompts, briefs, and quality checks.',
            tag: 'ai',
        },
        {
            title: 'Generative Images',
            body: 'Configurable engines produce high‑resolution, print‑ready assets.',
            tag: 'gen',
        },
        {
            title: 'Sharp Pipeline',
            body: 'Server‑side compositing generates mockups and production PNGs.',
            tag: 'img',
        },
        {
            title: 'Stripe',
            body: 'Live capture payments, instant order flow, receipts, and webhooks.',
            tag: 'payments',
        },
        {
            title: 'Printify',
            body: 'Direct order creation using mapped SKUs and variant IDs.',
            tag: 'print',
        },
        {
            title: 'Webhooks',
            body: 'Stripe + Printify events update status, tracking, and notifications.',
            tag: 'hooks',
        },
    ]

    return (
        <main className="bg-background text-foreground min-h-screen">
            <section className="relative overflow-hidden">
                <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />
                <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 md:pt-24 md:pb-16 lg:px-8">
                    <div className="flex flex-col items-center gap-6 text-center">
                        <span className="bg-primary/10 text-primary ring-primary/20 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ring-1">
                            <IconGlobe className="size-4" /> RealizeIt · KR + EN
                        </span>
                        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
                            Ideas to shipped products — automatically
                        </h1>
                        <p className="text-muted-foreground max-w-2xl leading-relaxed">
                            RealizeIt turns your natural‑language request into print‑ready designs,
                            runs secure checkout, and auto‑places your order with Printify. Built
                            for South Korea launch, global by design.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href={`${base}/design`}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow focus:outline-none focus-visible:ring-2"
                            >
                                Start designing <IconArrowRight className="size-4" />
                            </Link>
                            <Link
                                href={`${base}/products`}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 ring-border inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium ring-1"
                            >
                                Browse products
                            </Link>
                            <Link
                                href={`${base}/help`}
                                className="hover:bg-accent hover:text-accent-foreground ring-border inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium ring-1"
                            >
                                Need help?
                            </Link>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-4 text-xs">
                            <Link
                                href={`${base}/sign-in`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Sign in
                            </Link>
                            <span>·</span>
                            <Link
                                href={`${base}/sign-up`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Create account
                            </Link>
                            <span>·</span>
                            <Link
                                href={`${base}/contact`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Contact
                            </Link>
                            <span>·</span>
                            <Link
                                href={`${base}//legal/terms`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Terms
                            </Link>
                            <span>·</span>
                            <Link
                                href={`${base}//legal/privacy`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Privacy
                            </Link>
                            <span>·</span>
                            <Link
                                href={`${base}//legal/ip-policy`}
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                IP policy
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 pb-6 md:px-8">
                <Alert className="bg-card text-card-foreground border-border border">
                    <AlertTitle className="flex items-center gap-2 font-semibold">
                        <IconFlag className="text-primary size-5" /> KR Launch Focus
                    </AlertTitle>
                    <AlertDescription className="text-muted-foreground mt-1">
                        We currently prioritize South Korea shipping and apply a default 20% markup
                        on base costs. See details in{' '}
                        <Link
                            href={`${base}/help`}
                            className="hover:text-foreground underline underline-offset-4"
                        >
                            Help
                        </Link>
                        .
                    </AlertDescription>
                </Alert>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    <div>
                        <h2 className="text-2xl font-semibold md:text-3xl">Our mission</h2>
                        <p className="text-muted-foreground mt-4 leading-relaxed">
                            Empower creators and small businesses to launch physical products
                            without juggling design tools, file prep, or fulfillment logistics.
                            RealizeIt automates the pipeline — from intent to delivery — with
                            transparent pricing, quality checks, and full order traceability.
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <ValueCard
                                icon={<IconShield />}
                                title="Trust & Safety"
                                desc="Clear rights and consent flows. Customer IP and AI policies enforced."
                                link={{
                                    href: `${base}//legal/ip-policy`,
                                    label: 'IP policy',
                                }}
                            />
                            <ValueCard
                                icon={<IconHeart />}
                                title="Creator‑first"
                                desc="No manual uploads. Iterative generation until quality thresholds are met."
                                link={{ href: `${base}/design`, label: 'Start now' }}
                            />
                            <ValueCard
                                icon={<IconGauge />}
                                title="Fast to market"
                                desc="PWA performance, instant checkout, and automatic submission to Printify."
                                link={{ href: `${base}/checkout`, label: 'Checkout demo' }}
                            />
                            <ValueCard
                                icon={<IconTrack />}
                                title="Track everything"
                                desc="Orders, payments, and tracking in one place — updated via webhooks."
                                link={{ href: `${base}/orders`, label: 'Your orders' }}
                            />
                        </div>
                    </div>
                    <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
                        <h3 className="text-lg font-medium">How it works</h3>
                        <Separator className="my-4" />
                        <ol className="space-y-4">
                            {steps.map((s, i) => (
                                <li key={i} className="relative flex gap-4">
                                    <div className="mt-0.5">{s.icon}</div>
                                    <div>
                                        <p className="font-medium">
                                            {i + 1}. {s.title}
                                        </p>
                                        <p className="text-muted-foreground text-sm">{s.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href={`${base}/design`}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow"
                            >
                                Try the flow <IconArrowRight className="size-4" />
                            </Link>
                            <Link
                                href={`${base}/help`}
                                className="ring-border hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ring-1"
                            >
                                Learn more
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
                <div className="flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-semibold md:text-3xl">Technology stack</h2>
                    <Link
                        href={`${base}/admin/health`}
                        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                    >
                        System health
                    </Link>
                </div>
                <p className="text-muted-foreground mt-3 max-w-2xl">
                    A pragmatic platform built with proven tools. We keep dependencies tight and
                    focus on reliability, speed, and cost control.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stack.map((item) => (
                        <div
                            key={item.title}
                            className={cn(
                                'group border-border bg-card rounded-xl border p-5 shadow-sm transition hover:shadow',
                                item.tag === 'ai' && 'ring-primary/30 ring-1'
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{item.title}</p>
                                <span className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-[10px] tracking-wide uppercase">
                                    {item.tag}
                                </span>
                            </div>
                            <p className="text-muted-foreground mt-2 text-sm">{item.body}</p>
                        </div>
                    ))}
                </div>
                <div className="text-muted-foreground mt-6 text-sm">
                    See admin dashboards:{' '}
                    <Link
                        href={`${base}/admin`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Admin
                    </Link>
                    ,{' '}
                    <Link
                        href={`${base}/admin/orders`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Orders
                    </Link>
                    ,{' '}
                    <Link
                        href={`${base}/admin/logs`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Logs
                    </Link>
                    ,{' '}
                    <Link
                        href={`${base}/admin/costs`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Costs
                    </Link>
                    ,{' '}
                    <Link
                        href={`${base}/admin/analytics`}
                        className="hover:text-foreground underline underline-offset-4"
                    >
                        Analytics
                    </Link>
                    .
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="border-border bg-card rounded-2xl border p-6 lg:col-span-2">
                        <h3 className="text-lg font-medium">Policies and consent</h3>
                        <p className="text-muted-foreground mt-2 text-sm">
                            We store a consent record on checkout confirming that AI‑generated
                            designs and rights terms are accepted. Learn more below.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                            <Link
                                href={`${base}//legal/terms`}
                                className="ring-border hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 ring-1"
                            >
                                Terms of Service
                            </Link>
                            <Link
                                href={`${base}//legal/privacy`}
                                className="ring-border hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 ring-1"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href={`${base}//legal/ip-policy`}
                                className="ring-border hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 ring-1"
                            >
                                IP & Rights Policy
                            </Link>
                            <Link
                                href={`${base}/help`}
                                className="ring-border hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 ring-1"
                            >
                                Help Center
                            </Link>
                            <Link
                                href={`${base}/contact`}
                                className="ring-border hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 ring-1"
                            >
                                Contact us
                            </Link>
                        </div>
                    </div>
                    <div className="border-border bg-card rounded-2xl border p-6">
                        <h3 className="text-lg font-medium">Your account</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li>
                                <Link
                                    href={`${base}/sign-in`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Sign in
                                </Link>{' '}
                                or{' '}
                                <Link
                                    href={`${base}/sign-up`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Create account
                                </Link>
                            </li>
                            <li>
                                Manage{' '}
                                <Link
                                    href={`${base}/account`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Account
                                </Link>
                                ,{' '}
                                <Link
                                    href={`${base}/account/addresses`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Addresses
                                </Link>
                                ,{' '}
                                <Link
                                    href={`${base}/account/billing`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Billing
                                </Link>
                            </li>
                            <li>
                                View{' '}
                                <Link
                                    href={`${base}/account/orders`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Order history
                                </Link>{' '}
                                or{' '}
                                <Link
                                    href={`${base}/orders`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    All orders
                                </Link>
                            </li>
                            <li>
                                Track shipment:{' '}
                                <Link
                                    href={`${base}/track/TRK123`}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    /track/[code]
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
                <h2 className="text-2xl font-semibold md:text-3xl">FAQs</h2>
                <div className="mt-6 space-y-4">
                    <FAQ
                        question="Can I upload my own artwork?"
                        answer={
                            <>
                                We currently enforce AI‑only generation to keep quality consistent
                                and ensure print‑ready assets. If you need to incorporate text or
                                brand elements, include them in your prompt. For roadmap details,
                                see{' '}
                                <Link
                                    href={`${base}/help`}
                                    className="underline underline-offset-4"
                                >
                                    Help
                                </Link>
                                .
                            </>
                        }
                    />
                    <FAQ
                        question="How do you calculate price?"
                        answer={
                            <>
                                We pull Printify base costs and apply a default 20% markup, plus
                                taxes and shipping at checkout. You’ll see a breakdown before
                                paying. Learn more in{' '}
                                <Link
                                    href={`${base}/help`}
                                    className="underline underline-offset-4"
                                >
                                    Help
                                </Link>
                                .
                            </>
                        }
                    />
                    <FAQ
                        question="What products are supported?"
                        answer={
                            <>
                                Apparel, mugs, canvas, totes, stationery, and more. Browse our live{' '}
                                <Link
                                    href={`${base}/products`}
                                    className="underline underline-offset-4"
                                >
                                    catalog
                                </Link>
                                .
                            </>
                        }
                    />
                    <FAQ
                        question="When is my order placed?"
                        answer={
                            <>
                                Immediately after successful payment. Orders are auto‑submitted to
                                Printify and synced back to{' '}
                                <Link
                                    href={`${base}/account/orders`}
                                    className="underline underline-offset-4"
                                >
                                    your orders
                                </Link>{' '}
                                with tracking updates.
                            </>
                        }
                    />
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-6 py-14 md:px-8">
                <div className="border-border bg-primary text-primary-foreground rounded-3xl border p-8 shadow md:p-12">
                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h3 className="text-2xl font-semibold md:text-3xl">
                                Ready to turn an idea into a product?
                            </h3>
                            <p className="text-primary-foreground/80 mt-1">
                                Start a session now — pick variations, choose a product, and check
                                out in minutes.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={`${base}/design`}
                                className="bg-background text-foreground hover:bg-background/90 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow"
                            >
                                Start designing <IconArrowRight className="size-4" />
                            </Link>
                            <Link
                                href={`${base}/help`}
                                className="bg-primary/20 text-primary-foreground hover:bg-primary/25 ring-primary/40 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium ring-1"
                            >
                                Read the guide
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

function ValueCard({
    icon,
    title,
    desc,
    link,
}: {
    icon: ReactNode
    title: string
    desc: string
    link?: { href: string; label: string }
}) {
    return (
        <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-lg p-2">{icon}</div>
                <p className="font-medium">{title}</p>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{desc}</p>
            {link && (
                <div className="mt-3">
                    <Link
                        href={link.href}
                        className="hover:text-foreground inline-flex items-center gap-1 text-sm underline underline-offset-4"
                    >
                        {link.label} <IconArrowRight className="size-3" />
                    </Link>
                </div>
            )}
        </div>
    )
}

function FAQ({ question, answer }: { question: string; answer: React.ReactNode }) {
    return (
        <Collapsible className="border-border bg-card rounded-xl border p-5">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 text-left">
                <span className="font-medium">{question}</span>
                <IconChevronDown className="text-muted-foreground size-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <Separator className="my-4" />
                <p className="text-muted-foreground text-sm">{answer}</p>
            </CollapsibleContent>
        </Collapsible>
    )
}

function IconArrowRight(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
function IconGlobe(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
        </svg>
    )
}
function IconSpark(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn('text-primary inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6L12 2z" />
        </svg>
    )
}
function IconBrain(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M8 6a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3v3a2 2 0 1 0 4 0V6a3 3 0 1 0-4 0Zm8 0a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3v3a2 2 0 1 1-4 0V6a3 3 0 1 1 4 0Z" />
        </svg>
    )
}
function IconWand(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M15 4V2m0 20v-2m7-7h-2M4 12H2m1.7 7.3 1.4-1.4M18.9 6.5l1.4-1.4M6.5 5.1 5.1 6.5M19 19l-9-9 2-2 9 9-2 2z" />
        </svg>
    )
}
function IconLayers(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="m12 2 9 5-9 5-9-5 9-5z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 17 9 5 9-5" />
        </svg>
    )
}
function IconCart(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39A2 2 0 0 0 9.63 16H19a2 2 0 0 0 2-1.72L23 6H6" />
        </svg>
    )
}
function IconTruck(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M3 17V6a2 2 0 0 1 2-2h10v13" />
            <path d="M13 8h5l3 3v6" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    )
}
function IconFlag(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M4 22V4a2 2 0 0 1 2-2h11l-1.5 3L20 8h-9" />
        </svg>
    )
}
function IconShield(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z" />
        </svg>
    )
}
function IconHeart(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn('text-destructive/80 inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M12 21s-6.7-4.35-9.33-7A6 6 0 0 1 12 5a6 6 0 0 1 9.33 9c-2.63 2.65-9.33 7-9.33 7z" />
        </svg>
    )
}
function IconGauge(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M12 21a9 9 0 1 1 9-9" />
            <path d="M12 12l6-3" />
        </svg>
    )
}
function IconTrack(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn('inline-block', props.className)}
            aria-hidden="true"
        >
            <path d="M2 12h20" />
            <path d="M7 12a5 5 0 0 1 10 0" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}
function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(
                'transition-transform group-data-[state=open]:rotate-180',
                props.className
            )}
            aria-hidden="true"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}
