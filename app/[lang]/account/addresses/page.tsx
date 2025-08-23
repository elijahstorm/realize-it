'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

interface AddressRow {
    id: string
    user_id: string
    full_name: string
    phone?: string | null
    country: string
    postal_code: string
    state?: string | null
    city: string
    line1: string
    line2?: string | null
    is_default: boolean
    created_at?: string
    updated_at?: string
}

function SectionNav({ lang }: { lang: string }) {
    const linkBase = `/${lang}`
    const linkClass = 'text-sm text-muted-foreground hover:text-foreground transition-colors'
    return (
        <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link href={`${linkBase}/account`} className={linkClass}>
                Account Home
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <Link href={`${linkBase}/account/orders`} className={linkClass}>
                Orders
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <Link href={`${linkBase}/account/billing`} className={linkClass}>
                Billing
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <Link href={`${linkBase}/account/settings`} className={linkClass}>
                Settings
            </Link>
            <span className="text-muted-foreground/60">•</span>
            <Link href={`${linkBase}/cart`} className={linkClass}>
                Cart
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <Link href={`${linkBase}/checkout`} className={linkClass}>
                Checkout
            </Link>
            <span className="text-muted-foreground/60">•</span>
            <Link href={`${linkBase}/products`} className={linkClass}>
                Products
            </Link>
            <span className="text-muted-foreground/60">/</span>
            <Link href={`${linkBase}/design`} className={linkClass}>
                Start a Design
            </Link>
            <span className="text-muted-foreground/60">•</span>
            <Link href={`${linkBase}//help`} className={linkClass}>
                Help
            </Link>
        </div>
    )
}

function AddressForm({
    userId,
    lang,
    onSaved,
    onCancel,
    initial,
}: {
    userId: string
    lang: string
    onSaved: (saved?: AddressRow) => void
    onCancel?: () => void
    initial?: Partial<AddressRow> & { id?: string }
}) {
    const editing = Boolean(initial?.id)
    const [fullName, setFullName] = useState(initial?.full_name ?? '')
    const [phone, setPhone] = useState(initial?.phone ?? '')
    const [country, setCountry] = useState(initial?.country ?? 'KR')
    const [postalCode, setPostalCode] = useState(initial?.postal_code ?? '')
    const [state, setState] = useState(initial?.state ?? '')
    const [city, setCity] = useState(initial?.city ?? '')
    const [line1, setLine1] = useState(initial?.line1 ?? '')
    const [line2, setLine2] = useState(initial?.line2 ?? '')
    const [isDefault, setIsDefault] = useState(initial?.is_default ?? false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toast } = useToast()

    const supabase = useMemo(() => supabaseBrowser, [])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!fullName || !country || !postalCode || !city || !line1) {
            setError('Please fill all required fields.')
            return
        }

        setSubmitting(true)
        try {
            if (isDefault) {
                // Clear other defaults for this user first
                await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
            }

            if (editing && initial?.id) {
                const { data, error: upErr } = await supabase
                    .from('addresses')
                    .update({
                        full_name: fullName,
                        phone: phone || null,
                        country,
                        postal_code: postalCode,
                        state: state || null,
                        city,
                        line1,
                        line2: line2 || null,
                        is_default: isDefault,
                    })
                    .eq('id', initial.id)
                    .eq('user_id', userId)
                    .select('*')
                    .single()
                if (upErr) throw upErr
                toast({ title: 'Address updated' })
                onSaved(data as AddressRow)
            } else {
                const { data, error: inErr } = await supabase
                    .from('addresses')
                    .insert({
                        user_id: userId,
                        full_name: fullName,
                        phone: phone || null,
                        country,
                        postal_code: postalCode,
                        state: state || null,
                        city,
                        line1,
                        line2: line2 || null,
                        is_default: isDefault,
                    })
                    .select('*')
                    .single()
                if (inErr) throw inErr
                toast({ title: 'Address added' })
                onSaved(data as AddressRow)
            }
        } catch (err: any) {
            setError(err?.message ?? 'Failed to save address.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-5">
            {error && (
                <Alert variant="destructive" className="border-destructive/50">
                    <AlertTitle>Could not save</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-sm" htmlFor="full_name">
                        Full name
                    </label>
                    <input
                        id="full_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="Hong Gil-dong"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-sm" htmlFor="phone">
                        Phone
                    </label>
                    <input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="010-1234-5678"
                        inputMode="tel"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-sm" htmlFor="country">
                        Country
                    </label>
                    <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                    >
                        <option value="KR">South Korea</option>
                        <option value="US">United States</option>
                        <option value="JP">Japan</option>
                        <option value="CN">China</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="DE">Germany</option>
                        <option value="FR">France</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-sm" htmlFor="postal_code">
                        Postal code
                    </label>
                    <input
                        id="postal_code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="06236"
                    />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-muted-foreground text-sm" htmlFor="line1">
                        Address line 1
                    </label>
                    <input
                        id="line1"
                        value={line1}
                        onChange={(e) => setLine1(e.target.value)}
                        required
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="123 Teheran-ro"
                    />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-muted-foreground text-sm" htmlFor="line2">
                        Address line 2 (optional)
                    </label>
                    <input
                        id="line2"
                        value={line2}
                        onChange={(e) => setLine2(e.target.value)}
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="Apt, suite, building"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-sm" htmlFor="city">
                        City
                    </label>
                    <input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="Seoul"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-sm" htmlFor="state">
                        State/Province (optional)
                    </label>
                    <input
                        id="state"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="border-input bg-background text-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                        placeholder="Gangnam-gu"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    id="is_default"
                    type="checkbox"
                    className="border-input text-primary focus-visible:ring-ring h-4 w-4 rounded focus-visible:ring-2 focus-visible:outline-none"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                />
                <label htmlFor="is_default" className="text-foreground text-sm">
                    Set as default shipping address
                </label>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                        'bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow transition-colors',
                        submitting ? 'opacity-60' : 'hover:bg-primary/90'
                    )}
                >
                    {submitting
                        ? editing
                            ? 'Saving...'
                            : 'Adding...'
                        : editing
                          ? 'Save changes'
                          : 'Add address'}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onCancel}
                        className={cn(
                            'border-input bg-background text-foreground inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm',
                            submitting
                                ? 'opacity-60'
                                : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        Cancel
                    </button>
                )}
                <div className="text-muted-foreground ml-auto text-sm">
                    You can use your default address during{' '}
                    <Link href={`/${lang}/checkout`} className="text-primary hover:underline">
                        checkout
                    </Link>
                    .
                </div>
            </div>
        </form>
    )
}

export default function AddressesPage() {
    const { lang } = useParams<{ lang: string }>()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [addresses, setAddresses] = useState<AddressRow[]>([])
    const [error, setError] = useState<string | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [editing, setEditing] = useState<AddressRow | null>(null)

    const supabase = useMemo(() => supabaseBrowser, [])

    const fetchAddresses = useCallback(
        async (uid: string) => {
            setLoading(true)
            setError(null)
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', uid)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false })
            if (error) {
                setError(error.message)
                setAddresses([])
            } else {
                setAddresses((data as AddressRow[]) || [])
            }
            setLoading(false)
        },
        [supabase]
    )

    useEffect(() => {
        let mounted = true
        ;(async () => {
            const { data, error } = await supabase.auth.getUser()
            if (error || !data.user) {
                const redirect = encodeURIComponent(`/${lang}/account/addresses`)
                router.replace(`/${lang}/sign-in?redirect=${redirect}`)
                return
            }
            if (!mounted) return
            setUserId(data.user.id)
            fetchAddresses(data.user.id)
        })()
        return () => {
            mounted = false
        }
    }, [supabase, router, lang, fetchAddresses])

    const defaultAddress = useMemo(() => addresses.find((a) => a.is_default) || null, [addresses])

    const makeDefault = async (id: string) => {
        if (!userId) return
        setLoading(true)
        setError(null)
        try {
            await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId)
            const { error: upErr } = await supabase
                .from('addresses')
                .update({ is_default: true })
                .eq('id', id)
                .eq('user_id', userId)
            if (upErr) throw upErr
            await fetchAddresses(userId)
            toast({ title: 'Default address updated' })
        } catch (e: any) {
            setError(e?.message ?? 'Failed to set default address')
        } finally {
            setLoading(false)
        }
    }

    const deleteAddress = async (id: string) => {
        if (!userId) return
        if (!confirm('Delete this address? This cannot be undone.')) return
        setLoading(true)
        setError(null)
        try {
            const deletedWasDefault = addresses.find((a) => a.id === id)?.is_default
            const { error: delErr } = await supabase
                .from('addresses')
                .delete()
                .eq('id', id)
                .eq('user_id', userId)
            if (delErr) throw delErr

            // Optionally set another address as default if none remains
            const { data: after, error: aftErr } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: true })
            if (aftErr) throw aftErr
            const list = (after as AddressRow[]) || []
            if (deletedWasDefault && list.length > 0 && !list.some((a) => a.is_default)) {
                await supabase
                    .from('addresses')
                    .update({ is_default: true })
                    .eq('id', list[0].id)
                    .eq('user_id', userId)
            }
            await fetchAddresses(userId)
            toast({ title: 'Address deleted' })
        } catch (e: any) {
            setError(e?.message ?? 'Failed to delete address')
        } finally {
            setLoading(false)
        }
    }

    const onSaved = (saved?: AddressRow) => {
        setShowCreate(false)
        setEditing(null)
        if (userId) fetchAddresses(userId)
    }

    const toCheckout = (addrId?: string) => {
        const base = `/${lang}/checkout`
        router.push(addrId ? `${base}?addressId=${addrId}` : base)
    }

    return (
        <div className="bg-background min-h-[calc(100vh-4rem)]">
            <div className="mx-auto w-full max-w-5xl px-4 py-10">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                            Shipping Addresses
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage where your orders are delivered. Set a default and use it during
                            checkout.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${lang}/account/orders`}
                            className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground hidden items-center rounded-md border px-3 py-2 text-sm md:inline-flex"
                        >
                            View Orders
                        </Link>
                        <button
                            onClick={() => toCheckout(defaultAddress?.id)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium shadow"
                        >
                            Go to Checkout
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <SectionNav lang={lang} />
                </div>

                <Separator className="my-6" />

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>Something went wrong</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-foreground text-lg font-medium">
                                Your saved addresses
                            </h2>
                            <button
                                onClick={() => {
                                    setEditing(null)
                                    setShowCreate((s) => !s)
                                }}
                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
                            >
                                {showCreate ? 'Close' : 'Add new'}
                            </button>
                        </div>

                        {showCreate && (
                            <div className="border-border bg-card text-card-foreground mt-4 rounded-lg border p-4 shadow-sm">
                                <h3 className="text-foreground mb-3 text-sm font-medium">
                                    Add a new shipping address
                                </h3>
                                <AddressForm
                                    userId={userId!}
                                    lang={lang}
                                    onSaved={onSaved}
                                    onCancel={() => setShowCreate(false)}
                                />
                            </div>
                        )}

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {loading && (
                                <>
                                    <div className="border-border bg-muted/30 h-40 animate-pulse rounded-lg border" />
                                    <div className="border-border bg-muted/30 h-40 animate-pulse rounded-lg border" />
                                </>
                            )}
                            {!loading && addresses.length === 0 && (
                                <div className="border-border bg-card text-card-foreground col-span-1 rounded-lg border p-6 md:col-span-2">
                                    <p className="text-muted-foreground text-sm">
                                        You don’t have any saved addresses yet. Add one to use
                                        during checkout. You can also go back to{' '}
                                        <Link
                                            href={`/${lang}/products`}
                                            className="text-primary hover:underline"
                                        >
                                            products
                                        </Link>{' '}
                                        or{' '}
                                        <Link
                                            href={`/${lang}/design`}
                                            className="text-primary hover:underline"
                                        >
                                            start a design
                                        </Link>
                                        .
                                    </p>
                                </div>
                            )}
                            {!loading &&
                                addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className={cn(
                                            'group bg-card text-card-foreground relative flex h-full flex-col rounded-lg border p-4 shadow-sm',
                                            addr.is_default ? 'border-primary' : 'border-border'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-foreground font-medium">
                                                        {addr.full_name}
                                                    </h3>
                                                    {addr.is_default && (
                                                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground mt-1 text-sm">
                                                    <p>
                                                        {addr.line1}
                                                        {addr.line2 ? `, ${addr.line2}` : ''}
                                                    </p>
                                                    <p>
                                                        {addr.city}
                                                        {addr.state ? `, ${addr.state}` : ''}{' '}
                                                        {addr.postal_code}
                                                    </p>
                                                    <p>{addr.country}</p>
                                                    {addr.phone && <p>{addr.phone}</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2">
                                            <button
                                                onClick={() => toCheckout(addr.id)}
                                                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                            >
                                                Use in Checkout
                                            </button>
                                            {!addr.is_default && (
                                                <button
                                                    onClick={() => makeDefault(addr.id)}
                                                    className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                                    disabled={loading}
                                                >
                                                    Make Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setShowCreate(false)
                                                    setEditing(addr)
                                                }}
                                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteAddress(addr.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <aside className="space-y-6 lg:col-span-1">
                        <div className="border-border bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
                            <h3 className="text-foreground text-sm font-medium">Default address</h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                This address will be preselected during checkout.
                            </p>
                            <Separator className="my-3" />
                            {!defaultAddress ? (
                                <p className="text-muted-foreground text-sm">No default set yet.</p>
                            ) : (
                                <div className="text-sm">
                                    <p className="text-foreground font-medium">
                                        {defaultAddress.full_name}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {defaultAddress.line1}
                                        {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ''}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {defaultAddress.city}
                                        {defaultAddress.state
                                            ? `, ${defaultAddress.state}`
                                            : ''}{' '}
                                        {defaultAddress.postal_code}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {defaultAddress.country}
                                    </p>
                                </div>
                            )}
                            <div className="mt-4 flex items-center gap-2">
                                <button
                                    onClick={() => toCheckout(defaultAddress?.id)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium"
                                >
                                    Use in Checkout
                                </button>
                            </div>
                            <div className="text-muted-foreground mt-3 text-xs">
                                Need help with delivery? Visit our{' '}
                                <Link
                                    href={`/${lang}//help`}
                                    className="text-primary hover:underline"
                                >
                                    Help Center
                                </Link>
                                .
                            </div>
                        </div>

                        <div className="border-border bg-card text-card-foreground rounded-lg border p-4 shadow-sm">
                            <h3 className="text-foreground text-sm font-medium">
                                Continue shopping
                            </h3>
                            <ul className="mt-2 space-y-2 text-sm">
                                <li>
                                    <Link
                                        href={`/${lang}/products`}
                                        className="text-primary hover:underline"
                                    >
                                        Browse Products
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={`/${lang}/design`}
                                        className="text-primary hover:underline"
                                    >
                                        Generate a Design
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={`/${lang}/orders`}
                                        className="text-primary hover:underline"
                                    >
                                        Track Orders
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={`/${lang}//about`}
                                        className="text-primary hover:underline"
                                    >
                                        About RealizeIt
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={`/${lang}//legal/privacy`}
                                        className="text-primary hover:underline"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>

                {editing && (
                    <div className="border-border bg-card text-card-foreground mt-8 rounded-lg border p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-foreground text-sm font-medium">Edit address</h3>
                            <button
                                onClick={() => setEditing(null)}
                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm"
                            >
                                Close
                            </button>
                        </div>
                        <div className="mt-4">
                            <AddressForm
                                userId={userId!}
                                lang={lang}
                                initial={editing}
                                onSaved={onSaved}
                                onCancel={() => setEditing(null)}
                            />
                        </div>
                    </div>
                )}

                <div className="border-border bg-card mt-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div className="text-muted-foreground text-sm">
                        Ready to place your order? Head to{' '}
                        <Link href={`/${lang}/checkout`} className="text-primary hover:underline">
                            checkout
                        </Link>
                        .
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${lang}/account`}
                            className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm"
                        >
                            Back to Account
                        </Link>
                        <Link
                            href={`/${lang}/account/orders`}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center rounded-md px-3 py-2 text-sm"
                        >
                            View Orders
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
