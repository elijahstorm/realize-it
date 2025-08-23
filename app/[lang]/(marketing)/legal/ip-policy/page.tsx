'use client'

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { useState } from 'react'

type Props = { params: { lang: string } }

function pathFor(lang: string, p: string) {
    return `/${lang}${p}`
}

function Section({
    id,
    title,
    children,
    defaultOpen = false,
}: {
    id: string
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState<boolean>(defaultOpen)
    return (
        <section id={id} className="bg-card text-card-foreground rounded-lg border">
            <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger asChild>
                    <button
                        className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-t-lg px-4 py-3 text-left font-semibold md:px-6 md:py-4"
                        aria-expanded={open}
                        aria-controls={`${id}-content`}
                    >
                        <span className="text-base md:text-lg">{title}</span>
                        <span className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-md border text-sm">
                            {open ? '−' : '+'}
                        </span>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent forceMount>
                    <div id={`${id}-content`} className="space-y-3 px-4 py-4 md:px-6 md:py-5">
                        {children}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </section>
    )
}

export default function Page({ params: { lang } }: Props) {
    const links = {
        design: pathFor(lang, '/design'),
        checkout: pathFor(lang, '/checkout'),
        terms: pathFor(lang, '/legal/terms'),
        privacy: pathFor(lang, '/legal/privacy'),
        help: pathFor(lang, '/help'),
        contact: pathFor(lang, '/contact'),
        home: `/${lang}`,
        products: pathFor(lang, '/products'),
        orders: pathFor(lang, '/account/orders'),
        track: pathFor(lang, '/orders'),
        cart: pathFor(lang, '/cart'),
    }

    const sections = [
        { id: 'overview', label: 'Overview' },
        { id: 'ownership', label: 'Ownership of AI-Generated Designs' },
        { id: 'usage-license', label: 'Usage License & Rights' },
        { id: 'prohibited', label: 'Prohibited Content & Restrictions' },
        { id: 'ai-ethics', label: 'AI Sources, Ethics & Limitations' },
        { id: 'printify', label: 'Printify Production & Third-Party Rights' },
        { id: 'customer-consent', label: 'Customer Consent & Checkout' },
        { id: 'dmca', label: 'Takedown & Dispute Process (DMCA/Notice)' },
        { id: 'refunds', label: 'Refunds, Cancellations & Order Disruption' },
        { id: 'data', label: 'Data, Storage & Retention' },
        { id: 'jurisdiction', label: 'Jurisdiction & Regional Compliance (KR/EN)' },
        { id: 'updates', label: 'Changes to this Policy' },
        { id: 'contact', label: 'Contact Us' },
    ]

    return (
        <div className="bg-background text-foreground min-h-screen">
            <div className="from-primary/10 border-b bg-gradient-to-b to-transparent">
                <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
                    <nav className="text-muted-foreground mb-3 text-sm">
                        <Link href={links.home} className="hover:text-foreground">
                            Home
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-foreground">AI & IP Policy</span>
                    </nav>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                        AI & Intellectual Property Policy
                    </h1>
                    <p className="text-muted-foreground mt-3 max-w-3xl">
                        How we generate, license, and protect designs created by AI for your
                        physical products. This policy applies to all designs created via our AI
                        design flow and to orders placed through our checkout.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                            href={links.design}
                            className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 hover:opacity-90"
                        >
                            Start a new design
                        </Link>
                        <Link
                            href={links.checkout}
                            className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2"
                        >
                            Continue to checkout
                        </Link>
                        <Link
                            href={links.products}
                            className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2"
                        >
                            Browse products
                        </Link>
                    </div>
                </div>
            </div>

            <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 md:py-10 lg:grid-cols-12">
                <aside className="order-last lg:order-first lg:col-span-3">
                    <div className="sticky top-4 space-y-4">
                        <div className="bg-card rounded-lg border p-4">
                            <h2 className="mb-3 font-semibold">On this page</h2>
                            <nav className="space-y-2 text-sm">
                                {sections.map((s) => (
                                    <a
                                        key={s.id}
                                        href={`#${s.id}`}
                                        className="text-muted-foreground hover:text-foreground block"
                                    >
                                        {s.label}
                                    </a>
                                ))}
                            </nav>
                        </div>
                        <div className="bg-card rounded-lg border p-4">
                            <h2 className="mb-3 font-semibold">Quick links</h2>
                            <div className="flex flex-col gap-2 text-sm">
                                <Link href={links.design} className="hover:underline">
                                    Design a product
                                </Link>
                                <Link href={links.cart} className="hover:underline">
                                    View cart
                                </Link>
                                <Link href={links.checkout} className="hover:underline">
                                    Checkout
                                </Link>
                                <Link href={links.orders} className="hover:underline">
                                    Your orders
                                </Link>
                                <Link href={links.track} className="hover:underline">
                                    Order tracking
                                </Link>
                                <Link href={links.help} className="hover:underline">
                                    Help Center
                                </Link>
                                <Link href={links.contact} className="hover:underline">
                                    Contact support
                                </Link>
                                <Separator className="my-2" />
                                <Link href={links.terms} className="hover:underline">
                                    Terms of Service
                                </Link>
                                <Link href={links.privacy} className="hover:underline">
                                    Privacy Policy
                                </Link>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="space-y-6 lg:col-span-9">
                    <Alert className="border-primary/30 bg-primary/10">
                        <AlertTitle>Policy summary</AlertTitle>
                        <AlertDescription>
                            Designs generated through our AI flow are created automatically using
                            prompts you provide. By approving a design or completing checkout, you
                            confirm you have the right to request the design content and that you
                            grant us the rights necessary to produce and fulfill your order. See
                            details below and in our
                            <Link href={links.terms} className="mx-1 underline">
                                Terms
                            </Link>{' '}
                            and
                            <Link href={links.privacy} className="ml-1 underline">
                                Privacy
                            </Link>
                            .
                        </AlertDescription>
                    </Alert>

                    <div className="text-muted-foreground text-sm">Last updated: 2025-01-15</div>

                    <Section id="overview" title="Overview" defaultOpen>
                        <p>
                            RealizeIt converts natural language prompts into print-ready designs
                            using AI services (including Solar Pro2 for reasoning and selected image
                            generation APIs). We automatically create print files and submit orders
                            to Printify for fulfillment after successful payment via Stripe. This
                            policy explains how intellectual property is handled for AI-generated
                            content and the rights you grant to us to produce your goods.
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                You must ensure your prompt does not request content that infringes
                                on third-party rights or violates any applicable laws or platform
                                rules.
                            </li>
                            <li>
                                You receive a personal, non-transferable license to use purchased
                                designs on the physical products you order through our service.
                            </li>
                            <li>
                                We retain limited rights necessary to process, reproduce, and store
                                the design and order assets.
                            </li>
                            <li>
                                Certain content is prohibited. We may reject, cancel, or remove
                                designs at our discretion. See
                                <a href="#prohibited" className="ml-1 underline">
                                    Prohibited Content
                                </a>
                                .
                            </li>
                        </ul>
                        <div className="mt-3 flex gap-3">
                            <Link
                                href={links.design}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 hover:opacity-90"
                            >
                                Create a design
                            </Link>
                            <Link
                                href={links.checkout}
                                className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2"
                            >
                                Proceed to checkout
                            </Link>
                        </div>
                    </Section>

                    <Section id="ownership" title="Ownership of AI-Generated Designs" defaultOpen>
                        <p>
                            For designs produced exclusively through our AI pipeline based on your
                            prompt, we grant you a personal license to use the resulting artwork on
                            products purchased via RealizeIt. Unless otherwise stated, RealizeIt or
                            its licensors retain all other rights in the generated assets,
                            templates, and derivative manufacturing files.
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                You may use purchased products commercially (e.g., resell the
                                physical items). However, you may not redistribute, resell, or
                                publicly release the raw design files, mockups, or production assets
                                unless we explicitly permit it in writing.
                            </li>
                            <li>
                                If your prompt includes any text, slogans, or references you do not
                                own or do not have rights to use, you are solely responsible for any
                                resulting claims.
                            </li>
                        </ul>
                    </Section>

                    <Section id="usage-license" title="Usage License & Rights">
                        <p>
                            By using our service, you grant RealizeIt a worldwide, royalty-free
                            license to host, store, reproduce, and transmit the design and related
                            assets solely for: generating variations, preparing print files,
                            submitting and managing orders with Printify, providing customer
                            support, fraud prevention, and maintaining backups.
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                We may generate and store multiple versions/variations as part of
                                quality checks and reprints.
                            </li>
                            <li>
                                We may display low-resolution previews of your approved design to
                                you in your
                                <Link href={links.orders} className="ml-1 underline">
                                    order history
                                </Link>
                                .
                            </li>
                            <li>
                                We do not use your designs for advertising without your consent.
                                Some anonymized analytics are collected. See our{' '}
                                <Link href={links.privacy} className="underline">
                                    Privacy Policy
                                </Link>
                                .
                            </li>
                        </ul>
                    </Section>

                    <Section id="prohibited" title="Prohibited Content & Restrictions">
                        <p>
                            You may not request, upload, or otherwise generate content that
                            infringes on third-party intellectual property or violates applicable
                            law. This includes, without limitation:
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                Copyrighted characters, logos, or brand marks without permission
                            </li>
                            <li>Celebrity likeness or name without rights of publicity</li>
                            <li>
                                Hate speech, harassment, illegal activity, or explicit content
                                involving minors
                            </li>
                            <li>Content that violates Printify or payment processor policies</li>
                        </ul>
                        <p className="mt-2">
                            We reserve the right to reject, cancel, or remove any design or order at
                            our discretion. For more details, review our{' '}
                            <Link href={links.terms} className="underline">
                                Terms
                            </Link>{' '}
                            and visit
                            <Link href={links.help} className="ml-1 underline">
                                Help
                            </Link>
                            .
                        </p>
                    </Section>

                    <Section id="ai-ethics" title="AI Sources, Ethics & Limitations">
                        <p>
                            Our system uses Solar Pro2 for reasoning/orchestration and selected
                            generative image APIs for artwork. While we employ filters and quality
                            checks, AI outputs may be imperfect or similar to other outputs. No
                            guarantee is made regarding uniqueness or exclusivity of any generated
                            design.
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                We may iterate prompts and produce multiple images to achieve
                                print-ready quality.
                            </li>
                            <li>
                                We composite images server-side to meet Printify specifications
                                (size, DPI, placement).
                            </li>
                            <li>
                                If generation fails, we may retry or broaden prompts within safe and
                                compliant bounds.
                            </li>
                        </ul>
                    </Section>

                    <Section id="printify" title="Printify Production & Third-Party Rights">
                        <p>
                            Orders are produced and fulfilled via Printify and its print partners.
                            By approving a design and completing payment, you authorize us to submit
                            the necessary assets and your shipping details to Printify to produce
                            your order. Production quality and timelines may vary by partner.
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                Pricing includes a default 20% retail markup over Printify costs
                                unless stated otherwise at checkout.
                            </li>
                            <li>
                                Some color/variant availability depends on Printify providers and
                                may change without notice.
                            </li>
                            <li>
                                We will surface tracking links when provided. See
                                <Link href={links.track} className="ml-1 underline">
                                    Order tracking
                                </Link>
                                .
                            </li>
                        </ul>
                    </Section>

                    <Section id="customer-consent" title="Customer Consent & Checkout">
                        <p>
                            During design approval and checkout, you must confirm you have the
                            rights to request the content and that you accept this AI/IP Policy.
                            This consent is recorded with your order. Refusal to consent will
                            prevent order submission.
                        </p>
                        <div className="mt-2 flex gap-3">
                            <Link
                                href={links.design}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 hover:opacity-90"
                            >
                                Review design approvals
                            </Link>
                            <Link
                                href={links.checkout}
                                className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2"
                            >
                                Go to checkout
                            </Link>
                        </div>
                    </Section>

                    <Section id="dmca" title="Takedown & Dispute Process (DMCA/Notice)">
                        <p>
                            If you believe a design infringes your rights, please send a detailed
                            notice including the allegedly infringing content, evidence of rights
                            ownership, and your contact information. We may disable previews,
                            suspend fulfillment, or cancel orders where appropriate while we assess
                            the claim.
                        </p>
                        <p className="mt-1">
                            Rights holders can reach us via{' '}
                            <Link href={links.contact} className="underline">
                                Contact
                            </Link>
                            . We will make commercially reasonable efforts to respond promptly and,
                            if necessary, remove or disable access to the disputed material.
                        </p>
                    </Section>

                    <Section id="refunds" title="Refunds, Cancellations & Order Disruption">
                        <p>
                            Because products are custom-made, cancellations or refunds are limited
                            once production begins. We will assist with reprints or replacements for
                            manufacturing defects or shipping issues consistent with our providers’
                            policies.
                        </p>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>
                                If payment succeeds but Printify submission fails, we will retry or
                                issue a refund if we cannot fulfill.
                            </li>
                            <li>
                                Color/size substitutions may be offered if a variant becomes
                                unavailable before production starts.
                            </li>
                            <li>
                                For assistance, visit{' '}
                                <Link href={links.help} className="underline">
                                    Help
                                </Link>{' '}
                                or
                                <Link href={links.orders} className="ml-1 underline">
                                    your orders
                                </Link>
                                .
                            </li>
                        </ul>
                    </Section>

                    <Section id="data" title="Data, Storage & Retention">
                        <p>
                            We store design prompts, generated images, mockups, and print assets in
                            secure storage for order processing, support, and quality control. We
                            retain necessary records to comply with payment, tax, and logistics
                            requirements. You may request deletion of certain data where legally
                            permissible.
                        </p>
                        <p>
                            See our{' '}
                            <Link href={links.privacy} className="underline">
                                Privacy Policy
                            </Link>{' '}
                            for details on data retention periods, analytics, and user rights.
                        </p>
                    </Section>

                    <Section id="jurisdiction" title="Jurisdiction & Regional Compliance (KR/EN)">
                        <p>
                            This service initially supports English and Korean. We endeavor to
                            provide localized notices and support for South Korea. In the event of
                            any conflict between translations, the English version governs unless
                            otherwise required by local law.
                        </p>
                        <p>
                            You are responsible for ensuring your prompts comply with local
                            regulations, including restrictions related to IP, defamation, and
                            cultural or regulatory content standards.
                        </p>
                    </Section>

                    <Section id="updates" title="Changes to this Policy">
                        <p>
                            We may update this policy to reflect changes in our services,
                            third-party partners (e.g., Printify, Stripe), or applicable law.
                            Material changes will be noted on this page with a new effective date.
                            Continued use of the service after an update constitutes acceptance of
                            the revised policy.
                        </p>
                    </Section>

                    <Section id="contact" title="Contact Us">
                        <p>
                            Questions or concerns about AI/IP usage? We’re here to help. Visit our
                            <Link href={links.help} className="ml-1 underline">
                                Help Center
                            </Link>{' '}
                            or
                            <Link href={links.contact} className="ml-1 underline">
                                Contact
                            </Link>
                            .
                        </p>
                        <div className="mt-3 flex gap-3">
                            <Link
                                href={links.design}
                                className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-4 py-2 hover:opacity-90"
                            >
                                Start designing
                            </Link>
                            <Link
                                href={links.orders}
                                className="hover:bg-accent hover:text-accent-foreground inline-flex items-center rounded-md border px-4 py-2"
                            >
                                View your orders
                            </Link>
                        </div>
                    </Section>

                    <div className="flex items-center justify-between pt-4">
                        <Link href="#" className="text-sm underline">
                            Back to top
                        </Link>
                        <div className="flex gap-3 text-sm">
                            <Link href={links.terms} className="underline">
                                Terms
                            </Link>
                            <Link href={links.privacy} className="underline">
                                Privacy
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
