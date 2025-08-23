'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function Loading() {
    const pathname = usePathname()
    const lang = useMemo(() => {
        if (!pathname) return 'en'
        const seg = pathname.split('/')[1]
        return seg || 'en'
    }, [pathname])

    const [progress, setProgress] = useState(14)
    useEffect(() => {
        const id = setInterval(() => {
            setProgress((p) => {
                const next = p + Math.floor(Math.random() * 6) + 1
                if (next >= 93) return 18 // oscillate to suggest ongoing work
                return next
            })
        }, 350)
        return () => clearInterval(id)
    }, [])

    const steps = [
        { key: 'parse', label: 'Analyzing prompt' },
        { key: 'brief', label: 'Creating design brief' },
        { key: 'generate', label: 'Generating artwork' },
        { key: 'compose', label: 'Compositing mockups' },
        { key: 'prep', label: 'Preparing print files' },
    ]

    const activeStepIndex = useMemo(() => {
        if (progress < 30) return 0
        if (progress < 50) return 1
        if (progress < 70) return 2
        if (progress < 90) return 3
        return 4
    }, [progress])

    const link = (href: string, label: string, opts?: { subtle?: boolean }) => (
        <Link
            href={href}
            className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                opts?.subtle
                    ? 'text-muted-foreground hover:text-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
        >
            {label}
        </Link>
    )

    return (
        <div className="bg-background text-foreground min-h-[100dvh]">
            <div
                className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:py-14"
                aria-live="polite"
            >
                <header className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary/10 relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full">
                            <span className="bg-primary/20 absolute inset-0 animate-pulse rounded-full" />
                            <span className="border-primary relative h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        </span>
                        <div>
                            <h1 className="text-lg leading-tight font-semibold">
                                Initializing your AI design session
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                This usually takes ~15–30 seconds. Please keep this tab open.
                            </p>
                        </div>
                    </div>
                    <div className="hidden items-center gap-2 sm:flex">
                        {link(`/${lang}/design`, 'Start over')}
                        <Link
                            href={`/${lang}/cart`}
                            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium"
                        >
                            View cart
                        </Link>
                    </div>
                </header>

                <section className="border-border bg-card rounded-2xl border p-5 shadow-sm md:p-6">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <p className="text-muted-foreground text-sm">Progress</p>
                                <p className="text-muted-foreground text-xs tabular-nums">
                                    {progress}%
                                </p>
                            </div>
                            <div className="bg-muted relative h-3 w-full overflow-hidden rounded-full">
                                <div
                                    className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {steps.map((s, idx) => {
                                    const isActive = idx === activeStepIndex
                                    const isDone = idx < activeStepIndex
                                    return (
                                        <li
                                            key={s.key}
                                            className={cn(
                                                'rounded-xl border p-3',
                                                isActive
                                                    ? 'border-primary/50 bg-primary/5'
                                                    : 'border-border',
                                                isDone && 'opacity-70'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                                                        isDone
                                                            ? 'bg-primary text-primary-foreground'
                                                            : isActive
                                                              ? 'bg-primary/80 text-primary-foreground'
                                                              : 'bg-muted text-muted-foreground'
                                                    )}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm">{s.label}</span>
                                            </div>
                                            <div className="bg-muted mt-2 h-2 overflow-hidden rounded">
                                                <div
                                                    className={cn(
                                                        'bg-primary h-full transition-all',
                                                        isDone
                                                            ? 'w-full'
                                                            : isActive
                                                              ? 'w-2/3'
                                                              : 'w-1/6'
                                                    )}
                                                />
                                            </div>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>

                        <div className="mt-6 w-full max-w-sm md:mt-0 md:w-80">
                            <Alert className="border-border">
                                <AlertTitle>Having trouble?</AlertTitle>
                                <AlertDescription>
                                    If this takes unusually long, you can{' '}
                                    <Link
                                        href={`/${lang}/design`}
                                        className="underline underline-offset-4"
                                    >
                                        restart the design flow
                                    </Link>
                                    . You can also continue browsing products or check your cart.
                                </AlertDescription>
                            </Alert>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {link(`/${lang}/products`, 'Browse products')}
                                {link(`/${lang}/orders`, 'Your orders')}
                                {link(`/${lang}/account`, 'Account', { subtle: true })}
                                {link(`/${lang}/(marketing)/help`, 'Help', { subtle: true })}
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                        <h2 className="text-muted-foreground mb-3 text-sm font-medium">
                            Preview gallery is getting ready
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="border-border bg-card rounded-xl border p-3">
                                <Skeleton className="aspect-square w-full rounded-lg" />
                                <div className="mt-3 flex items-center justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </div>
                            </div>
                            <div className="border-border bg-card rounded-xl border p-3">
                                <Skeleton className="aspect-square w-full rounded-lg" />
                                <div className="mt-3 flex items-center justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </div>
                            </div>
                            <div className="border-border bg-card rounded-xl border p-3">
                                <Skeleton className="aspect-square w-full rounded-lg" />
                                <div className="mt-3 flex items-center justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-20 rounded-md" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-border bg-card rounded-2xl border p-5 shadow-sm md:p-6">
                    <div className="flex flex-col gap-4">
                        <h3 className="text-muted-foreground text-sm font-medium">Quick links</h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {link(`/${lang}/design`, 'Start new design')}
                            {link(`/${lang}/cart`, 'Cart')}
                            {link(`/${lang}/checkout`, 'Checkout')}
                            {link(`/${lang}/orders`, 'Orders')}
                            {link(`/${lang}/account/orders`, 'Order history', { subtle: true })}
                            {link(`/${lang}/account`, 'Account', { subtle: true })}
                            {link(`/${lang}/(marketing)/about`, 'About', { subtle: true })}
                            {link(`/${lang}/(marketing)/help`, 'Help Center', { subtle: true })}
                            {link(`/${lang}/(marketing)/legal/terms`, 'Terms', { subtle: true })}
                            {link(`/${lang}/(marketing)/legal/privacy`, 'Privacy', {
                                subtle: true,
                            })}
                            {link(`/${lang}/(marketing)/legal/ip-policy`, 'IP Policy', {
                                subtle: true,
                            })}
                            {link(`/${lang}/(auth)/sign-in`, 'Sign in', { subtle: true })}
                            {link(`/${lang}/(auth)/sign-up`, 'Create account', { subtle: true })}
                            {link(`/offline`, 'Offline support', { subtle: true })}
                            {link(`/${lang}/admin`, 'Admin', { subtle: true })}
                            {link(`/${lang}/admin/analytics`, 'Analytics', { subtle: true })}
                        </div>
                    </div>
                </section>

                <footer className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-muted-foreground text-center text-xs">
                        We’ll automatically continue when your design session is ready. You can
                        safely navigate elsewhere; we’ll save your progress.
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${lang}/design`}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium shadow"
                        >
                            Restart design
                        </Link>
                        <Link
                            href={`/${lang}/products`}
                            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-md px-4 py-2 text-sm font-medium"
                        >
                            Keep browsing
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
