'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'

export default function SignUpPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const lang = typeof params?.lang === 'string' ? params.lang : 'en'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isMerchant, setIsMerchant] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [agree, setAgree] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const supabase = useMemo(() => supabaseBrowser, [])

    const passwordScore = useMemo(() => {
        let score = 0
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++
        return score // 0-5
    }, [password])

    const strengthText = useMemo(() => {
        switch (passwordScore) {
            case 5:
            case 4:
                return 'Strong'
            case 3:
                return 'Medium'
            case 2:
            case 1:
                return 'Weak'
            default:
                return ''
        }
    }, [passwordScore])

    const onOAuth = useCallback(
        async (provider: 'google' | 'github') => {
            setErrorMsg(null)
            try {
                const redirectTo = `${window.location.origin}/${lang}/callback`
                const { error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo,
                    },
                })
                if (error) throw error
            } catch (err: any) {
                const message = err?.message || 'OAuth sign-in failed'
                setErrorMsg(message)
                toast({
                    title: 'Sign-in error',
                    description: message,
                    variant: 'destructive' as any,
                })
            }
        },
        [lang, supabase.auth, toast]
    )

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            setErrorMsg(null)

            if (!email || !password || !confirmPassword || !fullName) {
                setErrorMsg('Please complete all fields.')
                return
            }
            if (password !== confirmPassword) {
                setErrorMsg('Passwords do not match.')
                return
            }
            if (password.length < 8) {
                setErrorMsg('Password must be at least 8 characters.')
                return
            }
            if (!agree) {
                setErrorMsg('You must accept the terms to continue.')
                return
            }

            setSubmitting(true)
            try {
                const emailRedirectTo = `${window.location.origin}/${lang}/callback`
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo,
                        data: {
                            full_name: fullName,
                            preferred_lang: lang,
                            is_merchant: isMerchant,
                        },
                    },
                })
                if (error) throw error

                // Persist pending email + post-signup redirect for verify-email flow
                try {
                    window.localStorage.setItem('pendingSignUpEmail', email)
                    window.sessionStorage.setItem('postSignUpRedirect', `/${lang}/design`)
                } catch {}

                toast({
                    title: 'Check your email',
                    description:
                        'We sent a verification link. Please verify your email to continue.',
                })

                // If user is created but needs confirmation, route to verify-email
                if (!data.session) {
                    router.replace(`/${lang}/verify-email?email=${encodeURIComponent(email)}`)
                    return
                }

                // If email confirmations are disabled and session exists, go straight to design
                router.replace(`/${lang}/design`)
            } catch (err: any) {
                const message = err?.message || 'Sign-up failed. Please try again.'
                setErrorMsg(message)
                toast({
                    title: 'Sign-up error',
                    description: message,
                    variant: 'destructive' as any,
                })
            } finally {
                setSubmitting(false)
            }
        },
        [
            agree,
            confirmPassword,
            email,
            fullName,
            isMerchant,
            lang,
            password,
            router,
            supabase.auth,
            toast,
        ]
    )

    return (
        <div className="from-background to-muted/40 text-foreground min-h-screen bg-gradient-to-b">
            <header className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <Link
                        href={`/${lang}/products`}
                        className="text-foreground inline-flex items-center gap-2 font-semibold hover:opacity-90"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                            className="text-primary"
                        >
                            <path
                                d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.77 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z"
                                fill="currentColor"
                            />
                        </svg>
                        <span className="text-lg">RealizeIt</span>
                    </Link>
                    <nav className="hidden gap-6 text-sm md:flex">
                        <Link
                            href={`/${lang}/about`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            About
                        </Link>
                        <Link
                            href={`/${lang}/help`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Help
                        </Link>
                        <Link
                            href={`/${lang}/contact`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Contact
                        </Link>
                        <Link
                            href={`/${lang}/products`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Products
                        </Link>
                        <Link
                            href={`/${lang}/design`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Design
                        </Link>
                        <Link
                            href={`/${lang}/cart`}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cart
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
                <section className="order-2 md:order-1">
                    <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm sm:p-8">
                        <div className="mb-6">
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                Create your account
                            </h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Start turning ideas into real products with AI-powered designs and
                                Printify fulfillment.
                            </p>
                        </div>

                        {errorMsg ? (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTitle>We ran into an issue</AlertTitle>
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        ) : null}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-2">
                                <label htmlFor="fullName" className="text-sm font-medium">
                                    Full name
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    autoComplete="name"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="border-input bg-background focus-visible:border-primary focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-sm ring-0 transition outline-none focus-visible:ring-2"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-input bg-background focus-visible:border-primary focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-sm ring-0 transition outline-none focus-visible:ring-2"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    {strengthText ? (
                                        <span
                                            className={cn(
                                                'text-xs',
                                                passwordScore >= 4
                                                    ? 'text-emerald-600'
                                                    : passwordScore >= 3
                                                      ? 'text-amber-600'
                                                      : 'text-rose-600'
                                            )}
                                        >
                                            {strengthText}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">
                                            min 8 characters
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="border-input bg-background focus-visible:border-primary focus-visible:ring-ring h-11 w-full rounded-md border px-3 pr-10 text-sm ring-0 transition outline-none focus-visible:ring-2"
                                        placeholder="Create a password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
                                        aria-label={
                                            showPassword ? 'Hide password' : 'Show password'
                                        }
                                    >
                                        {showPassword ? (
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M3 3l18 18"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M16.24 16.24C14.9 17.38 13.12 18 11.99 18 6.48 18 3 12 3 12a17.37 17.37 0 015.17-4.73"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M12.99 6.16A10.1 10.1 0 0121 12s-.66 1.16-1.92 2.5"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <path
                                                    d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="3"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            passwordScore >= 4
                                                ? 'bg-emerald-500'
                                                : passwordScore >= 3
                                                  ? 'bg-amber-500'
                                                  : passwordScore >= 1
                                                    ? 'bg-rose-500'
                                                    : 'bg-muted'
                                        )}
                                        style={{ width: `${(passwordScore / 5) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="border-input bg-background focus-visible:border-primary focus-visible:ring-ring h-11 w-full rounded-md border px-3 text-sm ring-0 transition outline-none focus-visible:ring-2"
                                    placeholder="Re-enter your password"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="inline-flex cursor-pointer items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isMerchant}
                                        onChange={(e) => setIsMerchant(e.target.checked)}
                                        className="border-input text-primary focus:ring-ring h-4 w-4 rounded"
                                    />
                                    <span className="text-muted-foreground text-sm">
                                        I’m a seller/merchant and want access to admin features
                                    </span>
                                </label>

                                <label className="inline-flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                        className="border-input text-primary focus:ring-ring mt-1 h-4 w-4 rounded"
                                    />
                                    <span className="text-muted-foreground text-sm">
                                        I agree to the{' '}
                                        <Link
                                            href={`/${lang}/legal/terms`}
                                            className="text-foreground hover:text-primary underline underline-offset-2"
                                        >
                                            Terms
                                        </Link>
                                        ,{' '}
                                        <Link
                                            href={`/${lang}/legal/privacy`}
                                            className="text-foreground hover:text-primary underline underline-offset-2"
                                        >
                                            Privacy Policy
                                        </Link>
                                        , and{' '}
                                        <Link
                                            href={`/${lang}/legal/ip-policy`}
                                            className="text-foreground hover:text-primary underline underline-offset-2"
                                        >
                                            IP Policy
                                        </Link>
                                        .
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className={cn(
                                    'bg-primary text-primary-foreground inline-flex h-11 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition',
                                    submitting ? 'opacity-70' : 'hover:opacity-95'
                                )}
                            >
                                {submitting ? (
                                    <span className="inline-flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4 animate-spin"
                                            viewBox="0 0 24 24"
                                            fill="none"
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
                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                            />
                                        </svg>
                                        Creating account…
                                    </span>
                                ) : (
                                    <span>Create account</span>
                                )}
                            </button>

                            <div className="text-muted-foreground text-center text-sm">
                                By continuing you consent to receive service emails. You can update
                                preferences in{' '}
                                <Link
                                    href={`/${lang}/account/settings`}
                                    className="text-foreground hover:text-primary underline underline-offset-2"
                                >
                                    Settings
                                </Link>
                                .
                            </div>

                            <Separator className="my-2" />

                            <div className="grid gap-3">
                                <button
                                    type="button"
                                    onClick={() => onOAuth('google')}
                                    className="border-input bg-background text-foreground hover:bg-accent inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                                        <path
                                            fill="#EA4335"
                                            d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.7-5.4 3.7-3.2 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 11.9S6.8 21.3 12 21.3c6.8 0 9.4-4.7 9.4-7.2 0-.5 0-.9-.1-1.2H12z"
                                        />
                                    </svg>
                                    Continue with Google
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onOAuth('github')}
                                    className="border-input bg-background text-foreground hover:bg-accent inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border text-sm font-medium transition"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        aria-hidden
                                        fill="currentColor"
                                    >
                                        <path d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.2 3.4 9.6 8 11.1.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.2-1.3-1.6-1.3-1.6-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 .1.9.9 2.7 1 .3-.8.7-1.2 1.2-1.5-2.6-.3-5.3-1.3-5.3-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.2 1.8-.3 2.7-.3s1.8.1 2.7.3c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.3 5.9.7.5 1.3 1.5 1.3 3.1v2.9c0 .3.2.7.8.6 4.6-1.5 8-5.9 8-11.1A11.5 11.5 0 0 0 12 .5z" />
                                    </svg>
                                    Continue with GitHub
                                </button>
                            </div>

                            <div className="text-center text-sm">
                                Already have an account?{' '}
                                <Link
                                    href={`/${lang}/sign-in`}
                                    className="text-foreground hover:text-primary underline underline-offset-2"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="border-border/60 bg-card text-muted-foreground mt-6 rounded-xl border p-4 text-xs">
                        <p className="mb-2">Other helpful links:</p>
                        <div className="flex flex-wrap gap-3">
                            <Link href={`/${lang}/orders`} className="hover:text-foreground">
                                My Orders
                            </Link>
                            <Link href={`/${lang}/account`} className="hover:text-foreground">
                                Account
                            </Link>
                            <Link
                                href={`/${lang}/account/addresses`}
                                className="hover:text-foreground"
                            >
                                Addresses
                            </Link>
                            <Link
                                href={`/${lang}/account/billing`}
                                className="hover:text-foreground"
                            >
                                Billing
                            </Link>
                            <Link
                                href={`/${lang}/account/settings`}
                                className="hover:text-foreground"
                            >
                                Settings
                            </Link>
                            <Link href={`/${lang}/admin`} className="hover:text-foreground">
                                Admin
                            </Link>
                            <Link href={`/${lang}/help`} className="hover:text-foreground">
                                Support
                            </Link>
                        </div>
                    </div>
                </section>

                <aside className="order-1 md:order-2">
                    <div className="border-border/60 bg-card relative overflow-hidden rounded-2xl border p-8 shadow-sm">
                        <div className="bg-primary/10 absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl" />
                        <div className="bg-secondary/10 absolute -right-24 -bottom-24 h-64 w-64 rounded-full blur-3xl" />
                        <div className="relative">
                            <h2 className="text-xl font-semibold">Design with AI, ship to Korea</h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                RealizeIt turns your prompt into print-ready designs and
                                auto-fulfills via Printify after Stripe checkout. Support for Korean
                                and English.
                            </p>

                            <ul className="text-muted-foreground mt-6 space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary/10 text-primary mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M20 6L9 17l-5-5"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    3 AI-generated options per request with live mockups
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary/10 text-primary mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M20 6L9 17l-5-5"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    Automatic Printify order placement after payment
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary/10 text-primary mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M20 6L9 17l-5-5"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    Order tracking and history in your{' '}
                                    <Link
                                        href={`/${lang}/account/orders`}
                                        className="text-foreground hover:text-primary underline underline-offset-2"
                                    >
                                        Account
                                    </Link>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="bg-primary/10 text-primary mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path
                                                d="M20 6L9 17l-5-5"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                    Explore the{' '}
                                    <Link
                                        href={`/${lang}/products`}
                                        className="text-foreground hover:text-primary underline underline-offset-2"
                                    >
                                        catalog
                                    </Link>{' '}
                                    or jump into{' '}
                                    <Link
                                        href={`/${lang}/design`}
                                        className="text-foreground hover:text-primary underline underline-offset-2"
                                    >
                                        design
                                    </Link>
                                </li>
                            </ul>

                            <div className="mt-8">
                                <Link
                                    href={`/${lang}/design`}
                                    className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition hover:opacity-90"
                                >
                                    Start designing
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M5 12h14M13 5l7 7-7 7"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </Link>
                            </div>

                            <Separator className="my-8" />

                            <div className="text-muted-foreground text-xs">
                                Need help? Visit our{' '}
                                <Link
                                    href={`/${lang}/help`}
                                    className="text-foreground hover:text-primary underline underline-offset-2"
                                >
                                    Help Center
                                </Link>{' '}
                                or{' '}
                                <Link
                                    href={`/${lang}/contact`}
                                    className="text-foreground hover:text-primary underline underline-offset-2"
                                >
                                    Contact us
                                </Link>
                                .
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="border-border/60 bg-background/80 supports-[backdrop-filter]:bg-background/60 border-t backdrop-blur">
                <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-xs sm:flex-row">
                    <div className="flex items-center gap-3">
                        <Link href={`/${lang}/legal/terms`} className="hover:text-foreground">
                            Terms
                        </Link>
                        <span>•</span>
                        <Link href={`/${lang}/legal/privacy`} className="hover:text-foreground">
                            Privacy
                        </Link>
                        <span>•</span>
                        <Link href={`/${lang}/legal/ip-policy`} className="hover:text-foreground">
                            IP Policy
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={`/${lang}/checkout`} className="hover:text-foreground">
                            Checkout
                        </Link>
                        <span>•</span>
                        <Link href={`/${lang}/orders`} className="hover:text-foreground">
                            Orders
                        </Link>
                        <span>•</span>
                        <Link href={`/${lang}/track/ABC123`} className="hover:text-foreground">
                            Track
                        </Link>
                    </div>
                </div>
            </footer>

            <Toaster />
        </div>
    )
}
