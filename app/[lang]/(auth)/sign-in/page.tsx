'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function SignInPage({ params }: { params: { lang: string } }) {
    const { lang } = params
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const supabase = useMemo(() => supabaseBrowser, [])

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const defaultNext = `/${lang}/account`

    const nextPath = useMemo(() => {
        const sp = searchParams?.get('next')
        if (sp && sp.startsWith('/')) return sp
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('next')
            if (stored && stored.startsWith('/')) return stored
        }
        return defaultNext
    }, [searchParams, defaultNext])

    useEffect(() => {
        let active = true
        supabase.auth.getSession().then(({ data }) => {
            if (!active) return
            if (data?.session) {
                router.replace(nextPath || defaultNext)
            }
        })
        return () => {
            active = false
        }
    }, [supabase, router, nextPath, defaultNext])

    async function handleEmailPasswordSignIn(e: React.FormEvent) {
        e.preventDefault()
        setSubmitting(true)
        setErrorMsg(null)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                setErrorMsg(error.message)
                toast({
                    title: 'Sign-in failed',
                    description: error.message,
                    variant: 'destructive' as any,
                })
                return
            }
            if (data?.user) {
                toast({ title: 'Welcome back', description: 'Signed in successfully.' })
                router.replace(nextPath || defaultNext)
            }
        } catch (err: any) {
            const message = err?.message || 'Unexpected error during sign-in.'
            setErrorMsg(message)
            toast({ title: 'Sign-in error', description: message, variant: 'destructive' as any })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleOAuth(provider: 'google' | 'github') {
        setSubmitting(true)
        setErrorMsg(null)
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            const redirectTo = `${origin}/${lang}/callback${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo },
            })
            if (error) {
                setErrorMsg(error.message)
                toast({
                    title: 'OAuth error',
                    description: error.message,
                    variant: 'destructive' as any,
                })
            }
            // On success, Supabase will redirect, so no further action here.
        } catch (err: any) {
            const message = err?.message || 'Unexpected error starting OAuth.'
            setErrorMsg(message)
            toast({ title: 'OAuth error', description: message, variant: 'destructive' as any })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="bg-background text-foreground min-h-[100dvh]">
            <header className="border-border/60 bg-card/40 supports-[backdrop-filter]:bg-card/60 border-b backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link
                            href={`/${lang}`}
                            className="flex items-center gap-2 text-sm font-semibold hover:opacity-80"
                        >
                            <span className="bg-primary inline-block h-6 w-6 rounded" />
                            <span>RealizeIt</span>
                        </Link>
                        <nav className="hidden gap-6 text-sm md:flex">
                            <Link href={`/${lang}/products`} className="hover:text-primary">
                                Products
                            </Link>
                            <Link href={`/${lang}/design`} className="hover:text-primary">
                                Create a design
                            </Link>
                            <Link href={`/${lang}/cart`} className="hover:text-primary">
                                Cart
                            </Link>
                            <Link href={`/${lang}/about`} className="hover:text-primary">
                                About
                            </Link>
                            <Link href={`/${lang}/help`} className="hover:text-primary">
                                Help
                            </Link>
                        </nav>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/${lang}/sign-up`}
                                className="bg-secondary hover:bg-secondary/80 hidden rounded-md px-3 py-1.5 text-sm md:inline-block"
                            >
                                Sign up
                            </Link>
                            <Link
                                href={`/${lang}/products`}
                                className="border-input hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                            >
                                Browse
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <section className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
                <div className="hidden lg:block">
                    <div className="border-border bg-card sticky top-10 rounded-2xl border p-8 shadow-sm">
                        <h2 className="text-2xl font-semibold">Your idea to product in minutes</h2>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Sign in to continue designing AI-generated products and track your
                            orders. We ship to South Korea with seamless Printify fulfillment.
                        </p>
                        <ul className="text-muted-foreground mt-6 space-y-3 text-sm">
                            <li>• Start a design session and preview variants</li>
                            <li>• Configure sizes and colors with live pricing</li>
                            <li>• Checkout securely with Stripe</li>
                            <li>• Auto-submission to Printify and live tracking</li>
                        </ul>
                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <Link
                                href={`/${lang}/design`}
                                className="border-input hover:bg-accent hover:text-accent-foreground rounded-lg border px-4 py-2 text-center text-sm"
                            >
                                Start designing
                            </Link>
                            <Link
                                href={`/${lang}/products`}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-center text-sm"
                            >
                                Explore catalog
                            </Link>
                        </div>
                        <Separator className="my-8" />
                        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                            <Link href={`/${lang}/legal/terms`} className="hover:text-foreground">
                                Terms
                            </Link>
                            <Link href={`/${lang}/legal/privacy`} className="hover:text-foreground">
                                Privacy
                            </Link>
                            <Link
                                href={`/${lang}/legal/ip-policy`}
                                className="hover:text-foreground"
                            >
                                IP Policy
                            </Link>
                            <Link href={`/${lang}/contact`} className="hover:text-foreground">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="border-border bg-card w-full rounded-2xl border p-6 shadow-sm sm:p-8">
                        <h1 className="text-xl font-semibold">Sign in</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Welcome back. Continue to your account to manage designs and orders.
                        </p>

                        {errorMsg ? (
                            <Alert variant="destructive" className="mt-6">
                                <AlertTitle>Authentication error</AlertTitle>
                                <AlertDescription>{errorMsg}</AlertDescription>
                            </Alert>
                        ) : null}

                        <form onSubmit={handleEmailPasswordSignIn} className="mt-6 space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-primary block w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Password
                                    </label>
                                    <Link
                                        href={`/${lang}/forgot-password`}
                                        className="text-primary text-xs hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-primary block w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
                                        placeholder="Your password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute inset-y-0 right-0 my-1 mr-1 rounded px-2 text-xs"
                                        aria-label={
                                            showPassword ? 'Hide password' : 'Show password'
                                        }
                                    >
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !email || !password}
                                className={cn(
                                    'bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium shadow',
                                    submitting && 'opacity-80'
                                )}
                            >
                                {submitting ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div className="my-6 flex items-center gap-3">
                            <Separator className="flex-1" />
                            <span className="text-muted-foreground text-xs">or continue with</span>
                            <Separator className="flex-1" />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => handleOAuth('google')}
                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm"
                            >
                                <svg
                                    aria-hidden
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fill="#EA4335"
                                        d="M12 10.2v3.9h5.5c-.2 1.2-1.7 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.4l2.7-2.6C16.7 3 14.5 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.1-.2-1.6H12z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M3.7 7.1l3.2 2.4C8 7.9 9.8 6.6 12 6.6c1.9 0 3.2.8 3.9 1.4l2.7-2.6C16.7 3 14.5 2 12 2 8 2 4.6 4.3 3.7 7.1z"
                                    />
                                    <path
                                        fill="#4A90E2"
                                        d="M12 22c2.5 0 4.7-.8 6.2-2.1l-3-2.5c-.8.6-1.9 1-3.2 1-3.8 0-7-2.6-7.7-6.2l-3.3 2.5C2.9 18.9 7.1 22 12 22z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M21.6 12.1c0-.7-.1-1.1-.2-1.6H12v3.9h5.5c-.3 1.2-1.7 3.6-5.5 3.6-2.8 0-5.2-1.9-5.9-4.5l-3.3 2.5C4.1 19.6 7.9 22 12 22c5.8 0 9.6-4.1 9.6-9.9z"
                                    />
                                </svg>
                                Google
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOAuth('github')}
                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm"
                            >
                                <svg
                                    aria-hidden
                                    viewBox="0 0 24 24"
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fill="currentColor"
                                        d="M12 .5C5.7.5.7 5.5.7 11.9c0 5 3.2 9.3 7.6 10.8.6.1.8-.3.8-.6v-2.2c-3.1.7-3.8-1.3-3.8-1.3-.6-1.4-1.5-1.8-1.5-1.8-1.2-.8.1-.8.1-.8 1.3.1 2 . 1.3 2 .1 2.1 1.8 3.5 1.3 4.4 1 .1-.8.5-1.3.9-1.6-2.5-.3-5.1-1.3-5.1-5.7 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.4 1.2A11.8 11.8 0 0 1 12 6.7c1 0 2 .1 3 .3 2.4-1.5 3.4-1.2 3.4-1.2.6 1.6.2 2.9.1 3.2.8.9 1.2 2 1.2 3.3 0 4.5-2.6 5.4-5.1 5.7.5.4 1 . 1.3 1.8v2.7c0 .3.2.7.8.6a11.43 11.43 0 0 0 7.6-10.8C23.3 5.5 18.3.5 12 .5Z"
                                    />
                                </svg>
                                GitHub
                            </button>
                        </div>

                        <p className="text-muted-foreground mt-6 text-center text-sm">
                            Don&apos;t have an account?{' '}
                            <Link
                                href={`/${lang}/sign-up${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                                className="text-primary hover:underline"
                            >
                                Create one
                            </Link>
                        </p>

                        <div className="bg-muted/30 text-muted-foreground mt-8 rounded-lg p-4 text-xs">
                            <p>
                                By continuing, you agree to our{' '}
                                <Link
                                    href={`/${lang}/legal/terms`}
                                    className="hover:text-foreground underline"
                                >
                                    Terms
                                </Link>{' '}
                                and{' '}
                                <Link
                                    href={`/${lang}/legal/privacy`}
                                    className="hover:text-foreground underline"
                                >
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                        </div>

                        <div className="text-muted-foreground mt-8 grid grid-cols-2 gap-2 text-xs">
                            <Link href={`/${lang}/checkout`} className="hover:text-foreground">
                                Go to Checkout
                            </Link>
                            <Link href={`/${lang}/orders`} className="hover:text-foreground">
                                Order history
                            </Link>
                            <Link
                                href={`/${lang}/account/settings`}
                                className="hover:text-foreground"
                            >
                                Account settings
                            </Link>
                            <Link href={`/${lang}/help`} className="hover:text-foreground">
                                Get help
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-border/60 border-t">
                <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <span className="bg-primary inline-block h-5 w-5 rounded" />
                        <span>RealizeIt © {new Date().getFullYear()}</span>
                    </div>
                    <nav className="flex flex-wrap items-center gap-4">
                        <Link href={`/${lang}/about`} className="hover:text-foreground">
                            About
                        </Link>
                        <Link href={`/${lang}/contact`} className="hover:text-foreground">
                            Contact
                        </Link>
                        <Link href={`/${lang}/help`} className="hover:text-foreground">
                            Help
                        </Link>
                        <Link href={`/${lang}/admin`} className="hover:text-foreground">
                            Admin
                        </Link>
                    </nav>
                </div>
            </footer>
        </main>
    )
}
