const locations = [
  {
    name: "Bacolod",
    icon: "https://www.figma.com/api/mcp/asset/c8ed7df3-47a4-4878-8832-d370ab1d8d56",
  },
  {
    name: "BGC",
    icon: "https://www.figma.com/api/mcp/asset/c50cf5df-9b18-4c9f-b808-8147d0f27480",
  },
  {
    name: "Bohol",
    icon: "https://www.figma.com/api/mcp/asset/3c680e1d-2755-4604-90ca-4926d78ba331",
  },
  {
    name: "Cagayan De Oro",
    icon: "https://www.figma.com/api/mcp/asset/78b5cccf-ca95-4df3-8a85-326016dbf0cc",
  },
  {
    name: "Cavite",
    icon: "https://www.figma.com/api/mcp/asset/17c2226e-6ce0-4575-bc8e-0da96d52cd10",
  },
  {
    name: "Cebu",
    icon: "https://www.figma.com/api/mcp/asset/1149e991-20ce-4880-8670-e5e478133bfb",
  },
  {
    name: "Davao",
    icon: "https://www.figma.com/api/mcp/asset/df78cc44-7f64-4a67-ad0e-be5843a752b3",
  },
  {
    name: "General Santos",
    icon: "https://www.figma.com/api/mcp/asset/add9f55d-6177-4d8f-961b-53c78bb35e54",
  },
  {
    name: "Iloilo",
    icon: "https://www.figma.com/api/mcp/asset/7f4e35d4-3283-4965-9ccc-6d7d0992758b",
  },
  {
    name: "Pampanga",
    icon: "https://www.figma.com/api/mcp/asset/3a0e63c3-df48-455c-bdc0-27e291cca3ae",
  },
];

const featureCards = [
  {
    title: "Network Nationwide",
    description:
      "Our vetted affiliate of agents stretches from the northernmost peaks to the southern keys, so every neighborhood enjoys the same expert care and first-look alerts.",
    iconBg: "bg-[#FFFBef]",
    iconBorder: "border border-[#F4EDD8]",
    icon: "🌐",
  },
  {
    title: "Listings Nationwide",
    description:
      "Every listing is curated in real time, covering city condos, provincial estates, and investment-ready developments so you can compare homes side-by-side.",
    iconBg: "bg-[#FFFBef]",
    iconBorder: "border border-[#F4EDD8]",
    icon: "📋",
  },
];

export default function HomesLandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#002143]">
      {/* Top bar */}
      <div className="bg-[#1428AE] text-white">
        <div className="mx-auto flex max-w-[1345px] items-center justify-between px-6 py-2 text-[13px] sm:text-[15px]">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>(+63) 977 815 0888</span>
            <span>info@homes.ph</span>
            <span>Manila, Philippines</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span>f</span>
            <span>◎</span>
            <span>×</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="border-b border-[#D3D3D3] bg-white">
        <div className="mx-auto flex max-w-[1345px] items-center justify-between px-6 py-7">
          <img
            src="https://www.figma.com/api/mcp/asset/e263ce91-a316-4be6-baca-6a1005ee6673"
            alt="Homes.ph"
            className="h-10 w-auto object-contain"
          />

          <nav className="hidden items-center gap-8 text-[16px] md:flex lg:text-[18px]">
            <a href="#" className="transition hover:text-[#1428AE]">
              Our Company
            </a>
            <a href="#" className="transition hover:text-[#1428AE]">
              News
            </a>
            <a href="#" className="transition hover:text-[#1428AE]">
              Mortgage
            </a>
            <a href="#" className="transition hover:text-[#1428AE]">
              Legal
            </a>
            <a href="#" className="transition hover:text-[#1428AE]">
              Tourism
            </a>
            <a href="#" className="transition hover:text-[#1428AE]">
              Restaurant
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-100 pointer-events-none">
          <div className="mx-auto max-w-[1600px]">
            <img
              src="https://www.figma.com/api/mcp/asset/148f10a8-ace4-444e-9393-1f0732210541"
              alt=""
              className="mx-auto mt-8 w-full max-w-[1400px] object-contain opacity-90"
            />
          </div>
        </div>

        <div className="relative mx-auto max-w-[1345px] px-6 pb-24 pt-16 md:pt-24 lg:pb-28">
          <div className="mx-auto max-w-[1002px] text-center">
            <h1 className="text-[40px] font-semibold leading-tight text-[#1428AE] sm:text-[56px] lg:text-[75px]">
              Your Home Starts Here
            </h1>

            <p className="mx-auto mt-4 max-w-[831px] text-[18px] leading-relaxed text-[#1428AE] sm:text-[22px] lg:text-[25px]">
              Select a location below to explore available properties,
              condominiums, and investment opportunities.
            </p>

            <div className="mx-auto mt-8 inline-flex rounded-[10px] bg-[rgba(20,40,174,0.08)] px-6 py-3">
              <span className="text-[16px] font-medium text-[#1428AE] sm:text-[20px] lg:text-[25px]">
                STEP 1 — CHOOSE YOUR LOCATION
              </span>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-[1345px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {locations.map((location) => (
              <button
                key={location.name}
                className="group rounded-[20px] bg-white px-4 py-6 shadow-[0_0_4px_rgba(20,40,174,0.18)] transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto flex h-[75px] w-[75px] items-center justify-center rounded-[15px] border border-[#DBE2E9] bg-[#F8FBFF]">
                  <img
                    src={location.icon}
                    alt={location.name}
                    className="h-[62px] w-[62px] object-contain"
                  />
                </div>

                <h3 className="mt-4 text-[16px] font-normal text-[#002143] sm:text-[18px]">
                  {location.name}
                </h3>

                <p className="mt-2 text-[13px] font-light text-[#748AA0] sm:text-[15px]">
                  Philippines
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Reach and Inventory */}
      <section className="bg-[#002143] py-20 text-white">
        <div className="mx-auto max-w-[1345px] px-6 text-center">
          <p className="text-[16px] font-medium tracking-[0.25em] text-[#FFE8A6] sm:text-[20px] lg:text-[25px]">
            REACH AND INVENTORY
          </p>

          <h2 className="mx-auto mt-5 max-w-[1345px] text-[34px] font-semibold leading-tight sm:text-[48px] lg:text-[60px]">
            Network Nationwide and Listings Nationwide
          </h2>

          <p className="mx-auto mt-5 max-w-[1100px] text-[18px] leading-relaxed text-white/95 sm:text-[22px] lg:text-[25px]">
            We pair every city with a dedicated local team while syncing live
            inventory across the Philippines. The moment a property moves, your
            feed updates across every connected neighborhood.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[20px] bg-white px-6 py-10 text-left text-[#D9991D] lg:px-10"
              >
                <div
                  className={`flex h-[85px] w-[85px] items-center justify-center rounded-[15px] ${card.iconBg} ${card.iconBorder}`}
                >
                  <span className="text-4xl">{card.icon}</span>
                </div>

                <h3 className="mt-6 text-[28px] font-normal leading-tight sm:text-[34px] lg:text-[40px]">
                  {card.title}
                </h3>

                <p className="mt-5 text-[18px] font-light leading-relaxed sm:text-[22px] lg:text-[25px]">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#002143] text-white">
        <div className="border-t border-[#25406E]" />

        <div className="mx-auto max-w-[1345px] px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <img
                src="https://www.figma.com/api/mcp/asset/c551e121-0b28-4ca3-8175-54e1791884c0"
                alt="Homes.ph"
                className="h-[68px] w-auto object-contain"
              />

              <p className="mt-5 max-w-[434px] text-[16px] leading-relaxed text-white sm:text-[18px]">
                Your trusted partner in finding the perfect home. Connecting
                Filipinos with quality properties nationwide.
              </p>

              <div className="mt-6 flex items-center gap-4 text-xl">
                <span>f</span>
                <span>◎</span>
                <span>×</span>
              </div>
            </div>

            <div className="lg:col-span-3">
              <h4 className="text-[20px] font-bold">Contact Us</h4>

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-[18px] font-normal">(+63) 977 815 0888</p>
                  <p className="mt-1 text-[12px] font-light text-white/80">
                    Mon-Sat 9AM-6PM
                  </p>
                </div>

                <div>
                  <p className="text-[18px] font-normal">info@homes.ph</p>
                  <p className="mt-1 text-[12px] font-light text-white/80">
                    We reply within 24hrs
                  </p>
                </div>

                <div>
                  <p className="text-[18px] font-normal">Manila, Philippines</p>
                  <p className="mt-1 text-[12px] font-light text-white/80">
                    Serving nationwide
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#25406E] pt-8">
            <div className="flex flex-col gap-6 text-[15px] text-[#DDD] md:flex-row md:items-end md:justify-between">
              <div>
                <p>© 2026 Homes.ph. All rights reserved. Your dream home awaits.</p>
                <p className="mt-2">Powered by passion and innovation</p>
              </div>

              <div className="flex flex-wrap gap-6">
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-white">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-white">
                  Sitemap
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}