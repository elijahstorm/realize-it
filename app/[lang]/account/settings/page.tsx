'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

interface Profile {
    id: string
    locale?: string | null
    marketing_emails?: boolean | null
    order_updates_emails?: boolean | null
    sms_notifications?: boolean | null
    is_admin?: boolean | null
    deletion_requested?: boolean | null
}

export default function SettingsPage() {
    const router = useRouter()
    const params = useParams<{ lang: string }>()
    const { toast } = useToast()

    const lang = useMemo(() => (typeof params?.lang === 'string' ? params.lang : 'en'), [params])
    const supabase = useMemo(() => supabaseBrowser, [])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [userId, setUserId] = useState<string | null>(null)
    const [email, setEmail] = useState<string | null>(null)

    const [profile, setProfile] = useState<Profile | null>(null)

    const [form, setForm] = useState({
        locale: lang,
        marketing_emails: true,
        order_updates_emails: true,
        sms_notifications: false,
    })

    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [ackDelete, setAckDelete] = useState(false)

    const url = (path: string) => `/${lang}${path}`

    useEffect(() => {
        let mounted = true
        ;(async () => {
            setLoading(true)
            const {
                data: { user },
                error: userErr,
            } = await supabase.auth.getUser()
            if (userErr) {
                console.error(userErr)
            }
            if (!user) {
                router.replace(`/${lang}/sign-in`)
                return
            }
            if (!mounted) return

            setUserId(user.id)
            setEmail(user.email ?? null)

            const { data: prof, error } = await supabase
                .from('profiles')
                .select(
                    'id, locale, marketing_emails, order_updates_emails, sms_notifications, is_admin, deletion_requested'
                )
                .eq('id', user.id)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error(error)
                toast({
                    title: 'Couldn’t load settings',
                    description: 'Please try again in a moment.',
                    variant: 'destructive' as any,
                })
            }

            const nextProfile: Profile = {
                id: user.id,
                locale: prof?.locale ?? lang,
                marketing_emails: prof?.marketing_emails ?? true,
                order_updates_emails: prof?.order_updates_emails ?? true,
                sms_notifications: prof?.sms_notifications ?? false,
                is_admin: prof?.is_admin ?? false,
                deletion_requested: prof?.deletion_requested ?? false,
            }

            if (!mounted) return
            setProfile(nextProfile)
            setForm({
                locale: nextProfile.locale || lang,
                marketing_emails: !!nextProfile.marketing_emails,
                order_updates_emails: !!nextProfile.order_updates_emails,
                sms_notifications: !!nextProfile.sms_notifications,
            })

            setLoading(false)
        })()
        return () => {
            mounted = false
        }
    }, [lang, router, supabase, toast])

    const onSave = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!userId) return
        setSaving(true)
        try {
            const payload = {
                id: userId,
                locale: form.locale,
                marketing_emails: form.marketing_emails,
                order_updates_emails: form.order_updates_emails,
                sms_notifications: form.sms_notifications,
                updated_at: new Date().toISOString(),
            }
            const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
            if (error) throw error
            toast({ title: 'Preferences saved' })
            setProfile((p) => (p ? { ...p, ...payload } : (payload as Profile)))
        } catch (err: any) {
            console.error(err)
            toast({
                title: 'Save failed',
                description: err?.message || 'Please try again.',
                variant: 'destructive' as any,
            })
        } finally {
            setSaving(false)
        }
    }

    const onChangeLang = async (nextLang: string) => {
        setForm((f) => ({ ...f, locale: nextLang }))
        try {
            if (userId) {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({ id: userId, locale: nextLang, updated_at: new Date().toISOString() })
                if (error) throw error
            }
        } catch (err) {
            console.error(err)
        } finally {
            router.push(`/${nextLang}/account/settings`)
            router.refresh()
            toast({ title: 'Language updated' })
        }
    }

    const onSignOut = async () => {
        setSigningOut(true)
        try {
            const { error } = await supabase.auth.signOut({ scope: 'global' as any })
            if (error) throw error
            router.replace(`/${lang}/sign-in`)
            toast({ title: 'Signed out' })
        } catch (err: any) {
            console.error(err)
            toast({
                title: 'Sign out failed',
                description: err?.message || 'Please try again.',
                variant: 'destructive' as any,
            })
        } finally {
            setSigningOut(false)
        }
    }

    const onRequestDeletion = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return
        if (!ackDelete || deleteConfirm !== 'DELETE') {
            toast({
                title: 'Confirmation required',
                description: 'Type DELETE and acknowledge to proceed.',
            })
            return
        }
        setDeleting(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ deletion_requested: true, updated_at: new Date().toISOString() })
                .eq('id', userId)
            if (error) throw error
            toast({
                title: 'Deletion requested',
                description: 'We’ll process your request shortly.',
            })
            setProfile((p) => (p ? { ...p, deletion_requested: true } : p))
            setAckDelete(false)
            setDeleteConfirm('')
        } catch (err: any) {
            console.error(err)
            toast({
                title: 'Request failed',
                description: err?.message || 'Please try again.',
                variant: 'destructive' as any,
            })
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="bg-background min-h-[80vh] w-full">
            <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Account settings</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage your preferences, language, and security.
                        </p>
                    </div>
                    <nav className="hidden gap-3 text-sm sm:flex">
                        <Link
                            href={url('/account')}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Account
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium">Settings</span>
                    </nav>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <section className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-medium">Preferences</h2>
                                <p className="text-muted-foreground text-sm">
                                    Choose how you want to hear from us.
                                </p>
                            </div>
                            <button
                                onClick={onSave}
                                disabled={saving || loading}
                                className={cn(
                                    'bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity',
                                    (saving || loading) && 'opacity-60'
                                )}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                        <Separator className="my-4" />

                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-6 w-56" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <form onSubmit={onSave} className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Language</label>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={form.locale}
                                            onChange={(e) => onChangeLang(e.target.value)}
                                            className="border-input bg-background ring-offset-background focus:ring-ring h-10 w-full max-w-xs rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                                        >
                                            <option value="en">English</option>
                                            <option value="ko">한국어 (Korean)</option>
                                        </select>
                                        <span className="text-muted-foreground text-xs">
                                            Applies instantly
                                        </span>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                                        <div>
                                            <p className="text-sm font-medium">
                                                Order updates (email)
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Receive confirmations, shipping notices, and
                                                delivery updates.
                                            </p>
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={form.order_updates_emails}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        order_updates_emails: e.target.checked,
                                                    }))
                                                }
                                                className="border-input text-primary focus:ring-ring h-4 w-4 rounded"
                                            />
                                            <span className="text-sm">Enabled</span>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                                        <div>
                                            <p className="text-sm font-medium">Marketing emails</p>
                                            <p className="text-muted-foreground text-xs">
                                                Get product tips, new drops, and special offers. You
                                                can opt out anytime.
                                            </p>
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={form.marketing_emails}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        marketing_emails: e.target.checked,
                                                    }))
                                                }
                                                className="border-input text-primary focus:ring-ring h-4 w-4 rounded"
                                            />
                                            <span className="text-sm">Enabled</span>
                                        </label>
                                    </div>

                                    <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                                        <div>
                                            <p className="text-sm font-medium">
                                                SMS shipping updates
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                Optional SMS alerts for shipment milestones where
                                                available.
                                            </p>
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={form.sms_notifications}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        sms_notifications: e.target.checked,
                                                    }))
                                                }
                                                className="border-input text-primary focus:ring-ring h-4 w-4 rounded"
                                            />
                                            <span className="text-sm">Enabled</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Link
                                        href={url('/account')}
                                        className="text-muted-foreground hover:text-foreground text-sm"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className={cn(
                                            'bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity',
                                            saving && 'opacity-60'
                                        )}
                                    >
                                        {saving ? 'Saving…' : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>

                    <section className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-medium">Security</h2>
                        <p className="text-muted-foreground text-sm">
                            Manage your sessions and sign out on all devices.
                        </p>
                        <Separator className="my-4" />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm">
                                <p className="font-medium">Signed in as</p>
                                <p className="text-muted-foreground">{email ?? '—'}</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onSignOut}
                                    disabled={signingOut}
                                    className={cn(
                                        'border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium',
                                        signingOut && 'opacity-60'
                                    )}
                                >
                                    {signingOut ? 'Signing out…' : 'Sign out of all devices'}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-medium">Quick links</h2>
                        <p className="text-muted-foreground text-sm">
                            Navigate to other areas of your account.
                        </p>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Link
                                href={url('/account/orders')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Your orders</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    Track and manage orders
                                </p>
                            </Link>
                            <Link
                                href={url('/account/addresses')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Addresses</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    Manage shipping addresses
                                </p>
                            </Link>
                            <Link
                                href={url('/account/billing')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Billing</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    Payment methods and invoices
                                </p>
                            </Link>
                            <Link
                                href={url('/cart')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Cart</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    Ready to checkout
                                </p>
                            </Link>
                            <Link
                                href={url('/design')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Start a design</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    Create new AI-generated designs
                                </p>
                            </Link>
                            <Link
                                href={url('/products')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Products</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    Explore available items
                                </p>
                            </Link>
                            <Link
                                href={url('/help')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Help center</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    FAQs and guides
                                </p>
                            </Link>
                            <Link
                                href={url('/contact')}
                                className="group hover:bg-accent block rounded-lg border p-4"
                            >
                                <p className="font-medium">Contact support</p>
                                <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                    We’re here to help
                                </p>
                            </Link>
                            {profile?.is_admin ? (
                                <Link
                                    href={url('/admin')}
                                    className="group hover:bg-accent block rounded-lg border p-4"
                                >
                                    <p className="font-medium">Admin dashboard</p>
                                    <p className="text-muted-foreground group-hover:text-foreground text-sm">
                                        Orders, logs, costs, health
                                    </p>
                                </Link>
                            ) : null}
                        </div>
                    </section>

                    <section className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                        <h2 className="mb-1 text-lg font-medium">Legal</h2>
                        <p className="text-muted-foreground text-sm">
                            Review our policies and terms of service.
                        </p>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Link
                                href={url('/legal/terms')}
                                className="hover:bg-accent rounded-lg border p-4"
                            >
                                <p className="font-medium">Terms of Service</p>
                                <p className="text-muted-foreground text-sm">Read terms</p>
                            </Link>
                            <Link
                                href={url('/legal/privacy')}
                                className="hover:bg-accent rounded-lg border p-4"
                            >
                                <p className="font-medium">Privacy Policy</p>
                                <p className="text-muted-foreground text-sm">How we handle data</p>
                            </Link>
                            <Link
                                href={url('/legal/ip-policy')}
                                className="hover:bg-accent rounded-lg border p-4"
                            >
                                <p className="font-medium">IP & Content Policy</p>
                                <p className="text-muted-foreground text-sm">Ownership and usage</p>
                            </Link>
                        </div>
                    </section>

                    <section className="border-destructive/40 bg-background rounded-lg border p-6 shadow-sm">
                        <h2 className="text-destructive mb-1 text-lg font-medium">Danger zone</h2>
                        <p className="text-muted-foreground text-sm">
                            Request permanent deletion of your account and associated data.
                        </p>
                        <Separator className="my-4" />

                        {profile?.deletion_requested ? (
                            <Alert className="text-foreground mb-4 border-green-600/30 bg-green-600/10">
                                <AlertTitle>Deletion request received</AlertTitle>
                                <AlertDescription>
                                    We’ve recorded your request. You’ll receive an email once the
                                    deletion is completed.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        <form onSubmit={onRequestDeletion} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Type DELETE to confirm
                                </label>
                                <input
                                    value={deleteConfirm}
                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                    placeholder="DELETE"
                                    className="border-destructive/50 bg-background focus:ring-destructive h-10 w-full rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={ackDelete}
                                    onChange={(e) => setAckDelete(e.target.checked)}
                                    className="border-destructive/60 text-destructive focus:ring-destructive h-4 w-4 rounded"
                                />
                                I understand this action is irreversible and may cancel in-progress
                                orders.
                            </label>
                            <div className="flex items-center justify-end gap-3">
                                <Link
                                    href={url('/account')}
                                    className="text-muted-foreground hover:text-foreground text-sm"
                                >
                                    Back
                                </Link>
                                <button
                                    type="submit"
                                    disabled={deleting}
                                    className={cn(
                                        'bg-destructive text-destructive-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity',
                                        deleting && 'opacity-60'
                                    )}
                                >
                                    {deleting ? 'Requesting…' : 'Request account deletion'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <div className="bg-card text-card-foreground flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <div className="text-muted-foreground text-sm">
                            Looking for something else? Visit
                            <span className="mx-1" />
                            <Link
                                href={url('')}
                                className="text-foreground underline underline-offset-4"
                            >
                                Home
                            </Link>
                            ,
                            <span className="mx-1" />
                            <Link
                                href={url('/about')}
                                className="text-foreground underline underline-offset-4"
                            >
                                About
                            </Link>
                            , or
                            <span className="mx-1" />
                            <Link
                                href={url('/orders')}
                                className="text-foreground underline underline-offset-4"
                            >
                                Order history
                            </Link>
                            .
                        </div>
                        <button
                            onClick={() => router.push(url('/checkout'))}
                            className="bg-primary text-primary-foreground inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
                        >
                            Go to checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
