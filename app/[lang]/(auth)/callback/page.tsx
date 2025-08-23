'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export default function OAuthCallbackPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const langParam = params?.lang
    const lang = Array.isArray(langParam) ? langParam[0] : langParam || 'en'

    const buildPath = useCallback(
        (path: string) => `/${lang}${path.startsWith('/') ? path : `/${path}`}`,
        [lang]
    )

    const supabase = useMemo(() => supabaseBrowser, [])

    const [status, setStatus] = useState<'idle' | 'exchanging' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [redirectTo, setRedirectTo] = useState<string>(buildPath(''))
    const [countdown, setCountdown] = useState<number>(4)
    const ran = useRef(false)

    useEffect(() => {
        // Prefer explicit redirect params, then sessionStorage, then default locale root
        const next =
            searchParams.get('redirect_to') ||
            searchParams.get('next') ||
            searchParams.get('redirect') ||
            (typeof window !== 'undefined' ? sessionStorage.getItem('postAuthRedirect') : null) ||
            buildPath('')

        setRedirectTo(next.startsWith('/') ? next : buildPath(next))
    }, [buildPath, searchParams, lang])

    useEffect(() => {
        if (ran.current) return
        ran.current = true

        const urlError = searchParams.get('error_description') || searchParams.get('error')
        if (urlError) {
            setStatus('error')
            setErrorMsg(decodeURIComponent(urlError))
            return
        }

        const doExchange = async () => {
            try {
                setStatus('exchanging')
                const href = typeof window !== 'undefined' ? window.location.href : ''
                const { error } = await supabase.auth.exchangeCodeForSession(href)
                if (error) {
                    setStatus('error')
                    setErrorMsg(error.message || 'Authentication failed. Please try again.')
                    return
                }

                // Clear any stored redirect hint once authenticated
                try {
                    sessionStorage.removeItem('postAuthRedirect')
                } catch {}

                setStatus('success')
            } catch (e: any) {
                setStatus('error')
                setErrorMsg(e?.message || 'Unexpected error during authentication.')
            }
        }

        void doExchange()
    }, [searchParams, supabase])

    useEffect(() => {
        if (status !== 'success') return
        const timer = setTimeout(() => {
            router.replace(redirectTo)
        }, 600)
        return () => clearTimeout(timer)
    }, [status, redirectTo, router])

    useEffect(() => {
        if (status !== 'success') return
        if (countdown <= 0) return
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [status, countdown])

    return (
        <main className="flex min-h-[80vh] w-full items-center justify-center px-4">
            <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-xl border shadow-sm">
                <div className="flex flex-col items-center space-y-4 p-6 text-center">
                    {status === 'exchanging' || status === 'idle' ? (
                        <>
                            <div className="relative h-12 w-12">
                                <div className="border-muted absolute inset-0 rounded-full border-2" />
                                <div className="border-primary absolute inset-0 animate-spin rounded-full border-2 border-t-transparent" />
                            </div>
                            <h1 className="text-xl font-semibold">Signing you in…</h1>
                            <p className="text-muted-foreground text-sm">
                                Finishing OAuth with your provider. This usually takes just a
                                moment.
                            </p>
                            <div className="bg-border my-2 h-px w-full" />
                            <div className="text-muted-foreground text-xs">
                                If this takes too long, you can return to
                                <span className="mx-1" />
                                <Link
                                    href={buildPath('sign-in')}
                                    className="text-primary underline underline-offset-4"
                                >
                                    sign in
                                </Link>
                                .
                            </div>
                        </>
                    ) : null}

                    {status === 'success' ? (
                        <>
                            <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="28"
                                    height="28"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-semibold">You are signed in</h1>
                            <p className="text-muted-foreground text-sm">
                                Redirecting you to your destination
                                {countdown > 0 ? ` in ${countdown}s` : ''}…
                            </p>
                            <Link
                                href={redirectTo}
                                className="bg-primary text-primary-foreground focus-visible:ring-ring mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2"
                            >
                                Continue now
                            </Link>
                            <div className="bg-border my-2 h-px w-full" />
                            <nav className="grid grid-cols-2 gap-2 text-sm">
                                <Link
                                    href={buildPath('')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Home
                                </Link>
                                <Link
                                    href={buildPath('products')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Products
                                </Link>
                                <Link
                                    href={buildPath('design')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Start a Design
                                </Link>
                                <Link
                                    href={buildPath('cart')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Cart
                                </Link>
                                <Link
                                    href={buildPath('account')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Account
                                </Link>
                                <Link
                                    href={buildPath('orders')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Orders
                                </Link>
                            </nav>
                        </>
                    ) : null}

                    {status === 'error' ? (
                        <>
                            <Alert variant="destructive" className="w-full">
                                <AlertTitle>Sign-in failed</AlertTitle>
                                <AlertDescription>
                                    {errorMsg ||
                                        "We couldn't complete your sign-in. Please try again or use another method."}
                                </AlertDescription>
                            </Alert>
                            <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
                                <Link
                                    href={buildPath('sign-in')}
                                    className="bg-primary text-primary-foreground focus-visible:ring-ring inline-flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2"
                                >
                                    Back to Sign In
                                </Link>
                                <Link
                                    href={buildPath('')}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex flex-1 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
                                >
                                    Go to Home
                                </Link>
                            </div>
                            <div className="bg-border my-2 h-px w-full" />
                            <nav className="grid grid-cols-2 gap-2 text-sm">
                                <Link
                                    href={buildPath('/help')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Help
                                </Link>
                                <Link
                                    href={buildPath('/contact')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Contact
                                </Link>
                                <Link
                                    href={buildPath('/about')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    About
                                </Link>
                                <Link
                                    href={buildPath('/legal/privacy')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href={buildPath('sign-up')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    href={buildPath('forgot-password')}
                                    className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                                >
                                    Forgot Password
                                </Link>
                            </nav>
                        </>
                    ) : null}
                </div>
            </div>
        </main>
    )
}
