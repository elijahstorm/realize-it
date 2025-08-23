'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const params = useParams() as { lang: string; sessionId: string }
    const { lang, sessionId } = params
    const [retrying, setRetrying] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const base = `/${lang}`
    const sessionRoot = `${base}/design/s/${sessionId}`
    const variations = `${sessionRoot}/variations`
    const selectProduct = `${sessionRoot}/select-product`
    const designHome = `${base}/design`
    const help = `${base}/help`
    const contact = `${base}/contact`
    const products = `${base}/products`
    const cart = `${base}/cart`
    const checkout = `${base}/checkout`
    const orders = `${base}/account/orders`
    const adminLogs = `${base}/admin/logs`

    useEffect(() => {
        // Non-invasive client-side logging for observability (safe fallback)
        // This avoids dependencies and respects the error boundary contract.
        console.error('Design session error:', {
            message: error?.message,
            digest: error?.digest,
            sessionId,
        })
    }, [error, sessionId])

    const handleRetry = () => {
        setRetrying(true)
        // Allow microtask so UI updates before reset potentially rethrows
        setTimeout(() => {
            try {
                reset()
            } finally {
                setRetrying(false)
            }
        }, 0)
    }

    return (
        <main className="bg-background text-foreground flex min-h-screen items-center">
            <div className="mx-auto w-full max-w-3xl p-6">
                <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-start gap-4">
                            <div className="mt-1 shrink-0">
                                <svg
                                    aria-hidden
                                    viewBox="0 0 24 24"
                                    className="text-destructive h-9 w-9"
                                    fill="currentColor"
                                >
                                    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 5a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 10a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 17Z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    We hit a snag generating your design
                                </h1>
                                <p className="text-muted-foreground mt-2">
                                    Your session is safe. You can retry variations, return to the
                                    session, or start a fresh request. If this keeps happening,
                                    visit Help or Contact.
                                </p>

                                <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                                    <button
                                        onClick={handleRetry}
                                        disabled={retrying}
                                        aria-busy={retrying}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium shadow transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
                                    >
                                        {retrying ? (
                                            <span className="inline-flex items-center gap-2">
                                                <svg
                                                    className="h-4 w-4 animate-spin"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    aria-hidden
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        d="M4 12a8 8 0 0 1 8-8"
                                                        strokeWidth="4"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                Retrying…
                                            </span>
                                        ) : (
                                            'Try again'
                                        )}
                                    </button>

                                    <Link
                                        href={`${variations}?retry=1`}
                                        className="bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-ring inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium shadow transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        Retry variations
                                    </Link>

                                    <Link
                                        href={sessionRoot}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        Back to session
                                    </Link>

                                    <Link
                                        href={designHome}
                                        className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                        Start over
                                    </Link>
                                </div>

                                <Alert variant="destructive" className="mt-6">
                                    <AlertTitle>What might have happened</AlertTitle>
                                    <AlertDescription>
                                        <ul className="mt-2 list-disc space-y-1 pl-5">
                                            <li>
                                                Design API timed out or returned a low-quality
                                                image.
                                            </li>
                                            <li>
                                                Temporary network issue reaching our generation
                                                service.
                                            </li>
                                            <li>
                                                The prompt needed clarification for better outputs.
                                            </li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <Collapsible
                                    open={detailsOpen}
                                    onOpenChange={setDetailsOpen}
                                    className="mt-4"
                                >
                                    <CollapsibleTrigger className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4">
                                        {detailsOpen
                                            ? 'Hide technical details'
                                            : 'Show technical details'}
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-3">
                                        <div className="border-border bg-muted/30 text-muted-foreground overflow-auto rounded-lg border p-3 text-xs">
                                            <div className="grid gap-1">
                                                {error?.digest && (
                                                    <div>
                                                        <span className="text-foreground font-medium">
                                                            Digest:
                                                        </span>{' '}
                                                        {error.digest}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="text-foreground font-medium">
                                                        Message:
                                                    </span>{' '}
                                                    {error?.message || 'Unknown error'}
                                                </div>
                                                {error?.stack && (
                                                    <pre className="mt-2 leading-snug whitespace-pre-wrap">
                                                        {error.stack}
                                                    </pre>
                                                )}
                                                <div className="mt-2">
                                                    <span className="text-foreground font-medium">
                                                        Session:
                                                    </span>{' '}
                                                    {sessionId}
                                                </div>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>

                                <Separator className="my-8" />

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="border-border bg-muted/30 rounded-xl border p-4">
                                        <div className="mb-2 text-sm font-medium">Continue</div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={selectProduct}
                                                className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                            >
                                                Select product
                                            </Link>
                                            <Link
                                                href={variations}
                                                className="bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                            >
                                                View variations
                                            </Link>
                                            <Link
                                                href={products}
                                                className="bg-accent text-accent-foreground inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium hover:opacity-90"
                                            >
                                                Browse products
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="border-border bg-muted/30 rounded-xl border p-4">
                                        <div className="mb-2 text-sm font-medium">Get help</div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={help}
                                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                            >
                                                Help Center
                                            </Link>
                                            <Link
                                                href={contact}
                                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                            >
                                                Contact
                                            </Link>
                                            <Link
                                                href={orders}
                                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                            >
                                                My orders
                                            </Link>
                                            <Link
                                                href={adminLogs}
                                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium"
                                                aria-label="Admin logs (restricted)"
                                            >
                                                Admin logs
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    <Link
                                        href={base}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href={cart}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        Cart
                                    </Link>
                                    <Link
                                        href={checkout}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        Checkout
                                    </Link>
                                    <Link
                                        href={`${base}/legal/terms`}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        Terms
                                    </Link>
                                    <Link
                                        href={`${base}/legal/privacy`}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        Privacy
                                    </Link>
                                    <Link
                                        href={`${base}/legal/ip-policy`}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
                                    >
                                        IP Policy
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
