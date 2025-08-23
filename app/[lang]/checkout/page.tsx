'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState, useCallback } from 'react'

const MARKUP_RATE = 0.2

type Currency = 'USD' | 'KRW'

type CartItem = {
    id: string
    name: string
    productSlug?: string
    variantId?: string
    variantName?: string
    color?: string
    size?: string
    quantity: number
    baseCost: number // cost from Printify in item.currency
    currency?: Currency
    imageUrl?: string
}

type ShippingForm = {
    email: string
    fullName: string
    phone?: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string // ISO2
    consent: boolean
    saveAddress: boolean
    marketingOptIn: boolean
}

function getLocaleCurrency(country: string): Currency {
    if (country === 'KR') return 'KRW'
    return 'USD'
}

function formatCurrency(value: number, currency: Currency) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
        Math.max(0, value)
    )
}

function estimateShipping(itemsCount: number, country: string, currency: Currency) {
    if (itemsCount <= 0) return 0
    if (country === 'KR') {
        const base = 4500 // KRW base
        const extra = 1500 // KRW per additional item
        return currency === 'KRW'
            ? base + extra * (itemsCount - 1)
            : (base + extra * (itemsCount - 1)) / 1300 // fallback conversion if mismatch
    }
    // default international estimate
    const base = 6.99
    const extra = 2.99
    return currency === 'USD'
        ? base + extra * (itemsCount - 1)
        : (base + extra * (itemsCount - 1)) * 1300 // rough KRW if mismatch
}

function estimateTax(subtotal: number, country: string) {
    // Simple estimate: 10% VAT for KR, 0% otherwise (placeholder policy)
    if (country === 'KR') return subtotal * 0.1
    return 0
}

export default function CheckoutPage({ params }: { params: { lang: string } }) {
    const { toast } = useToast()
    const router = useRouter()
    const { lang } = params

    const [items, setItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const [stripeLoading, setStripeLoading] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [form, setForm] = useState<ShippingForm>({
        email: '',
        fullName: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postalCode: '',
        country: lang?.toUpperCase() === 'KR' ? 'KR' : 'US',
        consent: false,
        saveAddress: true,
        marketingOptIn: false,
    })

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            try {
                // Load cart from localStorage
                const raw = typeof window !== 'undefined' ? localStorage.getItem('cart') : null
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw) as CartItem[]
                        setItems(Array.isArray(parsed) ? parsed : [])
                    } catch {
                        setItems([])
                    }
                }
                // Load saved shipping
                const savedShip =
                    typeof window !== 'undefined' ? localStorage.getItem('shipping') : null
                if (savedShip) {
                    try {
                        const parsed = JSON.parse(savedShip) as ShippingForm
                        setForm((prev) => ({ ...prev, ...parsed }))
                    } catch {}
                }
                // Supabase user info
                const supabase = supabaseBrowser
                const { data } = await supabase.auth.getUser()
                const email = data?.user?.email || ''
                if (email) {
                    setUserEmail(email)
                    setForm((prev) => ({ ...prev, email: prev.email || email }))
                }
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    const currency: Currency = useMemo(() => {
        const c = items[0]?.currency
        if (c) return c
        return getLocaleCurrency(form.country)
    }, [items, form.country])

    const counts = useMemo(() => items.reduce((sum, i) => sum + (i.quantity || 0), 0), [items])

    const itemsCost = useMemo(() => {
        return items.reduce((sum, i) => sum + (i.baseCost || 0) * (i.quantity || 0), 0)
    }, [items])

    const margin = useMemo(() => itemsCost * MARKUP_RATE, [itemsCost])

    const subtotal = useMemo(() => itemsCost + margin, [itemsCost, margin])

    const shippingEstimate = useMemo(
        () => estimateShipping(counts, form.country, currency),
        [counts, form.country, currency]
    )

    const taxEstimate = useMemo(() => estimateTax(subtotal, form.country), [subtotal, form.country])

    const total = useMemo(
        () => subtotal + shippingEstimate + taxEstimate,
        [subtotal, shippingEstimate, taxEstimate]
    )

    useEffect(() => {
        // persist form
        try {
            localStorage.setItem('shipping', JSON.stringify(form))
        } catch {}
    }, [form])

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as any
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const validate = useCallback(() => {
        const errors: string[] = []
        if (!form.fullName || form.fullName.trim().length < 2) errors.push('Full name is required.')
        const email = form.email || userEmail
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push('A valid email is required.')
        if (!form.address1 || form.address1.trim().length < 4) errors.push('Address is required.')
        if (!form.city) errors.push('City is required.')
        if (!form.postalCode) errors.push('Postal code is required.')
        if (!form.country) errors.push('Country is required.')
        if (!form.consent) errors.push('You must accept the IP/rights and sales terms.')
        if (items.length === 0) errors.push('Your cart is empty.')
        if (total <= 0) errors.push('Unable to proceed with a zero-value order.')
        return errors
    }, [form, items.length, total, userEmail])

    const startCheckout = async () => {
        const errors = validate()
        if (errors.length) {
            toast({
                title: 'Checkout incomplete',
                description: errors.join('\n'),
                variant: 'destructive' as any,
            })
            return
        }

        setStripeLoading(true)
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            const successUrl = `${origin}/${lang}/checkout/success`
            const cancelUrl = `${origin}/${lang}/checkout/cancel`

            const payload = {
                items: items.map((i) => ({
                    id: i.id,
                    name: i.name,
                    productSlug: i.productSlug,
                    variantId: i.variantId,
                    variantName: i.variantName,
                    color: i.color,
                    size: i.size,
                    quantity: i.quantity,
                    baseCost: i.baseCost,
                    currency: i.currency || currency,
                })),
                totals: {
                    itemsCost,
                    margin,
                    subtotal,
                    shippingEstimate,
                    taxEstimate,
                    total,
                    currency,
                },
                shipping: {
                    ...form,
                    email: form.email || userEmail,
                },
                locale: lang,
                successUrl,
                cancelUrl,
            }

            const configuredEndpoint = process.env.NEXT_PUBLIC_CHECKOUT_ENDPOINT

            if (configuredEndpoint) {
                const res = await fetch(configuredEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!res.ok) throw new Error(`Checkout endpoint error: ${res.status}`)
                const data = await res.json()
                if (data?.url) {
                    window.location.href = data.url as string
                    return
                }
                if (data?.id || data?.sessionId) {
                    const stripe = await loadStripe(
                        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
                    )
                    if (!stripe) throw new Error('Stripe failed to initialize')
                    const ret = await stripe.redirectToCheckout({
                        sessionId: (data.id || data.sessionId) as string,
                    })
                    if (ret.error) throw ret.error
                    return
                }
                throw new Error('Invalid response from checkout endpoint')
            }

            // Fallback: redirectToCheckout with a pre-configured Price ID (represents total via quantity multiplier)
            const priceId = process.env.NEXT_PUBLIC_DEFAULT_PRICE_ID // Must be configured in env to work
            const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            if (priceId && publishableKey) {
                const stripe = await loadStripe(publishableKey)
                if (!stripe) throw new Error('Stripe failed to initialize')
                const quantity = Math.max(1, Math.round(total * 100))
                // quantity trick expects Price to be $0.01 or ₩1 depending on currency configuration
                const result = await stripe.redirectToCheckout({
                    lineItems: [{ price: priceId, quantity }],
                    mode: 'payment',
                    successUrl,
                    cancelUrl,
                    customerEmail: payload.shipping.email,
                } as any)
                if (result.error) throw result.error
                return
            }

            toast({
                title: 'Payment not configured',
                description:
                    'Stripe is not configured for this environment. Please contact support via Help, or try again later.',
                variant: 'destructive' as any,
            })
        } catch (err: any) {
            toast({
                title: 'Checkout failed',
                description: err?.message || 'Unexpected error',
                variant: 'destructive' as any,
            })
        } finally {
            setStripeLoading(false)
        }
    }

    useEffect(() => {
        if (!loading && items.length === 0) {
            // Encourage user to add items
            // Do not redirect immediately; show alert
        }
    }, [loading, items.length])

    const Step = ({ label, active }: { label: string; active?: boolean }) => (
        <div
            className={cn(
                'flex items-center gap-2 text-sm',
                active ? 'text-primary' : 'text-muted-foreground'
            )}
        >
            <div className={cn('h-2 w-2 rounded-full', active ? 'bg-primary' : 'bg-muted')}></div>
            <span>{label}</span>
        </div>
    )

    return (
        <div className="bg-background min-h-[calc(100vh-160px)]">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            Checkout
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Secure payment via Stripe. Ships to South Korea and more. Need help?{' '}
                            <Link
                                href={`/${lang}/(marketing)/help`}
                                className="hover:text-primary underline"
                            >
                                Visit Help
                            </Link>{' '}
                            or{' '}
                            <Link
                                href={`/${lang}/(marketing)/contact`}
                                className="hover:text-primary underline"
                            >
                                Contact us
                            </Link>
                            .
                        </p>
                    </div>
                    <div className="hidden items-center gap-4 md:flex">
                        <Step label="Cart" />
                        <span className="text-muted-foreground">→</span>
                        <Step label="Checkout" active />
                        <span className="text-muted-foreground">→</span>
                        <Step label="Pay" />
                        <span className="text-muted-foreground">→</span>
                        <Step label="Success" />
                    </div>
                </div>

                {items.length === 0 && (
                    <Alert className="mb-6">
                        <AlertTitle>Your cart is empty</AlertTitle>
                        <AlertDescription>
                            Add designs to your cart from{' '}
                            <Link href={`/${lang}/design`} className="hover:text-primary underline">
                                AI Design
                            </Link>{' '}
                            or browse{' '}
                            <Link
                                href={`/${lang}/products`}
                                className="hover:text-primary underline"
                            >
                                Products
                            </Link>
                            . You can also review your previous orders in{' '}
                            <Link
                                href={`/${lang}/account/orders`}
                                className="hover:text-primary underline"
                            >
                                Order History
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-8 md:grid-cols-2">
                    <section className="border-border bg-card rounded-xl border p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-medium">Shipping details</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={onChange}
                                    placeholder={userEmail || 'you@example.com'}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium">Full name</label>
                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={onChange}
                                    placeholder="홍길동 / Jane Doe"
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium">
                                    Phone (optional)
                                </label>
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={onChange}
                                    placeholder="+82 10-1234-5678"
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium">
                                    Address line 1
                                </label>
                                <input
                                    name="address1"
                                    value={form.address1}
                                    onChange={onChange}
                                    placeholder="Street address, P.O. box, company name"
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-sm font-medium">
                                    Address line 2 (optional)
                                </label>
                                <input
                                    name="address2"
                                    value={form.address2}
                                    onChange={onChange}
                                    placeholder="Apartment, suite, unit, building, floor, etc."
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">City</label>
                                <input
                                    name="city"
                                    value={form.city}
                                    onChange={onChange}
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    State / Province
                                </label>
                                <input
                                    name="state"
                                    value={form.state}
                                    onChange={onChange}
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Postal code
                                </label>
                                <input
                                    name="postalCode"
                                    value={form.postalCode}
                                    onChange={onChange}
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Country</label>
                                <select
                                    name="country"
                                    value={form.country}
                                    onChange={onChange}
                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                                >
                                    <option value="KR">South Korea</option>
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="GB">United Kingdom</option>
                                    <option value="AU">Australia</option>
                                    <option value="DE">Germany</option>
                                    <option value="FR">France</option>
                                    <option value="JP">Japan</option>
                                    <option value="SG">Singapore</option>
                                    <option value="" disabled>
                                        ────────
                                    </option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <Separator className="my-5" />

                        <div className="space-y-3">
                            <label className="flex items-start gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    name="consent"
                                    checked={form.consent}
                                    onChange={onChange}
                                    className="border-input text-primary focus:ring-ring mt-0.5 h-4 w-4 rounded"
                                />
                                <span>
                                    I confirm the design is AI-generated and I accept the{' '}
                                    <Link
                                        href={`/${lang}/(marketing)/legal/ip-policy`}
                                        className="hover:text-primary underline"
                                    >
                                        IP Policy
                                    </Link>
                                    ,{' '}
                                    <Link
                                        href={`/${lang}/(marketing)/legal/terms`}
                                        className="hover:text-primary underline"
                                    >
                                        Terms
                                    </Link>{' '}
                                    and{' '}
                                    <Link
                                        href={`/${lang}/(marketing)/legal/privacy`}
                                        className="hover:text-primary underline"
                                    >
                                        Privacy
                                    </Link>
                                    .
                                </span>
                            </label>
                            <label className="text-muted-foreground flex items-start gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    name="saveAddress"
                                    checked={form.saveAddress}
                                    onChange={onChange}
                                    className="border-input text-primary focus:ring-ring mt-0.5 h-4 w-4 rounded"
                                />
                                <span>Save this address for my account</span>
                            </label>
                            <label className="text-muted-foreground flex items-start gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    name="marketingOptIn"
                                    checked={form.marketingOptIn}
                                    onChange={onChange}
                                    className="border-input text-primary focus:ring-ring mt-0.5 h-4 w-4 rounded"
                                />
                                <span>Email me order updates and product news</span>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                            <Link
                                href={`/${lang}/cart`}
                                className="text-muted-foreground hover:text-primary underline"
                            >
                                Return to cart
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href={`/${lang}/products`}
                                className="text-muted-foreground hover:text-primary underline"
                            >
                                Continue shopping
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href={`/${lang}/account/addresses`}
                                className="text-muted-foreground hover:text-primary underline"
                            >
                                Manage addresses
                            </Link>
                        </div>
                    </section>

                    <aside className="border-border bg-card rounded-xl border p-5 shadow-sm">
                        <h2 className="mb-4 text-lg font-medium">Order summary</h2>
                        <div className="space-y-4">
                            <div className="border-border max-h-64 overflow-auto rounded-md border">
                                {items.length > 0 ? (
                                    <ul className="divide-border divide-y">
                                        {items.map((i) => (
                                            <li key={i.id} className="flex items-center gap-4 p-3">
                                                <div className="border-border bg-muted h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border">
                                                    {i.imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={i.imageUrl}
                                                            alt={i.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="from-muted to-accent h-full w-full bg-gradient-to-br" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-medium">
                                                        {i.name}
                                                    </div>
                                                    <div className="text-muted-foreground truncate text-xs">
                                                        {i.variantName ||
                                                            [i.color, i.size]
                                                                .filter(Boolean)
                                                                .join(' / ')}
                                                    </div>
                                                    <div className="text-muted-foreground mt-0.5 text-xs">
                                                        Qty: {i.quantity}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {formatCurrency(
                                                        (i.baseCost || 0) *
                                                            (1 + MARKUP_RATE) *
                                                            (i.quantity || 0),
                                                        i.currency || currency
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-muted-foreground p-4 text-sm">
                                        Your cart is empty.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Items cost</span>
                                    <span>{formatCurrency(itemsCost, currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Margin (20%)</span>
                                    <span>{formatCurrency(margin, currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Estimated tax</span>
                                    <span>{formatCurrency(taxEstimate, currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Estimated shipping
                                    </span>
                                    <span>{formatCurrency(shippingEstimate, currency)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between text-base font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(total, currency)}</span>
                                </div>
                            </div>

                            <button
                                onClick={startCheckout}
                                disabled={stripeLoading || items.length === 0 || total <= 0}
                                className={cn(
                                    'bg-primary text-primary-foreground focus-visible:ring-ring mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-sm transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                                )}
                            >
                                {stripeLoading ? 'Processing...' : 'Pay with Stripe'}
                            </button>

                            <p className="text-muted-foreground text-xs">
                                By paying, you agree to our{' '}
                                <Link
                                    className="hover:text-primary underline"
                                    href={`/${lang}/(marketing)/legal/terms`}
                                >
                                    Terms
                                </Link>
                                ,{' '}
                                <Link
                                    className="hover:text-primary underline"
                                    href={`/${lang}/(marketing)/legal/privacy`}
                                >
                                    Privacy
                                </Link>{' '}
                                and{' '}
                                <Link
                                    className="hover:text-primary underline"
                                    href={`/${lang}/(marketing)/legal/ip-policy`}
                                >
                                    IP Policy
                                </Link>
                                .
                            </p>

                            <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-2 text-xs">
                                <Link
                                    href={`/${lang}/orders`}
                                    className="hover:text-primary underline"
                                >
                                    View orders
                                </Link>
                                <Link
                                    href={`/${lang}/account`}
                                    className="hover:text-primary underline"
                                >
                                    Account
                                </Link>
                                <Link
                                    href={`/${lang}/(marketing)/about`}
                                    className="hover:text-primary underline"
                                >
                                    About
                                </Link>
                                <Link
                                    href={`/${lang}/(marketing)/help`}
                                    className="hover:text-primary underline"
                                >
                                    Help Center
                                </Link>
                                <Link
                                    href={`/${lang}/(auth)/sign-in`}
                                    className="hover:text-primary underline"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href={`/${lang}/(auth)/sign-up`}
                                    className="hover:text-primary underline"
                                >
                                    Create account
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}
