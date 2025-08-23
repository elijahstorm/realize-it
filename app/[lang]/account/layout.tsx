'use client'

import { Separator } from '@/components/ui/separator'
import {
    SidebarProvider,
    Sidebar,
    SidebarTrigger,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    SidebarInput,
    useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { supabaseBrowser } from '@/utils/supabase/client-browser'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import * as React from 'react'

function IconHome(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 10v10h14V10" />
        </svg>
    )
}
function IconUser(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 6-6 8-6s6.5 2 8 6" />
        </svg>
    )
}
function IconMapPin(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
            <circle cx="12" cy="10" r="2.5" />
        </svg>
    )
}
function IconOrders(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M15 3v4h4" />
            <path d="M8 9h8M8 13h8M8 17h6" />
        </svg>
    )
}
function IconBilling(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18" />
        </svg>
    )
}
function IconSettings(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.07a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.07a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.02 3.4l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.07a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .67.39 1.28 1 1.51H21a2 2 0 1 1 0 4h-.07c-.62.23-1 .84-1 1.49z" />
        </svg>
    )
}
function IconCart(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <circle cx="9" cy="20" r="1.75" />
            <circle cx="17" cy="20" r="1.75" />
            <path d="M3 3h2l2 12h11l2-8H7" />
        </svg>
    )
}
function IconArrowLeft(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <path d="M15 18l-6-6 6-6" />
        </svg>
    )
}
function IconHelp(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
            {...props}
        >
            <path d="M9 9a3 3 0 1 1 5.2 2.1C13.4 12 13 12.5 13 14" />
            <path d="M12 18h.01" />
            <circle cx="12" cy="12" r="10" />
        </svg>
    )
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen>
            <InsideSidebar>{children}</InsideSidebar>
        </SidebarProvider>
    )
}

function InsideSidebar({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const { lang } = useParams<{ lang: string }>()
    const [loading, setLoading] = React.useState(true)
    const [userEmail, setUserEmail] = React.useState<string | null>(null)

    React.useEffect(() => {
        let isMounted = true
        const init = async () => {
            try {
                const supabase = supabaseBrowser
                const { data } = await supabase.auth.getSession()
                const session = data?.session
                if (!isMounted) return
                if (!session) {
                    const next = encodeURIComponent(`/${lang}/account`)
                    router.replace(`/${lang}/sign-in?next=${next}`)
                    return
                }
                setUserEmail(session.user.email ?? null)
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        init()
        return () => {
            isMounted = false
        }
    }, [router, lang])

    const isActive = React.useCallback(
        (href: string) => pathname === href || pathname.startsWith(`${href}/`),
        [pathname]
    )

    const navItems = React.useMemo(
        () => [
            { key: 'profile', label: 'Profile', href: `/${lang}/account`, icon: IconUser },
            {
                key: 'addresses',
                label: 'Addresses',
                href: `/${lang}/account/addresses`,
                icon: IconMapPin,
            },
            { key: 'orders', label: 'Orders', href: `/${lang}/account/orders`, icon: IconOrders },
            {
                key: 'billing',
                label: 'Billing',
                href: `/${lang}/account/billing`,
                icon: IconBilling,
            },
            {
                key: 'settings',
                label: 'Settings',
                href: `/${lang}/account/settings`,
                icon: IconSettings,
            },
        ],
        [lang]
    )

    const quickLinks = React.useMemo(
        () => [
            { label: 'Home', href: `/${lang}`, icon: IconHome },
            { label: 'Products', href: `/${lang}/products`, icon: IconHome },
            { label: 'Design', href: `/${lang}/design`, icon: IconSettings },
            { label: 'Cart', href: `/${lang}/cart`, icon: IconCart },
            { label: 'Help', href: `/${lang}//help`, icon: IconHelp },
            { label: 'All Orders', href: `/${lang}/orders`, icon: IconOrders },
        ],
        [lang]
    )

    const signOut = async () => {
        const supabase = supabaseBrowser
        await supabase.auth.signOut()
        router.replace(`/${lang}`)
    }

    const currentSectionLabel = React.useMemo(() => {
        const match = navItems.find((n) => isActive(n.href))
        return match?.label ?? 'Account'
    }, [navItems, isActive])

    const sidebar = useSidebar()

    if (loading) {
        return (
            <div className="bg-background text-foreground min-h-[60vh]">
                <div className="container mx-auto p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <Skeleton className="h-8 w-40" />
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <div className="space-y-3 md:col-span-1">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-3/4" />
                        </div>
                        <div className="space-y-4 md:col-span-3">
                            <Skeleton className="h-10 w-1/3" />
                            <Skeleton className="h-[400px] w-full" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="bg-background text-foreground">
                <Sidebar
                    side="left"
                    variant="inset"
                    collapsible="offcanvas"
                    className="border-border border-r"
                >
                    <SidebarHeader className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/${lang}`}
                                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
                            >
                                <IconArrowLeft className="h-4 w-4" />
                                <span>Back to Home</span>
                            </Link>
                        </div>
                        <div className="mt-4">
                            <SidebarInput placeholder="Search account" className="bg-input" />
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupLabel>Account</SidebarGroupLabel>
                            <SidebarMenu>
                                {navItems.map((item) => (
                                    <SidebarMenuItem key={item.key}>
                                        <SidebarMenuButton asChild isActive={isActive(item.href)}>
                                            <Link
                                                href={item.href}
                                                aria-current={
                                                    isActive(item.href) ? 'page' : undefined
                                                }
                                                className="flex items-center gap-3"
                                            >
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                        <SidebarSeparator />
                        <SidebarGroup>
                            <SidebarGroupLabel>Quick links</SidebarGroupLabel>
                            <SidebarMenu>
                                {quickLinks.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={isActive(item.href)}>
                                            <Link
                                                href={item.href}
                                                className="flex items-center gap-3"
                                            >
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter className="px-4 py-3">
                        <div className="text-muted-foreground truncate text-xs">
                            {userEmail ?? 'Signed in'}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <Link
                                href={`/${lang}//legal/terms`}
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                Terms
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href={`/${lang}//legal/privacy`}
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                Privacy
                            </Link>
                            <span className="text-muted-foreground">•</span>
                            <Link
                                href={`/${lang}//legal/ip-policy`}
                                className="text-muted-foreground hover:text-foreground text-xs"
                            >
                                IP Policy
                            </Link>
                        </div>
                        <button
                            onClick={signOut}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-3 inline-flex items-center justify-center rounded-md px-3 py-2 text-sm transition"
                        >
                            Sign out
                        </button>
                    </SidebarFooter>
                </Sidebar>

                <div
                    className={`transition-[ml] ${sidebar.open && !sidebar.isMobile ? 'ml-[231px]' : ''}`}
                >
                    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-border sticky top-0 z-20 border-b backdrop-blur">
                        <div className="flex h-14 items-center gap-3 px-4">
                            <SidebarTrigger className="border-border rounded-md border" />
                            <Separator orientation="vertical" className="mx-2 h-6" />
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <Link href={`/${lang}`} className="hover:text-foreground">
                                    Home
                                </Link>
                                <span>/</span>
                                <Link href={`/${lang}/account`} className="hover:text-foreground">
                                    Account
                                </Link>
                                <span>/</span>
                                <span className="text-foreground font-medium">
                                    {currentSectionLabel}
                                </span>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <Link
                                    href={`/${lang}/cart`}
                                    className="border-border hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition"
                                    aria-label="Cart"
                                >
                                    <IconCart className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cart</span>
                                </Link>
                            </div>
                        </div>
                    </header>
                    <main className="px-4 pt-6 pb-8">
                        <div className="mx-auto w-full max-w-6xl">{children}</div>
                    </main>
                </div>
            </div>
        </>
    )
}
