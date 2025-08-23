'use client'

import { Separator } from '@/components/ui/separator'
import {
    SidebarProvider,
    Sidebar,
    SidebarTrigger,
    SidebarRail,
    SidebarHeader,
    SidebarFooter,
    SidebarSeparator,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import { cn } from '@/utils/utils'
import Link from 'next/link'
import { usePathname, useRouter, useParams } from 'next/navigation'
import React, { useMemo } from 'react'

type AdminLayoutProps = {
    children: React.ReactNode
}

function useAuthAdminGate(lang: string, pathname: string) {
    const router = useRouter()
    const supabase = React.useMemo(() => supabaseBrowser, [])
    const [status, setStatus] = React.useState<'loading' | 'unauth' | 'forbidden' | 'ok'>('loading')

    React.useEffect(() => {
        let mounted = true

        const check = async () => {
            try {
                const { data, error } = await supabase.auth.getUser()
                if (!mounted) return
                if (error) {
                    setStatus('unauth')
                    router.replace(
                        `/${lang}/(auth)/sign-in?redirect=${encodeURIComponent(pathname)}`
                    )
                    return
                }
                const user = data.user
                if (!user) {
                    setStatus('unauth')
                    router.replace(
                        `/${lang}/(auth)/sign-in?redirect=${encodeURIComponent(pathname)}`
                    )
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin, is_merchant, display_name, language, locale, phone')
                    .eq('user_id', user.id)
                    .single()

                const isAdmin = profile?.is_admin

                if (!isAdmin) {
                    setStatus('forbidden')
                    return
                }

                setStatus('ok')
            } catch {
                if (!mounted) return
                setStatus('unauth')
                router.replace(`/${lang}/(auth)/sign-in?redirect=${encodeURIComponent(pathname)}`)
            }
        }

        check()

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                setStatus('unauth')
                router.replace(`/${lang}/(auth)/sign-in?redirect=${encodeURIComponent(pathname)}`)
            }
        })

        return () => {
            mounted = false
            try {
                listener?.subscription?.unsubscribe?.()
            } catch {}
        }
    }, [supabase, router, lang, pathname])

    const signOut = React.useCallback(async () => {
        try {
            await supabase.auth.signOut()
        } finally {
            router.replace(`/${lang}`)
        }
    }, [router, supabase, lang])

    return { status, signOut } as const
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname()
    const params = useParams()
    const lang = (Array.isArray(params?.lang) ? params?.lang[0] : params?.lang || 'en') as string

    const { status, signOut } = useAuthAdminGate(lang, pathname)

    const adminBase = `/${lang}/admin`

    const navItems = useMemo(
        () => [
            { key: 'dashboard', label: 'Dashboard', href: `${adminBase}` },
            { key: 'orders', label: 'Orders', href: `${adminBase}/orders` },
            {
                key: 'products-mapping',
                label: 'Product Mappings',
                href: `${adminBase}/products-mapping`,
            },
            { key: 'logs', label: 'Logs', href: `${adminBase}/logs` },
            { key: 'costs', label: 'Costs', href: `${adminBase}/costs` },
            { key: 'health', label: 'Health', href: `${adminBase}/health` },
            { key: 'retries', label: 'Retries', href: `${adminBase}/retries` },
            { key: 'analytics', label: 'Analytics', href: `${adminBase}/analytics` },
        ],
        [adminBase]
    )

    const storefrontQuickLinks = [
        { label: 'Home', href: `/${lang}` },
        { label: 'Products', href: `/${lang}/products` },
        { label: 'Design', href: `/${lang}/design` },
        { label: 'Cart', href: `/${lang}/cart` },
        { label: 'Checkout', href: `/${lang}/checkout` },
        { label: 'Orders', href: `/${lang}/orders` },
        { label: 'Account', href: `/${lang}/account` },
        { label: 'Help', href: `/${lang}/(marketing)/help` },
    ]

    const currentLabel = React.useMemo(() => {
        const matched = navItems
            .slice()
            .sort((a, b) => b.href.length - a.href.length)
            .find((n) =>
                n.href === `${adminBase}` ? pathname === n.href : pathname.startsWith(n.href)
            )
        return matched?.label || 'Admin'
    }, [navItems, pathname, adminBase])

    const isActive = (href: string) =>
        href === `${adminBase}` ? pathname === href : pathname.startsWith(href)

    if (status === 'loading') {
        return (
            <div className="bg-background grid min-h-svh place-items-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="border-muted-foreground h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />
                    <p className="text-muted-foreground text-sm">Checking admin access…</p>
                    <div className="text-muted-foreground flex gap-3 text-xs">
                        <Link
                            className="hover:text-foreground underline underline-offset-4"
                            href={`/${lang}`}
                        >
                            Go to Storefront
                        </Link>
                        <span>•</span>
                        <Link
                            className="hover:text-foreground underline underline-offset-4"
                            href={`/${lang}/(auth)/sign-in`}
                        >
                            Sign in
                        </Link>
                        <span>•</span>
                        <Link
                            className="hover:text-foreground underline underline-offset-4"
                            href={`/${lang}/(marketing)/help`}
                        >
                            Help
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (status === 'forbidden') {
        return (
            <div className="bg-background grid min-h-svh place-items-center p-6">
                <div className="bg-card w-full max-w-md rounded-xl border p-6 shadow-sm">
                    <div className="mb-3 text-lg font-semibold">Access denied</div>
                    <p className="text-muted-foreground text-sm">
                        Your account does not have admin permissions. If you believe this is an
                        error, please contact support.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/${lang}`}
                            className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm font-medium hover:opacity-90"
                        >
                            Return to Storefront
                        </Link>
                        <Link
                            href={`/${lang}/account`}
                            className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
                        >
                            Go to Account
                        </Link>
                        <Link
                            href={`/${lang}/(marketing)/contact`}
                            className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium"
                        >
                            Contact Support
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // unauth state will have triggered redirect already

    return (
        <SidebarProvider defaultOpen>
            <Sidebar
                side="left"
                variant="sidebar"
                collapsible="offcanvas"
                className="bg-sidebar text-sidebar-foreground"
            >
                <SidebarHeader className="px-3 py-2">
                    <Link
                        href={`/${lang}`}
                        className="group hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5"
                    >
                        <span className="bg-primary text-primary-foreground inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold">
                            RZ
                        </span>
                        <span className="font-semibold">RealizeIt Admin</span>
                    </Link>
                    <SidebarSeparator className="my-2" />
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton asChild isActive={isActive(item.href)}>
                                            <Link href={item.href}>{item.label}</Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup className="mt-2">
                        <SidebarGroupLabel>Storefront</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/${lang}`}>Home</Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/${lang}/products`}>Products</Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/${lang}/design`}>Design</Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild size="sm">
                                                <Link href={`/${lang}/cart`}>Cart</Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild size="sm">
                                                <Link href={`/${lang}/checkout`}>Checkout</Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/${lang}/orders`}>Orders</Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link href={`/${lang}/account`}>Account</Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild size="sm">
                                                <Link href={`/${lang}/account/orders`}>
                                                    My Orders
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton asChild size="sm">
                                                <Link href={`/${lang}/account/settings`}>
                                                    Settings
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <div className="text-muted-foreground px-3 py-2 text-xs">
                        <div className="mb-2">Quick links</div>
                        <div className="grid grid-cols-2 gap-1">
                            {storefrontQuickLinks.map((l) => (
                                <Link
                                    key={l.href}
                                    className="hover:text-foreground truncate"
                                    href={l.href}
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-3">
                            <button
                                onClick={signOut}
                                className="text-foreground hover:bg-accent hover:text-accent-foreground w-full rounded-md border px-3 py-1.5 text-left"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>

            <div className="bg-background ml-[230px] flex min-h-svh flex-1 flex-col">
                <header className="bg-background/80 sticky top-0 z-40 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <nav className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Link href={`/${lang}`} className="hover:text-foreground">
                            Storefront
                        </Link>
                        <span>/</span>
                        <Link
                            href={adminBase}
                            className={cn(
                                'hover:text-foreground',
                                pathname === adminBase && 'text-foreground font-medium'
                            )}
                        >
                            Admin
                        </Link>
                        {pathname !== adminBase && (
                            <>
                                <span>/</span>
                                <span className="text-foreground font-medium">{currentLabel}</span>
                            </>
                        )}
                    </nav>
                    <div className="ml-auto flex items-center gap-2">
                        <ThemeToggle />

                        <Link
                            href={`/${lang}/(marketing)/help`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            Help
                        </Link>
                        <Link
                            href={`/${lang}/(marketing)/about`}
                            className="hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1 text-sm"
                        >
                            About
                        </Link>
                        <button
                            onClick={signOut}
                            className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm hover:opacity-90"
                        >
                            Sign out
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-4">{children}</main>

                <footer className="bg-muted/30 text-muted-foreground border-t p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/${lang}/(marketing)/legal/terms`}
                                className="hover:text-foreground"
                            >
                                Terms
                            </Link>
                            <span>•</span>
                            <Link
                                href={`/${lang}/(marketing)/legal/privacy`}
                                className="hover:text-foreground"
                            >
                                Privacy
                            </Link>
                            <span>•</span>
                            <Link
                                href={`/${lang}/(marketing)/legal/ip-policy`}
                                className="hover:text-foreground"
                            >
                                IP Policy
                            </Link>
                        </div>
                        <div>
                            <Link
                                href={`/${lang}/(marketing)/contact`}
                                className="hover:text-foreground"
                            >
                                Contact
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </SidebarProvider>
    )
}
