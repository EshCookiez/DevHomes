import SiteHeader from '../../components/layout/SiteHeader'
import SiteFooter from '../../components/layout/SiteFooter'
import { getSiteSettings } from '../../lib/site-settings'
import LoginForm from '../../components/auth/LoginForm'
import { getCurrentDashboardUser } from '@/lib/auth/user'
import { redirect } from 'next/navigation'

function getLoginNotice(notice: string | string[] | undefined) {
    const value = Array.isArray(notice) ? notice[0] : notice

    if (value === 'approval-pending') {
        return 'After you verify your email, an admin must approve your account before dashboard access is enabled.'
    }

    return null
}

export default async function LoginPage(props: {
    searchParams?: Promise<{ notice?: string | string[] }>
}) {
    const searchParams = (await props.searchParams) ?? {}
    const notice = getLoginNotice(searchParams.notice)
    const currentUser = await getCurrentDashboardUser()
    if (currentUser) {
        redirect(`/dashboard/${currentUser.roleSegment}`)
    }

    const settings = await getSiteSettings()

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <SiteHeader
                logoText={settings.siteTitle}
                logoUrl={settings.logoUrl}
                contactEmail={settings.contactEmail}
                contactPhone={settings.contactPhone}
                socialLinks={settings.socialLinks}
            />

            <main className="flex-1 flex flex-col lg:flex-row">

                {/* ── Mobile / Tablet brand strip (hidden on lg+) ─────── */}
                <div className="lg:hidden relative bg-gradient-to-br from-[#0c1f4a] via-[#0f2856] to-[#052539] px-6 pt-10 pb-20 text-center overflow-hidden select-none">
                    {/* Decorative shapes */}
                    <div className="pointer-events-none absolute -top-14 -right-14 w-52 h-52 rounded-full bg-white/[0.04]" />
                    <div className="pointer-events-none absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#f59e0b]/[0.07]" />
                    <div className="pointer-events-none absolute top-8 left-8 w-16 h-16 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute bottom-10 right-12 w-10 h-10 rounded-full border border-[#f59e0b]/20" />

                    <div className="relative z-10">
                        <p className="text-[#f59e0b] font-bold text-[10px] tracking-[0.28em] uppercase mb-3">
                            Your Home Starts Here
                        </p>
                        <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight tracking-tight">
                            The <span className="text-[#f59e0b]">Biggest</span> Real Estate
                            <br />
                            <span className="text-[#f59e0b]">Revolution</span> in the Philippines
                        </h2>
                        <p className="text-blue-200/70 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
                            Discover properties and investment opportunities across the Philippines.
                        </p>
                        {/* Mini stats row */}
                        <div className="flex items-center justify-center gap-6 mt-6">
                            <div>
                                <p className="text-white font-black text-lg leading-none">10K+</p>
                                <p className="text-blue-300/60 text-[10px] mt-0.5">Listings</p>
                            </div>
                            <div className="w-px h-6 bg-white/20" />
                            <div>
                                <p className="text-white font-black text-lg leading-none">50K+</p>
                                <p className="text-blue-300/60 text-[10px] mt-0.5">Happy Buyers</p>
                            </div>
                            <div className="w-px h-6 bg-white/20" />
                            <div>
                                <p className="text-white font-black text-lg leading-none">82</p>
                                <p className="text-blue-300/60 text-[10px] mt-0.5">Provinces</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Left: Brand panel (lg+) ──────────────────────────── */}
                <div className="hidden lg:flex lg:w-[60%] xl:w-[55%] relative bg-gradient-to-br from-[#0c1f4a] via-[#0f2856] to-[#052539] overflow-hidden select-none">

                    {/* Decorative shapes */}
                    <div className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-white/[0.04]" />
                    <div className="pointer-events-none absolute top-1/3 -right-10 w-52 h-52 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-[#f59e0b]/[0.07]" />
                    <div className="pointer-events-none absolute bottom-32 right-10 w-28 h-28 rounded-full border border-[#f59e0b]/20" />

                    {/* Content container */}
                    <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col justify-between p-14 xl:p-20">

                        {/* Main copy */}
                        <div className="flex-1 flex flex-col justify-center">
                            <p className="text-[#f59e0b] font-bold text-xs tracking-[0.25em] uppercase mb-5">
                                Your Home Starts Here
                            </p>
                            <h2 className="text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight text-white">
                                The{' '}
                                <span className="text-[#f59e0b]">Biggest</span>
                                <br />
                                Real Estate
                                <br />
                                <span className="text-[#f59e0b]">Revolution</span>
                                <br />
                                in the Philippines
                            </h2>
                            <p className="mt-6 text-blue-200/80 text-base xl:text-lg max-w-sm leading-relaxed">
                                Discover properties, condominiums, and investment opportunities across every province in the Philippines.
                            </p>
                        </div>

                        {/* Testimonial */}
                        <div className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-6">
                            <svg className="text-[#f59e0b] mb-3" width="24" height="18" viewBox="0 0 24 18" fill="currentColor">
                                <path d="M0 18V10.5C0 6.9 1.35 3.9 4.05 1.5 5.4.5 6.9 0 8.55 0L9.6 1.5C7.8 2.1 6.375 3.15 5.325 4.65 4.275 6.15 3.75 7.8 3.75 9.6H6.75V18H0zm13.5 0V10.5c0-3.6 1.35-6.6 4.05-9C18.9.5 20.4 0 22.05 0L23.1 1.5c-1.8.6-3.225 1.65-4.275 3.15-1.05 1.5-1.575 3.15-1.575 4.95h3V18H13.5z" />
                            </svg>
                            <p className="text-blue-100/90 text-sm leading-relaxed italic">
                                "Found our dream condo in BGC within a week. HomesPH made the entire
                                process effortless and transparent."
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center text-white text-xs font-black">
                                    MR
                                </div>
                                <div>
                                    <p className="text-white text-xs font-semibold">Maria Reyes</p>
                                    <p className="text-blue-300/60 text-xs">Homeowner · Taguig City</p>
                                </div>
                            </div>
                        </div>

                    </div>{/* end content container */}
                </div>

                {/* ── Right: Login panel ────────────────────────────────── */}
                {/* On mobile the card lifts into the brand strip via -mt-10 */}
                <div className="flex-1 flex items-start lg:items-center justify-center px-5 pb-12 pt-0 lg:py-14 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                    <div className="w-full flex justify-center -mt-10 lg:mt-0">
                        <LoginForm logoUrl={settings.logoUrl} notice={notice} />
                    </div>
                </div>

            </main>

            <SiteFooter
                contactEmail={settings.contactEmail}
                contactPhone={settings.contactPhone}
                socialLinks={settings.socialLinks}
                logoUrl={settings.logoUrl}
                brandName={settings.siteTitle}
            />
        </div>
    )
}


