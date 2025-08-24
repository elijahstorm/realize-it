'use client'

import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

type StepKey = 'prompt' | 'options' | 'select' | 'configure' | 'approval' | 'checkout'

const STEPS: { key: StepKey; label: string }[] = [
    { key: 'prompt', label: 'Prompt' },
    { key: 'options', label: 'Options' },
    { key: 'select', label: 'Select Product' },
    { key: 'configure', label: 'Configure' },
    { key: 'approval', label: 'Approval' },
    { key: 'checkout', label: 'Checkout' },
]

function useDesignPathContext(paramsLang?: string) {
    const pathname = usePathname()
    const segments = useMemo(() => pathname.split('/').filter(Boolean), [pathname])
    const lang = paramsLang ?? segments[0] ?? 'en'
    const isInDesign = segments[1] === 'design'

    let sessionId: string | undefined
    let productSlug: string | undefined
    let imgId: string | undefined
    let current: StepKey = 'prompt'

    const sIndex = segments.indexOf('s')
    if (sIndex > -1 && segments[sIndex + 1]) {
        sessionId = segments[sIndex + 1]
    }

    if (segments.includes('approval')) {
        current = 'approval'
    } else if (segments.includes('configure')) {
        current = 'configure'
        const cIdx = segments.indexOf('configure')
        if (segments[cIdx + 1]) productSlug = segments[cIdx + 1]
        if (segments[cIdx + 2]) imgId = segments[cIdx + 2]
    } else if (segments.includes('select-product')) {
        current = 'select'
    } else if (segments.includes('variations') || (sessionId && isInDesign)) {
        current = sessionId ? 'options' : 'prompt'
    } else if (isInDesign) {
        current = 'prompt'
    }

    return { pathname, segments, lang, sessionId, productSlug, imgId, current }
}

function buildHref(
    lang: string,
    sessionId: string | undefined,
    productSlug: string | undefined,
    imgId: string | undefined,
    step: StepKey
) {
    switch (step) {
        case 'prompt':
            return `/${lang}/design`
        case 'options':
            return sessionId ? `/${lang}/design/s/${sessionId}` : undefined
        case 'select':
            return sessionId ? `/${lang}/design/s/${sessionId}/select-product/${imgId}` : undefined
        case 'configure': {
            if (!sessionId) return undefined
            if (productSlug)
                return `/${lang}/design/s/${sessionId}/configure/${productSlug}/${imgId}`
            return `/${lang}/design/s/${sessionId}/select-product/${imgId}`
        }
        case 'approval':
            return sessionId ? `/${lang}/design/s/${sessionId}/approval` : undefined
        case 'checkout':
            return `/${lang}/checkout`
    }
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
            <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414l2.293 2.293 6.543-6.543a1 1 0 0 1 1.414 0z" />
        </svg>
    )
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
            <path d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 1 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" />
        </svg>
    )
}

export default function Layout({ children }: { children: React.ReactNode }) {
    const { lang, sessionId, productSlug, current, imgId } = useDesignPathContext(
        useParams().lang as 'en' | 'ko'
    )
    const currentIndex = useMemo(() => STEPS.findIndex((s) => s.key === current), [current])

    const [knownProductSlug, setKnownProductSlug] = useState<string | undefined>(undefined)
    const [knownImgId, setKnownImgId] = useState<string | undefined>(undefined)
    const [allowedIndex, setAllowedIndex] = useState<number>(currentIndex)

    // Persist and retrieve per-session progress + selected product
    useEffect(() => {
        if (!sessionId) {
            setAllowedIndex((idx) => Math.max(idx, currentIndex))
            return
        }
        const progressKey = `design:${sessionId}:progress`
        const productKey = `design:${sessionId}:productSlug`
        const imgKey = `design:${sessionId}:imgId`

        try {
            const stored = localStorage.getItem(progressKey)
            const storedIdx = stored ? parseInt(stored, 10) : 0
            const nextAllowed = Math.max(storedIdx, currentIndex)
            if (Number.isFinite(nextAllowed)) {
                setAllowedIndex(nextAllowed)
            }
            if (currentIndex > storedIdx) {
                localStorage.setItem(progressKey, String(currentIndex))
            }
            if (productSlug) {
                localStorage.setItem(productKey, productSlug)
                setKnownProductSlug(productSlug)
            } else {
                const storedSlug = localStorage.getItem(productKey) || undefined
                if (storedSlug) setKnownProductSlug(storedSlug)
            }
            if (imgId) {
                localStorage.setItem(imgKey, imgId)
                setKnownImgId(imgId)
            } else {
                const storedSlug = localStorage.getItem(imgKey) || undefined
                if (storedSlug) setKnownImgId(storedSlug)
            }
        } catch {
            setAllowedIndex((idx) => Math.max(idx, currentIndex))
        }
    }, [sessionId, currentIndex, productSlug, imgId])

    const progressPercent = useMemo(() => {
        const clamped = Math.max(0, Math.min(allowedIndex, STEPS.length - 1))
        return (clamped / (STEPS.length - 1)) * 100
    }, [allowedIndex])

    return (
        <div className="bg-background text-foreground min-h-screen">
            <header className="border-border bg-card/80 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 border-b backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${lang}`}
                            className="text-foreground hover:text-primary focus-visible:ring-ring inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold focus:outline-none focus-visible:ring-2"
                        >
                            <span
                                className="bg-primary inline-block h-2.5 w-2.5 rounded-sm"
                                aria-hidden="true"
                            />
                            <span>RealizeIt</span>
                        </Link>
                        <span className="text-muted-foreground hidden sm:inline">/</span>
                        <Link
                            href={`/${lang}/design`}
                            className="text-muted-foreground hover:text-foreground hidden text-sm sm:inline"
                        >
                            Design
                        </Link>
                        {sessionId && (
                            <div className="hidden items-center gap-2 sm:flex">
                                <ChevronRight className="text-muted-foreground h-4 w-4" />
                                <span className="text-muted-foreground truncate text-xs">
                                    Session {sessionId.slice(0, 6)}…
                                </span>
                            </div>
                        )}
                    </div>

                    <nav className="hidden items-center gap-2 md:flex">
                        <Link
                            href={`/${lang}/products`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Products
                        </Link>
                        <Link
                            href={`/${lang}/cart`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Cart
                        </Link>
                        <Link
                            href={`/${lang}/orders`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Orders
                        </Link>
                        <Link
                            href={`/${lang}/account`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Account
                        </Link>
                        <Link
                            href={`/${lang}/help`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Help
                        </Link>
                        <Link
                            href={`/${lang}/admin`}
                            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Admin
                        </Link>
                    </nav>
                </div>

                <div className="mx-auto w-full max-w-7xl px-2 pb-3 md:px-4">
                    <ol className="no-scrollbar bg-muted/50 flex items-stretch gap-1 overflow-x-auto rounded-md p-1">
                        {STEPS.map((step, idx) => {
                            const isCurrent = idx === currentIndex
                            const isComplete = idx < currentIndex
                            const href = buildHref(
                                lang,
                                sessionId,
                                knownProductSlug,
                                knownImgId,
                                step.key
                            )
                            const isClickable = typeof href === 'string' && idx <= allowedIndex
                            return (
                                <li key={step.key} className="min-w-max flex-1">
                                    {isClickable ? (
                                        <Link
                                            href={href!}
                                            className={cn(
                                                'group inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                                isCurrent
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : isComplete
                                                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border-secondary bg-secondary/10 border border-dashed'
                                            )}
                                            aria-current={isCurrent ? 'step' : undefined}
                                        >
                                            <span
                                                className={cn(
                                                    'flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                                                    isCurrent
                                                        ? 'border-primary-foreground/60 bg-primary-foreground/20 text-primary-foreground'
                                                        : isComplete
                                                          ? 'bg-secondary-foreground/20 text-secondary-foreground border-transparent'
                                                          : 'border-border text-muted-foreground'
                                                )}
                                                aria-hidden="true"
                                            >
                                                {isComplete ? (
                                                    <CheckIcon className="h-3.5 w-3.5" />
                                                ) : (
                                                    idx + 1
                                                )}
                                            </span>
                                            <span className="font-medium whitespace-nowrap">
                                                {step.label}
                                            </span>
                                        </Link>
                                    ) : (
                                        <div
                                            className={cn(
                                                'border-border bg-background text-muted-foreground inline-flex w-full cursor-not-allowed items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm opacity-70'
                                            )}
                                        >
                                            <span className="border-border text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full border text-[10px]">
                                                {idx + 1}
                                            </span>
                                            <span className="whitespace-nowrap">{step.label}</span>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ol>

                    <div className="bg-muted relative mt-2 h-1 w-full overflow-hidden rounded-full">
                        <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    <div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span>Need to start over?</span>
                            <Link
                                href={`/${lang}/design`}
                                className="text-foreground hover:bg-accent hover:text-accent-foreground rounded px-1.5 py-0.5"
                            >
                                New design
                            </Link>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/${lang}/products`} className="hover:text-foreground">
                                Browse products
                            </Link>
                            <Link href={`/${lang}/about`} className="hover:text-foreground">
                                About
                            </Link>
                            <Link href={`/${lang}/contact`} className="hover:text-foreground">
                                Contact
                            </Link>
                            <Link href={`/${lang}/legal/terms`} className="hover:text-foreground">
                                Terms
                            </Link>
                            <Link href={`/${lang}/legal/privacy`} className="hover:text-foreground">
                                Privacy
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>

            <footer className="border-border bg-card/50 border-t">
                <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs sm:flex-row">
                    <div className="flex items-center gap-2">
                        <span
                            className="bg-primary inline-block h-2 w-2 rounded-full"
                            aria-hidden="true"
                        />
                        <span>RealizeIt</span>
                        <span>•</span>
                        <span>AI-to-Product</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/${lang}/orders`} className="hover:text-foreground">
                            Your orders
                        </Link>
                        <Link href={`/${lang}/account/settings`} className="hover:text-foreground">
                            Settings
                        </Link>
                        <Link href={`/${lang}/help`} className="hover:text-foreground">
                            Help Center
                        </Link>
                        <Link href={`/${lang}/admin/analytics`} className="hover:text-foreground">
                            Analytics
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
