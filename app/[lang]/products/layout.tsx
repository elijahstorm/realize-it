'use client'

import {
    SidebarProvider,
    Sidebar,
    SidebarTrigger,
    SidebarInset,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    SidebarFooter,
    SidebarInput,
} from '@/components/ui/sidebar'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

// Remove custom LayoutProps and use Next.js built-in types
interface ProductsLayoutProps {
    children: React.ReactNode
    params: Promise<{ lang: string }>
}

type Lang = 'en' | 'ko'

const PRODUCT_TYPES: { slug: string; icon: string; names: Record<Lang, string> }[] = [
    { slug: 't-shirt', icon: '👕', names: { en: 'T-Shirts', ko: '티셔츠' } },
    { slug: 'hoodie', icon: '🧥', names: { en: 'Hoodies', ko: '후디' } },
    { slug: 'socks', icon: '🧦', names: { en: 'Socks', ko: '양말' } },
    { slug: 'mug', icon: '☕', names: { en: 'Mugs', ko: '머그컵' } },
    { slug: 'canvas', icon: '🖼️', names: { en: 'Canvas', ko: '캔버스' } },
    { slug: 'blanket', icon: '🛏️', names: { en: 'Blankets', ko: '담요' } },
    { slug: 'phone-case', icon: '📱', names: { en: 'Phone Cases', ko: '폰 케이스' } },
    { slug: 'tote', icon: '👜', names: { en: 'Tote Bags', ko: '토트백' } },
    { slug: 'stickers', icon: '🏷️', names: { en: 'Stickers', ko: '스티커' } },
    { slug: 'journal', icon: '📓', names: { en: 'Journals', ko: '저널' } },
]

const COLOR_OPTIONS = [
    { v: 'white', hex: '#ffffff' },
    { v: 'black', hex: '#111111' },
    { v: 'navy', hex: '#1e3a8a' },
    { v: 'red', hex: '#ef4444' },
    { v: 'blue', hex: '#3b82f6' },
    { v: 'green', hex: '#10b981' },
    { v: 'pink', hex: '#ec4899' },
    { v: 'purple', hex: '#8b5cf6' },
]

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', '2XL']

const SORT_OPTIONS = [
    { v: 'relevance', names: { en: 'Relevance', ko: '관련순' } },
    { v: 'price-asc', names: { en: 'Price: Low to High', ko: '가격 낮은순' } },
    { v: 'price-desc', names: { en: 'Price: High to Low', ko: '가격 높은순' } },
    { v: 'newest', names: { en: 'Newest', ko: '최신순' } },
]

function useI18n(lang: Lang) {
    return useMemo(() => {
        const dict = {
            en: {
                catalog: 'Catalog',
                allProducts: 'All Products',
                filters: 'Filters',
                searchPlaceholder: 'Search designs, themes, colors...',
                colors: 'Colors',
                sizes: 'Sizes',
                price: 'Price',
                min: 'Min',
                max: 'Max',
                sortBy: 'Sort by',
                apply: 'Apply',
                reset: 'Reset',
                quickLinks: 'Quick links',
                designStudio: 'Design Studio',
                cart: 'Cart',
                checkout: 'Checkout',
                orders: 'Orders',
                account: 'Account',
                help: 'Help',
                about: 'About',
                contact: 'Contact',
                admin: 'Admin',
                marketing: 'Learn more',
                saved: 'Saved',
                saving: 'Saving...',
                language: 'Language',
            },
            ko: {
                catalog: '카탈로그',
                allProducts: '모든 상품',
                filters: '필터',
                searchPlaceholder: '디자인, 테마, 색상 검색...',
                colors: '색상',
                sizes: '사이즈',
                price: '가격',
                min: '최소',
                max: '최대',
                sortBy: '정렬',
                apply: '적용',
                reset: '초기화',
                quickLinks: '바로가기',
                designStudio: '디자인 스튜디오',
                cart: '장바구니',
                checkout: '결제',
                orders: '주문내역',
                account: '계정',
                help: '도움말',
                about: '소개',
                contact: '문의',
                admin: '관리자',
                marketing: '자세히 보기',
                saved: '저장됨',
                saving: '저장 중...',
                language: '언어',
            },
        } as const
        return dict[lang]
    }, [lang])
}

function serializeFiltersToParams(filters: FiltersState): URLSearchParams {
    const p = new URLSearchParams()
    if (filters.q) p.set('q', filters.q)
    if (filters.colors.length) p.set('colors', filters.colors.join(','))
    if (filters.sizes.length) p.set('sizes', filters.sizes.join(','))
    if (filters.priceMin !== '') p.set('priceMin', String(filters.priceMin))
    if (filters.priceMax !== '') p.set('priceMax', String(filters.priceMax))
    if (filters.sort) p.set('sort', filters.sort)
    return p
}

function parseParamsToFilters(sp: URLSearchParams): FiltersState {
    const colors = sp.get('colors')?.split(',').filter(Boolean) ?? []
    const sizes = sp.get('sizes')?.split(',').filter(Boolean) ?? []
    const q = sp.get('q') ?? ''
    const priceMinStr = sp.get('priceMin')
    const priceMaxStr = sp.get('priceMax')
    const sort = sp.get('sort') ?? 'relevance'
    return {
        q,
        colors,
        sizes,
        priceMin: priceMinStr ? Number(priceMinStr) : '',
        priceMax: priceMaxStr ? Number(priceMaxStr) : '',
        sort,
    }
}

type FiltersState = {
    q: string
    colors: string[]
    sizes: string[]
    priceMin: number | ''
    priceMax: number | ''
    sort: string
}

export default function ProductsLayout({ children, params }: ProductsLayoutProps) {
    const [lang, setLang] = useState<Lang>('en')

    useEffect(() => {
        params.then((resolvedParams) => {
            setLang(resolvedParams.lang as Lang)
        })
    }, [params])

    const t = useI18n(lang)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [filters, setFilters] = useState<FiltersState>(() =>
        parseParamsToFilters(new URLSearchParams())
    )
    const [saving, setSaving] = useState(false)

    const storageKey = `productsFilters:${lang}`

    // Sync state from URL
    useEffect(() => {
        setFilters(parseParamsToFilters(searchParams))
    }, [searchParams])

    // On first mount, if no params, hydrate from localStorage
    useEffect(() => {
        if (!searchParams.toString()) {
            try {
                const saved = localStorage.getItem(storageKey)
                if (saved) {
                    const parsed = JSON.parse(saved) as FiltersState
                    const p = serializeFiltersToParams(parsed)
                    router.replace(`${pathname}${p.toString() ? `?${p.toString()}` : ''}`)
                }
            } catch {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const currentProductSlug = useMemo(() => {
        const parts = pathname.split('/').filter(Boolean)
        // ['', lang, 'products', slug?]
        // after filter(Boolean), it's [lang, 'products', slug?]
        if (parts[1] !== 'products') return null
        return parts[2] || null
    }, [pathname])

    const hrefWithParams = useCallback(
        (path: string) => {
            const paramsStr = searchParams.toString()
            return `${path}${paramsStr ? `?${paramsStr}` : ''}`
        },
        [searchParams]
    )

    const applyFilters = useCallback(
        (next: FiltersState) => {
            const p = serializeFiltersToParams(next)
            setSaving(true)
            router.replace(`${pathname}${p.toString() ? `?${p.toString()}` : ''}`)
            try {
                localStorage.setItem(storageKey, JSON.stringify(next))
            } catch {}
            setTimeout(() => setSaving(false), 350)
        },
        [pathname, router, storageKey]
    )

    const onApplyClick = useCallback(() => applyFilters(filters), [applyFilters, filters])

    const onReset = useCallback(() => {
        router.replace(pathname)
        try {
            localStorage.removeItem(storageKey)
        } catch {}
    }, [pathname, router, storageKey])

    const setColor = (c: string) => {
        setFilters((prev) => {
            const exists = prev.colors.includes(c)
            return {
                ...prev,
                colors: exists ? prev.colors.filter((x) => x !== c) : [...prev.colors, c],
            }
        })
    }

    const setSize = (s: string) => {
        setFilters((prev) => {
            const exists = prev.sizes.includes(s)
            return {
                ...prev,
                sizes: exists ? prev.sizes.filter((x) => x !== s) : [...prev.sizes, s],
            }
        })
    }

    const otherLang: Lang = lang === 'ko' ? 'en' : 'ko'
    const switchLangHref = useMemo(() => {
        const parts = pathname.split('/')
        if (parts.length > 1) parts[1] = otherLang // replace lang segment
        const base = parts.join('/')
        const sp = searchParams.toString()
        return `${base}${sp ? `?${sp}` : ''}`
    }, [pathname, otherLang, searchParams])

    const activeLabel = useMemo(() => {
        if (!currentProductSlug) return t.allProducts
        const found = PRODUCT_TYPES.find((p) => p.slug === currentProductSlug)
        return found ? found.names[lang] : t.allProducts
    }, [currentProductSlug, lang, t.allProducts])

    return (
        <SidebarProvider defaultOpen>
            <div className="bg-background text-foreground min-h-screen">
                <Sidebar
                    side="left"
                    variant="sidebar"
                    collapsible="offcanvas"
                    className="border-border border-r"
                >
                    <SidebarHeader className="px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary text-primary-foreground inline-flex h-8 w-8 items-center justify-center rounded-md font-semibold">
                                    R
                                </span>
                                <div className="text-sm leading-tight">
                                    <div className="font-semibold">RealizeIt</div>
                                    <div className="text-muted-foreground">{t.catalog}</div>
                                </div>
                            </div>
                            <Link
                                href={switchLangHref}
                                className="border-input bg-card hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                                aria-label="Switch language"
                            >
                                <span className="font-medium">{t.language}:</span>
                                <span className="uppercase">{otherLang}</span>
                            </Link>
                        </div>
                        <div className="mt-3">
                            <SidebarInput
                                value={filters.q}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFilters((f) => ({ ...f, q: e.target.value }))
                                }
                                placeholder={t.searchPlaceholder}
                                className="w-full"
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') onApplyClick()
                                }}
                            />
                        </div>
                    </SidebarHeader>

                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>{t.catalog}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild isActive={!currentProductSlug}>
                                            <Link
                                                href={hrefWithParams(`/${lang}/products`)}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">🛍️</span>
                                                <span>{t.allProducts}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    {PRODUCT_TYPES.map((p) => (
                                        <SidebarMenuItem key={p.slug}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={currentProductSlug === p.slug}
                                            >
                                                <Link
                                                    href={hrefWithParams(
                                                        `/${lang}/products/${p.slug}`
                                                    )}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="text-lg">{p.icon}</span>
                                                    <span>{p.names[lang]}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>{t.filters}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-muted-foreground text-xs">
                                            {t.colors}
                                        </label>
                                        <div className="grid grid-cols-8 gap-2">
                                            {COLOR_OPTIONS.map((c) => {
                                                const active = filters.colors.includes(c.v)
                                                return (
                                                    <button
                                                        key={c.v}
                                                        type="button"
                                                        onClick={() => setColor(c.v)}
                                                        className={cn(
                                                            'relative h-7 w-7 rounded-md border transition',
                                                            active
                                                                ? 'ring-primary ring-2 ring-offset-2'
                                                                : '',
                                                            'border-border'
                                                        )}
                                                        style={{ backgroundColor: c.hex }}
                                                        aria-pressed={active}
                                                        aria-label={c.v}
                                                    >
                                                        <span className="sr-only">{c.v}</span>
                                                        {active ? (
                                                            <svg
                                                                viewBox="0 0 20 20"
                                                                className="fill-primary absolute -top-1 -right-1 h-4 w-4"
                                                            >
                                                                <circle cx="10" cy="10" r="10" />
                                                            </svg>
                                                        ) : null}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-muted-foreground text-xs">
                                            {t.sizes}
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {SIZE_OPTIONS.map((s) => {
                                                const active = filters.sizes.includes(s)
                                                return (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setSize(s)}
                                                        className={cn(
                                                            'inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition',
                                                            active
                                                                ? 'bg-primary text-primary-foreground border-transparent'
                                                                : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground border-border'
                                                        )}
                                                        aria-pressed={active}
                                                    >
                                                        {s}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-muted-foreground text-xs">
                                                {t.min}
                                            </label>
                                            <input
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={filters.priceMin}
                                                onChange={(e) =>
                                                    setFilters((f) => ({
                                                        ...f,
                                                        priceMin:
                                                            e.target.value === ''
                                                                ? ''
                                                                : Number(e.target.value),
                                                    }))
                                                }
                                                placeholder="0"
                                                className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-muted-foreground text-xs">
                                                {t.max}
                                            </label>
                                            <input
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={filters.priceMax}
                                                onChange={(e) =>
                                                    setFilters((f) => ({
                                                        ...f,
                                                        priceMax:
                                                            e.target.value === ''
                                                                ? ''
                                                                : Number(e.target.value),
                                                    }))
                                                }
                                                placeholder="100"
                                                className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-muted-foreground text-xs">
                                            {t.sortBy}
                                        </label>
                                        <select
                                            value={filters.sort}
                                            onChange={(e) =>
                                                setFilters((f) => ({ ...f, sort: e.target.value }))
                                            }
                                            className="border-input bg-background w-full rounded-md border px-2 py-1 text-sm"
                                        >
                                            {SORT_OPTIONS.map((o) => (
                                                <option key={o.v} value={o.v}>
                                                    {o.names[lang]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            onClick={onApplyClick}
                                            className={cn(
                                                'bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium shadow-sm transition hover:opacity-90',
                                                saving && 'opacity-70'
                                            )}
                                            disabled={saving}
                                        >
                                            {saving ? t.saving : t.apply}
                                        </button>
                                        <button
                                            onClick={onReset}
                                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium"
                                        >
                                            {t.reset}
                                        </button>
                                    </div>
                                </div>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>{t.quickLinks}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/design`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">✨</span>
                                                <span>{t.designStudio}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/cart`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">🛒</span>
                                                <span>{t.cart}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/checkout`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">💳</span>
                                                <span>{t.checkout}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/orders`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">📦</span>
                                                <span>{t.orders}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/account`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">👤</span>
                                                <span>{t.account}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator />

                        <SidebarGroup>
                            <SidebarGroupLabel>{t.marketing}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/(marketing)/about`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">ℹ️</span>
                                                <span>{t.about}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/(marketing)/help`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">🧭</span>
                                                <span>{t.help}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/${lang}/(marketing)/contact`}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="text-lg">✉️</span>
                                                <span>{t.contact}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="px-3 py-2">
                        <div className="text-muted-foreground flex items-center justify-between text-xs">
                            <Link href={`/${lang}/admin`} className="hover:text-foreground">
                                {t.admin}
                            </Link>
                            <span>© {new Date().getFullYear()} RealizeIt</span>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                <SidebarInset>
                    <header className="border-border bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
                        <div className="flex h-14 items-center gap-3 px-3">
                            <SidebarTrigger className="-ml-1" />
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="text-muted-foreground truncate text-sm">
                                    <span className="text-foreground font-medium">{t.catalog}</span>
                                    <span className="text-muted-foreground mx-2">/</span>
                                    <span className="truncate">{activeLabel}</span>
                                </div>
                            </div>
                            <nav className="hidden items-center gap-1 md:flex">
                                <Link
                                    href={`/${lang}/design`}
                                    className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium shadow hover:opacity-90"
                                >
                                    ✨ {t.designStudio}
                                </Link>
                                <Link
                                    href={`/${lang}/cart`}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
                                >
                                    🛒 {t.cart}
                                </Link>
                                <Link
                                    href={`/${lang}/account`}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-1.5 text-sm"
                                >
                                    👤 {t.account}
                                </Link>
                            </nav>
                        </div>
                    </header>

                    <main className="p-4 md:p-6">
                        <div className="mx-auto max-w-7xl">{children}</div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
