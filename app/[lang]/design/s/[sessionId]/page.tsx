'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

interface PageProps {
    params: { lang: string; sessionId: string }
}

type DesignSession = {
    id: string
    prompt?: string | null
    status?: string | null
    language?: string | null
}

type DesignOption = {
    id: string
    title?: string | null
    description?: string | null
    primary_image_url?: string | null
    // Optional mapping from product slug to a product-specific mockup image URL
    mockups?: Record<string, string> | null
}

const PRODUCT_PREVIEWS: { slug: string; name: string; href: (lang: string) => string }[] = [
    { slug: 't-shirt', name: 'T‑Shirt', href: (lang) => `/${lang}/products/t-shirt` },
    { slug: 'hoodie', name: 'Hoodie', href: (lang) => `/${lang}/products/hoodie` },
    { slug: 'mug', name: 'Mug', href: (lang) => `/${lang}/products/mug` },
    { slug: 'tote', name: 'Tote', href: (lang) => `/${lang}/products/tote` },
    { slug: 'phone-case', name: 'Phone Case', href: (lang) => `/${lang}/products/phone-case` },
]

export default function Page({ params }: PageProps) {
    const { sessionId, lang } = params
    const router = useRouter()
    const { toast } = useToast()
    const supabase = useMemo(() => supabaseBrowser, [])

    const [isLoading, setIsLoading] = useState(true)
    const [isSavingDraft, setIsSavingDraft] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [authUserId, setAuthUserId] = useState<string | null>(null)
    const [session, setSession] = useState<DesignSession | null>(null)
    const [options, setOptions] = useState<DesignOption[]>([])
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
    // Track chosen product preview per option
    const [optionPreviewProduct, setOptionPreviewProduct] = useState<Record<string, string>>({})

    const selectedOption = useMemo(
        () => options.find((o) => o.id === selectedOptionId) || null,
        [options, selectedOptionId]
    )

    const load = useCallback(async () => {
        setIsLoading(true)
        setLoadError(null)
        try {
            const { data: auth } = await supabase.auth.getSession()
            setAuthUserId(auth?.session?.user?.id ?? null)

            const { data: sessionRow, error: sessionErr } = await supabase
                .from('design_sessions')
                .select('id,prompt,status,language')
                .eq('id', sessionId)
                .single()
            if (sessionErr) throw sessionErr
            setSession(sessionRow as DesignSession)

            const { data: optionRows, error: optErr } = await supabase
                .from('design_options')
                .select('id,title,description,primary_image_url,mockups')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })
                .limit(3)
            if (optErr) throw optErr

            const list = (optionRows || []) as DesignOption[]
            setOptions(list)
            if (list.length > 0) {
                setSelectedOptionId(list[0].id)
                const nextPreview: Record<string, string> = {}
                for (const o of list) nextPreview[o.id] = PRODUCT_PREVIEWS[0].slug
                setOptionPreviewProduct(nextPreview)
            }
        } catch (e: any) {
            setLoadError(e?.message || 'Failed to load design options.')
        } finally {
            setIsLoading(false)
        }
    }, [sessionId, supabase])

    useEffect(() => {
        load()
    }, [load])

    const imageForOptionAndProduct = useCallback((o: DesignOption, productSlug: string) => {
        const byProduct = o?.mockups?.[productSlug]
        return byProduct || o?.primary_image_url || ''
    }, [])

    const handleRequestVariations = useCallback(() => {
        if (!selectedOptionId) {
            toast({
                title: 'Select an option',
                description: 'Please choose a design option to request variations.',
                variant: 'default',
            })
            return
        }
        router.push(
            `/${lang}/design/s/${sessionId}/variations?base=${encodeURIComponent(selectedOptionId)}`
        )
    }, [lang, router, selectedOptionId, sessionId, toast])

    const handleSelectProduct = useCallback(() => {
        if (!selectedOptionId) {
            toast({
                title: 'Select an option',
                description: 'Please choose a design option to continue.',
            })
            return
        }
        router.push(
            `/${lang}/design/s/${sessionId}/select-product?design=${encodeURIComponent(selectedOptionId)}`
        )
    }, [lang, router, selectedOptionId, sessionId, toast])

    const handleContinueLater = useCallback(async () => {
        try {
            setIsSavingDraft(true)
            if (authUserId) {
                await supabase
                    .from('design_sessions')
                    .update({ status: 'draft' })
                    .eq('id', sessionId)
            }
        } catch (_) {
            // best effort only
        } finally {
            setIsSavingDraft(false)
            router.push(`/${lang}/account/orders`)
        }
    }, [authUserId, lang, router, sessionId, supabase])

    const Step = ({ idx, label, active }: { idx: number; label: string; active?: boolean }) => (
        <div
            className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1 text-xs md:text-sm',
                active
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-muted text-muted-foreground border-transparent'
            )}
        >
            <span
                className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full',
                    active ? 'bg-primary-foreground/20' : 'bg-background/50'
                )}
            >
                {idx}
            </span>
            <span className="font-medium">{label}</span>
        </div>
    )

    return (
        <div className="bg-background min-h-screen">
            <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-24 md:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                            Choose your design option
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Session {sessionId.slice(0, 8)} • {session?.status || 'processing'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/${lang}//help`}
                            className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-sm"
                        >
                            Help
                        </Link>
                        <Link
                            href={`/${lang}/cart`}
                            className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-sm"
                        >
                            Cart
                        </Link>
                        <Link
                            href={`/${lang}/account/orders`}
                            className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground rounded-full border px-3 py-1.5 text-sm"
                        >
                            My Orders
                        </Link>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Step idx={1} label="Intent" />
                    <Step idx={2} label="Options" active />
                    <Step idx={3} label="Select Product" />
                    <Step idx={4} label="Configure" />
                    <Step idx={5} label="Approval" />
                    <Step idx={6} label="Checkout" />
                </div>

                {session?.prompt ? (
                    <div className="bg-card text-muted-foreground mt-4 rounded-lg p-4 text-sm">
                        <span className="text-foreground font-medium">Brief:</span> {session.prompt}
                    </div>
                ) : null}

                <Separator className="my-6" />

                {loadError ? (
                    <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                        <AlertTitle>Could not load designs</AlertTitle>
                        <AlertDescription>
                            {loadError}
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={load}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium"
                                >
                                    Retry
                                </button>
                                <Link
                                    href={`/${lang}/design/s/${sessionId}/variations`}
                                    className="hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium"
                                >
                                    Request Variations
                                </Link>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : null}

                {isLoading ? (
                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-card overflow-hidden rounded-xl border">
                                <Skeleton className="aspect-square w-full" />
                                <div className="space-y-3 p-4">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <div className="mt-4 flex gap-2">
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-28" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

                {!isLoading && !loadError && options.length === 0 ? (
                    <div className="mt-6">
                        <Alert>
                            <AlertTitle>No options yet</AlertTitle>
                            <AlertDescription>
                                We couldn&apos;t find generated options for this session.
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Link
                                        href={`/${lang}/design/s/${sessionId}/variations`}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium"
                                    >
                                        Request Variations
                                    </Link>
                                    <Link
                                        href={`/${lang}/products`}
                                        className="hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium"
                                    >
                                        Browse Products
                                    </Link>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : null}

                {!isLoading && options.length > 0 ? (
                    <div className="mt-6">
                        <div className="md:hidden">
                            <Carousel opts={{ align: 'start', loop: true }}>
                                <CarouselContent>
                                    {options.map((o, idx) => {
                                        const chosenProduct =
                                            optionPreviewProduct[o.id] || PRODUCT_PREVIEWS[0].slug
                                        const previewUrl = imageForOptionAndProduct(
                                            o,
                                            chosenProduct
                                        )
                                        const isSelected = selectedOptionId === o.id
                                        return (
                                            <CarouselItem key={o.id} className="basis-[85%] pl-2">
                                                <div
                                                    className={cn(
                                                        'group bg-card relative overflow-hidden rounded-xl border',
                                                        isSelected
                                                            ? 'ring-primary ring-2'
                                                            : 'hover:ring-ring hover:ring-1'
                                                    )}
                                                >
                                                    <button
                                                        onClick={() => setSelectedOptionId(o.id)}
                                                        className="absolute inset-0 z-10"
                                                        aria-label={`Select option ${idx + 1}`}
                                                    />
                                                    {previewUrl ? (
                                                        // @ts-expect-warning @next/next/no-img/element - use img to avoid remote pattern restrictions
                                                        <img
                                                            src={previewUrl}
                                                            alt={
                                                                o.title ||
                                                                `Design option ${idx + 1}`
                                                            }
                                                            className="aspect-square w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="bg-muted aspect-square w-full" />
                                                    )}
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h3 className="text-base leading-tight font-semibold">
                                                                    {o.title || `Option ${idx + 1}`}
                                                                </h3>
                                                                {o.description ? (
                                                                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                                                        {o.description}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                            {isSelected ? (
                                                                <span className="bg-primary text-primary-foreground inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2 text-xs font-medium">
                                                                    Selected
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="text-muted-foreground mb-2 text-xs">
                                                                Preview on
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {PRODUCT_PREVIEWS.map((p) => (
                                                                    <button
                                                                        key={p.slug}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setOptionPreviewProduct(
                                                                                (prev) => ({
                                                                                    ...prev,
                                                                                    [o.id]: p.slug,
                                                                                })
                                                                            )
                                                                        }}
                                                                        className={cn(
                                                                            'rounded-full border px-3 py-1 text-xs',
                                                                            chosenProduct === p.slug
                                                                                ? 'bg-secondary text-secondary-foreground border-transparent'
                                                                                : 'hover:bg-accent hover:text-accent-foreground'
                                                                        )}
                                                                    >
                                                                        {p.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="mt-3">
                                                                <Link
                                                                    href={
                                                                        PRODUCT_PREVIEWS.find(
                                                                            (p) =>
                                                                                p.slug ===
                                                                                chosenProduct
                                                                        )?.href(lang) ||
                                                                        `/${lang}/products`
                                                                    }
                                                                    className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
                                                                >
                                                                    View{' '}
                                                                    {PRODUCT_PREVIEWS.find(
                                                                        (p) =>
                                                                            p.slug === chosenProduct
                                                                    )?.name || 'product'}{' '}
                                                                    details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        )
                                    })}
                                </CarouselContent>
                                <div className="mt-3 flex items-center justify-end gap-2 pr-2">
                                    <CarouselPrevious className="bg-card hover:bg-accent hover:text-accent-foreground static translate-y-0 rounded-full border p-2" />
                                    <CarouselNext className="bg-card hover:bg-accent hover:text-accent-foreground static translate-y-0 rounded-full border p-2" />
                                </div>
                            </Carousel>
                        </div>

                        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
                            {options.map((o, idx) => {
                                const chosenProduct =
                                    optionPreviewProduct[o.id] || PRODUCT_PREVIEWS[0].slug
                                const previewUrl = imageForOptionAndProduct(o, chosenProduct)
                                const isSelected = selectedOptionId === o.id
                                return (
                                    <div
                                        key={o.id}
                                        className={cn(
                                            'group bg-card relative overflow-hidden rounded-xl border',
                                            isSelected
                                                ? 'ring-primary ring-2'
                                                : 'hover:ring-ring hover:ring-1'
                                        )}
                                    >
                                        <button
                                            onClick={() => setSelectedOptionId(o.id)}
                                            className="absolute inset-0 z-10"
                                            aria-label={`Select option ${idx + 1}`}
                                        />
                                        {previewUrl ? (
                                            <Image
                                                src={previewUrl}
                                                alt={o.title || `Design option ${idx + 1}`}
                                                className="aspect-square w-full object-cover"
                                            />
                                        ) : (
                                            <div className="bg-muted aspect-square w-full" />
                                        )}
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-base leading-tight font-semibold">
                                                        {o.title || `Option ${idx + 1}`}
                                                    </h3>
                                                    {o.description ? (
                                                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                                                            {o.description}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                {isSelected ? (
                                                    <span className="bg-primary text-primary-foreground inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2 text-xs font-medium">
                                                        Selected
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-muted-foreground mb-2 text-xs">
                                                    Preview on
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {PRODUCT_PREVIEWS.map((p) => (
                                                        <button
                                                            key={p.slug}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOptionPreviewProduct((prev) => ({
                                                                    ...prev,
                                                                    [o.id]: p.slug,
                                                                }))
                                                            }}
                                                            className={cn(
                                                                'rounded-full border px-3 py-1 text-xs',
                                                                chosenProduct === p.slug
                                                                    ? 'bg-secondary text-secondary-foreground border-transparent'
                                                                    : 'hover:bg-accent hover:text-accent-foreground'
                                                            )}
                                                        >
                                                            {p.name}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="mt-3">
                                                    <Link
                                                        href={
                                                            PRODUCT_PREVIEWS.find(
                                                                (p) => p.slug === chosenProduct
                                                            )?.href(lang) || `/${lang}/products`
                                                        }
                                                        className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
                                                    >
                                                        View{' '}
                                                        {PRODUCT_PREVIEWS.find(
                                                            (p) => p.slug === chosenProduct
                                                        )?.name || 'product'}{' '}
                                                        details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="bg-card/95 supports-[backdrop-filter]:bg-card/70 sticky bottom-4 z-20 mt-8 rounded-xl border p-4 backdrop-blur">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-muted-foreground text-sm">
                                        {selectedOption ? (
                                            <>
                                                Selected:{' '}
                                                <span className="text-foreground font-medium">
                                                    {selectedOption.title || 'Option'}
                                                </span>
                                            </>
                                        ) : (
                                            <>Select one of the options to continue</>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-xs">
                                        Not what you wanted? You can request new variations or go
                                        back later from your orders.
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={handleRequestVariations}
                                        className="bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
                                    >
                                        Request Variations
                                    </button>
                                    <button
                                        onClick={handleSelectProduct}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                                    >
                                        Select Product
                                    </button>
                                    <button
                                        onClick={handleContinueLater}
                                        disabled={isSavingDraft}
                                        className="bg-card hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
                                    >
                                        {isSavingDraft ? 'Saving…' : 'Continue later'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 grid gap-6 md:grid-cols-3">
                            <div className="bg-card rounded-xl border p-4">
                                <h4 className="text-sm font-semibold">Next steps</h4>
                                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href={`/${lang}/design/s/${sessionId}/select-product`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Choose a product to continue
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}/products`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Browse catalog
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}/cart`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Review cart
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}/checkout`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Go to checkout
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-card rounded-xl border p-4">
                                <h4 className="text-sm font-semibold">Help & support</h4>
                                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                                    <li>
                                        <Link
                                            href={`/${lang}//help`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            How AI designs work
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}//contact`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Contact us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}//legal/ip-policy`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            IP & content policy
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-card rounded-xl border p-4">
                                <h4 className="text-sm font-semibold">Your account</h4>
                                <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                                    {!authUserId ? (
                                        <li>
                                            <Link
                                                href={`/${lang}/sign-in`}
                                                className="hover:text-foreground underline underline-offset-2"
                                            >
                                                Sign in to save progress
                                            </Link>
                                        </li>
                                    ) : null}
                                    <li>
                                        <Link
                                            href={`/${lang}/account/orders`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Orders
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}/account/addresses`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Addresses
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${lang}/account/settings`}
                                            className="hover:text-foreground underline underline-offset-2"
                                        >
                                            Settings
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-10">
                            <Separator />
                            <div className="text-muted-foreground mt-6 grid grid-cols-2 gap-4 text-xs md:grid-cols-6">
                                <Link href={`/${lang}//about`} className="hover:text-foreground">
                                    About
                                </Link>
                                <Link
                                    href={`/${lang}//legal/terms`}
                                    className="hover:text-foreground"
                                >
                                    Terms
                                </Link>
                                <Link
                                    href={`/${lang}//legal/privacy`}
                                    className="hover:text-foreground"
                                >
                                    Privacy
                                </Link>
                                <Link href={`/${lang}/orders`} className="hover:text-foreground">
                                    All Orders
                                </Link>
                                <Link href={`/${lang}/admin`} className="hover:text-foreground">
                                    Admin
                                </Link>
                                <Link
                                    href={`/${lang}/admin/analytics`}
                                    className="hover:text-foreground"
                                >
                                    Analytics
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
