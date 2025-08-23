'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function ResetPasswordPage({ params }: { params: { lang: string; token: string } }) {
    const { lang, token } = params
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [verifying, setVerifying] = useState(true)
    const [sessionReady, setSessionReady] = useState(false)
    const [verifyError, setVerifyError] = useState<string | null>(null)

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)
    const [resetError, setResetError] = useState<string | null>(null)

    const supabase = useMemo(() => supabaseBrowser, [])

    const path = (p: string) => `/${lang}${p}`

    useEffect(() => {
        let cancelled = false
        const ensureRecoverySession = async () => {
            setVerifying(true)
            setVerifyError(null)
            try {
                const { data: sess } = await supabase.auth.getSession()
                if (sess.session) {
                    if (!cancelled) {
                        setSessionReady(true)
                        setVerifying(false)
                    }
                    return
                }

                const code = searchParams.get('code') || searchParams.get('token') || token || null

                if (!code && typeof window !== 'undefined' && window.location.hash) {
                    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
                    const access_token = h.get('access_token')
                    const refresh_token = h.get('refresh_token')
                    if (access_token && refresh_token) {
                        const { error: setErr } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        })
                        if (setErr) throw setErr
                        // Clean hash from URL
                        const cleanUrl = window.location.pathname + window.location.search
                        window.history.replaceState({}, '', cleanUrl)
                        if (!cancelled) {
                            setSessionReady(true)
                            setVerifying(false)
                        }
                        return
                    }
                }

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code)
                    if (error) throw error
                    // Remove query params like ?code=... from URL for cleanliness
                    if (typeof window !== 'undefined') {
                        const cleanUrl = window.location.pathname
                        window.history.replaceState({}, '', cleanUrl)
                    } else {
                        router.replace(pathname)
                    }
                    if (!cancelled) {
                        setSessionReady(true)
                        setVerifying(false)
                    }
                    return
                }

                throw new Error('Missing or invalid recovery token. Please request a new link.')
            } catch (err: any) {
                if (!cancelled) {
                    setVerifyError(err?.message ?? 'Unable to verify recovery link.')
                    setVerifying(false)
                    setSessionReady(false)
                }
            }
        }

        ensureRecoverySession()
        return () => {
            cancelled = true
        }
    }, [supabase, searchParams, token, pathname, router])

    const passwordScore = useMemo(() => {
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++
        return score // 0-5
    }, [password])

    const strengthLabel = useMemo(() => {
        switch (passwordScore) {
            case 0:
            case 1:
                return { label: 'Very weak', color: 'bg-destructive' } as const
            case 2:
                return { label: 'Weak', color: 'bg-destructive' } as const
            case 3:
                return { label: 'Fair', color: 'bg-accent' } as const
            case 4:
                return { label: 'Good', color: 'bg-primary' } as const
            case 5:
                return { label: 'Strong', color: 'bg-primary' } as const
            default:
                return { label: '', color: 'bg-muted' } as const
        }
    }, [passwordScore])

    const canSubmit = useMemo(() => {
        return sessionReady && !submitting && password.length >= 8 && password === confirm
    }, [sessionReady, submitting, password, confirm])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        setSubmitting(true)
        setResetError(null)
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) throw error
            setResetSuccess(true)
            toast({
                title: 'Password updated',
                description: 'Your password has been reset successfully.',
            })
        } catch (err: any) {
            const message = err?.message ?? 'Failed to update password. Please try again.'
            setResetError(message)
            toast({
                title: 'Reset failed',
                description: message,
                variant: 'destructive' as any,
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="bg-background text-foreground min-h-screen">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Link href={path('/')} className="hover:text-foreground">
                            Home
                        </Link>
                        <span aria-hidden>›</span>
                        <Link href={path('/sign-in')} className="hover:text-foreground">
                            Sign in
                        </Link>
                        <span aria-hidden>›</span>
                        <span className="text-foreground">Reset password</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <Link
                            href={path('/about')}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            About
                        </Link>
                        <Link
                            href={path('/help')}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Help
                        </Link>
                        <Link
                            href={path('/contact')}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Contact
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <section className="lg:col-span-2">
                        <div className="border-border bg-card relative overflow-hidden rounded-xl border shadow-sm">
                            <div className="p-6 sm:p-8">
                                <h1 className="mb-2 text-2xl font-semibold tracking-tight">
                                    Set a new password
                                </h1>
                                <p className="text-muted-foreground mb-6 text-sm">
                                    Securely update your account password. After resetting, you can
                                    sign in with your new credentials.
                                </p>

                                {verifying && (
                                    <div className="border-border bg-muted/30 mb-6 rounded-lg border p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                            <p className="text-muted-foreground text-sm">
                                                Validating your reset link…
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {!verifying && verifyError && (
                                    <Alert variant="destructive" className="mb-6">
                                        <AlertTitle>Invalid or expired link</AlertTitle>
                                        <AlertDescription>
                                            {verifyError} You can request a new one from the forgot
                                            password page.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {!resetSuccess ? (
                                    <form
                                        onSubmit={onSubmit}
                                        className={cn(
                                            'space-y-5',
                                            (!sessionReady || verifying) &&
                                                'pointer-events-none opacity-60'
                                        )}
                                    >
                                        <div>
                                            <label
                                                htmlFor="password"
                                                className="mb-1 block text-sm font-medium"
                                            >
                                                New password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    className="border-input bg-background ring-offset-background focus:ring-primary block w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus:border-transparent focus:ring-2"
                                                    placeholder="At least 8 characters"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    minLength={8}
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 mr-2 inline-flex items-center rounded px-2 text-xs"
                                                    aria-label={
                                                        showPassword
                                                            ? 'Hide password'
                                                            : 'Show password'
                                                    }
                                                >
                                                    {showPassword ? 'Hide' : 'Show'}
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="flex flex-1 gap-1">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                'bg-muted h-1 w-full rounded-full',
                                                                i < passwordScore &&
                                                                    strengthLabel.color
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-muted-foreground text-xs">
                                                    {strengthLabel.label}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground mt-2 text-xs">
                                                Use at least 8 characters, including a mix of upper
                                                and lower case letters, numbers, and symbols.
                                            </p>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="confirm"
                                                className="mb-1 block text-sm font-medium"
                                            >
                                                Confirm password
                                            </label>
                                            <input
                                                id="confirm"
                                                type={showPassword ? 'text' : 'password'}
                                                className="border-input bg-background ring-offset-background focus:ring-primary block w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus:border-transparent focus:ring-2"
                                                placeholder="Re-enter your new password"
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                required
                                                minLength={8}
                                                autoComplete="new-password"
                                            />
                                            {confirm.length > 0 && confirm !== password && (
                                                <p className="text-destructive mt-2 text-xs">
                                                    Passwords do not match.
                                                </p>
                                            )}
                                        </div>

                                        {resetError && (
                                            <Alert variant="destructive">
                                                <AlertTitle>Update failed</AlertTitle>
                                                <AlertDescription>{resetError}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <Link
                                                href={path('/forgot-password')}
                                                className="text-muted-foreground text-sm underline-offset-4 hover:underline"
                                            >
                                                Request a new reset link
                                            </Link>
                                            <button
                                                type="submit"
                                                disabled={!canSubmit}
                                                className={cn(
                                                    'bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors',
                                                    !canSubmit && 'opacity-60'
                                                )}
                                            >
                                                {submitting && (
                                                    <span className="border-primary-foreground/80 h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                                                )}
                                                Reset password
                                            </button>
                                        </div>

                                        <div className="pt-4 text-sm">
                                            <span className="text-muted-foreground">
                                                Remembered it?
                                            </span>{' '}
                                            <Link
                                                href={path('/sign-in')}
                                                className="text-primary font-medium underline-offset-4 hover:underline"
                                            >
                                                Sign in
                                            </Link>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <Alert className="border-green-600/50">
                                            <AlertTitle className="font-semibold">
                                                Password updated
                                            </AlertTitle>
                                            <AlertDescription>
                                                Your password has been reset. You can now sign in
                                                with your new password.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Link
                                                href={path('/sign-in')}
                                                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors"
                                            >
                                                Go to sign in
                                            </Link>
                                            <Link
                                                href={path('/account')}
                                                className="border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors"
                                            >
                                                Go to account
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <aside className="lg:col-span-1">
                        <div className="sticky top-8 space-y-4">
                            <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
                                <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide">
                                    Quick links
                                </h2>
                                <nav className="grid grid-cols-1 gap-2 text-sm">
                                    <Link
                                        href={path('/products')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Browse products
                                    </Link>
                                    <Link
                                        href={path('/design')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Start a new design
                                    </Link>
                                    <Link
                                        href={path('/cart')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        View cart
                                    </Link>
                                    <Link
                                        href={path('/orders')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Your orders
                                    </Link>
                                    <Link
                                        href={path('/account')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Account settings
                                    </Link>
                                    <Link
                                        href={path('/help')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Help center
                                    </Link>
                                    <Link
                                        href={path('/legal/terms')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Terms of service
                                    </Link>
                                    <Link
                                        href={path('/legal/privacy')}
                                        className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-2"
                                    >
                                        Privacy policy
                                    </Link>
                                </nav>
                            </div>

                            <div className="border-border bg-card rounded-xl border p-5 shadow-sm">
                                <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide">
                                    New here?
                                </h2>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    Create an account to track orders, manage addresses, and access
                                    your AI design history.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Link
                                        href={path('/sign-up')}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                                    >
                                        Create account
                                    </Link>
                                    <Link
                                        href={path('/about')}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
                                    >
                                        Learn more
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                <footer className="border-border text-muted-foreground mt-10 border-t pt-6 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p>
                            Need more help? Visit our{' '}
                            <Link
                                href={path('/help')}
                                className="underline-offset-4 hover:underline"
                            >
                                Help Center
                            </Link>{' '}
                            or{' '}
                            <Link
                                href={path('/contact')}
                                className="underline-offset-4 hover:underline"
                            >
                                Contact us
                            </Link>
                            .
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href={path('/admin')} className="hover:text-foreground">
                                Admin
                            </Link>
                            <Link href={path('/admin/analytics')} className="hover:text-foreground">
                                Analytics
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    )
}
