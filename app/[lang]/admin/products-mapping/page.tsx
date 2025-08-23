'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/components/ui/use-toast'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

const TABLE = 'product_mappings'

type VariantMapItem = { label: string; variantId: string }

type ProductMapping = {
    id: string
    internal_product_type: string
    printify_store_id: string | null
    printify_product_id: string | null
    default_color: string | null
    default_size: string | null
    enabled: boolean
    variant_mappings: VariantMapItem[] | Record<string, any> | null
    created_at: string | null
    updated_at: string | null
}

function parseVariantMappings(input: any): VariantMapItem[] {
    if (!input) return []
    try {
        if (Array.isArray(input)) {
            return input
                .map((x: any) => ({
                    label: String(x.label ?? x.key ?? x.name ?? ''),
                    variantId: String(x.variantId ?? x.variant_id ?? x.id ?? ''),
                }))
                .filter((x: VariantMapItem) => x.label && x.variantId)
        }
        if (typeof input === 'object') {
            return Object.entries(input)
                .map(([k, v]) => ({
                    label: String(k),
                    variantId: String((v as any)?.variantId ?? (v as any)?.variant_id ?? v),
                }))
                .filter((x) => x.label && x.variantId)
        }
    } catch {}
    return []
}

function stringifyVariantMappings(items: VariantMapItem[]): string {
    try {
        return JSON.stringify(items, null, 2)
    } catch {
        return '[]'
    }
}

function humanTime(ts?: string | null) {
    if (!ts) return '—'
    try {
        const d = new Date(ts)
        return d.toLocaleString()
    } catch {
        return ts ?? '—'
    }
}

const INTERNAL_TYPES = [
    't-shirt',
    'hoodie',
    'socks',
    'mug',
    'canvas',
    'blanket',
    'phone case',
    'tote',
    'stickers',
    'journal',
]

export default function AdminProductsMappingPage({ params }: { params: { lang: string } }) {
    const { lang } = params
    const router = useRouter()
    const supabase = useMemo(() => supabaseBrowser, [])
    const { toast } = useToast()

    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [mappings, setMappings] = useState<ProductMapping[]>([])
    const [search, setSearch] = useState<string>('')

    const [editingId, setEditingId] = useState<string | null>(null)
    const [formOpen, setFormOpen] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)

    const [f_type, setFType] = useState<string>('')
    const [f_typeCustom, setFTypeCustom] = useState<string>('')
    const [f_store, setFStore] = useState<string>('')
    const [f_product, setFProduct] = useState<string>('')
    const [f_defaultColor, setFDefaultColor] = useState<string>('')
    const [f_defaultSize, setFDefaultSize] = useState<string>('')
    const [f_enabled, setFEnabled] = useState<boolean>(true)
    const [f_variantItems, setFVariantItems] = useState<VariantMapItem[]>([])
    const [jsonOpen, setJsonOpen] = useState<boolean>(false)
    const [jsonText, setJsonText] = useState<string>('[]')

    const filtered = useMemo(() => {
        if (!search) return mappings
        const q = search.toLowerCase()
        return mappings.filter((m) =>
            [
                m.internal_product_type,
                m.printify_product_id ?? '',
                m.printify_store_id ?? '',
                m.default_color ?? '',
                m.default_size ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(q)
        )
    }, [mappings, search])

    useEffect(() => {
        let mounted = true
        ;(async () => {
            setLoading(true)
            setError(null)
            const { data, error } = await supabase
                .from(TABLE)
                .select('*')
                .order('internal_product_type', { ascending: true })
            if (!mounted) return
            if (error) {
                setError(error.message)
                setMappings([])
            } else {
                setMappings(
                    (data ?? []).map((row) => ({
                        ...row,
                        variant_mappings: parseVariantMappings(row.variant_mappings),
                    })) as ProductMapping[]
                )
            }
            setLoading(false)
        })()
        return () => {
            mounted = false
        }
    }, [supabase])

    function resetForm() {
        setEditingId(null)
        setFType('')
        setFTypeCustom('')
        setFStore('')
        setFProduct('')
        setFDefaultColor('')
        setFDefaultSize('')
        setFEnabled(true)
        setFVariantItems([])
        setJsonText('[]')
    }

    function openCreate() {
        resetForm()
        setFormOpen(true)
    }

    function openEdit(row: ProductMapping) {
        setEditingId(row.id)
        setFType(
            INTERNAL_TYPES.includes(row.internal_product_type)
                ? row.internal_product_type
                : '__custom__'
        )
        setFTypeCustom(
            INTERNAL_TYPES.includes(row.internal_product_type) ? '' : row.internal_product_type
        )
        setFStore(row.printify_store_id ?? '')
        setFProduct(row.printify_product_id ?? '')
        setFDefaultColor(row.default_color ?? '')
        setFDefaultSize(row.default_size ?? '')
        const items = parseVariantMappings(row.variant_mappings)
        setFVariantItems(items)
        setJsonText(stringifyVariantMappings(items))
        setFEnabled(Boolean(row.enabled))
        setFormOpen(true)
    }

    function applyJsonToItems() {
        try {
            const parsed = JSON.parse(jsonText)
            const items = parseVariantMappings(parsed)
            setFVariantItems(items)
            toast({
                title: 'Variant mappings loaded from JSON',
                description: `${items.length} items parsed.`,
            })
        } catch (e: any) {
            toast({
                title: 'Invalid JSON',
                description: e?.message ?? 'Could not parse JSON.',
                variant: 'destructive' as any,
            })
        }
    }

    function syncItemsToJson() {
        setJsonText(stringifyVariantMappings(f_variantItems))
    }

    function addVariantRow() {
        setFVariantItems((prev) => [...prev, { label: '', variantId: '' }])
    }

    function removeVariantRow(idx: number) {
        setFVariantItems((prev) => prev.filter((_, i) => i !== idx))
    }

    async function saveMapping(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const internalType = f_type === '__custom__' ? f_typeCustom.trim() : f_type
        if (!internalType) {
            toast({
                title: 'Missing product type',
                description: 'Select or enter an internal product type.',
                variant: 'destructive' as any,
            })
            setSaving(false)
            return
        }
        const payload: any = {
            internal_product_type: internalType,
            printify_store_id: f_store || null,
            printify_product_id: f_product || null,
            default_color: f_defaultColor || null,
            default_size: f_defaultSize || null,
            enabled: f_enabled,
            variant_mappings: f_variantItems.filter((i) => i.label && i.variantId),
        }

        if (editingId) {
            const { data, error } = await supabase
                .from(TABLE)
                .update(payload)
                .eq('id', editingId)
                .select()
                .maybeSingle()
            setSaving(false)
            if (error) {
                toast({
                    title: 'Update failed',
                    description: error.message,
                    variant: 'destructive' as any,
                })
                return
            }
            if (data) {
                setMappings((prev) =>
                    prev.map((m) =>
                        m.id === editingId
                            ? {
                                  ...data,
                                  variant_mappings: parseVariantMappings(
                                      (data as any).variant_mappings
                                  ),
                              }
                            : m
                    )
                )
                toast({ title: 'Mapping updated', description: `${internalType} saved.` })
                setFormOpen(false)
                resetForm()
            }
        } else {
            const { data, error } = await supabase
                .from(TABLE)
                .insert(payload)
                .select()
                .maybeSingle()
            setSaving(false)
            if (error) {
                toast({
                    title: 'Create failed',
                    description: error.message,
                    variant: 'destructive' as any,
                })
                return
            }
            if (data) {
                setMappings((prev) => [
                    {
                        ...data,
                        variant_mappings: parseVariantMappings((data as any).variant_mappings),
                    },
                    ...prev,
                ])
                toast({ title: 'Mapping created', description: `${internalType} added.` })
                setFormOpen(false)
                resetForm()
            }
        }
    }

    async function deleteMapping(row: ProductMapping) {
        const ok = window.confirm(
            `Delete mapping for "${row.internal_product_type}"? This cannot be undone.`
        )
        if (!ok) return
        const prev = mappings
        setMappings((m) => m.filter((x) => x.id !== row.id))
        const { error } = await supabase.from(TABLE).delete().eq('id', row.id)
        if (error) {
            setMappings(prev)
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive' as any,
            })
        } else {
            toast({ title: 'Mapping deleted', description: row.internal_product_type })
        }
    }

    async function toggleEnabled(row: ProductMapping) {
        const { data, error } = await supabase
            .from(TABLE)
            .update({ enabled: !row.enabled })
            .eq('id', row.id)
            .select()
            .maybeSingle()
        if (error) {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive' as any,
            })
            return
        }
        if (data) {
            setMappings((prev) =>
                prev.map((m) =>
                    m.id === row.id
                        ? {
                              ...data,
                              variant_mappings: parseVariantMappings(
                                  (data as any).variant_mappings
                              ),
                          }
                        : m
                )
            )
            toast({
                title: !row.enabled ? 'Enabled' : 'Disabled',
                description: row.internal_product_type,
            })
        }
    }

    async function refresh() {
        setLoading(true)
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('internal_product_type', { ascending: true })
        if (error) {
            setError(error.message)
            setMappings([])
        } else {
            setError(null)
            setMappings(
                (data ?? []).map((row) => ({
                    ...row,
                    variant_mappings: parseVariantMappings(row.variant_mappings),
                })) as ProductMapping[]
            )
        }
        setLoading(false)
    }

    const adminBase = `/${lang}/admin`

    return (
        <div className="bg-background text-foreground min-h-[calc(100svh-4rem)] w-full">
            <Toaster />
            <header className="border-border bg-card/70 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30 border-b backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${lang}`}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Home
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <Link
                            href={`${adminBase}`}
                            className="text-muted-foreground hover:text-foreground text-sm"
                        >
                            Admin
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm font-medium">Products Mapping</span>
                    </div>
                    <nav className="flex items-center gap-2">
                        <Link
                            href={`${adminBase}/orders`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm"
                        >
                            Orders
                        </Link>
                        <Link
                            href={`${adminBase}/products-mapping`}
                            className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm hover:opacity-90"
                        >
                            Mappings
                        </Link>
                        <Link
                            href={`${adminBase}/logs`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm"
                        >
                            Logs
                        </Link>
                        <Link
                            href={`${adminBase}/health`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm"
                        >
                            Health
                        </Link>
                        <Link
                            href={`${adminBase}/analytics`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm"
                        >
                            Analytics
                        </Link>
                        <Link
                            href={`${adminBase}/costs`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm"
                        >
                            Costs
                        </Link>
                        <Link
                            href={`${adminBase}/retries`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm"
                        >
                            Retries
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Product to Printify Mapping
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Map internal product types to Printify templates and variant IDs for
                            automated fulfillment.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/${lang}/products`}
                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                        >
                            Browse Products
                        </Link>
                        <Link
                            href={`/${lang}/design`}
                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                        >
                            Start a Design
                        </Link>
                        <button
                            onClick={openCreate}
                            className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm hover:opacity-90"
                        >
                            New Mapping
                        </button>
                        <button
                            onClick={refresh}
                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <Alert className="mb-6">
                    <AlertTitle>Printify integration</AlertTitle>
                    <AlertDescription>
                        Ensure your Printify store and product template IDs are correct. View{' '}
                        <Link href={`${adminBase}/health`} className="underline underline-offset-4">
                            API Health
                        </Link>{' '}
                        to verify connectivity. See{' '}
                        <Link
                            href={`${adminBase}/logs?source=printify-templates`}
                            className="underline underline-offset-4"
                        >
                            Template Fetch Logs
                        </Link>{' '}
                        for recent syncs.
                    </AlertDescription>
                </Alert>

                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-input bg-background flex w-full max-w-xl items-center gap-2 rounded-md border px-3 py-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-muted-foreground h-4 w-4"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10.5 3.75a6.75 6.75 0 104.29 11.96l4.25 4.25a.75.75 0 101.06-1.06l-4.25-4.25A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <input
                            placeholder="Search by type, product ID, store ID, color, size"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
                        />
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Link href={`/${lang}/(marketing)/help`} className="hover:underline">
                            Help
                        </Link>
                        <span>•</span>
                        <Link
                            href={`/${lang}/(marketing)/legal/ip-policy`}
                            className="hover:underline"
                        >
                            IP Policy
                        </Link>
                        <span>•</span>
                        <Link href={`/${lang}/(marketing)/about`} className="hover:underline">
                            About
                        </Link>
                        <span>•</span>
                        <Link href={`/${lang}/orders`} className="hover:underline">
                            User Orders
                        </Link>
                    </div>
                </div>

                <div className="border-border bg-card overflow-hidden rounded-lg border">
                    <Table className="w-full">
                        <TableCaption>
                            Mappings power automatic Printify order creation after checkout.
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Internal Type</TableHead>
                                <TableHead>Printify Store</TableHead>
                                <TableHead>Template/Product ID</TableHead>
                                <TableHead>Defaults</TableHead>
                                <TableHead>Variants</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`sk-${i}`}>
                                            <TableCell>
                                                <Skeleton className="h-4 w-28" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-36" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-20" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-24" />
                                            </TableCell>
                                            <TableCell>
                                                <Skeleton className="h-4 w-28" />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Skeleton className="ml-auto h-8 w-28" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </>
                            )}
                            {!loading && error && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="border-destructive/30 bg-destructive/10 text-destructive-foreground flex items-center justify-between rounded-md border p-4">
                                            <div>
                                                <div className="font-medium">
                                                    Failed to load mappings
                                                </div>
                                                <div className="text-sm opacity-90">{error}</div>
                                            </div>
                                            <button
                                                onClick={refresh}
                                                className="bg-destructive text-destructive-foreground/90 rounded-md px-3 py-1.5 text-sm hover:opacity-90"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && !error && filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                                            <div className="text-muted-foreground text-sm">
                                                No mappings found.
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={openCreate}
                                                    className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm hover:opacity-90"
                                                >
                                                    Create mapping
                                                </button>
                                                <button
                                                    onClick={refresh}
                                                    className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                                                >
                                                    Refresh
                                                </button>
                                                <Link
                                                    href={`${adminBase}/logs?source=printify-templates`}
                                                    className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                                                >
                                                    View Logs
                                                </Link>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading &&
                                !error &&
                                filtered.map((row) => {
                                    const variants = parseVariantMappings(row.variant_mappings)
                                    return (
                                        <TableRow
                                            key={row.id}
                                            className={!row.enabled ? 'opacity-60' : ''}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs">
                                                        {row.internal_product_type}
                                                    </span>
                                                    {!row.enabled && (
                                                        <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs">
                                                            disabled
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{row.printify_store_id ?? '—'}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.printify_product_id ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-muted-foreground text-xs">
                                                    {row.default_color ?? '—'} /{' '}
                                                    {row.default_size ?? '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-muted-foreground text-xs">
                                                    {variants.length} mapped
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {humanTime(row.updated_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleEnabled(row)}
                                                        className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-2 py-1 text-xs"
                                                    >
                                                        {row.enabled ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(row)}
                                                        className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-2 py-1 text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMapping(row)}
                                                        className="bg-destructive text-destructive-foreground rounded-md px-2 py-1 text-xs hover:opacity-90"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link
                        href={`${adminBase}/logs`}
                        className="group border-border bg-card hover:bg-accent rounded-lg border p-4"
                    >
                        <div className="group-hover:text-accent-foreground mb-1 text-sm font-medium">
                            View Integration Logs
                        </div>
                        <div className="text-muted-foreground text-xs">
                            Template fetches, order submissions, and image generation audit trail.
                        </div>
                    </Link>
                    <Link
                        href={`${adminBase}/health`}
                        className="group border-border bg-card hover:bg-accent rounded-lg border p-4"
                    >
                        <div className="group-hover:text-accent-foreground mb-1 text-sm font-medium">
                            Check API Health
                        </div>
                        <div className="text-muted-foreground text-xs">
                            Printify, Stripe, Solar Pro2, and storage connectivity.
                        </div>
                    </Link>
                </div>

                <Separator className="my-8" />

                {formOpen && (
                    <div className="border-border bg-card mx-auto max-w-4xl rounded-xl border p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingId ? 'Edit Mapping' : 'Create Mapping'}
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Define how an internal product maps to a Printify template and
                                    variants.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`${adminBase}/logs?source=printify-templates`}
                                    className="text-primary text-sm underline-offset-4 hover:underline"
                                >
                                    View Template Logs
                                </Link>
                                <button
                                    onClick={() => {
                                        setFormOpen(false)
                                        resetForm()
                                    }}
                                    className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={saveMapping}
                            className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                            <div className="col-span-1">
                                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                    Internal Product Type
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={f_type}
                                        onChange={(e) => setFType(e.target.value)}
                                        className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                    >
                                        <option value="">Select type…</option>
                                        {INTERNAL_TYPES.map((t) => (
                                            <option value={t} key={t}>
                                                {t}
                                            </option>
                                        ))}
                                        <option value="__custom__">Custom…</option>
                                    </select>
                                </div>
                                {f_type === '__custom__' && (
                                    <input
                                        value={f_typeCustom}
                                        onChange={(e) => setFTypeCustom(e.target.value)}
                                        placeholder="Enter custom type"
                                        className="border-input bg-background focus:ring-ring mt-2 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                    />
                                )}
                            </div>

                            <div className="col-span-1">
                                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                    Enabled
                                </label>
                                <div className="border-input bg-background flex h-10 items-center gap-2 rounded-md border px-3">
                                    <input
                                        id="enabled"
                                        type="checkbox"
                                        checked={f_enabled}
                                        onChange={(e) => setFEnabled(e.target.checked)}
                                    />
                                    <label htmlFor="enabled" className="cursor-pointer text-sm">
                                        Active for auto-submission
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                    Printify Store ID
                                </label>
                                <input
                                    value={f_store}
                                    onChange={(e) => setFStore(e.target.value)}
                                    placeholder="e.g. 1234567"
                                    className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Find in Printify &gt; Manage Stores. Required for submissions.
                                </p>
                            </div>

                            <div>
                                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                    Printify Template/Product ID
                                </label>
                                <input
                                    value={f_product}
                                    onChange={(e) => setFProduct(e.target.value)}
                                    placeholder="e.g. 6543210"
                                    className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                                <div className="text-muted-foreground mt-1 text-xs">
                                    Don’t know it? Check{' '}
                                    <Link
                                        href={`${adminBase}/logs?source=printify-templates`}
                                        className="underline underline-offset-2"
                                    >
                                        Template Logs
                                    </Link>{' '}
                                    or{' '}
                                    <Link
                                        href={`${adminBase}/health`}
                                        className="underline underline-offset-2"
                                    >
                                        API Health
                                    </Link>
                                    .
                                </div>
                            </div>

                            <div>
                                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                    Default Color
                                </label>
                                <input
                                    value={f_defaultColor}
                                    onChange={(e) => setFDefaultColor(e.target.value)}
                                    placeholder="e.g. Black"
                                    className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                    Default Size
                                </label>
                                <input
                                    value={f_defaultSize}
                                    onChange={(e) => setFDefaultSize(e.target.value)}
                                    placeholder="e.g. L"
                                    className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-muted-foreground text-xs font-medium">
                                        Variant Mappings
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={addVariantRow}
                                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-2 py-1 text-xs"
                                        >
                                            Add Row
                                        </button>
                                        <button
                                            type="button"
                                            onClick={syncItemsToJson}
                                            className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-2 py-1 text-xs"
                                        >
                                            Sync to JSON
                                        </button>
                                    </div>
                                </div>
                                <div className="border-border overflow-hidden rounded-md border">
                                    <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 px-3 py-2 text-xs">
                                        <div className="col-span-5">Label (e.g. Black / L)</div>
                                        <div className="col-span-5">Variant ID</div>
                                        <div className="col-span-2 text-right">Actions</div>
                                    </div>
                                    <div className="divide-border divide-y">
                                        {f_variantItems.length === 0 && (
                                            <div className="text-muted-foreground px-3 py-3 text-sm">
                                                No variants mapped. Add rows or import JSON.
                                            </div>
                                        )}
                                        {f_variantItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-12 items-center gap-2 px-3 py-2"
                                            >
                                                <div className="col-span-5">
                                                    <input
                                                        value={item.label}
                                                        onChange={(e) =>
                                                            setFVariantItems((prev) =>
                                                                prev.map((it, i) =>
                                                                    i === idx
                                                                        ? {
                                                                              ...it,
                                                                              label: e.target.value,
                                                                          }
                                                                        : it
                                                                )
                                                            )
                                                        }
                                                        placeholder="Color / Size"
                                                        className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="col-span-5">
                                                    <input
                                                        value={item.variantId}
                                                        onChange={(e) =>
                                                            setFVariantItems((prev) =>
                                                                prev.map((it, i) =>
                                                                    i === idx
                                                                        ? {
                                                                              ...it,
                                                                              variantId:
                                                                                  e.target.value,
                                                                          }
                                                                        : it
                                                                )
                                                            )
                                                        }
                                                        placeholder="Printify Variant ID"
                                                        className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariantRow(idx)}
                                                        className="bg-destructive text-destructive-foreground rounded-md px-2 py-1 text-xs hover:opacity-90"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="text-muted-foreground text-xs">
                                            Import/Export JSON
                                        </div>
                                        <CollapsibleTrigger asChild>
                                            <button
                                                type="button"
                                                className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-2 py-1 text-xs"
                                            >
                                                {jsonOpen ? 'Hide JSON' : 'Show JSON'}
                                            </button>
                                        </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent>
                                        <div className="border-border bg-background mt-2 rounded-md border p-2">
                                            <textarea
                                                value={jsonText}
                                                onChange={(e) => setJsonText(e.target.value)}
                                                rows={8}
                                                className="border-input bg-background focus:ring-ring h-40 w-full resize-y rounded-md border p-3 font-mono text-xs focus:ring-2 focus:outline-none"
                                            />
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={applyJsonToItems}
                                                    className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs hover:opacity-90"
                                                >
                                                    Load from JSON
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={syncItemsToJson}
                                                    className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-1.5 text-xs"
                                                >
                                                    Update JSON
                                                </button>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>

                            <div className="mt-4 flex items-center justify-between md:col-span-2">
                                <div className="text-muted-foreground text-xs">
                                    After saving, test a flow via{' '}
                                    <Link
                                        href={`/${lang}/design`}
                                        className="underline underline-offset-2"
                                    >
                                        Design
                                    </Link>{' '}
                                    →{' '}
                                    <Link
                                        href={`/${lang}/checkout`}
                                        className="underline underline-offset-2"
                                    >
                                        Checkout
                                    </Link>
                                    . Monitor{' '}
                                    <Link
                                        href={`${adminBase}/orders`}
                                        className="underline underline-offset-2"
                                    >
                                        Admin Orders
                                    </Link>{' '}
                                    and{' '}
                                    <Link
                                        href={`${adminBase}/logs`}
                                        className="underline underline-offset-2"
                                    >
                                        Logs
                                    </Link>
                                    .
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormOpen(false)
                                            resetForm()
                                        }}
                                        className="border-border hover:bg-accent hover:text-accent-foreground rounded-md border px-3 py-2 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={saving}
                                        type="submit"
                                        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {saving
                                            ? 'Saving…'
                                            : editingId
                                              ? 'Save Changes'
                                              : 'Create Mapping'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Link
                        href={`${adminBase}`}
                        className="border-border bg-card hover:bg-accent rounded-lg border p-4"
                    >
                        <div className="text-sm font-medium">Admin Home</div>
                        <div className="text-muted-foreground text-xs">
                            Overview and quick links
                        </div>
                    </Link>
                    <Link
                        href={`/${lang}/account/settings`}
                        className="border-border bg-card hover:bg-accent rounded-lg border p-4"
                    >
                        <div className="text-sm font-medium">Account Settings</div>
                        <div className="text-muted-foreground text-xs">
                            Manage admin preferences
                        </div>
                    </Link>
                    <Link
                        href={`/${lang}/(marketing)/contact`}
                        className="border-border bg-card hover:bg-accent rounded-lg border p-4"
                    >
                        <div className="text-sm font-medium">Contact</div>
                        <div className="text-muted-foreground text-xs">
                            Need help? Reach out to us
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    )
}
