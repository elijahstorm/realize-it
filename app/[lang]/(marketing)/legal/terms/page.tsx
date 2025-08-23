import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Metadata } from 'next'
import Link from 'next/link'

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
    const title = 'Terms of Service | RealizeIt'
    const description =
        "Read RealizeIt's Terms of Service covering AI-generated designs, pricing, payments, order processing, shipping, returns, IP, and dispute resolution."
    const url = `/${params.lang}/legal/terms`
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    }
}

export default function TermsPage({ params }: { params: { lang: string } }) {
    const { lang } = params
    const p = (path: string) => `/${lang}${path}`
    const lastUpdated = '2025-08-01'

    const Section = ({
        id,
        title,
        children,
    }: {
        id: string
        title: string
        children: React.ReactNode
    }) => (
        <section
            id={id}
            className="border-border bg-card text-card-foreground rounded-lg border shadow-sm"
        >
            <Collapsible defaultOpen>
                <CollapsibleTrigger className="w-full">
                    <div className="flex w-full items-center justify-between gap-4 rounded-t-lg p-4 sm:p-5">
                        <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
                        <span
                            aria-hidden
                            className="bg-muted text-muted-foreground inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </span>
                    </div>
                </CollapsibleTrigger>
                <Separator className="mx-4 sm:mx-5" />
                <CollapsibleContent>
                    <div className="space-y-4 p-4 text-sm leading-relaxed sm:space-y-5 sm:p-5">
                        {children}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </section>
    )

    return (
        <main className="bg-background min-h-screen">
            <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
                <nav className="text-muted-foreground mb-6 text-sm">
                    <ol className="flex flex-wrap items-center gap-2">
                        <li>
                            <Link href={`/${lang}`} className="hover:text-foreground">
                                Home
                            </Link>
                        </li>
                        <li aria-hidden>/</li>
                        <li>
                            <Link href={p('/help')} className="hover:text-foreground">
                                Help
                            </Link>
                        </li>
                        <li aria-hidden>/</li>
                        <li className="text-foreground">Terms of Service</li>
                    </ol>
                </nav>

                <header className="from-primary/10 via-primary/5 ring-border mb-8 rounded-xl bg-gradient-to-br to-transparent p-6 ring-1 ring-inset">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Terms of Service
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                These terms govern your use of RealizeIt. By checking the consent
                                box during checkout, you agree to these Terms, our{' '}
                                <Link
                                    href={p('/legal/privacy')}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Privacy Policy
                                </Link>
                                , and our{' '}
                                <Link
                                    href={p('/legal/ip-policy')}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    IP Policy
                                </Link>
                                .
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Last updated: {lastUpdated}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={p('/checkout')}
                                className="bg-primary text-primary-foreground focus:ring-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus:ring-2 focus:outline-none"
                            >
                                Continue to Checkout
                            </Link>
                            <Link
                                href={p('/help')}
                                className="border-input bg-background text-foreground hover:bg-muted focus:ring-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none"
                            >
                                Visit Help Center
                            </Link>
                        </div>
                    </div>
                </header>

                <Alert className="mb-8">
                    <AlertTitle>Consent reminder</AlertTitle>
                    <AlertDescription>
                        By proceeding with payment at{' '}
                        <Link href={p('/checkout')} className="underline underline-offset-4">
                            checkout
                        </Link>
                        , you agree to these terms, including automatic order submission to Printify
                        after successful Stripe payment, AI-only design generation (no manual
                        uploads), and our handling of shipping to South Korea. See{' '}
                        <Link href={p('/legal/privacy')} className="underline underline-offset-4">
                            Privacy
                        </Link>{' '}
                        and
                        <Link
                            href={p('/legal/ip-policy')}
                            className="ml-1 underline underline-offset-4"
                        >
                            IP Policy
                        </Link>{' '}
                        for details.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
                    <aside className="border-border bg-card text-muted-foreground top-24 h-max rounded-lg border p-4 text-sm lg:sticky">
                        <p className="text-foreground mb-3 font-semibold">On this page</p>
                        <ul className="space-y-2">
                            {[
                                { id: 'overview', label: '1. Overview & Acceptance' },
                                { id: 'service', label: '2. Service Description' },
                                { id: 'accounts', label: '3. Eligibility & Accounts' },
                                { id: 'pricing', label: '4. Pricing, Taxes & Payments' },
                                { id: 'ai-ip', label: '5. AI Content & IP' },
                                { id: 'prohibited', label: '6. Prohibited Uses' },
                                { id: 'orders', label: '7. Orders & Fulfillment' },
                                { id: 'returns', label: '8. Cancellations & Returns' },
                                { id: 'shipping', label: '9. Shipping & Risk of Loss' },
                                { id: 'warranty', label: '10. Warranties & Disclaimers' },
                                { id: 'liability', label: '11. Limitation of Liability' },
                                { id: 'disputes', label: '12. Dispute Resolution' },
                                { id: 'changes', label: '13. Changes to Terms' },
                                { id: 'contact', label: '14. Contact' },
                            ].map((s) => (
                                <li key={s.id}>
                                    <a
                                        className="hover:bg-muted hover:text-foreground block rounded px-2 py-1"
                                        href={`#${s.id}`}
                                    >
                                        {s.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <Separator className="my-4" />
                        <div className="space-y-2">
                            <p className="text-foreground font-semibold">Quick links</p>
                            <ul className="space-y-1">
                                <li>
                                    <Link href={p('/products')} className="hover:text-foreground">
                                        Browse products
                                    </Link>
                                </li>
                                <li>
                                    <Link href={p('/design')} className="hover:text-foreground">
                                        Start a design
                                    </Link>
                                </li>
                                <li>
                                    <Link href={p('/cart')} className="hover:text-foreground">
                                        View cart
                                    </Link>
                                </li>
                                <li>
                                    <Link href={p('/orders')} className="hover:text-foreground">
                                        Order history
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={p('/account/settings')}
                                        className="hover:text-foreground"
                                    >
                                        Account settings
                                    </Link>
                                </li>
                                <li>
                                    <Link href={p('/admin')} className="hover:text-foreground">
                                        Admin dashboard
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        <Section id="overview" title="1. Overview & Acceptance">
                            <p>
                                Welcome to RealizeIt. We provide a service that turns your
                                natural-language prompts into print-ready designs and physical
                                products fulfilled via third-party partners. By accessing or using
                                our website or services, including any checkout flow at{' '}
                                <Link
                                    href={p('/checkout')}
                                    className="underline underline-offset-4"
                                >
                                    /checkout
                                </Link>
                                , you agree to be bound by these Terms of Service
                                (&quot;Terms&quot;).
                            </p>
                            <p>
                                You also agree to our{' '}
                                <Link
                                    href={p('/legal/privacy')}
                                    className="underline underline-offset-4"
                                >
                                    Privacy Policy
                                </Link>{' '}
                                and
                                <Link
                                    href={p('/legal/ip-policy')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    IP Policy
                                </Link>
                                . If you do not agree, do not use the service. These Terms are
                                effective for both English and Korean language experiences available
                                under <code className="bg-muted rounded px-1 py-0.5">/{lang}</code>{' '}
                                routes.
                            </p>
                        </Section>

                        <Section id="service" title="2. Service Description">
                            <p>
                                RealizeIt enables you to generate design concepts with AI, review
                                variations, select product options (e.g., size, color, variant),
                                complete payment via Stripe, and have your product manufactured and
                                shipped by Printify and its network of print providers.
                            </p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>
                                    AI-only pipeline: We do not accept manual artwork uploads. All
                                    production assets are generated and prepared by our system.
                                    Begin at{' '}
                                    <Link
                                        href={p('/design')}
                                        className="underline underline-offset-4"
                                    >
                                        Start a design
                                    </Link>
                                    .
                                </li>
                                <li>
                                    Variations & approval: You will be presented with multiple
                                    design options to approve before proceeding to
                                    <Link
                                        href={p('/checkout')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        Checkout
                                    </Link>
                                    .
                                </li>
                                <li>
                                    Fulfillment: Orders are placed automatically with Printify after
                                    successful Stripe payment. Tracking updates are surfaced in
                                    <Link
                                        href={p('/orders')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        Order history
                                    </Link>{' '}
                                    and via email.
                                </li>
                            </ul>
                        </Section>

                        <Section id="accounts" title="3. Eligibility & Accounts">
                            <p>
                                You must be at least the age of majority in your jurisdiction to
                                purchase. You are responsible for maintaining the security of your
                                account, credentials, and shipping defaults. Manage your profile in
                                <Link
                                    href={p('/account/settings')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Account settings
                                </Link>{' '}
                                and addresses in
                                <Link
                                    href={p('/account/addresses')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Addresses
                                </Link>
                                .
                            </p>
                            <p>
                                Merchants or sellers granted admin access must use the admin tools
                                responsibly; see
                                <Link
                                    href={p('/admin')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Admin dashboard
                                </Link>
                                .
                            </p>
                        </Section>

                        <Section id="pricing" title="4. Pricing, Taxes & Payments (Stripe)">
                            <p>
                                Prices for products are based on Printify cost plus a default 20%
                                retail markup unless otherwise displayed. Taxes, duties, and
                                shipping are estimated at checkout and may vary based on
                                destination. You authorize Stripe to charge your selected payment
                                method for the total amount.
                            </p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>
                                    Price breakdowns: View cost, margin, and estimates in your cart
                                    and at
                                    <Link
                                        href={p('/checkout')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        Checkout
                                    </Link>
                                    .
                                </li>
                                <li>
                                    Receipts: Stripe will issue a receipt; you can also view payment
                                    details under
                                    <Link
                                        href={p('/account/billing')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        Billing
                                    </Link>
                                    .
                                </li>
                                <li>
                                    Currency & conversions: Charges may appear in local or USD
                                    depending on configuration and bank conversion rules.
                                </li>
                            </ul>
                        </Section>

                        <Section id="ai-ip" title="5. AI-Generated Content, Ownership & IP Policy">
                            <p>
                                Designs are generated by AI (Solar Pro2 assisted orchestration) and
                                post-processed to meet print requirements. By using the service, you
                                acknowledge that AI-generated outputs may be similar to other
                                outputs, public content, or style references.
                            </p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>
                                    License to fulfill: You grant us and our partners a license to
                                    use the generated assets solely to create and deliver your
                                    products.
                                </li>
                                <li>
                                    No unlawful content: You may not request content that infringes
                                    third-party rights or violates applicable laws. See our
                                    <Link
                                        href={p('/legal/ip-policy')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        IP Policy
                                    </Link>
                                    .
                                </li>
                                <li>
                                    Publicity: We may display anonymized or watermarked mockups for
                                    portfolio or promotional purposes unless you opt out in
                                    <Link
                                        href={p('/account/settings')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        Settings
                                    </Link>
                                    .
                                </li>
                            </ul>
                        </Section>

                        <Section id="prohibited" title="6. Prohibited Uses">
                            <p>
                                Do not use the service to create or distribute content that is
                                illegal, hateful, harassing, pornographic, violent, self-harm
                                encouraging, or otherwise harmful.
                            </p>
                            <p>
                                You also agree not to attempt to bypass technical limitations,
                                scrape the service, or interfere with operations. We may suspend or
                                terminate access for violations.
                            </p>
                        </Section>

                        <Section
                            id="orders"
                            title="7. Orders, Automatic Submission & Fulfillment (Printify)"
                        >
                            <p>
                                After a successful Stripe payment, your order is submitted
                                automatically to Printify using the product mappings and production
                                assets generated by our pipeline. Order creation typically begins
                                immediately and may not be cancelable once production starts.
                            </p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>
                                    Status & tracking: Track your order under
                                    <Link
                                        href={p('/orders')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        Orders
                                    </Link>
                                    . Shipping emails will include tracking when available.
                                </li>
                                <li>
                                    South Korea launch: We target fulfillment and delivery to South
                                    Korea. Customs, duties, or delays may apply per carrier
                                    policies.
                                </li>
                                <li>
                                    Provider network: Printify may route production to different
                                    print providers to optimize speed/quality.
                                </li>
                            </ul>
                        </Section>

                        <Section id="returns" title="8. Cancellations, Returns & Refunds">
                            <p>
                                Because products are made-to-order, cancellations are limited. If
                                your order has not entered production, contact us immediately via
                                <Link
                                    href={p('/contact')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Contact
                                </Link>
                                . Once production begins, cancellations may not be possible.
                            </p>
                            <ul className="list-inside list-disc space-y-1">
                                <li>
                                    Damaged or incorrect items: Report within 14 days of delivery
                                    with photos. We will work with Printify to replace or refund as
                                    appropriate.
                                </li>
                                <li>
                                    Buyer’s remorse or size issues: As on-demand goods, returns for
                                    preference-based reasons are generally not accepted. Check size
                                    charts on
                                    <Link
                                        href={p('/products')}
                                        className="ml-1 underline underline-offset-4"
                                    >
                                        product pages
                                    </Link>{' '}
                                    before ordering.
                                </li>
                                <li>
                                    Refund method: Approved refunds are issued to the original
                                    payment method via Stripe.
                                </li>
                            </ul>
                        </Section>

                        <Section id="shipping" title="9. Shipping, Customs & Risk of Loss">
                            <p>
                                Shipping timelines shown during checkout are estimates. Risk of loss
                                transfers upon carrier acceptance. You are responsible for providing
                                an accurate delivery address under{' '}
                                <Link
                                    href={p('/account/addresses')}
                                    className="underline underline-offset-4"
                                >
                                    Addresses
                                </Link>
                                .
                            </p>
                            <p>
                                International shipments may incur duties or taxes collected on
                                delivery. Carrier delays or customs holds are outside our control.
                            </p>
                        </Section>

                        <Section id="warranty" title="10. Warranties & Disclaimers">
                            <p>
                                The service is provided “as is” and “as available.” We disclaim all
                                warranties to the fullest extent permitted by law, including implied
                                warranties of merchantability, fitness for a particular purpose, and
                                non-infringement. We do not guarantee uninterrupted access,
                                error-free operation, or specific creative outcomes.
                            </p>
                        </Section>

                        <Section id="liability" title="11. Limitation of Liability">
                            <p>
                                To the maximum extent permitted by law, RealizeIt and its partners
                                will not be liable for indirect, incidental, special, consequential,
                                or punitive damages, or for lost profits, revenues, data, or
                                goodwill. Our aggregate liability for claims arising out of or
                                relating to the service will not exceed the amount you paid for the
                                order giving rise to the claim.
                            </p>
                        </Section>

                        <Section id="disputes" title="12. Dispute Resolution & Governing Law">
                            <p>
                                These Terms are governed by applicable laws of the operating
                                entity’s jurisdiction, without regard to conflict-of-law principles.
                                Where local consumer laws apply (e.g., in South Korea), you retain
                                any mandatory rights under those laws. Before filing a formal claim,
                                please contact support via
                                <Link
                                    href={p('/help')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Help
                                </Link>{' '}
                                so we can try to resolve the issue.
                            </p>
                            <p>
                                Any dispute not resolved informally shall be handled in the courts
                                or arbitration forum of the governing jurisdiction, unless local
                                mandatory law provides otherwise.
                            </p>
                        </Section>

                        <Section id="changes" title="13. Changes to Terms">
                            <p>
                                We may update these Terms to reflect changes to our services,
                                partners, or legal requirements. When we make material changes, we
                                will update the “Last updated” date and, where appropriate, provide
                                notice in-app or via email. Your continued use after changes
                                constitutes acceptance.
                            </p>
                        </Section>

                        <Section id="contact" title="14. Contact">
                            <p>
                                Need help? Visit our{' '}
                                <Link href={p('/help')} className="underline underline-offset-4">
                                    Help Center
                                </Link>{' '}
                                or reach out via
                                <Link
                                    href={p('/contact')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Contact
                                </Link>
                                .
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Link
                                    href={p('/checkout')}
                                    className="bg-primary text-primary-foreground focus:ring-ring inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow hover:opacity-95 focus:ring-2 focus:outline-none"
                                >
                                    Back to Checkout
                                </Link>
                                <Link
                                    href={p('/orders')}
                                    className="border-input bg-background text-foreground hover:bg-muted focus:ring-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:ring-2 focus:outline-none"
                                >
                                    View My Orders
                                </Link>
                            </div>
                        </Section>

                        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-4 text-xs">
                            <p>
                                By using RealizeIt, you also consent to operational webhooks and
                                notifications related to your orders, including those from Stripe
                                and Printify. You can manage notification preferences in
                                <Link
                                    href={p('/account/settings')}
                                    className="ml-1 underline underline-offset-4"
                                >
                                    Settings
                                </Link>
                                .
                            </p>
                        </div>

                        <div className="bg-muted/30 text-muted-foreground flex items-center justify-between rounded-lg p-4 text-xs">
                            <span>Last updated: {lastUpdated}</span>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={p('/legal/privacy')}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    Privacy Policy
                                </Link>
                                <span aria-hidden>•</span>
                                <Link
                                    href={p('/legal/ip-policy')}
                                    className="hover:text-foreground underline underline-offset-4"
                                >
                                    IP Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
