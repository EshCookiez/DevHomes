import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSiteSettings } from '@/lib/site-settings'
import InquiryForm from '@/components/listings/InquiryForm'
import { MOCK_DEVELOPERS, MOCK_PROJECTS } from '@/lib/mock-data'

const fmt = (n?: number | null) => n ? `₱ ${Number(n).toLocaleString()}` : null
const fmtRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Price on request'
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min ?? max) ?? 'Price on request'
}

export default async function DeveloperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [settings] = await Promise.all([getSiteSettings()])

  const dev = MOCK_DEVELOPERS.find(d => d.id === Number(id))
  if (!dev) notFound()

  const devProjects = MOCK_PROJECTS.filter(p => p.developer_id === dev.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
      />

      {/* ── Dark Hero Banner ── */}
      <section className="bg-[#0c1f4a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[url('https://picsum.photos/seed/devhero/1200/400')] bg-cover bg-center" />
        <div className="relative max-w-6xl mx-auto px-4 py-14 flex flex-col sm:flex-row items-center gap-8">
          <div className="h-28 w-28 rounded-2xl border-4 border-white/20 overflow-hidden bg-white shadow-xl shrink-0">
            <img src={dev.logo_url ?? undefined} alt={dev.developer_name} className="h-full w-full object-cover" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Real Estate Developer</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{dev.developer_name}</h1>
            <p className="text-white/60 text-sm mt-1.5">{dev.industry} · Est. {dev.founded}</p>
            {dev.website_url && (
              <a href={dev.website_url} target="_blank" rel="noreferrer"
                className="inline-block mt-3 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2">
                {dev.website_url}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Band ── */}
      <div className="bg-[#1428ae]">
        <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-white/20 text-center">
          {[
            { value: `${dev.stats.projects}+`, label: 'Projects' },
            { value: dev.stats.units >= 1000 ? `${(dev.stats.units / 1000).toFixed(1)}K+` : `${dev.stats.units}+`, label: 'Units Built' },
            { value: `${dev.stats.provinces}+`, label: 'Provinces' },
          ].map(s => (
            <div key={s.label} className="px-4">
              <p className="text-xl font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-white/70 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">

        {/* ── About ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About {dev.developer_name}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{dev.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="font-semibold text-gray-900">Headquarters:</span> {dev.address}
            </div>
          </div>
        </section>

        {/* ── Contact + Persons ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dev.contact && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Contact Information</h2>
              <dl className="space-y-3 text-sm">
                {dev.contact.email && (
                  <div className="flex items-start gap-3">
                    <dt className="text-gray-400 shrink-0 w-28 text-xs uppercase tracking-wider pt-0.5">Email</dt>
                    <dd><a href={`mailto:${dev.contact.email}`} className="text-[#1428ae] hover:underline">{dev.contact.email}</a></dd>
                  </div>
                )}
                {dev.contact.primary_mobile && (
                  <div className="flex items-start gap-3">
                    <dt className="text-gray-400 shrink-0 w-28 text-xs uppercase tracking-wider pt-0.5">Mobile</dt>
                    <dd><a href={`tel:${dev.contact.primary_mobile}`} className="text-gray-700">{dev.contact.primary_mobile}</a></dd>
                  </div>
                )}
                {dev.contact.telephone && (
                  <div className="flex items-start gap-3">
                    <dt className="text-gray-400 shrink-0 w-28 text-xs uppercase tracking-wider pt-0.5">Telephone</dt>
                    <dd><a href={`tel:${dev.contact.telephone}`} className="text-gray-700">{dev.contact.telephone}</a></dd>
                  </div>
                )}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {dev.contact.facebook_url && (
                  <a href={dev.contact.facebook_url} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                    Facebook
                  </a>
                )}
                {dev.contact.instagram_url && (
                  <a href={dev.contact.instagram_url} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-full bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors">
                    Instagram
                  </a>
                )}
                {(dev.contact as any).linkedin_url && (
                  <a href={(dev.contact as any).linkedin_url} target="_blank" rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-900 hover:bg-blue-100 transition-colors">
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}

          {dev.contact_persons && dev.contact_persons.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Our Team</h2>
              <div className="space-y-4">
                {dev.contact_persons.map(cp => (
                  <div key={cp.id} className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#1428ae]/10 flex items-center justify-center text-[#1428ae] font-bold text-sm shrink-0">
                      {cp.full_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{cp.full_name}</p>
                      <p className="text-xs text-amber-600 font-medium">{cp.position}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs">
                        {cp.email && <a href={`mailto:${cp.email}`} className="text-[#1428ae] hover:underline">{cp.email}</a>}
                        {cp.mobile_number && <a href={`tel:${cp.mobile_number}`} className="text-gray-500">{cp.mobile_number}</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Projects ── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Projects <span className="text-base font-normal text-gray-400">({devProjects.length})</span>
            </h2>
            <Link href="/projects" className="text-sm text-[#1428ae] font-medium hover:text-amber-500 transition-colors">View all →</Link>
          </div>
          {devProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {devProjects.map(p => (
                <Link key={p.id} href={`/projects/${p.slug}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-[#1428ae]/20 transition-all">
                  <div className="h-44 bg-gray-100 overflow-hidden">
                    {p.main_image_url
                      ? <img src={p.main_image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="h-full flex items-center justify-center text-sm text-gray-400">No image</div>}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        p.status === 'Ready for Occupancy' ? 'bg-green-50 text-green-700' :
                        p.status === 'Pre-Selling' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                      }`}>{p.status}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#1428ae] transition-colors">{p.name}</h3>
                    <p className="text-xs text-gray-500">{[p.city_municipality, p.province].filter(Boolean).join(', ')}</p>
                    <p className="text-sm font-bold text-[#1428ae]">{fmtRange(p.price_range_min, p.price_range_max)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-sm text-gray-400">No projects listed for this developer yet.</p>
            </div>
          )}
        </section>

        {/* ── Inquiry Form ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Send an Inquiry</h2>
          <p className="text-sm text-gray-500 mb-6">
            Interested in a project by {dev.developer_name}? Send us a message and we'll get back to you.
          </p>
          <div className="max-w-lg">
            <InquiryForm listingTitle={`Inquiry — ${dev.developer_name}`} />
          </div>
        </section>

      </main>

      <SiteFooter
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        brandName={settings.siteTitle}
      />
    </div>
  )
}
