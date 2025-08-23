import { ThemeProvider } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { supabaseServer } from '@/utils/supabase/client-server'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamicParams = false

type Locale = 'en' | 'ko'

const DIR_BY_LOCALE: Record<Locale, 'ltr' | 'rtl'> = {
    en: 'ltr',
    ko: 'ltr',
}

const MESSAGES: Record<
    Locale,
    {
        brand: string
        home: string
        design: string
        products: string
        cart: string
        account: string
        signIn: string
        signUp: string
        orders: string
        admin: string
        about: string
        help: string
        contact: string
        terms: string
        privacy: string
        ipPolicy: string
        checkout: string
        settings: string
        addresses: string
        billing: string
        language: string
        english: string
        korean: string
        menu: string
        dashboard: string
    }
> = {
    en: {
        brand: 'RealizeIt',
        home: 'Home',
        design: 'Design',
        products: 'Products',
        cart: 'Cart',
        account: 'Account',
        signIn: 'Sign in',
        signUp: 'Sign up',
        orders: 'Orders',
        admin: 'Admin',
        about: 'About',
        help: 'Help',
        contact: 'Contact',
        terms: 'Terms',
        privacy: 'Privacy',
        ipPolicy: 'IP Policy',
        checkout: 'Checkout',
        settings: 'Settings',
        addresses: 'Addresses',
        billing: 'Billing',
        language: 'Language',
        english: 'English',
        korean: 'Korean',
        menu: 'Menu',
        dashboard: 'Dashboard',
    },
    ko: {
        brand: 'RealizeIt',
        home: '홈',
        design: '디자인',
        products: '제품',
        cart: '장바구니',
        account: '내 계정',
        signIn: '로그인',
        signUp: '회원가입',
        orders: '주문',
        admin: '관리자',
        about: '소개',
        help: '도움말',
        contact: '문의',
        terms: '이용약관',
        privacy: '개인정보처리방침',
        ipPolicy: 'IP 정책',
        checkout: '결제',
        settings: '설정',
        addresses: '배송지',
        billing: '결제관리',
        language: '언어',
        english: '영어',
        korean: '한국어',
        menu: '메뉴',
        dashboard: '대시보드',
    },
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

export default async function RootLayout({
    children,
}: Readonly<{
    params: Promise<{ lang: string }>
    children: React.ReactNode
}>) {
    const headerList = await headers()
    const locale = headerList.get('x-current-lang') as Locale
    const pathname = headerList.get('x-current-pathname')
    const dir = DIR_BY_LOCALE[locale]
    const t = MESSAGES[locale]

    const supabase = await supabaseServer()
    const { data } = await supabase.auth.getUser()
    const user = data?.user ?? null

    const switchPath = (target: Locale) => {
        if (!pathname) return `/${target}`
        const parts = pathname.split('/')
        if (parts.length > 1) {
            parts[1] = target
        }
        return parts.join('/') || `/${target}`
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <div lang={locale} dir={dir} className="bg-background text-foreground min-h-screen">
                <a
                    href={`/${locale}#content`}
                    className="bg-primary text-primary-foreground sr-only rounded px-3 py-2 text-sm shadow focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100]"
                >
                    Skip to content
                </a>

                <header className="border-border bg-card/80 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 border-b backdrop-blur">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-14 items-center justify-between gap-4">
                            <div className="flex items-center gap-6">
                                <Link
                                    href={`/${locale}`}
                                    className="text-foreground inline-flex items-center gap-2 font-semibold hover:opacity-90"
                                >
                                    <span className="bg-primary text-primary-foreground inline-block rounded px-2 py-1 text-xs">
                                        AI
                                    </span>
                                    <span className="text-base sm:text-lg">{t.brand}</span>
                                </Link>
                                <nav className="hidden items-center gap-1 md:flex">
                                    <Link
                                        href={`/${locale}`}
                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                        prefetch
                                    >
                                        {t.home}
                                    </Link>
                                    <Link
                                        href={`/${locale}/design`}
                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                        prefetch
                                    >
                                        {t.design}
                                    </Link>
                                    <Link
                                        href={`/${locale}/products`}
                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                        prefetch
                                    >
                                        {t.products}
                                    </Link>
                                    <Link
                                        href={`/${locale}/orders`}
                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                        prefetch
                                    >
                                        {t.orders}
                                    </Link>
                                    <Link
                                        href={`/${locale}/help`}
                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                        prefetch
                                    >
                                        {t.help}
                                    </Link>
                                </nav>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThemeToggle />
                                <div className="border-input inline-flex overflow-hidden rounded-md border">
                                    <Link
                                        href={switchPath('en')}
                                        className={`px-2 py-1.5 text-xs sm:text-sm ${locale === 'en' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    >
                                        EN
                                    </Link>
                                    <Link
                                        href={switchPath('ko')}
                                        className={`px-2 py-1.5 text-xs sm:text-sm ${locale === 'ko' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    >
                                        한국어
                                    </Link>
                                </div>
                                <Link
                                    href={`/${locale}/cart`}
                                    className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                    prefetch
                                >
                                    {t.cart}
                                </Link>
                                {user ? (
                                    <div className="hidden items-center gap-1 sm:flex">
                                        <Link
                                            href={`/${locale}/account`}
                                            className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                            prefetch
                                        >
                                            {t.account}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="hidden items-center gap-1 sm:flex">
                                        <Link
                                            href={`/${locale}/sign-in`}
                                            className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                            prefetch
                                        >
                                            {t.signIn}
                                        </Link>
                                        <Link
                                            href={`/${locale}/sign-up`}
                                            className="bg-primary text-primary-foreground rounded px-3 py-2 text-sm hover:opacity-90"
                                            prefetch
                                        >
                                            {t.signUp}
                                        </Link>
                                    </div>
                                )}
                                <details className="md:hidden">
                                    <summary className="hover:bg-muted/60 cursor-pointer list-none rounded px-2 py-1 text-sm">
                                        {t.menu}
                                    </summary>
                                    <div className="border-border bg-popover absolute right-2 mt-2 w-56 rounded-md border p-2 shadow">
                                        <nav className="flex flex-col">
                                            <Link
                                                href={`/${locale}`}
                                                className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                prefetch
                                            >
                                                {t.home}
                                            </Link>
                                            <Link
                                                href={`/${locale}/design`}
                                                className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                prefetch
                                            >
                                                {t.design}
                                            </Link>
                                            <Link
                                                href={`/${locale}/products`}
                                                className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                prefetch
                                            >
                                                {t.products}
                                            </Link>
                                            <Link
                                                href={`/${locale}/orders`}
                                                className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                prefetch
                                            >
                                                {t.orders}
                                            </Link>
                                            <Link
                                                href={`/${locale}/cart`}
                                                className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                prefetch
                                            >
                                                {t.cart}
                                            </Link>
                                            {user ? (
                                                <Link
                                                    href={`/${locale}/account`}
                                                    className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                    prefetch
                                                >
                                                    {t.account}
                                                </Link>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={`/${locale}/sign-in`}
                                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                        prefetch
                                                    >
                                                        {t.signIn}
                                                    </Link>
                                                    <Link
                                                        href={`/${locale}/sign-up`}
                                                        className="hover:bg-muted/60 rounded px-3 py-2 text-sm"
                                                        prefetch
                                                    >
                                                        {t.signUp}
                                                    </Link>
                                                </>
                                            )}
                                            <div className="flex items-center gap-2 px-3 py-2">
                                                <span className="text-muted-foreground text-xs">
                                                    {t.language}
                                                </span>
                                                <a
                                                    data-locale-switch="en"
                                                    href={`/${locale}`}
                                                    className={`rounded px-2 py-1 text-xs ${locale === 'en' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}
                                                >
                                                    EN
                                                </a>
                                                <a
                                                    data-locale-switch="ko"
                                                    href={`/${locale}`}
                                                    className={`rounded px-2 py-1 text-xs ${locale === 'ko' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'}`}
                                                >
                                                    KO
                                                </a>
                                            </div>
                                        </nav>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </header>

                <div id="content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </div>

                <footer className="border-border bg-card/40 mt-10 border-t">
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">{t.products}</h3>
                                <ul className="text-muted-foreground space-y-1 text-sm">
                                    <li>
                                        <Link
                                            href={`/${locale}/products`}
                                            className="hover:text-foreground"
                                        >
                                            {t.products}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/design`}
                                            className="hover:text-foreground"
                                        >
                                            {t.design}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/checkout`}
                                            className="hover:text-foreground"
                                        >
                                            {t.checkout}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/cart`}
                                            className="border-border hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition"
                                            aria-label="Cart"
                                        >
                                            <IconCart className="h-4 w-4" />
                                            <span className="hidden sm:inline">Cart</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">{t.account}</h3>
                                <ul className="text-muted-foreground space-y-1 text-sm">
                                    <li>
                                        <Link
                                            href={`/${locale}/account`}
                                            className="hover:text-foreground"
                                        >
                                            {t.account}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/account/orders`}
                                            className="hover:text-foreground"
                                        >
                                            {t.orders}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/account/addresses`}
                                            className="hover:text-foreground"
                                        >
                                            {t.addresses}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/account/billing`}
                                            className="hover:text-foreground"
                                        >
                                            {t.billing}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/account/settings`}
                                            className="hover:text-foreground"
                                        >
                                            {t.settings}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">{t.help}</h3>
                                <ul className="text-muted-foreground space-y-1 text-sm">
                                    <li>
                                        <Link
                                            href={`/${locale}/help`}
                                            className="hover:text-foreground"
                                        >
                                            {t.help}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/about`}
                                            className="hover:text-foreground"
                                        >
                                            {t.about}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/contact`}
                                            className="hover:text-foreground"
                                        >
                                            {t.contact}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/orders`}
                                            className="hover:text-foreground"
                                        >
                                            {t.orders}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold">{t.admin}</h3>
                                <ul className="text-muted-foreground space-y-1 text-sm">
                                    <li>
                                        <Link
                                            href={`/${locale}/admin`}
                                            className="hover:text-foreground"
                                        >
                                            {t.dashboard}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/orders`}
                                            className="hover:text-foreground"
                                        >
                                            {t.orders}
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/products-mapping`}
                                            className="hover:text-foreground"
                                        >
                                            Products Mapping
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/logs`}
                                            className="hover:text-foreground"
                                        >
                                            Logs
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/costs`}
                                            className="hover:text-foreground"
                                        >
                                            Costs
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/health`}
                                            className="hover:text-foreground"
                                        >
                                            Health
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/retries`}
                                            className="hover:text-foreground"
                                        >
                                            Retries
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={`/${locale}/admin/analytics`}
                                            className="hover:text-foreground"
                                        >
                                            Analytics
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="text-muted-foreground mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                            <Link href={`/${locale}/legal/terms`} className="hover:text-foreground">
                                {t.terms}
                            </Link>
                            <Link
                                href={`/${locale}/legal/privacy`}
                                className="hover:text-foreground"
                            >
                                {t.privacy}
                            </Link>
                            <Link
                                href={`/${locale}/legal/ip-policy`}
                                className="hover:text-foreground"
                            >
                                {t.ipPolicy}
                            </Link>
                            <span className="ml-auto">© {new Date().getFullYear()} RealizeIt</span>
                        </div>
                    </div>
                </footer>

                <script
                    // Sets language switcher links to the same path in the alternate locale on the client
                    dangerouslySetInnerHTML={{
                        __html: `(() => { try { const anchors = document.querySelectorAll('a[data-locale-switch]'); anchors.forEach((a) => { const target = a.getAttribute('data-locale-switch'); if (!target) return; const path = location.pathname; const replaced = path.replace(/^\/(en|ko)(?=\/|$)/, '/' + target); const ensured = /^\/(en|ko)(\/|$)/.test(path) ? replaced : '/' + target + (path.startsWith('/') ? '' : '/') + path; a.setAttribute('href', ensured + location.search + location.hash); }); } catch (e) { /* noop */ } })();`,
                    }}
                />
            </div>
        </ThemeProvider>
    )
}
