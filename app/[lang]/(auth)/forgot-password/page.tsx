'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useMemo } from 'react'

interface PageProps {
    params: { lang: string }
}

export default function ForgotPasswordPage({ params: { lang } }: PageProps) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const { toast } = useToast()
    const router = useRouter()

    const links = useMemo(() => {
        const base = `/${lang}`
        return {
            home: `${base}`,
            signIn: `${base}/sign-in`,
            signUp: `${base}/sign-up`,
            help: `${base}/help`,
            contact: `${base}/contact`,
            about: `${base}/about`,
            terms: `${base}/legal/terms`,
            privacy: `${base}/legal/privacy`,
            ipPolicy: `${base}/legal/ip-policy`,
            products: `${base}/products`,
            design: `${base}/design`,
            cart: `${base}/cart`,
            orders: `${base}/orders`,
            account: `${base}/account`,
        }
    }, [lang])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg(null)

        const trimmed = email.trim()
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
            setErrorMsg('Please enter a valid email address.')
            toast({ title: 'Invalid email', description: 'Enter a valid email to proceed.' })
            return
        }

        setLoading(true)
        try {
            const supabase = supabaseBrowser
            const { error } = await supabase.auth.resetPasswordForEmail(trimmed)
            if (error) {
                // Show error, but still avoid account enumeration by presenting success UI
                setErrorMsg(error.message)
                toast({
                    title: "We couldn't send the reset link",
                    description: error.message,
                })
            }
            setSuccess(true)
            toast({
                title: 'Check your email',
                description: 'We sent a password reset link if an account exists for this address.',
            })
        } catch (err: any) {
            const message = err?.message ?? 'Unexpected error. Please try again.'
            setErrorMsg(message)
            toast({ title: 'Something went wrong', description: message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-background text-foreground flex min-h-svh flex-col">
            <header className="border-border/60 bg-card/40 w-full border-b backdrop-blur">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={links.home}
                            className="inline-flex items-center gap-2 text-sm font-semibold"
                        >
                            <span className="bg-primary text-primary-foreground inline-flex h-7 w-7 items-center justify-center rounded-md">
                                R
                            </span>
                            <span className="hidden sm:inline">RealizeIt</span>
                        </Link>
                        <nav className="text-muted-foreground hidden items-center gap-5 text-sm md:flex">
                            <Link
                                href={links.design}
                                className="hover:text-foreground transition-colors"
                            >
                                Design
                            </Link>
                            <Link
                                href={links.products}
                                className="hover:text-foreground transition-colors"
                            >
                                Products
                            </Link>
                            <Link
                                href={links.help}
                                className="hover:text-foreground transition-colors"
                            >
                                Help
                            </Link>
                            <Link
                                href={links.contact}
                                className="hover:text-foreground transition-colors"
                            >
                                Contact
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={links.signIn}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Sign in
                        </Link>
                        <Link
                            href={links.signUp}
                            className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </header>

            <main className="grid flex-1 place-items-center px-4">
                <div className="w-full max-w-md">
                    <div className="border-border bg-card/80 rounded-xl border p-6 shadow-sm backdrop-blur">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Enter your account email and we&apos;ll send a secure link to reset
                                your password.
                            </p>
                        </div>

                        {success ? (
                            <div className="space-y-4">
                                <Alert className="border-green-500/60">
                                    <AlertTitle className="font-medium">
                                        Check your email
                                    </AlertTitle>
                                    <AlertDescription>
                                        If an account exists for{' '}
                                        <span className="font-medium">{email.trim()}</span>,
                                        you&apos;ll receive a reset link shortly. Follow the
                                        instructions to set a new password.
                                    </AlertDescription>
                                </Alert>

                                {errorMsg ? (
                                    <p className="text-destructive text-xs">Note: {errorMsg}</p>
                                ) : null}

                                <div className="mt-6 grid gap-3">
                                    <Link
                                        href={links.signIn}
                                        className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
                                    >
                                        Back to sign in
                                    </Link>
                                    <div className="text-muted-foreground text-center text-xs">
                                        Didn&apos;t get the email? Check spam or
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSuccess(false)
                                                setTimeout(() => {
                                                    const input = document.getElementById('email')
                                                    if (input) (input as HTMLInputElement).focus()
                                                }, 0)
                                            }}
                                            className="hover:text-foreground ml-1 underline underline-offset-2"
                                        >
                                            try again
                                        </button>
                                        .
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={onSubmit} className="space-y-5">
                                <div className="grid gap-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        inputMode="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={cn(
                                            'border-input bg-background w-full rounded-md border px-3 py-2 text-sm outline-none',
                                            'focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-2'
                                        )}
                                        placeholder="you@example.com"
                                    />
                                    {errorMsg ? (
                                        <p className="text-destructive text-xs">{errorMsg}</p>
                                    ) : null}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={cn(
                                        'bg-primary text-primary-foreground inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                                        loading
                                            ? 'cursor-not-allowed opacity-80'
                                            : 'hover:opacity-90'
                                    )}
                                >
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="border-primary-foreground/70 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                                            Sending link...
                                        </span>
                                    ) : (
                                        'Send reset link'
                                    )}
                                </button>

                                <div className="text-muted-foreground text-center text-sm">
                                    Remembered your password?{' '}
                                    <Link
                                        href={links.signIn}
                                        className="hover:text-foreground underline underline-offset-2"
                                    >
                                        Back to sign in
                                    </Link>
                                </div>

                                <div className="text-muted-foreground grid gap-2 pt-2 text-xs">
                                    <div className="flex items-center justify-center gap-3">
                                        <Link
                                            href={links.about}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            About
                                        </Link>
                                        <span className="text-border">•</span>
                                        <Link
                                            href={links.help}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Help
                                        </Link>
                                        <span className="text-border">•</span>
                                        <Link
                                            href={links.contact}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Contact
                                        </Link>
                                    </div>
                                    <div className="flex items-center justify-center gap-3">
                                        <Link
                                            href={links.terms}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Terms
                                        </Link>
                                        <span className="text-border">•</span>
                                        <Link
                                            href={links.privacy}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Privacy
                                        </Link>
                                        <span className="text-border">•</span>
                                        <Link
                                            href={links.ipPolicy}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            IP Policy
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="border-border/70 mt-6 rounded-xl border border-dashed p-4 text-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-muted-foreground">
                                Explore more while you wait:
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={links.design}
                                    className="border-border bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5"
                                >
                                    Start a design
                                </Link>
                                <Link
                                    href={links.products}
                                    className="border-border bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5"
                                >
                                    Browse products
                                </Link>
                                <Link
                                    href={links.cart}
                                    className="border-border bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5"
                                >
                                    View cart
                                </Link>
                                <Link
                                    href={links.orders}
                                    className="border-border bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5"
                                >
                                    Track orders
                                </Link>
                                <Link
                                    href={links.account}
                                    className="border-border bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5"
                                >
                                    Account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-border/60 bg-card/40 border-t">
                <div className="text-muted-foreground mx-auto flex max-w-4xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <div>© {new Date().getFullYear()} RealizeIt. All rights reserved.</div>
                    <div className="flex items-center gap-4">
                        <Link href={links.terms} className="hover:text-foreground">
                            Terms
                        </Link>
                        <Link href={links.privacy} className="hover:text-foreground">
                            Privacy
                        </Link>
                        <Link href={links.ipPolicy} className="hover:text-foreground">
                            IP Policy
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
