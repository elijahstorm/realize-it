'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

export default function ContactPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const lang = useMemo(() => {
        const v = (params?.lang as string) || 'en'
        return Array.isArray(v) ? v[0] : v
    }, [params])

    const prefillOrderId = searchParams.get('order') || ''

    const paths = useMemo(() => {
        const base = `/${lang}`
        return {
            help: `${base}/help`,
            design: `${base}/design`,
            products: `${base}/products`,
            cart: `${base}/cart`,
            checkout: `${base}/checkout`,
            orders: `${base}/orders`,
            accountOrders: `${base}/account/orders`,
            account: `${base}/account`,
            signin: `${base}/sign-in`,
            signup: `${base}/sign-up`,
            terms: `${base}/legal/terms`,
            privacy: `${base}/legal/privacy`,
            ip: `${base}/legal/ip-policy`,
            trackSample: `${base}/track/TRACK123`,
            admin: `${base}/admin`,
        }
    }, [lang])

    const [email, setEmail] = useState('')
    const [isEmailLocked, setIsEmailLocked] = useState(false)
    const [subject, setSubject] = useState('')
    const [category, setCategory] = useState('general')
    const [orderId, setOrderId] = useState(prefillOrderId)
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        const supabase = supabaseBrowser
        supabase.auth.getUser().then(({ data }) => {
            const e = data?.user?.email
            if (e) {
                setEmail(e)
                setIsEmailLocked(true)
            }
        })
    }, [])

    const isValidEmail = (v: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(v)

    const canSubmit = useMemo(() => {
        return (
            subject.trim().length >= 3 &&
            message.trim().length >= 20 &&
            isValidEmail(email.trim()) &&
            category.length > 0
        )
    }, [subject, message, email, category])

    const resetForm = useCallback(() => {
        setSubject('')
        setCategory('general')
        setOrderId(prefillOrderId || '')
        if (!isEmailLocked) setEmail('')
        setMessage('')
    }, [isEmailLocked, prefillOrderId])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!canSubmit) {
            toast({
                title: 'Missing details',
                description:
                    'Please provide a valid email, a subject, and a message with at least 20 characters.',
                variant: 'destructive' as any,
            })
            return
        }

        setSubmitting(true)

        const metaLines = [
            category ? `Category: ${category}` : '',
            orderId ? `Order ID: ${orderId}` : '',
            `Locale: ${lang}`,
        ]
            .filter(Boolean)
            .join('\n')

        const mailtoHref = `mailto:support@realizeit.ai?subject=${encodeURIComponent(
            `[${lang.toUpperCase()}] ${subject}`
        )}&body=${encodeURIComponent(`${metaLines}\n\n${message}`)}`

        // Simulate async submit (placeholder). In production this would call an API route.
        setTimeout(() => {
            setSubmitting(false)
            toast({
                title: 'Thanks—your message is queued',
                description:
                    'We’ll follow up via email within 1 business day. You can also open your email client now to send this message directly.',
            })
            // Offer a convenient mail fallback for immediate sending
            window.open(mailtoHref, '_blank', 'noopener,noreferrer')
            resetForm()
        }, 700)
    }

    const categories = [
        { value: 'general', label: 'General' },
        { value: 'order', label: 'Order issue' },
        { value: 'billing', label: 'Billing & payments' },
        { value: 'bug', label: 'Technical bug' },
        { value: 'legal', label: 'Legal / IP' },
        { value: 'feature', label: 'Feature request' },
    ]

    const faqs = [
        {
            q: 'How do I start an AI design?',
            a: (
                <span>
                    Head to{' '}
                    <Link href={paths.design} className="underline underline-offset-4">
                        Start Design
                    </Link>{' '}
                    and describe your idea. Our AI generates several options and mockups—no file
                    uploads needed.
                </span>
            ),
        },
        {
            q: 'Where can I check my orders?',
            a: (
                <span>
                    See your{' '}
                    <Link href={paths.accountOrders} className="underline underline-offset-4">
                        order history
                    </Link>{' '}
                    or the public{' '}
                    <Link href={paths.orders} className="underline underline-offset-4">
                        orders page
                    </Link>
                    . For tracking, use your code at{' '}
                    <Link href={paths.trackSample} className="underline underline-offset-4">
                        Track
                    </Link>
                    .
                </span>
            ),
        },
        {
            q: 'How are prices calculated?',
            a: (
                <span>
                    We pull live Printify costs and apply a default 20% retail markup, plus taxes
                    and shipping at checkout. Browse{' '}
                    <Link href={paths.products} className="underline underline-offset-4">
                        products
                    </Link>{' '}
                    for available items.
                </span>
            ),
        },
        {
            q: 'Is customer upload allowed?',
            a: (
                <span>
                    For this POC, designs are AI-only. See our policies:{' '}
                    <Link href={paths.ip} className="underline underline-offset-4">
                        IP Policy
                    </Link>
                    ,{' '}
                    <Link href={paths.terms} className="underline underline-offset-4">
                        Terms
                    </Link>
                    , and{' '}
                    <Link href={paths.privacy} className="underline underline-offset-4">
                        Privacy
                    </Link>
                    .
                </span>
            ),
        },
    ]

    return (
        <div className="bg-background min-h-[calc(100vh-4rem)]">
            <section className="relative overflow-hidden">
                <div className="from-primary/15 via-primary/5 pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] to-transparent" />
                <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                        <div className="flex flex-col justify-center">
                            <p className="border-border bg-card text-muted-foreground mb-3 inline-flex w-max items-center gap-2 rounded-full border px-3 py-1 text-xs">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                24/7 support inbox
                            </p>
                            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                                Contact RealizeIt Support
                            </h1>
                            <p className="text-muted-foreground mt-3">
                                Need help with AI designs, orders, or payments? Send us a message
                                here. Quick links to{' '}
                                <Link
                                    href={paths.help}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Help
                                </Link>{' '}
                                and{' '}
                                <Link
                                    href={paths.design}
                                    className="text-primary underline underline-offset-4"
                                >
                                    Start Design
                                </Link>
                                .
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-3">
                                <Link
                                    href={paths.design}
                                    className="group bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow"
                                >
                                    Start a design
                                    <svg
                                        className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                </Link>
                                <Link
                                    href={paths.help}
                                    className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium"
                                >
                                    Visit Help Center
                                </Link>
                            </div>

                            <div className="border-border bg-card text-muted-foreground mt-8 rounded-xl border p-4 text-sm">
                                <p>
                                    Prefer email?{' '}
                                    <a
                                        href="mailto:support@realizeit.ai"
                                        className="text-foreground underline"
                                    >
                                        support@realizeit.ai
                                    </a>
                                </p>
                                <p className="mt-1">
                                    KR/EN supported · 응답: 영업일 기준 24시간 이내
                                </p>
                            </div>
                        </div>

                        <div className="md:pl-6">
                            <form
                                onSubmit={handleSubmit}
                                className="border-border bg-card rounded-2xl border p-6 shadow-sm"
                            >
                                <h2 className="text-card-foreground text-lg font-medium">
                                    Send us a message
                                </h2>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    We’ll reply to your email. No uploads required—AI-only design
                                    flow.
                                </p>

                                <Alert className="mt-4">
                                    <AlertTitle>Note</AlertTitle>
                                    <AlertDescription>
                                        For order-specific issues, include your order ID. You can
                                        look it up in{' '}
                                        <Link href={paths.accountOrders} className="underline">
                                            your orders
                                        </Link>
                                        .
                                    </AlertDescription>
                                </Alert>

                                <div className="mt-6 grid grid-cols-1 gap-4">
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="text-foreground mb-1 block text-sm font-medium"
                                        >
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            inputMode="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={isEmailLocked}
                                            placeholder="you@example.com"
                                            className={cn(
                                                'border-input bg-background text-foreground placeholder:text-muted-foreground block w-full rounded-lg border px-3 py-2 text-sm',
                                                'focus:ring-primary focus:ring-2 focus:outline-none',
                                                isEmailLocked && 'opacity-80'
                                            )}
                                            required
                                        />
                                        {isEmailLocked && (
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                Signed in—using your account email.
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="category"
                                                className="text-foreground mb-1 block text-sm font-medium"
                                            >
                                                Category
                                            </label>
                                            <select
                                                id="category"
                                                name="category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="border-input bg-background text-foreground focus:ring-primary block w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                            >
                                                {categories.map((c) => (
                                                    <option key={c.value} value={c.value}>
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="orderId"
                                                className="text-foreground mb-1 block text-sm font-medium"
                                            >
                                                Order ID (optional)
                                            </label>
                                            <input
                                                id="orderId"
                                                name="orderId"
                                                value={orderId}
                                                onChange={(e) => setOrderId(e.target.value)}
                                                placeholder="e.g., ORD-2024-00123"
                                                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary block w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="subject"
                                            className="text-foreground mb-1 block text-sm font-medium"
                                        >
                                            Subject
                                        </label>
                                        <input
                                            id="subject"
                                            name="subject"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Brief summary"
                                            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary block w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="message"
                                                className="text-foreground mb-1 block text-sm font-medium"
                                            >
                                                Message
                                            </label>
                                            <span className="text-muted-foreground text-xs">
                                                Min 20 characters
                                            </span>
                                        </div>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Tell us what’s going on..."
                                            rows={6}
                                            className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary block w-full resize-y rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || submitting}
                                        className={cn(
                                            'bg-primary text-primary-foreground inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow',
                                            'hover:bg-primary/90 focus:ring-primary focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
                                        )}
                                    >
                                        {submitting ? (
                                            <>
                                                <svg
                                                    className="mr-2 h-4 w-4 animate-spin"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                                                    />
                                                </svg>
                                                Sending…
                                            </>
                                        ) : (
                                            <>Send message</>
                                        )}
                                    </button>

                                    <Link
                                        href={paths.help}
                                        className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium"
                                    >
                                        Go to Help
                                    </Link>
                                </div>

                                <Separator className="my-6" />

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <Link
                                        href={paths.orders}
                                        className="group border-border bg-background hover:bg-accent flex items-center justify-between rounded-lg border p-3 text-sm"
                                    >
                                        View orders
                                        <svg
                                            className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href={paths.cart}
                                        className="group border-border bg-background hover:bg-accent flex items-center justify-between rounded-lg border p-3 text-sm"
                                    >
                                        View cart
                                        <svg
                                            className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="9" cy="21" r="1" />
                                            <circle cx="20" cy="21" r="1" />
                                            <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href={paths.checkout}
                                        className="group border-border bg-background hover:bg-accent flex items-center justify-between rounded-lg border p-3 text-sm"
                                    >
                                        Checkout
                                        <svg
                                            className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </Link>
                                    <Link
                                        href={paths.signin}
                                        className="group border-border bg-background hover:bg-accent flex items-center justify-between rounded-lg border p-3 text-sm"
                                    >
                                        Sign in
                                        <svg
                                            className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                            <polyline points="10 17 15 12 10 7" />
                                            <line x1="15" x2="3" y1="12" y2="12" />
                                        </svg>
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-6xl px-6 pb-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="border-border bg-card rounded-xl border p-6">
                        <h3 className="text-card-foreground text-base font-medium">Quick links</h3>
                        <ul className="mt-3 space-y-2 text-sm">
                            <li>
                                <Link className="text-primary underline" href={paths.design}>
                                    Start a design
                                </Link>
                            </li>
                            <li>
                                <Link className="text-primary underline" href={paths.products}>
                                    Browse products
                                </Link>
                            </li>
                            <li>
                                <Link className="text-primary underline" href={paths.account}>
                                    Your account
                                </Link>
                            </li>
                            <li>
                                <Link className="text-primary underline" href={paths.accountOrders}>
                                    Order history
                                </Link>
                            </li>
                            <li>
                                <Link className="text-primary underline" href={paths.help}>
                                    Help center
                                </Link>
                            </li>
                            <li>
                                <Link className="text-primary underline" href={paths.signup}>
                                    Create account
                                </Link>
                            </li>
                            <li>
                                <Link className="text-primary underline" href={paths.admin}>
                                    Merchant admin
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="border-border bg-card rounded-xl border p-6 md:col-span-2">
                        <h3 className="text-card-foreground text-base font-medium">
                            Frequently asked
                        </h3>
                        <div className="divide-border mt-3 divide-y">
                            {faqs.map((item, idx) => (
                                <Collapsible key={idx}>
                                    <div className="flex items-center justify-between py-3">
                                        <h4 className="text-foreground text-sm font-medium">
                                            {item.q}
                                        </h4>
                                        <CollapsibleTrigger
                                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-1"
                                            aria-label="Toggle"
                                        >
                                            <svg
                                                className="h-5 w-5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent>
                                        <div className="text-muted-foreground pb-4 text-sm">
                                            {item.a}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Toaster />
        </div>
    )
}
