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
      <div className="mx-auto w-full max-w-[1346px] px-4 py-20 sm:px-6 md:px-8 lg:px-10 min-[1346px]:px-0">
        <div className="w-full space-y-4 text-center">
          <p className="text-[19px] font-medium uppercase leading-[19px] tracking-[0.25em] text-[#FFE8A6] sm:text-[21px] sm:leading-[21px] lg:text-[25px] lg:leading-[25px]">
            Reach and Inventory
          </p>
          <h2 className="text-[36px] font-semibold leading-[60px] text-center text-[#FFFFFF] sm:text-[44px] md:text-[52px] lg:text-[60px]">
            Network Nationwide and Listings Nationwide
          </h2>
          <p className="text-[16px] font-normal leading-[24px] text-center text-[#FFFFFF] sm:text-[18px] sm:leading-[26px] md:text-[21px] md:leading-[28px] lg:text-[25px] lg:leading-[30px]">
            We pair every city with a dedicated local team while syncing live inventory across the Philippines. The moment a property moves, your feed updates across every connected neighborhood.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {HIGHLIGHTS.map((highlight) => (
            <article
              key={highlight.title}
              className="rounded-2xl border border-[#F4EDD8] bg-[#FFFFFF] p-8 transition hover:-translate-y-1"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8A6]/30">
                  <Image src={highlight.icon} alt={highlight.title} width={52} height={52} />
                </div>
                <h3 className="text-4xl  text-[#D9991D]">{highlight.title}</h3>
              </div>
              <p className="mt-5 text-2xl font-light leading-relaxed text-[#D9991D]">{highlight.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
