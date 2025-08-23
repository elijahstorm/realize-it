import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { type NextRequest, NextResponse } from 'next/server'

let headers = { 'accept-language': 'en,ko;q=0.5' }
let languages = new Negotiator({ headers }).languages()
let locales = ['en', 'ko']
let defaultLocale = 'en'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    )

    if (pathnameHasLocale) {
        const headers = new Headers(request.headers)
        headers.set('x-current-lang', pathname.split('/')[1])
        headers.set('x-current-pathname', pathname)
        return NextResponse.next({
            request: { headers: headers },
        })
    }

    const locale = match(languages, locales, defaultLocale)
    request.nextUrl.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api folder
         * - assets folder
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - site.webmanifest
         * - .well-known
         */
        '/((?!api|assets|_next|_next/image|favicon.ico|site.webmanifest|.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
