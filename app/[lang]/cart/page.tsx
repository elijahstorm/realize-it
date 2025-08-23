'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

// Cart types
interface CartItem {
    id: string // unique id per cart item
    productSlug: string
    name: string
    size?: string
    color?: string
    quantity: number // >= 1
    unitCost: number // base Printify cost in app currency
    markupRate?: number // default 0.2 (20%)
    previewUrl?: string // optional mockup URL
    sessionId?: string // design session id
}

const CART_KEY = 'cart:v1'
const DEFAULT_MARKUP = 0.2
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL']
const COLORS = ['black', 'white', 'navy', 'gray', 'beige']

function roundToCurrency(amount: number, currency: string) {
    const decimals = currency === 'KRW' ? 0 : 2
    const factor = Math.pow(10, decimals)
    return Math.round(amount * factor) / factor
}

function classNames(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}

export default function CartPage() {
    const params = useParams<{ lang: string }>()
    const lang = (params?.lang || 'en').toString()
    const router = useRouter()
    const { toast } = useToast()

    const locale =
        lang.toLowerCase().startsWith('ko') || lang.toLowerCase().startsWith('kr')
            ? 'ko-KR'
            : 'en-US'
    const currency = locale === 'ko-KR' ? 'KRW' : 'USD'

    const fmtCurrency = useCallback(
        (amount: number) =>
            new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                maximumFractionDigits: currency === 'KRW' ? 0 : 2,
            }).format(roundToCurrency(amount, currency)),
        [locale, currency]
    )

    const [cart, setCart] = useState<CartItem[] | null>(null)
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        // Load cart from localStorage
        try {
            const raw = localStorage.getItem(CART_KEY)
            if (raw) {
                const parsed = JSON.parse(raw) as CartItem[]
                if (Array.isArray(parsed)) setCart(parsed.filter((i) => i && typeof i === 'object'))
                else setCart([])
            } else {
                setCart([])
            }
        } catch {
            setCart([])
        }
    }, [])

    useEffect(() => {
        // Fetch auth session to tailor messaging
        const supabase = supabaseBrowser
        supabase.auth.getUser().then(({ data }) => {
            setUserEmail(data.user?.email ?? null)
        })
    }, [])

    useEffect(() => {
        // Persist cart
        if (cart) {
            try {
                localStorage.setItem(CART_KEY, JSON.stringify(cart))
            } catch {
                // ignore
            }
        }
    }, [cart])

    const isEmpty = (cart?.length ?? 0) === 0

    const computeUnitPrice = useCallback(
        (item: CartItem) => {
            const rate = item.markupRate ?? DEFAULT_MARKUP
            return roundToCurrency(item.unitCost * (1 + rate), currency)
        },
        [currency]
    )

    const totals = useMemo(() => {
        const items = cart || []
        const baseCostTotal = items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0)
        const markupTotal = items.reduce(
            (sum, i) => sum + i.unitCost * (i.markupRate ?? DEFAULT_MARKUP) * i.quantity,
            0
        )
        const subtotal = baseCostTotal + markupTotal // no shipping/tax yet
        return {
            baseCostTotal: roundToCurrency(baseCostTotal, currency),
            markupTotal: roundToCurrency(markupTotal, currency),
            subtotal: roundToCurrency(subtotal, currency),
            itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
        }
    }, [cart, currency])

    const updateQuantity = useCallback(
        (id: string, nextQty: number) => {
            setCart((prev) => {
                if (!prev) return prev
                const qty = Math.max(1, Math.min(99, Math.floor(nextQty || 1)))
                const updated = prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
                return updated
            })
            toast({ title: locale === 'ko-KR' ? '수량이 업데이트되었습니다' : 'Quantity updated' })
        },
        [toast, locale]
    )

    const removeItem = useCallback(
        (id: string) => {
            setCart((prev) => (prev ? prev.filter((i) => i.id !== id) : prev))
            toast({ title: locale === 'ko-KR' ? '장바구니에서 제거됨' : 'Removed from cart' })
        },
        [toast, locale]
    )

    const clearCart = useCallback(() => {
        setCart([])
        toast({ title: locale === 'ko-KR' ? '장바구니가 비워졌습니다' : 'Cart cleared' })
    }, [toast, locale])

    const updateVariant = useCallback(
        (id: string, change: Partial<Pick<CartItem, 'size' | 'color'>>) => {
            setCart((prev) =>
                prev ? prev.map((i) => (i.id === id ? { ...i, ...change } : i)) : prev
            )
            toast({ title: locale === 'ko-KR' ? '옵션이 업데이트되었습니다' : 'Options updated' })
        },
        [toast, locale]
    )

    const handleCheckout = useCallback(() => {
        if (isEmpty) return
        router.push(`/${lang}/checkout`)
    }, [router, lang, isEmpty])

    return (
        <div className="bg-background text-foreground min-h-[calc(100vh-4rem)]">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <nav className="text-muted-foreground text-sm">
                        <ol className="flex flex-wrap items-center gap-2">
                            <li>
                                <Link href={`/${lang}`} className="hover:text-foreground">
                                    Home
                                </Link>
                            </li>
                            <li className="text-muted-foreground">/</li>
                            <li>
                                <Link href={`/${lang}/products`} className="hover:text-foreground">
                                    Products
                                </Link>
                            </li>
                            <li className="text-muted-foreground">/</li>
                            <li className="text-foreground font-medium">Cart</li>
                        </ol>
                    </nav>
                    <div className="flex items-center gap-2 text-sm">
                        <Link href={`/${lang}/design`} className="text-primary hover:underline">
                            {locale === 'ko-KR' ? '디자인 더하기' : 'Add more designs'}
                        </Link>
                        <span className="text-muted-foreground">·</span>
                        <Link
                            href={`/${lang}/help`}
                            className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                            {locale === 'ko-KR' ? '도움말' : 'Help'}
                        </Link>
                        <span className="text-muted-foreground">·</span>
                        <Link
                            href={`/${lang}//about`}
                            className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                            About
                        </Link>
                    </div>
                </div>

                {!userEmail && (
                    <div className="mb-6">
                        <Alert className="border-border">
                            <AlertTitle className="font-semibold">
                                {locale === 'ko-KR'
                                    ? '로그인하여 장바구니를 저장하세요'
                                    : 'Sign in to save your cart'}
                            </AlertTitle>
                            <AlertDescription>
                                {locale === 'ko-KR'
                                    ? '계정으로 로그인하면 모든 기기에서 장바구니와 주문 내역을 동기화합니다.'
                                    : 'Sign in to sync your cart and order history across devices.'}
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Link
                                        href={`/${lang}/sign-in`}
                                        className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90"
                                    >
                                        {locale === 'ko-KR' ? '로그인' : 'Sign in'}
                                    </Link>
                                    <Link
                                        href={`/${lang}/sign-up`}
                                        className="border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium"
                                    >
                                        {locale === 'ko-KR' ? '회원가입' : 'Create account'}
                                    </Link>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {locale === 'ko-KR' ? '장바구니' : 'Shopping Cart'}
                            </h1>
                            {cart && cart.length > 0 ? (
                                <button
                                    onClick={clearCart}
                                    className="text-destructive text-sm hover:underline"
                                >
                                    {locale === 'ko-KR' ? '비우기' : 'Clear cart'}
                                </button>
                            ) : null}
                        </div>
                        <Separator className="my-4" />

                        {!cart ? (
                            <div className="animate-pulse space-y-4">
                                <div className="bg-muted h-20 rounded-md" />
                                <div className="bg-muted h-20 rounded-md" />
                                <div className="bg-muted h-20 rounded-md" />
                            </div>
                        ) : isEmpty ? (
                            <div className="border-border rounded-lg border border-dashed p-8 text-center">
                                <p className="text-lg font-medium">
                                    {locale === 'ko-KR'
                                        ? '장바구니가 비어 있습니다'
                                        : 'Your cart is empty'}
                                </p>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    {locale === 'ko-KR'
                                        ? '디자인을 생성하고 제품을 추가해 보세요.'
                                        : 'Create a design and add products to get started.'}
                                </p>
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                                    <Link
                                        href={`/${lang}/design`}
                                        className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-90"
                                    >
                                        {locale === 'ko-KR' ? '디자인 시작' : 'Start designing'}
                                    </Link>
                                    <Link
                                        href={`/${lang}/products`}
                                        className="border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                                    >
                                        {locale === 'ko-KR' ? '제품 살펴보기' : 'Browse products'}
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="border-border overflow-hidden rounded-lg border">
                                <Table className="w-full">
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-[60%]">
                                                {locale === 'ko-KR' ? '상품' : 'Item'}
                                            </TableHead>
                                            <TableHead className="w-[10%] text-center">
                                                {locale === 'ko-KR' ? '수량' : 'Qty'}
                                            </TableHead>
                                            <TableHead className="w-[15%] text-right">
                                                {locale === 'ko-KR' ? '단가' : 'Price'}
                                            </TableHead>
                                            <TableHead className="w-[15%] text-right">
                                                {locale === 'ko-KR' ? '합계' : 'Total'}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => {
                                            const unitPrice = computeUnitPrice(item)
                                            const lineTotal = roundToCurrency(
                                                unitPrice * item.quantity,
                                                currency
                                            )
                                            return (
                                                <TableRow key={item.id} className="align-top">
                                                    <TableCell>
                                                        <div className="flex gap-4">
                                                            <div
                                                                className="border-border from-accent to-muted size-16 min-w-16 overflow-hidden rounded-md border bg-gradient-to-br"
                                                                aria-hidden
                                                            >
                                                                {item.previewUrl ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={item.previewUrl}
                                                                        alt=""
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-xs">
                                                                        {item.name?.slice(0, 1) ||
                                                                            ''}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex min-w-0 flex-1 flex-col">
                                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                                    <div className="min-w-0">
                                                                        <Link
                                                                            href={`/${lang}/products/${encodeURIComponent(item.productSlug)}`}
                                                                            className="line-clamp-1 font-medium hover:underline"
                                                                        >
                                                                            {item.name}
                                                                        </Link>
                                                                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                                            <span className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5">
                                                                                {locale === 'ko-KR'
                                                                                    ? '색상'
                                                                                    : 'Color'}
                                                                                :{' '}
                                                                                {item.color ||
                                                                                    (locale ===
                                                                                    'ko-KR'
                                                                                        ? '선택'
                                                                                        : 'Select')}
                                                                            </span>
                                                                            <span className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5">
                                                                                {locale === 'ko-KR'
                                                                                    ? '사이즈'
                                                                                    : 'Size'}
                                                                                :{' '}
                                                                                {item.size ||
                                                                                    (locale ===
                                                                                    'ko-KR'
                                                                                        ? '선택'
                                                                                        : 'Select')}
                                                                            </span>
                                                                            {item.sessionId ? (
                                                                                <Link
                                                                                    href={`/${lang}/design/s/${encodeURIComponent(item.sessionId)}/configure/${encodeURIComponent(item.productSlug)}`}
                                                                                    className="text-primary ml-1 hover:underline"
                                                                                >
                                                                                    {locale ===
                                                                                    'ko-KR'
                                                                                        ? '디자인 수정'
                                                                                        : 'Edit design'}
                                                                                </Link>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() =>
                                                                            removeItem(item.id)
                                                                        }
                                                                        className="text-muted-foreground hover:text-destructive text-xs"
                                                                    >
                                                                        {locale === 'ko-KR'
                                                                            ? '제거'
                                                                            : 'Remove'}
                                                                    </button>
                                                                </div>

                                                                <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-3">
                                                                    <label className="text-muted-foreground flex items-center gap-2 text-xs">
                                                                        <span className="w-10">
                                                                            {locale === 'ko-KR'
                                                                                ? '색상'
                                                                                : 'Color'}
                                                                        </span>
                                                                        <select
                                                                            aria-label={
                                                                                locale === 'ko-KR'
                                                                                    ? '색상 선택'
                                                                                    : 'Select color'
                                                                            }
                                                                            value={item.color || ''}
                                                                            onChange={(e) =>
                                                                                updateVariant(
                                                                                    item.id,
                                                                                    {
                                                                                        color: e
                                                                                            .target
                                                                                            .value,
                                                                                    }
                                                                                )
                                                                            }
                                                                            className="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border px-2 py-1 shadow-sm focus:ring-2 focus:outline-none"
                                                                        >
                                                                            <option
                                                                                value=""
                                                                                disabled
                                                                            >
                                                                                {locale === 'ko-KR'
                                                                                    ? '색상 선택'
                                                                                    : 'Choose color'}
                                                                            </option>
                                                                            {COLORS.map((c) => (
                                                                                <option
                                                                                    key={c}
                                                                                    value={c}
                                                                                >
                                                                                    {c}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </label>
                                                                    <label className="text-muted-foreground flex items-center gap-2 text-xs">
                                                                        <span className="w-10">
                                                                            {locale === 'ko-KR'
                                                                                ? '사이즈'
                                                                                : 'Size'}
                                                                        </span>
                                                                        <select
                                                                            aria-label={
                                                                                locale === 'ko-KR'
                                                                                    ? '사이즈 선택'
                                                                                    : 'Select size'
                                                                            }
                                                                            value={item.size || ''}
                                                                            onChange={(e) =>
                                                                                updateVariant(
                                                                                    item.id,
                                                                                    {
                                                                                        size: e
                                                                                            .target
                                                                                            .value,
                                                                                    }
                                                                                )
                                                                            }
                                                                            className="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border px-2 py-1 shadow-sm focus:ring-2 focus:outline-none"
                                                                        >
                                                                            <option
                                                                                value=""
                                                                                disabled
                                                                            >
                                                                                {locale === 'ko-KR'
                                                                                    ? '사이즈 선택'
                                                                                    : 'Choose size'}
                                                                            </option>
                                                                            {SIZES.map((s) => (
                                                                                <option
                                                                                    key={s}
                                                                                    value={s}
                                                                                >
                                                                                    {s}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-center align-middle">
                                                        <div className="border-input inline-flex items-center rounded-md border">
                                                            <button
                                                                aria-label={
                                                                    locale === 'ko-KR'
                                                                        ? '수량 감소'
                                                                        : 'Decrease quantity'
                                                                }
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        item.quantity - 1
                                                                    )
                                                                }
                                                                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-l-md text-lg transition select-none"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                inputMode="numeric"
                                                                type="number"
                                                                min={1}
                                                                max={99}
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        Number(e.target.value || 1)
                                                                    )
                                                                }
                                                                className="border-input bg-background h-8 w-12 border-x text-center text-sm outline-none"
                                                            />
                                                            <button
                                                                aria-label={
                                                                    locale === 'ko-KR'
                                                                        ? '수량 증가'
                                                                        : 'Increase quantity'
                                                                }
                                                                onClick={() =>
                                                                    updateQuantity(
                                                                        item.id,
                                                                        item.quantity + 1
                                                                    )
                                                                }
                                                                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-r-md text-lg transition select-none"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="text-right align-middle whitespace-nowrap">
                                                        {fmtCurrency(unitPrice)}
                                                    </TableCell>
                                                    <TableCell className="text-right align-middle font-medium whitespace-nowrap">
                                                        {fmtCurrency(lineTotal)}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
                                                    <div className="text-muted-foreground text-xs">
                                                        {locale === 'ko-KR'
                                                            ? '모든 가격에는 기본 마진 20%가 적용됩니다.'
                                                            : 'All prices include a default 20% margin.'}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {locale === 'ko-KR'
                                                            ? '배송비 및 세금은 결제 시 계산됩니다.'
                                                            : 'Shipping and taxes are calculated at checkout.'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        )}

                        {!isEmpty && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <Link
                                    href={`/${lang}/products`}
                                    className="border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                                >
                                    {locale === 'ko-KR' ? '계속 쇼핑하기' : 'Continue shopping'}
                                </Link>
                                <Link
                                    href={`/${lang}/design`}
                                    className="border-input hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium"
                                >
                                    {locale === 'ko-KR' ? '디자인 추가' : 'Add more designs'}
                                </Link>
                                <Link
                                    href={`/${lang}//contact`}
                                    className="text-muted-foreground hover:text-foreground ml-auto text-sm hover:underline"
                                >
                                    {locale === 'ko-KR' ? '문의하기' : 'Contact us'}
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="border-border bg-card sticky top-6 rounded-lg border p-5 shadow-sm">
                            <h2 className="text-lg font-semibold">
                                {locale === 'ko-KR' ? '주문 요약' : 'Order Summary'}
                            </h2>
                            <Separator className="my-4" />
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '상품 수량' : 'Items'} (
                                        {totals.itemsCount})
                                    </span>
                                    <span className="font-medium">
                                        {fmtCurrency(totals.baseCostTotal)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '마진 (20%)' : 'Margin (20%)'}
                                    </span>
                                    <span className="font-medium">
                                        {fmtCurrency(totals.markupTotal)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {locale === 'ko-KR' ? '배송/세금' : 'Shipping/Tax'}
                                    </span>
                                    <span className="font-medium">
                                        {locale === 'ko-KR'
                                            ? '결제 시 계산'
                                            : 'Calculated at checkout'}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between text-base">
                                    <span className="font-semibold">
                                        {locale === 'ko-KR' ? '소계' : 'Subtotal'}
                                    </span>
                                    <span className="font-semibold">
                                        {fmtCurrency(totals.subtotal)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isEmpty}
                                className={classNames(
                                    'bg-primary text-primary-foreground mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium shadow transition',
                                    isEmpty ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'
                                )}
                            >
                                {locale === 'ko-KR' ? '결제하기' : 'Checkout'}
                            </button>

                            <div className="text-muted-foreground mt-4 text-xs">
                                <p>
                                    {locale === 'ko-KR'
                                        ? '결제 시 즉시 주문이 Printify로 제출됩니다. 주문 상태는 주문 내역에서 확인하세요.'
                                        : 'Your order auto-submits to Printify after payment. Track it in your orders.'}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <Link
                                        href={`/${lang}/account/orders`}
                                        className="hover:underline"
                                    >
                                        {locale === 'ko-KR' ? '주문 내역' : 'Order history'}
                                    </Link>
                                    <span>·</span>
                                    <Link href={`/${lang}/orders`} className="hover:underline">
                                        {locale === 'ko-KR' ? '전체 주문' : 'All orders'}
                                    </Link>
                                    <span>·</span>
                                    <Link
                                        href={`/${lang}//legal/terms`}
                                        className="hover:underline"
                                    >
                                        {locale === 'ko-KR' ? '이용 약관' : 'Terms'}
                                    </Link>
                                    <span>·</span>
                                    <Link
                                        href={`/${lang}//legal/privacy`}
                                        className="hover:underline"
                                    >
                                        {locale === 'ko-KR' ? '개인정보처리방침' : 'Privacy'}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="border-border bg-card text-muted-foreground mt-6 rounded-lg border p-4 text-xs">
                            <p>
                                {locale === 'ko-KR'
                                    ? '디자인 검토가 필요한가요? ‘디자인’ 페이지에서 세션으로 돌아가 수정할 수 있습니다.'
                                    : 'Need to tweak your design? Return to your session on the Design page to make changes.'}{' '}
                                <Link
                                    href={`/${lang}/design`}
                                    className="text-primary hover:underline"
                                >
                                    {locale === 'ko-KR' ? '디자인으로 이동' : 'Go to Design'}
                                </Link>
                                {' · '}
                                <Link
                                    href={`/${lang}/design/s/${encodeURIComponent('example-session')}/variations`}
                                    className="hover:underline"
                                >
                                    {locale === 'ko-KR' ? '변형 살펴보기' : 'Explore variations'}
                                </Link>
                            </p>
                        </div>

                        <div className="border-border bg-card text-muted-foreground mt-6 rounded-lg border p-4 text-xs">
                            <p>
                                {locale === 'ko-KR' ? '관리자입니까?' : 'Are you an admin?'}{' '}
                                <Link href={`/${lang}/admin`} className="hover:underline">
                                    {locale === 'ko-KR' ? '대시보드' : 'Dashboard'}
                                </Link>
                                {' · '}
                                <Link href={`/${lang}/admin/orders`} className="hover:underline">
                                    {locale === 'ko-KR' ? '주문 큐' : 'Orders queue'}
                                </Link>
                                {' · '}
                                <Link href={`/${lang}/admin/analytics`} className="hover:underline">
                                    {locale === 'ko-KR' ? '분석' : 'Analytics'}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
