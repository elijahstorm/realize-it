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
import { toast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

type PageProps = {
    params: { lang: string; sessionId: string; productSlug: string; imgId: string }
}

type ProductConfig = {
    slug: string
    name: string
    colors: { name: string; hex: string }[]
    sizes: string[]
    variants: { id: string; name: string; baseCost: number }[]
}

const DEFAULT_MARKUP = 0.2 // 20%
const FX_USD_KRW = 1350 // approximate; for display only

const PRODUCT_CATALOG: Record<string, ProductConfig> = {
    't-shirt': {
        slug: 't-shirt',
        name: 'Unisex T‑Shirt',
        colors: [
            { name: 'Black', hex: '#111827' },
            { name: 'White', hex: '#F9FAFB' },
            { name: 'Navy', hex: '#1F2937' },
            { name: 'Heather Gray', hex: '#9CA3AF' },
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
        variants: [
            { id: 'classic', name: 'Classic', baseCost: 8.5 },
            { id: 'premium', name: 'Premium', baseCost: 12 },
        ],
    },
    hoodie: {
        slug: 'hoodie',
        name: 'Pullover Hoodie',
        colors: [
            { name: 'Black', hex: '#111827' },
            { name: 'Charcoal', hex: '#374151' },
            { name: 'White', hex: '#F9FAFB' },
            { name: 'Forest', hex: '#14532D' },
        ],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        variants: [
            { id: 'standard', name: 'Standard', baseCost: 18 },
            { id: 'heavy', name: 'Heavyweight', baseCost: 28 },
        ],
    },
    mug: {
        slug: 'mug',
        name: 'Ceramic Mug',
        colors: [
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Black Rim', hex: '#0B0F1A' },
        ],
        sizes: ['11oz', '15oz'],
        variants: [
            { id: '11oz', name: '11oz', baseCost: 7 },
            { id: '15oz', name: '15oz', baseCost: 9 },
        ],
    },
    tote: {
        slug: 'tote',
        name: 'Canvas Tote',
        colors: [
            { name: 'Natural', hex: '#F3F4F6' },
            { name: 'Black', hex: '#111827' },
        ],
        sizes: ['One Size'],
        variants: [
            { id: 'basic', name: 'Basic', baseCost: 9 },
            { id: 'heavy', name: 'Heavy Canvas', baseCost: 12 },
        ],
    },
    socks: {
        slug: 'socks',
        name: 'Crew Socks',
        colors: [
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Black', hex: '#111827' },
        ],
        sizes: ['One Size'],
        variants: [{ id: 'onesize', name: 'One Size', baseCost: 8 }],
    },
    sweatshirt: {
        slug: 'sweatshirt',
        name: 'Crewneck Sweatshirt',
        colors: [
            { name: 'Black', hex: '#111827' },
            { name: 'Heather Gray', hex: '#9CA3AF' },
            { name: 'Navy', hex: '#1F2937' },
            { name: 'Maroon', hex: '#800000' },
        ],
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        variants: [
            { id: 'classic', name: 'Classic', baseCost: 20 },
            { id: 'premium', name: 'Premium', baseCost: 30 },
        ],
    },
    'phone-case': {
        slug: 'phone-case',
        name: 'Phone Case',
        colors: [
            { name: 'Clear', hex: '#FFFFFF00' },
            { name: 'Black', hex: '#111827' },
            { name: 'White', hex: '#F9FAFB' },
        ],
        sizes: ['iPhone', 'Android'],
        variants: [
            { id: 'standard', name: 'Standard', baseCost: 15 },
            { id: 'premium', name: 'Premium', baseCost: 20 },
        ],
    },
    canvas: {
        slug: 'canvas',
        name: 'Gallery Canvas',
        colors: [
            { name: 'White', hex: '#FFFFFF' },
            { name: 'Black', hex: '#111827' },
        ],
        sizes: ['12x12', '16x20', '18x24'],
        variants: [
            { id: 'standard', name: 'Standard', baseCost: 40 },
            { id: 'premium', name: 'Premium', baseCost: 60 },
        ],
    },
    blanket: {
        slug: 'blanket',
        name: 'Fleece Blanket',
        colors: [
            { name: 'Gray', hex: '#9CA3AF' },
            { name: 'Black', hex: '#111827' },
            { name: 'Navy', hex: '#1F2937' },
        ],
        sizes: ['50x60', '60x80'],
        variants: [
            { id: 'standard', name: 'Standard', baseCost: 25 },
            { id: 'premium', name: 'Premium', baseCost: 40 },
        ],
    },
    stickers: {
        slug: 'stickers',
        name: 'Die-Cut Stickers',
        colors: [{ name: 'Full Color', hex: '#FFFFFF' }],
        sizes: ['2in', '3in', '4in'],
        variants: [
            { id: 'single', name: 'Single', baseCost: 2 },
            { id: 'pack', name: 'Pack of 5', baseCost: 8 },
        ],
    },
    journal: {
        slug: 'journal',
        name: 'Hardcover Journal',
        colors: [
            { name: 'Black', hex: '#111827' },
            { name: 'Navy', hex: '#1F2937' },
            { name: 'Tan', hex: '#D9B99B' },
        ],
        sizes: ['A5', 'A4'],
        variants: [
            { id: 'lined', name: 'Lined', baseCost: 15 },
            { id: 'blank', name: 'Blank', baseCost: 15 },
            { id: 'grid', name: 'Grid', baseCost: 15 },
        ],
    },
}

function estimateShippingUSD(slug: string, quantity: number) {
    const rules: Record<string, { first: number; additional: number; eta: string }> = {
        't-shirt': { first: 4.99, additional: 1.5, eta: '7–14 days' },
        hoodie: { first: 7.99, additional: 2.5, eta: '7–14 days' },
        mug: { first: 5.99, additional: 1.5, eta: '7–14 days' },
        tote: { first: 4.49, additional: 1.2, eta: '7–14 days' },
        socks: { first: 3.99, additional: 1.0, eta: '7–14 days' },
        default: { first: 5.99, additional: 1.99, eta: '7–14 days' },
    }
    const rule = rules[slug] || rules.default
    const q = Math.max(1, quantity)
    const shipping = rule.first + rule.additional * (q - 1)
    return { shipping, eta: rule.eta }
}

function formatUSD(v: number) {
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function formatKRWApproxFromUSD(usd: number) {
    return Math.round(usd * FX_USD_KRW).toLocaleString('ko-KR', {
        style: 'currency',
        currency: 'KRW',
    })
}

function uuid() {
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
        return (crypto as any).randomUUID()
    }
    return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Page({ params }: PageProps) {
    const { lang, sessionId, productSlug, imgId } = params
    const router = useRouter()
    const product = PRODUCT_CATALOG[productSlug]
    const supabase = supabaseBrowser

    const [selectedImage, setSelectedImage] = useState<{
        image_url: string
        image_prompt: string
    } | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [color, setColor] = useState<string>(product?.colors?.[0]?.name || '')
    const [size, setSize] = useState<string>(product?.sizes?.[0] || '')
    const [variantId, setVariantId] = useState<string>(product?.variants?.[0]?.id || '')
    const [quantity, setQuantity] = useState<number>(1)

    useEffect(() => {
        const sb = supabaseBrowser
        sb.auth.getUser().then((res) => {
            const email = res.data.user?.email ?? null
            setUserEmail(email)
        })
    }, [])

    useEffect(() => {
        // load saved config for this session if available
        try {
            const saved = localStorage.getItem(`design:config:${sessionId}`)
            if (saved) {
                const cfg = JSON.parse(saved)
                if (cfg && cfg.productSlug === productSlug) {
                    if (cfg.color) setColor(cfg.color)
                    if (cfg.size) setSize(cfg.size)
                    if (cfg.variantId) setVariantId(cfg.variantId)
                    if (cfg.quantity) setQuantity(cfg.quantity)
                }
            }
        } catch (_) {}
    }, [sessionId, productSlug])

    useEffect(() => {
        // ensure defaults if product changes
        if (product) {
            const load = async () => {
                if (!product.colors.find((c) => c.name === color)) {
                    setColor(product.colors[0]?.name || '')
                }
                if (!product.sizes.includes(size)) {
                    setSize(product.sizes[0] || '')
                }
                if (!product.variants.find((v) => v.id === variantId)) {
                    setVariantId(product.variants[0]?.id || '')
                }

                const { data: imageUrl, error: messagesErr } = await supabase
                    .from('design_session_messages')
                    .select('image_url,image_prompt')
                    .eq('id', imgId)
                    .eq('design_session_id', sessionId)
                    .single()

                if (imageUrl && !messagesErr) {
                    setSelectedImage(imageUrl)
                }
            }

            load()
        }
    }, [productSlug, imgId, color, product, size, variantId])

    const variant = useMemo(
        () => product?.variants.find((v) => v.id === variantId) || null,
        [product, variantId]
    )

    const pricing = useMemo(() => {
        const base = variant?.baseCost || 0
        const markup = base * DEFAULT_MARKUP
        const unit = base + markup
        const sub = unit * quantity
        const { shipping, eta } = estimateShippingUSD(productSlug, quantity)
        const total = sub + shipping
        return {
            base,
            markup,
            unit,
            sub,
            shipping,
            total,
            eta,
        }
    }, [variant, quantity, productSlug])

    function saveCurrentConfig() {
        try {
            const payload = { productSlug, color, size, variantId, quantity }
            localStorage.setItem(`design:config:${sessionId}`, JSON.stringify(payload))
        } catch (_) {}
    }

    function handleAddToCart() {
        if (!product || !variant) return
        const item = {
            id: uuid(),
            sessionId,
            productSlug,
            productName: product.name,
            variantId,
            variantName: variant.name,
            color,
            size,
            quantity,
            unitPriceUSD: Number(pricing.unit.toFixed(2)),
            currency: 'USD',
            priceBreakdown: {
                printifyCostUSD: Number(pricing.base.toFixed(2)),
                markupUSD: Number(pricing.markup.toFixed(2)),
                shippingUSD: Number(pricing.shipping.toFixed(2)),
            },
            created_at: new Date().toISOString(),
        }
        try {
            const raw = localStorage.getItem('cart')
            const cart = raw ? JSON.parse(raw) : []
            cart.push(item)
            localStorage.setItem('cart', JSON.stringify(cart))
            saveCurrentConfig()
            toast({
                title: 'Added to cart',
                description: `${item.productName} • ${item.variantName} (${item.color}/${item.size})`,
            })
            router.push(`/${lang}/cart`)
        } catch (e) {
            toast({
                title: 'Could not add to cart',
                description: 'Please try again.',
                variant: 'destructive' as any,
            })
        }
    }

    function handleGoToApproval() {
        saveCurrentConfig()
        router.push(`/${lang}/design/s/${sessionId}/approval`)
    }

    if (!product) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <Alert variant="destructive">
                    <AlertTitle>Product not found</AlertTitle>
                    <AlertDescription>
                        The requested product is not available. Explore our catalog or go back to
                        select a product.
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                                href={`/${lang}/products`}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium"
                            >
                                View Products
                            </Link>
                            <Link
                                href={`/${lang}/design/s/${sessionId}/select-product/${imgId}`}
                                className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm"
                            >
                                Back to Select Product
                            </Link>
                            <Link
                                href={`/${lang}/help`}
                                className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-3 py-2 text-sm"
                            >
                                Need Help?
                            </Link>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    const selectedColorHex = product.colors.find((c) => c.name === color)?.hex || '#E5E7EB'

    return (
        <div className="from-background to-muted/30 min-h-screen bg-gradient-to-br">
            <main className="mx-auto max-w-6xl px-4 py-8">
                {!userEmail && (
                    <div className="mb-6">
                        <Alert className="bg-secondary/30">
                            <AlertTitle>Save your configuration</AlertTitle>
                            <AlertDescription>
                                Sign in to save shipping details and faster checkout.
                                <div className="mt-3 flex gap-2">
                                    <Link
                                        href={`/${lang}/sign-in`}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={`/${lang}/sign-up`}
                                        className="border-input bg-background hover:bg-muted inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
                                    >
                                        Create account
                                    </Link>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Left: Preview */}
                    {selectedImage?.image_url && (
                        <section className="border-border bg-card relative rounded-xl border p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-semibold">{product.name}</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Session {sessionId.slice(0, 8)} • {productSlug}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/${lang}/design/s/${sessionId}/variations`}
                                        className="border-input hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                                    >
                                        Back to Variations
                                    </Link>
                                    <Link
                                        href={`/${lang}/products/${productSlug}`}
                                        className="border-input hover:bg-muted rounded-md border px-3 py-1.5 text-sm"
                                    >
                                        Product details
                                    </Link>
                                </div>
                            </div>

                            <div className="border-border bg-background relative overflow-hidden rounded-lg border">
                                <div
                                    className="aspect-[4/3] w-full"
                                    title={`Interactive preview of your AI design on ${product.name}.
Color: ${color}.
Size: ${size}.
Variant: ${variant?.name}.`}
                                    style={{
                                        background: `radial-gradient(1200px circle at 20% 0%, ${selectedColorHex}22, transparent 40%), linear-gradient(135deg, ${selectedColorHex}33, transparent)`,
                                    }}
                                >
                                    <div className="flex h-full w-full items-center justify-center">
                                        <img
                                            src={selectedImage.image_url}
                                            alt={
                                                selectedImage?.image_prompt ||
                                                'Generated image (partial)'
                                            }
                                            className="w-full rounded-lg opacity-75 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Carousel className="w-full">
                                    <CarouselContent>
                                        {product.colors.map((c, idx) => (
                                            <CarouselItem
                                                key={c.name}
                                                className="basis-1/2 sm:basis-1/3 md:basis-1/3 lg:basis-1/4"
                                            >
                                                <div className="border-border rounded-md border p-2">
                                                    <img
                                                        src={selectedImage.image_url.replace(
                                                            '/upload/',
                                                            '/upload/' +
                                                                encodeURIComponent(
                                                                    `e_tint:50:hex:${c.hex}`
                                                                ) +
                                                                '/'
                                                        )}
                                                        alt={
                                                            selectedImage?.image_prompt ||
                                                            'Generated image (partial)'
                                                        }
                                                        className="w-full rounded-lg opacity-75 shadow-sm"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${c.hex}, #ffffff)`,
                                                        }}
                                                    />
                                                    <div className="text-muted-foreground mt-2 truncate text-xs">
                                                        Mockup {idx + 1} — {c.name}
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                </Carousel>
                            </div>

                            <div className="text-muted-foreground mt-4 text-xs">
                                Shipping to South Korea: {pricing.eta}. See{' '}
                                <Link
                                    href={`/${lang}/help`}
                                    className="hover:text-foreground underline"
                                >
                                    Help
                                </Link>
                                .
                            </div>
                        </section>
                    )}

                    {/* Right: Configuration + Pricing */}
                    <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
                        <div className="space-y-5">
                            {/* Colors */}
                            <div>
                                <div className="mb-2 text-sm font-medium">Color</div>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors.map((c) => (
                                        <button
                                            key={c.name}
                                            onClick={() => setColor(c.name)}
                                            className={cn(
                                                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                                                color === c.name
                                                    ? 'border-primary ring-primary/30 ring-2'
                                                    : 'border-input hover:bg-muted'
                                            )}
                                        >
                                            <span
                                                className="h-4 w-4 rounded"
                                                style={{
                                                    backgroundColor: c.hex,
                                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                                }}
                                                aria-hidden
                                            />
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size */}
                            <div>
                                <div className="mb-2 text-sm font-medium">Size</div>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setSize(s)}
                                            className={cn(
                                                'rounded-md border px-3 py-2 text-sm',
                                                size === s
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-input hover:bg-muted'
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Variant */}
                            <div>
                                <div className="mb-2 text-sm font-medium">Variant</div>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setVariantId(v.id)}
                                            className={cn(
                                                'rounded-md border px-3 py-2 text-sm',
                                                variantId === v.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-input hover:bg-muted'
                                            )}
                                            title={`Printify cost ${formatUSD(v.baseCost)} • Retail will apply ${Math.round(
                                                DEFAULT_MARKUP * 100
                                            )}% markup`}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="text-sm font-medium">Quantity</div>
                                    <div className="text-muted-foreground text-xs">
                                        Bulk pricing coming soon
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        className="border-input hover:bg-muted h-9 w-9 rounded-md border text-lg leading-none"
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={50}
                                        value={quantity}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value || '1', 10)
                                            setQuantity(
                                                Number.isFinite(v)
                                                    ? Math.min(50, Math.max(1, v))
                                                    : 1
                                            )
                                        }}
                                        className="border-input bg-background h-9 w-20 rounded-md border text-center text-sm"
                                    />
                                    <button
                                        onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                                        className="border-input hover:bg-muted h-9 w-9 rounded-md border text-lg leading-none"
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <Separator />

                            {/* Pricing */}
                            <div>
                                <div className="mb-3 text-sm font-semibold">Price breakdown</div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Printify cost</span>
                                        <span className="font-medium">
                                            {formatUSD(pricing.base)}{' '}
                                            <span className="text-muted-foreground text-xs">
                                                ({formatKRWApproxFromUSD(pricing.base)} est)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Markup {Math.round(DEFAULT_MARKUP * 100)}%
                                        </span>
                                        <span className="font-medium">
                                            {formatUSD(pricing.markup)}{' '}
                                            <span className="text-muted-foreground text-xs">
                                                ({formatKRWApproxFromUSD(pricing.markup)} est)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Unit price</span>
                                        <span className="font-semibold">
                                            {formatUSD(pricing.unit)}{' '}
                                            <span className="text-muted-foreground text-xs">
                                                ({formatKRWApproxFromUSD(pricing.unit)} est)
                                            </span>
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Subtotal × {quantity}
                                        </span>
                                        <span className="font-medium">
                                            {formatUSD(pricing.sub)}{' '}
                                            <span className="text-muted-foreground text-xs">
                                                ({formatKRWApproxFromUSD(pricing.sub)} est)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">
                                            Shipping est. (KR)
                                        </span>
                                        <span className="font-medium">
                                            {formatUSD(pricing.shipping)}{' '}
                                            <span className="text-muted-foreground text-xs">
                                                ({formatKRWApproxFromUSD(pricing.shipping)} est)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-base">
                                        <span className="font-semibold">Estimated total</span>
                                        <span className="font-bold">
                                            {formatUSD(pricing.total)}{' '}
                                            <span className="text-muted-foreground text-xs font-normal">
                                                ({formatKRWApproxFromUSD(pricing.total)} est)
                                            </span>
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        Taxes are calculated at checkout. Shipping times:{' '}
                                        {pricing.eta}. See{' '}
                                        <Link
                                            href={`/${lang}/legal/terms`}
                                            className="hover:text-foreground underline"
                                        >
                                            Terms
                                        </Link>{' '}
                                        and{' '}
                                        <Link
                                            href={`/${lang}/legal/ip-policy`}
                                            className="hover:text-foreground underline"
                                        >
                                            IP Policy
                                        </Link>
                                        .
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                                <button
                                    onClick={handleAddToCart}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow"
                                >
                                    Add to Cart
                                </button>
                                <button
                                    onClick={handleGoToApproval}
                                    className="border-input bg-background hover:bg-muted inline-flex flex-1 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
                                >
                                    Go to Approval
                                </button>
                            </div>

                            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
                                <Link
                                    href={`/${lang}/cart`}
                                    className="hover:text-foreground underline"
                                >
                                    View cart
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/checkout`}
                                    className="hover:text-foreground underline"
                                >
                                    Checkout
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/contact`}
                                    className="hover:text-foreground underline"
                                >
                                    Contact us
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/orders`}
                                    className="hover:text-foreground underline"
                                >
                                    Order history
                                </Link>
                                <span>•</span>
                                <Link
                                    href={`/${lang}/admin`}
                                    className="hover:text-foreground underline"
                                >
                                    Admin
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="text-muted-foreground mx-auto max-w-6xl px-4 pt-6 pb-10 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/${lang}/about`} className="hover:text-foreground">
                        About
                    </Link>
                    <span>·</span>
                    <Link href={`/${lang}/legal/privacy`} className="hover:text-foreground">
                        Privacy
                    </Link>
                    <span>·</span>
                    <Link href={`/${lang}/legal/terms`} className="hover:text-foreground">
                        Terms
                    </Link>
                    <span>·</span>
                    <Link href={`/${lang}/help`} className="hover:text-foreground">
                        Help
                    </Link>
                </div>
            </footer>
        </div>
    )
}
