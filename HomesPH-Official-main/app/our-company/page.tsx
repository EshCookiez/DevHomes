import HomeFooter from '@/components/home/HomeFooter'
import HomeHeader from '@/components/home/HomeHeader'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { getSiteSettings } from '@/lib/site-settings'

export default async function OurCompanyPage() {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen bg-white text-[#1428AE]">
      <HomeHeader
        logoUrl={settings.logoUrl}
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        socialLinks={settings.socialLinks}
        navItems={GENERAL_NAV_ITEMS}
        topBarLocationLabel="Manila, Philippines"
      />

      <main className="mx-auto w-full max-w-[1920px]">
        <section className="bg-gradient-to-b from-[#EFF1FFCC] to-white px-4 pb-16 pt-10 sm:px-8 lg:px-0 lg:pb-24 lg:pt-20">
          <div className="mx-auto w-full max-w-[1345px]">
            <p className="text-center font-[family-name:var(--font-outfit)] text-[34px] font-medium leading-none tracking-[0.3em] text-[#F4AA1D] sm:text-[44px] lg:text-[60px]">
              OUR MISSION
            </p>

            <div className="relative mt-8 lg:h-[192px]">
              <img
                src="/our-company-logo.png"
                alt="HomesPH"
                className="h-[160px] w-[164px] object-contain sm:h-[192px] sm:w-[196px] lg:absolute lg:left-[4px] lg:top-0"
              />

              <div className="mt-6 max-w-[1111px] space-y-3 sm:space-y-4 lg:absolute lg:left-[226px] lg:top-0 lg:mt-0 lg:h-[192px] lg:w-[1111px] lg:space-y-0">
                <div className="space-y-3 sm:space-y-4 lg:space-y-0">
                  <div className="lg:absolute lg:left-0 lg:top-0 lg:flex lg:h-[40px] lg:w-[1111px] lg:items-center lg:gap-[12px]">
                    <p className="font-[family-name:var(--font-outfit)] text-[30px] font-semibold leading-none text-[#1428AE] sm:text-[40px] lg:h-[40px] lg:w-[210.65px] lg:shrink-0">
                      HOMES.PH
                    </p>
                    <p className="font-[family-name:var(--font-outfit)] text-[20px] font-normal leading-tight text-[#1428AE] sm:text-[25px] sm:leading-[25px] lg:h-[27px] lg:w-[890.22px]">
                      is built on one simple idea: every Filipino deserves a better,
                    </p>
                  </div>

                  <p className="font-[family-name:var(--font-outfit)] text-[20px] font-normal leading-tight text-[#1428AE] sm:text-[25px] sm:leading-[25px] lg:absolute lg:left-0 lg:top-[45px] lg:h-[27px] lg:w-[1111px]">
                    safer, and more transparent way to find and invest in property.
                  </p>

                  <p className="pt-1 font-[family-name:var(--font-outfit)] text-[19px] font-normal leading-[1.35] text-[#1428AE] sm:text-[22px] sm:leading-[30px] lg:absolute lg:left-0 lg:top-[102px] lg:h-[90px] lg:w-[1111px] lg:pt-0 lg:text-[22px] lg:leading-[30px]">
                    We are a newly launched multimedia property platform with a bold goal — to revolutionize the Philippine real estate industry. Our aim is to become one of the country’s most trusted property portals by delivering real value for buyers, sellers, brokers, developers, and investors.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3">
              <p className="font-[family-name:var(--font-outfit)] text-[15px] font-semibold uppercase leading-none tracking-[0.45em] text-[#F4AA1D] sm:text-[22px]">
                Built on Experience and Scale
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-[32px] font-semibold leading-none text-[#1428AE] sm:text-[40px]">
                A legacy of people and presence
              </p>
              <p className="pt-2 font-[family-name:var(--font-outfit)] text-[19px] font-normal leading-[1.35] text-[#1428AE] sm:text-[22px] sm:leading-[30px]">
                HOME.ph is backed by a management team with more than two decades of Philippine real estate experience. We currently work with over 10,000 real estate practitioners nationwide and operate through 100+ branches that serve as convenient drop-off centers for property owners.
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-[19px] font-normal leading-[1.35] text-[#1428AE] sm:text-[22px] sm:leading-[30px]">
                This strong physical presence bridges the gap between digital listings and real-world service. It ensures that technology is supported by people — real experts who understand local markets.
              </p>
              <p className="pt-1 font-[family-name:var(--font-outfit)] text-[28px] font-semibold leading-none tracking-[0.2em] text-[#F4AA1D] sm:text-[40px]">
                20+ YEARS
              </p>
            </div>

            <div className="mt-10 rounded-[20px] bg-gradient-to-l from-[#1428AE] to-[#000F73] p-6 sm:p-10">
              <p className="font-[family-name:var(--font-outfit)] text-[14px] font-semibold uppercase leading-none tracking-[0.35em] text-[#FFE8A6] sm:text-[22px]">
                More than a listing site
              </p>
              <p className="mt-4 font-[family-name:var(--font-outfit)] text-[32px] font-semibold leading-none text-white sm:text-[40px]">
                An integrated lifestyle platform
              </p>
              <p className="mt-5 max-w-[1263px] font-[family-name:var(--font-outfit)] text-[20px] font-normal leading-[1.2] text-white sm:text-[25px] sm:leading-[30px]">
                HOME.ph is not just a classifieds platform. We are building a complete ecosystem that supports the entire property journey, connecting property with lifestyle, travel, and local business to craft a richer experience.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-10">
                <p className="font-[family-name:var(--font-outfit)] text-[20px] font-normal leading-[1.2] text-white sm:text-[25px] sm:leading-[30px]">
                  A dynamic property marketplace
                  <br />
                  A dedicated tourism section celebrating the Philippines’ 7,641 islands
                </p>
                <p className="font-[family-name:var(--font-outfit)] text-[20px] font-normal leading-[1.2] text-white sm:text-[25px] sm:leading-[30px]">
                  Timely regional news updates
                  <br />
                  A curated restaurant directory to highlight thriving local communities
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="rounded-[20px] bg-gradient-to-l from-[#1428AE] to-[#000F73] p-6 sm:p-10">
                <p className="font-[family-name:var(--font-outfit)] text-[14px] font-semibold uppercase leading-none tracking-[0.4em] text-[#FFE8A6] sm:text-[15px]">
                  Legal Protection and Trusted Guidance
                </p>
                <p className="mt-4 font-[family-name:var(--font-outfit)] text-[32px] font-semibold leading-none text-white sm:text-[40px]">
                  Legal Homes
                </p>
                <p className="mt-5 font-[family-name:var(--font-outfit)] text-[18px] font-normal leading-[1.35] text-white sm:text-[20px] sm:leading-[28px]">
                  Through Legal Homes, our in-house legal advisory platform, users gain access to expert insights and podcasts from lawyers representing every region in the country. This adds a strong layer of protection and credibility — giving buyers and investors confidence that transactions are guided by professional advice and ethical standards.
                </p>
              </div>

              <div className="rounded-[20px] bg-gradient-to-l from-[#1428AE] to-[#000F73] p-6 sm:p-10">
                <p className="font-[family-name:var(--font-outfit)] text-[14px] font-semibold uppercase leading-none tracking-[0.35em] text-[#FFE8A6] sm:text-[15px]">
                  Unmatched Local Intelligence
                </p>
                <p className="mt-4 font-[family-name:var(--font-outfit)] text-[32px] font-semibold leading-none text-white sm:text-[40px]">
                  Ground truth built for scale
                </p>
                <p className="mt-5 font-[family-name:var(--font-outfit)] text-[18px] font-normal leading-[1.35] text-white sm:text-[20px] sm:leading-[28px]">
                  To deliver accurate and up-to-date information, HOME.ph has deployed 300 trained field reporters across cities nationwide. This on-the-ground network provides verified data, community insights, and real-time updates — something no traditional property portal offers at this scale. Combined with our 100+ branches, we are building what we believe is the most accessible and reliable property platform in the country.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 pt-6 sm:px-8 lg:px-0 lg:pb-24">
          <div className="mx-auto w-full max-w-[1345px] text-center">
            <p className="font-[family-name:var(--font-outfit)] text-[16px] font-semibold uppercase leading-none tracking-[0.45em] text-[#F4AA1D] sm:text-[22px] sm:leading-[22px]">
              A SECURE, TRANSPARENT, DATA- DRIVEN MARKETPLACE
            </p>
            <p className="mt-[25px] font-[family-name:var(--font-outfit)] text-[28px] font-semibold leading-[1.15] text-[#1428AE] sm:text-[35px] sm:leading-[40px]">
              In an industry where trust is everything, HOME.ph is committed to raising standards.
            </p>

            <div className="mt-8 grid gap-6 lg:hidden">
              <div className="commitment-float commitment-float--a rounded-[20px] bg-[#F1F8FF] p-6 text-left">
                <p className="font-[family-name:var(--font-outfit)] text-[18px] font-bold uppercase leading-[18px] tracking-[0.4em] text-[#1428AE]">
                  COMMITMENT
                </p>
                <p className="mt-5 font-[family-name:var(--font-outfit)] text-[23px] font-light leading-[1.5] text-[#1428AE] sm:text-[25px] sm:leading-[38px]">
                  Secure – supported by legal expertise and verified listings
                </p>
              </div>

              <div className="flex justify-center">
                <img
                  src="/our-company-logo.png"
                  alt="HomesPH"
                  className="h-[220px] w-[224px] object-contain sm:h-[317px] sm:w-[323px]"
                />
              </div>

              <div className="commitment-float commitment-float--b rounded-[20px] bg-[#F1F8FF] p-6 text-left">
                <p className="font-[family-name:var(--font-outfit)] text-[18px] font-bold uppercase leading-[18px] tracking-[0.4em] text-[#1428AE]">
                  COMMITMENT
                </p>
                <p className="mt-5 font-[family-name:var(--font-outfit)] text-[23px] font-light leading-[1.5] text-[#1428AE] sm:text-[25px] sm:leading-[38px]">
                  Transparent – guided by ethical practices
                </p>
              </div>

              <div className="commitment-float commitment-float--c rounded-[20px] bg-[#F1F8FF] p-6 text-left">
                <p className="font-[family-name:var(--font-outfit)] text-[18px] font-bold uppercase leading-[18px] tracking-[0.4em] text-[#1428AE]">
                  COMMITMENT
                </p>
                <p className="mt-5 font-[family-name:var(--font-outfit)] text-[23px] font-light leading-[1.5] text-[#1428AE] sm:text-[25px] sm:leading-[38px]">
                  Data-driven – powered by nationwide reporting and market intelligence
                </p>
              </div>
            </div>

            <div className="relative mt-[55px] hidden h-[530px] lg:block">
              <div className="commitment-float commitment-float--a absolute left-1/2 top-0 h-[153px] w-[463px] -translate-x-1/2 rounded-[20px] bg-[#F1F8FF] px-[25px] py-[25px] text-left">
                <p className="font-[family-name:var(--font-outfit)] text-[18px] font-bold uppercase leading-[18px] tracking-[0.4em] text-[#1428AE]">
                  COMMITMENT
                </p>
                <p className="mt-[27px] w-[413px] font-[family-name:var(--font-outfit)] text-[25px] font-light leading-[38px] text-[#1428AE]">
                  Secure – supported by legal expertise and verified listings
                </p>
              </div>

              <img
                src="/our-company-logo.png"
                alt="HomesPH"
                className="absolute left-1/2 top-[203px] h-[317px] w-[323px] -translate-x-1/2 object-contain"
              />

              <div className="commitment-float commitment-float--b absolute left-[55px] top-[285px] h-[153px] w-[397px] rounded-[20px] bg-[#F1F8FF] px-[25px] py-[25px] text-left">
                <p className="font-[family-name:var(--font-outfit)] text-[18px] font-bold uppercase leading-[18px] tracking-[0.4em] text-[#1428AE]">
                  COMMITMENT
                </p>
                <p className="mt-[27px] w-[347px] font-[family-name:var(--font-outfit)] text-[25px] font-light leading-[38px] text-[#1428AE]">
                  Transparent – guided by ethical practices
                </p>
              </div>

              <div className="commitment-float commitment-float--c absolute right-[0px] top-[266px] h-[191px] w-[415px] rounded-[20px] bg-[#F1F8FF] px-[25px] py-[25px] text-left">
                <p className="font-[family-name:var(--font-outfit)] text-[18px] font-bold uppercase leading-[18px] tracking-[0.4em] text-[#1428AE]">
                  COMMITMENT
                </p>
                <p className="mt-[27px] w-[365px] font-[family-name:var(--font-outfit)] text-[25px] font-light leading-[38px] text-[#1428AE]">
                  Data-driven – powered by nationwide reporting and market intelligence
                </p>
              </div>
            </div>

            <p className="mx-auto mt-12 max-w-[1343px] text-left font-[family-name:var(--font-outfit)] text-[20px] font-light leading-[1.4] text-[#1428AE] sm:text-[25px] sm:leading-[35px] lg:text-center">
              For mainstream homebuyers, HOME.ph offers clarity and confidence. For developers, CEOs, and institutional investors, it offers scale, reach, and actionable insight.
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 pt-6 text-center sm:px-8 lg:px-0 lg:pb-24">
          <div className="mx-auto w-full max-w-[1345px]">
            <p className="font-[family-name:var(--font-outfit)] text-[34px] font-medium leading-none tracking-[0.3em] text-[#F4AA1D] sm:text-[44px] lg:text-[60px]">
              OUR PROMISE
            </p>
            <p className="mx-auto mt-8 max-w-[1341px] font-[family-name:var(--font-outfit)] text-[26px] font-semibold leading-[1.3] text-[#1428AE] sm:text-[34px] sm:leading-[1.45] lg:text-[40px] lg:leading-[60px]">
              We are not just listing properties. We are building the future of real estate in the Philippines — one that connects communities, protects stakeholders, and creates lasting value across all 7,641 islands.
            </p>
            <p className="mt-8 font-[family-name:var(--font-outfit)] text-[22px] font-semibold leading-none text-[#F4AA1D] sm:text-[25px]">
              HOME.ph — Where every property story begins.
            </p>
          </div>
        </section>
      </main>

      <HomeFooter
        contactEmail={settings.contactEmail}
        contactPhone={settings.contactPhone}
        logoUrl={settings.logoUrl}
      />
    </div>
  )
}
