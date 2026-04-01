import Link from 'next/link'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { getSiteSettings } from '@/lib/site-settings'

const SECTIONS = [
  {
    id: 'ownership-laws',
    icon: '🏛️',
    title: 'Property Ownership Laws',
    content: [
      {
        heading: 'Who Can Own Real Property in the Philippines?',
        body: [
          'Filipino citizens and Filipino-owned corporations (60% Filipino equity) may own land.',
          'Foreigners are generally prohibited from owning land but may own condominium units, provided foreign ownership in the project does not exceed 40%.',
          'Dual citizens who reacquired Philippine citizenship under RA 9225 may own land.',
          'Former natural-born Filipinos abroad may acquire up to 5,000 sqm of urban land or 3 hectares of rural land.',
        ],
      },
      {
        heading: 'Types of Property Ownership',
        body: [
          'Freehold/Fee Simple – Full and absolute ownership with the right to sell, lease, or transfer.',
          'Condominium Title (CCT) – Ownership of a unit within a registered condominium project.',
          'Transfer Certificate of Title (TCT) – Issued for land parcels transferred from one owner to another.',
          'Original Certificate of Title (OCT) – Issued for land first registered under the Torrens system.',
        ],
      },
    ],
  },
  {
    id: 'foreign-ownership',
    icon: '🌏',
    title: 'Foreign Ownership Rules',
    content: [
      {
        heading: 'What Foreigners Can Own',
        body: [
          'Condominium units in projects where foreign ownership does not exceed 40% of the total number of units.',
          'Long-term leasehold rights up to 50 years, renewable once for 25 years (RA 7652).',
          'Buildings and improvements on leased land.',
         'As a Philippine corporation stockholder, foreigners may invest in mixed-use and commercial properties within equity limits.',
        ],
      },
      {
        heading: 'Special Cases for Foreigners',
        body: [
          'Retired foreign nationals under RA 9593 (Tourism Act) may invest without restriction on certain retirement visas.',
          'Foreigners married to Filipino citizens may benefit from their spouse\'s ownership rights but cannot hold title in their own name.',
          'SRRV (Special Resident Retiree\'s Visa) holders enjoy streamlined investment processes but still cannot own land directly.',
        ],
      },
    ],
  },
  {
    id: 'title-transfer',
    icon: '📜',
    title: 'Title Transfer Process',
    content: [
      {
        heading: 'Step-by-Step Transfer Procedure',
        body: [
          '1. Execute a Deed of Absolute Sale (DOAS) before a Notary Public.',
          '2. Obtain Bureau of Internal Revenue (BIR) Clearance — pay Documentary Stamp Tax (1.5%) and Capital Gains Tax (6%).',
          '3. Pay Transfer Tax at the City/Municipal Treasurer\'s Office (0.5%–0.75% of property value).',
          '4. Submit documents to the Registry of Deeds (ROD) for title transfer.',
          '5. Pay Registration Fee (approximately 0.25%–0.75% of the sale price).',
          '6. Receive new Transfer Certificate of Title (TCT) or Condominium Certificate of Title (CCT).',
          '7. File new Tax Declaration at the Municipal/City Assessor\'s Office.',
        ],
      },
      {
        heading: 'Typical Timeline',
        body: [
          'BIR processing: 5–10 business days.',
          'Registry of Deeds processing: 15–30 business days.',
          'Assessor\'s Office: 1–5 business days.',
          'Total estimated timeline: 1–3 months depending on workload.',
        ],
      },
    ],
  },
  {
    id: 'due-diligence',
    icon: '🔍',
    title: 'Due Diligence Checklist',
    content: [
      {
        heading: 'Essential Documents to Verify',
        body: [
          'Clean and updated Transfer Certificate of Title (TCT) or CCT — verify at the Registry of Deeds.',
          'Tax Declaration — must be up-to-date and match the title details.',
          'Real Property Tax (RPT) clearance — ensure no arrears.',
          'DHSUD License to Sell — mandatory for subdivision and condominium projects.',
          'Bureau of Internal Revenue (BIR) Tax Clearance for the property.',
          'Building permits, occupancy permits, and HLURB approvals (for developments).',
        ],
      },
      {
        heading: 'Red Flags to Watch',
        body: [
          'Sellers unable to present original TCT or CCT.',
          'Discrepancies between title area and actual lot size.',
          'Property located within flood-prone or hazard zones.',
          'Developer without valid License to Sell from DHSUD.',
          'Multiple encumbrances or liens annotated on the title.',
          'Inconsistencies in the Deed of Sale and supporting documents.',
        ],
      },
    ],
  },
  {
    id: 'taxes-fees',
    icon: '💰',
    title: 'Property Taxes & Fees',
    content: [
      {
        heading: 'Buyer\'s Costs',
        body: [
          'Documentary Stamp Tax (DST): 1.5% of the sale price (paid by buyer).',
          'Registration Fee: 0.25%–0.75% of the sale price.',
          'Transfer Tax: 0.5%–0.75% (varies by LGU).',
          'Notarial Fee: approximately 0.5%–1% of the sale price.',
          'Miscellaneous fees: Title search, annotation fees, etc.',
        ],
      },
      {
        heading: 'Seller\'s Costs',
        body: [
          'Capital Gains Tax (CGT): 6% of the gross selling price or zonal value, whichever is higher.',
          'Franchise\'s commission: typically 3%–5% of the sale price.',
          'Real Property Tax (RPT) clearance fees.',
          'Creditable Withholding Tax (CWT): 1.5%–6% if seller is a real estate dealer.',
        ],
      },
      {
        heading: 'Recurring Real Property Tax (RPT)',
        body: [
          'Annual RPT rate: 1% (cities/municipalities in Metro Manila and other cities) to 2% of assessed value.',
          'Assessed value = Fair Market Value × Assessment Level (varies by property classification).',
          'Special Education Fund (SEF) levy: additional 1% of assessed value annually.',
          'Deadline: January 31 of each year for a 20% discount on annual RPT.',
        ],
      },
    ],
  },
  {
    id: 'legal-terms',
    icon: '📚',
    title: 'Common Legal Terms',
    content: [
      {
        heading: 'Title & Ownership',
        body: [
          'TCT (Transfer Certificate of Title) — the primary document proving land ownership in the Philippines.',
          'CCT (Condominium Certificate of Title) — equivalent of TCT for condominium unit ownership.',
          'OCT (Original Certificate of Title) — issued when land is first registered; subsequent transfers create TCTs.',
          'Torrens System — the Philippine system of land registration, guaranteeing the indefeasibility of a registered title.',
        ],
      },
      {
        heading: 'Transactions',
        body: [
          'DOAS (Deed of Absolute Sale) — legal document transferring ownership from seller to buyer.',
          'Contract to Sell (CTS) — agreement to sell upon full payment of the purchase price.',
          'Reservation Agreement — initial document securing the buyer\'s right to purchase a specific unit.',
          'Lis Pendens — legal notice that a property is the subject of pending litigation.',
          'Encumbrance — a claim, lien, or liability on a property (e.g., mortgage, easement).',
        ],
      },
      {
        heading: 'Regulatory Bodies',
        body: [
          'DHSUD (Department of Human Settlements and Urban Development) — issues License to Sell for developers.',
          'Registry of Deeds — processes title transfers and maintains records of all registered properties.',
          'BIR (Bureau of Internal Revenue) — collects taxes on property transactions.',
          'LGU Assessor\'s Office — maintains tax declarations and imposes real property tax.',
        ],
      },
    ],
  },
]

export default async function LegalPage() {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
      />

      {/* ── Hero ── */}
      <section className="bg-[#0c1f4a] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Buyer Protection</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Philippine Real Estate Legal Guide</h1>
          <p className="text-white/60 text-sm max-w-lg">
            Everything you need to know about buying, selling, and owning property in the Philippines — from ownership laws and foreign restrictions to title transfer and due diligence.
          </p>
          <p className="mt-4 text-amber-300 text-xs">
            ⚠️ This guide is for informational purposes only. Consult a licensed lawyer or real estate professional for legal advice specific to your situation.
          </p>
        </div>
      </section>

      {/* ── Quick Navigation ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto scrollbar-hide text-sm">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="flex items-center gap-1.5 text-gray-600 hover:text-[#1428ae] transition-colors whitespace-nowrap font-medium text-xs">
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </a>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-20 space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Table of Contents</h2>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#1428ae]/5 hover:text-[#1428ae] transition-colors">
                  <span className="text-base">{s.icon}</span>
                  <span>{s.title}</span>
                </a>
              ))}
              {/* Quick links */}
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                <Link href="/mortgage"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#1428ae] hover:bg-[#1428ae]/5 transition-colors font-medium">
                  🏦 Mortgage Calculator
                </Link>
                <Link href="/buy"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#1428ae] hover:bg-[#1428ae]/5 transition-colors font-medium">
                  🏠 Browse Properties
                </Link>
                <Link href="/developers"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#1428ae] hover:bg-[#1428ae]/5 transition-colors font-medium">
                  🏢 Registered Developers
                </Link>
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="lg:col-span-3 space-y-8">
            {SECTIONS.map(section => (
              <section key={section.id} id={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 scroll-mt-20">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{section.icon}</span>
                  <h2 className="text-xl font-extrabold text-gray-900">{section.title}</h2>
                </div>
                <div className="space-y-6">
                  {section.content.map(block => (
                    <div key={block.heading}>
                      <h3 className="text-sm font-bold text-[#1428ae] mb-3 uppercase tracking-wide">{block.heading}</h3>
                      <ul className="space-y-2">
                        {block.body.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1428ae] mt-2 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* ── Cost Calculator link ── */}
            <div className="bg-[#1428ae] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="text-4xl">🧮</div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-bold text-white mb-1">Estimate Your Total Purchase Cost</h2>
                <p className="text-white/60 text-sm">Use our mortgage calculator to estimate monthly payments, total interest, and compare bank rates.</p>
              </div>
              <Link href="/mortgage"
                className="bg-amber-400 text-[#1428ae] font-bold text-sm px-6 py-3 rounded-xl hover:bg-amber-300 transition-colors shrink-0">
                Open Calculator
              </Link>
            </div>

            {/* ── Disclaimer ── */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
              <h3 className="font-bold text-amber-800 text-sm mb-2">📋 Legal Disclaimer</h3>
              <p className="text-xs text-amber-700 leading-relaxed">
                The information provided in this legal guide is for general informational and educational purposes only. 
                It does not constitute legal advice and should not be relied upon as a substitute for advice from a licensed Philippine attorney.
                Consult a qualified real estate lawyer or accredited franchise/professional before entering into any property transaction.
                Laws and regulations may change; always verify current information with relevant government agencies.
              </p>
            </div>

            {/* ── Useful Resources ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Useful Government Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'DHSUD', desc: 'Dept. of Human Settlements and Urban Development', url: 'https://www.dhsud.gov.ph', icon: '🏛️' },
                  { name: 'BIR', desc: 'Bureau of Internal Revenue — Property Taxes', url: 'https://www.bir.gov.ph', icon: '📋' },
                  { name: 'Pag-IBIG Fund', desc: 'Home Development Mutual Fund', url: 'https://www.pagibigfund.gov.ph', icon: '🏠' },
                  { name: 'LRA', desc: 'Land Registration Authority', url: 'https://www.lra.gov.ph', icon: '📜' },
                  { name: 'HLURB (PhilSys)', desc: 'Housing & Land Use Regulatory Board', url: 'https://www.dhsud.gov.ph', icon: '🔎' },
                  { name: 'PSA', desc: 'Philippine Statistics Authority — Land Records', url: 'https://www.psa.gov.ph', icon: '📊' },
                ].map(r => (
                  <div key={r.name} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl hover:border-[#1428ae]/20 transition-colors">
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
