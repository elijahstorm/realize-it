'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import React from 'react'

function maskEmail(email: string) {
    const [name, domain] = email.split('@')
    if (!name || !domain) return email
    if (name.length <= 2) return `${name[0] ?? '*'}*@${domain}`
    const visible = name.slice(0, 2)
    return `${visible}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`
}

export default function VerifyEmailPage() {
    const params = useParams<{ lang: string }>()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const lang = params?.lang || 'en'

    const [email, setEmail] = React.useState<string>(searchParams.get('email') || '')
    const [detectedEmail, setDetectedEmail] = React.useState<string>('')
    const [isSending, setIsSending] = React.useState(false)
    const [cooldown, setCooldown] = React.useState(0)

    React.useEffect(() => {
        let mounted = true
        const init = async () => {
            try {
                const supabase = supabaseBrowser
                const { data } = await supabase.auth.getUser()
                if (!mounted) return
                if (data?.user?.email) {
                    setDetectedEmail(data.user.email)
                    if (!email) setEmail(data.user.email)
                }
            } catch {
                // ignore
            }
        }
        init()
        return () => {
            mounted = false
        }
    }, [email])

    React.useEffect(() => {
        if (cooldown <= 0) return
        const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
        return () => clearInterval(t)
    }, [cooldown])

    const doResend = async () => {
        const targetEmail = email?.trim().toLowerCase()
        if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
            toast({
                title: 'Enter a valid email',
                description: 'Please type the email address you used to sign up.',
                variant: 'destructive' as any,
            })
            return
        }
        try {
            setIsSending(true)
            const supabase = supabaseBrowser
            const redirectTo = `${window.location.origin}/${lang}/(auth)/callback`
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: targetEmail,
                options: { emailRedirectTo: redirectTo },
            })
            if (error) throw error
            toast({
                title: 'Verification email sent',
                description: `We sent a fresh link to ${maskEmail(targetEmail)}. It may take a minute to arrive.`,
            })
            setCooldown(45)
        } catch (e: any) {
            const msg = e?.message || 'Could not resend verification email. Try again shortly.'
            toast({ title: 'Resend failed', description: msg, variant: 'destructive' as any })
        } finally {
            setIsSending(false)
        }
    }

    const currentEmail = email || detectedEmail

    return (
        <div className="bg-background text-foreground flex min-h-[100dvh] items-center justify-center px-4">
            <div className="w-full max-w-lg">
                <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
                    <div className="p-8">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-2xl">
                                    <svg
                                        aria-hidden="true"
                                        className="text-primary h-7 w-7"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M2.25 6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 19.5 19.5h-15A2.25 2.25 0 0 1 2.25 17.25V6.75Zm2.326-.75a.75.75 0 0 0-.576 1.238l6.81 7.947a1.5 1.5 0 0 0 2.28 0l6.81-7.947a.75.75 0 0 0-.576-1.238H4.576Zm16.174 2.347-5.997 7.003a3 3 0 0 1-4.506 0L4.25 8.347v8.903c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V8.347Z" />
                                    </svg>
                                </div>
                                <span
                                    className="bg-primary absolute -right-1.5 -bottom-1.5 h-4 w-4 rounded-full"
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <h1 className="text-2xl leading-tight font-semibold">
                                    Verify your email
                                </h1>
                                <p className="text-muted-foreground text-sm">
                                    We just sent a confirmation link to your inbox.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Alert className="bg-muted/40">
                                <AlertTitle>Next step</AlertTitle>
                                <AlertDescription>
                                    {currentEmail ? (
                                        <span>
                                            Open the email sent to{' '}
                                            <span className="font-medium">
                                                {maskEmail(currentEmail)}
                                            </span>{' '}
                                            and click the verify button. The link expires for your
                                            security.
                                        </span>
                                    ) : (
                                        <span>
                                            Enter your email below and we will resend the
                                            verification link to your inbox.
                                        </span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        </div>

                        <form
                            className="mt-6 grid gap-3"
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (!cooldown && !isSending) doResend()
                            }}
                        >
                            <label className="text-sm font-medium" htmlFor="email">
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
                                placeholder="you@example.com"
                                className="border-input bg-background focus:border-primary focus:ring-primary/20 w-full rounded-md border px-3 py-2 text-sm ring-0 transition outline-none focus:ring-2"
                            />
                            <button
                                type="submit"
                                disabled={isSending || cooldown > 0}
                                className={`bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60`}
                                aria-live="polite"
                            >
                                {isSending
                                    ? 'Sending...'
                                    : cooldown > 0
                                      ? `Resend in ${cooldown}s`
                                      : 'Resend verification email'}
                            </button>
                            <p className="text-muted-foreground text-xs">
                                Tip: Check your spam or promotions folder. Add our address to your
                                contacts to ensure delivery.
                            </p>
                        </form>

                        <Separator className="my-6" />

                        <div className="grid gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <Link
                                    href={`/${lang}/(auth)/sign-in`}
                                    className="text-primary text-sm hover:underline"
                                >
                                    Back to sign in
                                </Link>
                                <div className="flex items-center gap-3 text-sm">
                                    <Link
                                        href={`/${lang}/(marketing)/help`}
                                        className="text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                        Help
                                    </Link>
                                    <span className="text-muted-foreground">•</span>
                                    <Link
                                        href={`/${lang}/(marketing)/contact`}
                                        className="text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                        Contact
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                                    Quick links
                                </p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    <Link
                                        href={`/${lang}/products`}
                                        className="group border-border hover:border-primary/40 hover:bg-accent rounded-md border p-3 text-sm"
                                    >
                                        <span className="group-hover:text-foreground font-medium">
                                            Browse products
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                            See what we support
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/design`}
                                        className="group border-border hover:border-primary/40 hover:bg-accent rounded-md border p-3 text-sm"
                                    >
                                        <span className="group-hover:text-foreground font-medium">
                                            Start a design
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                            Let AI draft options
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/cart`}
                                        className="group border-border hover:border-primary/40 hover:bg-accent rounded-md border p-3 text-sm"
                                    >
                                        <span className="group-hover:text-foreground font-medium">
                                            View cart
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                            Ready to checkout?
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/orders`}
                                        className="group border-border hover:border-primary/40 hover:bg-accent rounded-md border p-3 text-sm"
                                    >
                                        <span className="group-hover:text-foreground font-medium">
                                            Orders
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                            Track status & history
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/account`}
                                        className="group border-border hover:border-primary/40 hover:bg-accent rounded-md border p-3 text-sm"
                                    >
                                        <span className="group-hover:text-foreground font-medium">
                                            My account
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                            Profile & settings
                                        </p>
                                    </Link>
                                    <Link
                                        href={`/${lang}/(marketing)/about`}
                                        className="group border-border hover:border-primary/40 hover:bg-accent rounded-md border p-3 text-sm"
                                    >
                                        <span className="group-hover:text-foreground font-medium">
                                            About
                                        </span>
                                        <p className="text-muted-foreground text-xs">
                                            Learn our mission
                                        </p>
                                    </Link>
                                </div>
                            </div>

                            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                                <Link
                                    href={`/${lang}/(marketing)/legal/terms`}
                                    className="hover:underline"
                                >
                                    Terms
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/(marketing)/legal/privacy`}
                                    className="hover:underline"
                                >
                                    Privacy
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/(marketing)/legal/ip-policy`}
                                    className="hover:underline"
                                >
                                    IP Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-muted-foreground mt-6 text-center text-xs">
                    <p>
                        Already verified?{' '}
                        <Link
                            href={`/${lang}/(auth)/sign-in`}
                            className="text-primary hover:underline"
                        >
                            Continue to sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
