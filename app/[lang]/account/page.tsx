'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'

type LangParam = { lang?: string }

type DefaultShipping = {
    recipient_name: string
    phone: string
    country: string
    line1: string
    line2: string
    city: string
    state: string
    postal_code: string
}

export default function AccountPage() {
    const router = useRouter()
    const params = useParams() as unknown as LangParam
    const lang = (params?.lang || 'en').toString()
    const { toast } = useToast()

    const [user, setUser] = React.useState<User | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const [fullName, setFullName] = React.useState('')
    const [email, setEmail] = React.useState('')
    const [phone, setPhone] = React.useState('')
    const [prefLang, setPrefLang] = React.useState<string>(lang)
    const [trackingCode, setTrackingCode] = React.useState('')

    const [shipping, setShipping] = React.useState<DefaultShipping>({
        recipient_name: '',
        phone: '',
        country: 'KR',
        line1: '',
        line2: '',
        city: '',
        state: '',
        postal_code: '',
    })

    const supabase = React.useMemo(() => supabaseBrowser, [])

    React.useEffect(() => {
        let isMounted = true
        ;(async () => {
            setLoading(true)
            setError(null)
            const { data: userRes, error: userErr } = await supabase.auth.getUser()
            if (userErr) {
                if (!isMounted) return
                setError('Unable to load session. Please refresh.')
                setLoading(false)
                return
            }
            const currentUser = userRes?.user ?? null
            if (!isMounted) return
            setUser(currentUser)

            if (!currentUser) {
                setLoading(false)
                return
            }

            setEmail(currentUser.email ?? '')
            const metaName = (
                currentUser.user_metadata?.full_name ||
                currentUser.user_metadata?.name ||
                ''
            ).toString()
            setFullName(metaName)

            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('full_name, phone, language, default_shipping')
                .eq('id', currentUser.id)
                .maybeSingle()

            if (!isMounted) return
            if (profileErr) {
                // If table or row missing, proceed with defaults but show non-blocking warning
                console.warn('profiles fetch error', profileErr)
            }

            if (profile) {
                setFullName(profile.full_name ?? metaName)
                setPhone(profile.phone ?? '')
                if (profile.language) setPrefLang(profile.language)
                if (profile.default_shipping) {
                    const s = profile.default_shipping as DefaultShipping
                    setShipping({
                        recipient_name: s?.recipient_name ?? '',
                        phone: s?.phone ?? '',
                        country: s?.country ?? 'KR',
                        line1: s?.line1 ?? '',
                        line2: s?.line2 ?? '',
                        city: s?.city ?? '',
                        state: s?.state ?? '',
                        postal_code: s?.postal_code ?? '',
                    })
                }
            }

            setLoading(false)
        })()

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            isMounted = false
            sub.subscription.unsubscribe()
        }
    }, [supabase])

    const onChangeShipping = (key: keyof DefaultShipping, value: string) => {
        setShipping((s) => ({ ...s, [key]: value }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            router.push(`/${lang}/(auth)/sign-in`)
            return
        }
        setSaving(true)
        setError(null)

        try {
            const payload: Record<string, any> = {
                id: user.id,
                full_name: fullName || null,
                phone: phone || null,
                language: prefLang || lang,
                default_shipping: shipping,
                updated_at: new Date().toISOString(),
            }

            const { error: upsertErr } = await supabase
                .from('profiles')
                .upsert(payload, { onConflict: 'id' })

            if (upsertErr) throw upsertErr

            toast({
                title: 'Profile saved',
                description: 'Your profile changes have been updated.',
            })

            if (prefLang && prefLang !== lang) {
                router.push(`/${prefLang}/account`)
            }
        } catch (err: any) {
            console.error(err)
            setError('Failed to save profile. Please try again.')
            toast({
                title: 'Save failed',
                description: "We couldn't update your profile.",
                variant: 'destructive' as any,
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push(`/${lang}/(auth)/sign-in`)
    }

    const handleTrackingSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const code = trackingCode.trim()
        if (!code) return
        router.push(`/${lang}/track/${encodeURIComponent(code)}`)
    }

    return (
        <div className="bg-background min-h-[calc(100vh-4rem)]">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
                        <p className="text-muted-foreground text-sm">
                            Manage your profile, preferences, and default shipping details.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${lang}/design`}
                            className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none"
                        >
                            Start a design
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="border-input bg-background hover:bg-muted focus-visible:ring-ring inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                {!user && !loading ? (
                    <div className="border-border rounded-lg border border-dashed p-8 text-center">
                        <h2 className="mb-2 text-lg font-medium">You&apos;re not signed in</h2>
                        <p className="text-muted-foreground mb-4 text-sm">
                            Sign in to manage your account and view your orders.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <Link
                                href={`/${lang}/(auth)/sign-in`}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95"
                            >
                                Sign in
                            </Link>
                            <Link
                                href={`/${lang}/(auth)/sign-up`}
                                className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm"
                            >
                                Create account
                            </Link>
                        </div>
                    </div>
                ) : null}

                {user ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        <aside className="lg:col-span-1">
                            <div className="bg-card rounded-lg border p-4 text-sm">
                                <div className="mb-2 font-medium">Quick links</div>
                                <nav className="grid gap-1">
                                    <Link
                                        href={`/${lang}/account/orders`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Orders
                                    </Link>
                                    <Link
                                        href={`/${lang}/orders`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        All orders
                                    </Link>
                                    <Link
                                        href={`/${lang}/account/addresses`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Addresses
                                    </Link>
                                    <Link
                                        href={`/${lang}/account/billing`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Billing
                                    </Link>
                                    <Link
                                        href={`/${lang}/account/settings`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Account settings
                                    </Link>
                                    <Separator className="my-2" />
                                    <Link
                                        href={`/${lang}/products`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Browse products
                                    </Link>
                                    <Link
                                        href={`/${lang}/cart`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Cart
                                    </Link>
                                    <Link
                                        href={`/${lang}/checkout`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Checkout
                                    </Link>
                                    <Separator className="my-2" />
                                    <Link
                                        href={`/${lang}/(marketing)/help`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Help center
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/about`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        About
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/contact`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Contact
                                    </Link>
                                    <Separator className="my-2" />
                                    <Link
                                        href={`/${lang}/(marketing)/legal/terms`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Terms
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/legal/privacy`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        Privacy
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/legal/ip-policy`}
                                        className="hover:bg-muted rounded px-2 py-1"
                                    >
                                        IP policy
                                    </Link>
                                </nav>
                            </div>
                            <div className="bg-card mt-6 rounded-lg border p-4">
                                <div className="mb-2 text-sm font-medium">Track your order</div>
                                <form onSubmit={handleTrackingSubmit} className="flex gap-2">
                                    <input
                                        value={trackingCode}
                                        onChange={(e) => setTrackingCode(e.target.value)}
                                        placeholder="Enter tracking code"
                                        className="border-input bg-background focus-visible:ring-ring flex-1 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                    />
                                    <button className="bg-secondary text-secondary-foreground focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium hover:opacity-95 focus-visible:ring-2 focus-visible:outline-none">
                                        Go
                                    </button>
                                </form>
                            </div>
                        </aside>

                        <section className="lg:col-span-3">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="bg-card rounded-lg border p-6 shadow-sm">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold">Profile</h2>
                                            <p className="text-muted-foreground text-sm">
                                                Basic information visible on orders and receipts.
                                            </p>
                                        </div>
                                    </div>

                                    {error ? (
                                        <Alert variant="destructive" className="mb-4">
                                            <AlertTitle>Something went wrong</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    ) : null}

                                    {loading ? (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Full name
                                                </label>
                                                <input
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    autoComplete="name"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Email
                                                </label>
                                                <input
                                                    value={email}
                                                    disabled
                                                    className="border-input bg-muted text-muted-foreground w-full cursor-not-allowed rounded-md border px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Phone
                                                </label>
                                                <input
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    autoComplete="tel"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Preferred language
                                                </label>
                                                <select
                                                    value={prefLang}
                                                    onChange={(e) => setPrefLang(e.target.value)}
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                >
                                                    <option value="en">English</option>
                                                    <option value="kr">한국어 (Korean)</option>
                                                </select>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Saving will navigate to your selected language.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-card rounded-lg border p-6 shadow-sm">
                                    <div className="mb-4">
                                        <h2 className="text-lg font-semibold">Default shipping</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Used at checkout by default. You can still change it per
                                            order.
                                        </p>
                                    </div>

                                    {loading ? (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <Skeleton key={i} className="h-10 w-full" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="md:col-span-1">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Recipient name
                                                </label>
                                                <input
                                                    value={shipping.recipient_name}
                                                    onChange={(e) =>
                                                        onChangeShipping(
                                                            'recipient_name',
                                                            e.target.value
                                                        )
                                                    }
                                                    autoComplete="name"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Recipient phone
                                                </label>
                                                <input
                                                    value={shipping.phone}
                                                    onChange={(e) =>
                                                        onChangeShipping('phone', e.target.value)
                                                    }
                                                    autoComplete="tel"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Country
                                                </label>
                                                <select
                                                    value={shipping.country}
                                                    onChange={(e) =>
                                                        onChangeShipping('country', e.target.value)
                                                    }
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                >
                                                    <option value="KR">South Korea</option>
                                                    <option value="US">United States</option>
                                                    <option value="JP">Japan</option>
                                                    <option value="CN">China</option>
                                                    <option value="GB">United Kingdom</option>
                                                    <option value="DE">Germany</option>
                                                    <option value="AU">Australia</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Postal code
                                                </label>
                                                <input
                                                    value={shipping.postal_code}
                                                    onChange={(e) =>
                                                        onChangeShipping(
                                                            'postal_code',
                                                            e.target.value
                                                        )
                                                    }
                                                    autoComplete="postal-code"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Address line 1
                                                </label>
                                                <input
                                                    value={shipping.line1}
                                                    onChange={(e) =>
                                                        onChangeShipping('line1', e.target.value)
                                                    }
                                                    autoComplete="address-line1"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium">
                                                    Address line 2
                                                </label>
                                                <input
                                                    value={shipping.line2}
                                                    onChange={(e) =>
                                                        onChangeShipping('line2', e.target.value)
                                                    }
                                                    autoComplete="address-line2"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="mb-1 block text-sm font-medium">
                                                    City
                                                </label>
                                                <input
                                                    value={shipping.city}
                                                    onChange={(e) =>
                                                        onChangeShipping('city', e.target.value)
                                                    }
                                                    autoComplete="address-level2"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="mb-1 block text-sm font-medium">
                                                    State / Province
                                                </label>
                                                <input
                                                    value={shipping.state}
                                                    onChange={(e) =>
                                                        onChangeShipping('state', e.target.value)
                                                    }
                                                    autoComplete="address-level1"
                                                    className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-muted-foreground text-xs">
                                        Need to manage multiple addresses? Go to{' '}
                                        <Link
                                            href={`/${lang}/account/addresses`}
                                            className="underline underline-offset-2"
                                        >
                                            Addresses
                                        </Link>
                                        .
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/${lang}/account/orders`}
                                            className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm"
                                        >
                                            View orders
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className={cn(
                                                'bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow',
                                                saving ? 'opacity-70' : 'hover:opacity-95'
                                            )}
                                        >
                                            {saving ? 'Saving...' : 'Save changes'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="bg-card mt-10 rounded-lg border p-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">Next steps</h3>
                                        <p className="text-muted-foreground text-sm">
                                            Continue where you left off or explore more.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    <Link
                                        href={`/${lang}/design`}
                                        className="bg-background hover:bg-muted rounded-md border p-4 shadow-sm transition"
                                    >
                                        <div className="text-sm font-medium">
                                            Create a new design
                                        </div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Let AI generate designs for products.
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/products`}
                                        className="bg-background hover:bg-muted rounded-md border p-4 shadow-sm transition"
                                    >
                                        <div className="text-sm font-medium">Browse products</div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            T-shirts, hoodies, mugs, totes, and more.
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/checkout`}
                                        className="bg-background hover:bg-muted rounded-md border p-4 shadow-sm transition"
                                    >
                                        <div className="text-sm font-medium">Go to checkout</div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Ready to place your order?
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/help`}
                                        className="bg-background hover:bg-muted rounded-md border p-4 shadow-sm transition"
                                    >
                                        <div className="text-sm font-medium">Get help</div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Shipping, returns, and FAQs.
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/about`}
                                        className="bg-background hover:bg-muted rounded-md border p-4 shadow-sm transition"
                                    >
                                        <div className="text-sm font-medium">About RealizeIt</div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Learn how it works.
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/account/settings`}
                                        className="bg-background hover:bg-muted rounded-md border p-4 shadow-sm transition"
                                    >
                                        <div className="text-sm font-medium">Account settings</div>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Security and preferences.
                                        </p>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
