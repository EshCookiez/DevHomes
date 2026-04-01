import Image from 'next/image'

const HIGHLIGHTS: { title: string; description: string; icon: string }[] = [
  {
    title: 'Network Nationwide',
    description:
      'Our vetted ambassador of agents stretches from the northernmost peaks to the southern keys, so every neighborhood enjoys the same expert care and first-look alerts.',
    icon: '/networkIcon.png',
  },
  {
    title: 'Listings Nationwide',
    description:
      'Every listing is curated in real time, covering city condos, provincial estates, and investment-ready developments so you can compare homes side-by-side.',
    icon: '/ListIcon.png',
  },
]

export default function NationwideShowcase() {
  return (
    <section
      className="bg-[#002143] font-[family-name:var(--font-outfit)]"
      aria-label="Nationwide reach and listings"
    >
      <div className="mx-auto w-full max-w-[1345px] px-4 pt-[68px] pb-[65px] sm:px-6 md:px-[287px] lg:px-0">
        <div className="flex w-full flex-col items-center text-center">
          {/* REACH AND INVENTORY */}
          <h2 className="text-[25px] font-medium leading-[25px] tracking-[0.25em] text-[#FFE8A6] uppercase">
            Reach and Inventory
          </h2>
          
          {/* Network Nationwide and Listings Nationwide */}
          <h3 className="mt-[16px] text-[60px] font-semibold leading-[60px] text-[#FFFFFF]">
            Network Nationwide and Listings Nationwide
          </h3>
          
          {/* We pair every city... */}
          <p className="mt-[6px] max-w-[1331px] text-[25px] font-normal leading-[30px] text-[#FFFFFF]">
            We pair every city with a dedicated local team while syncing live inventory across the Philippines. The moment a property moves, your feed updates across every connected neighborhood.
          </p>
        </div>

        <div className="mt-[58px] flex flex-col gap-[35px] lg:flex-row">
          {HIGHLIGHTS.map((highlight) => (
            <article
              key={highlight.title}
              className="flex h-auto w-full lg:h-[310px] lg:w-[655px] flex-col justify-center rounded-[20px] bg-[#FFFFFF] px-[39px] py-8 transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-[26px]">
                <div className="flex h-[85px] w-[85px] shrink-0 items-center justify-center rounded-[15px] border border-[#F4EDD8] bg-[#FFFBEF]">
                  <Image src={highlight.icon} alt={highlight.title} width={75} height={75} className="object-contain" />
                </div>
                <h4 className="text-[40px] font-normal leading-[40px] text-[#D9991D]">{highlight.title}</h4>
              </div>
              <p className="mt-[15px] max-w-[560px] text-[25px] font-light leading-[30px] text-[#D9991D]">
                {highlight.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

