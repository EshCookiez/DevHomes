'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { GENERAL_NAV_ITEMS } from '@/lib/general-nav'
import { MORTGAGE_RATES } from '@/lib/mock-data'

const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtPeso = (n: number) => `₱ ${fmt(n)}`

function calcMonthly(principal: number, annualRate: number, years: number) {
  if (!principal || !annualRate || !years) return 0
  const r = annualRate / 100 / 12
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export default function MortgagePage() {
  const [price, setPrice] = useState(5000000)
  const [downPercent, setDownPercent] = useState(20)
  const [years, setYears] = useState(20)
  const [rateIndex, setRateIndex] = useState(1) // BPI default

  const downPayment = (price * downPercent) / 100
  const loanAmount = price - downPayment
  const selectedBank = MORTGAGE_RATES.bank_rates[rateIndex]
  const annualRate = years <= 1 ? selectedBank.rate_1yr
    : years <= 5 ? selectedBank.rate_5yr
    : years <= 10 ? selectedBank.rate_10yr
    : selectedBank.rate_20yr

  const monthly = useMemo(() => calcMonthly(loanAmount, annualRate, years), [loanAmount, annualRate, years])
  const totalPaid = monthly * years * 12
  const totalInterest = totalPaid - loanAmount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-[#0c1f4a] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-white font-extrabold text-xl tracking-tight">HomesPH</Link>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-white/70">
            {GENERAL_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-white ${item.href === '/mortgage' ? 'text-white' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#0c1f4a] to-[#1428ae] py-14 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Financial Tools</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Mortgage Calculator</h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Estimate your monthly home loan payments using current bank rates. Compare lenders and plan your property investment with confidence.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Calculator ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Loan Calculator</h2>

              <div className="space-y-5">
                {/* Property Price */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                    <span>Property Price</span>
                    <span className="text-[#1428ae] font-bold">{fmtPeso(price)}</span>
                  </label>
                  <input type="range" min={500000} max={50000000} step={500000} value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#1428ae] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>₱500K</span><span>₱50M</span>
                  </div>
                </div>

                {/* Down Payment */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                    <span>Down Payment</span>
                    <span className="text-[#1428ae] font-bold">{downPercent}% — {fmtPeso(downPayment)}</span>
                  </label>
                  <input type="range" min={10} max={50} step={5} value={downPercent}
                    onChange={e => setDownPercent(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-[#1428ae] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>10%</span><span>50%</span>
                  </div>
                </div>

                {/* Loan Term */}
                <div>
                  <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                    <span>Loan Term</span>
                    <span className="text-[#1428ae] font-bold">{years} years</span>
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 25, 30].map(y => (
                      <button key={y} onClick={() => setYears(y)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors border ${
                          years === y ? 'bg-[#1428ae] text-white border-[#1428ae]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1428ae]/40'
                        }`}
                      >{y}yr</button>
                    ))}
                  </div>
                </div>

                {/* Bank Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Bank</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MORTGAGE_RATES.bank_rates.map((bank, i) => (
                      <button key={i} onClick={() => setRateIndex(i)}
                        className={`text-xs font-semibold py-2.5 px-3 rounded-xl transition-all border text-left ${
                          rateIndex === i ? 'bg-[#1428ae] text-white border-[#1428ae]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#1428ae]/40'
                        }`}
                      >
                        {bank.bank.split(' ')[0]}
                        <span className={`block text-[10px] font-normal mt-0.5 ${rateIndex === i ? 'text-white/70' : 'text-gray-400'}`}>
                          {bank.rate_1yr}% – {bank.rate_20yr}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bank Rate Comparison Table ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Current Bank Rates Comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Bank</th>
                      <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-gray-400">1 Year</th>
                      <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-gray-400">5 Years</th>
                      <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-gray-400">10 Years</th>
                      <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-gray-400">20 Years</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MORTGAGE_RATES.bank_rates.map((bank, i) => (
                      <tr key={i} className={`${i === rateIndex ? 'bg-[#1428ae]/5' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                        onClick={() => setRateIndex(i)}>
                        <td className="py-3 font-semibold text-gray-900">
                          {bank.bank}
                          {i === rateIndex && <span className="ml-2 text-[9px] font-bold text-[#1428ae] uppercase bg-[#1428ae]/10 px-2 py-0.5 rounded-full">Selected</span>}
                        </td>
                        <td className="py-3 text-right text-gray-700">{bank.rate_1yr}%</td>
                        <td className="py-3 text-right text-gray-700">{bank.rate_5yr}%</td>
                        <td className="py-3 text-right text-gray-700">{bank.rate_10yr}%</td>
                        <td className="py-3 text-right text-gray-700">{bank.rate_20yr}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">* Rates are indicative. Contact banks directly for official rates and terms.</p>
            </div>

            {/* ── Pag-IBIG Section ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🏛️</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">Pag-IBIG Housing Loan</h2>
                  <p className="text-sm text-gray-500 mb-4">The Home Development Mutual Fund offers the most affordable housing loan rates in the Philippines.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-xl font-bold text-green-700">₱{(MORTGAGE_RATES.pag_ibig_info.max_loan / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-green-600 font-medium mt-0.5">Maximum Loan</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xl font-bold text-blue-700">{MORTGAGE_RATES.pag_ibig_info.max_repayment_period} Yrs</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">Max Repayment</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <p className="text-xl font-bold text-amber-700">{MORTGAGE_RATES.pag_ibig_info.min_contribution_period} Mos</p>
                      <p className="text-xs text-amber-600 font-medium mt-0.5">Min. Contributions</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Lowest interest rates starting at 5.75% p.a.</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Available to all Pag-IBIG members with at least 24 monthly contributions</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> OFWs and locally employed can both apply</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Loan can be used for purchase, construction, or home improvement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ── Results Panel ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Monthly Payment */}
              <div className="bg-[#1428ae] rounded-2xl p-6 text-white text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Monthly Payment</p>
                <p className="text-4xl font-extrabold">{fmtPeso(Math.round(monthly))}</p>
                <p className="text-white/60 text-xs mt-2">at {annualRate}% per annum</p>
              </div>

              {/* Loan Summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Loan Summary</h3>
                {[
                  { label: 'Property Price', value: fmtPeso(price) },
                  { label: 'Down Payment', value: `${fmtPeso(downPayment)} (${downPercent}%)` },
                  { label: 'Loan Amount', value: fmtPeso(loanAmount) },
                  { label: 'Interest Rate', value: `${annualRate}% p.a.` },
                  { label: 'Loan Term', value: `${years} years` },
                  { label: 'Total Interest', value: fmtPeso(Math.round(totalInterest)), highlight: true },
                  { label: 'Total Payment', value: fmtPeso(Math.round(totalPaid)), highlight: true },
                ].map(row => (
                  <div key={row.label} className={`flex justify-between items-center text-sm ${row.highlight ? 'border-t border-gray-100 pt-3' : ''}`}>
                    <span className="text-gray-500">{row.label}</span>
                    <span className={`font-semibold ${row.highlight ? 'text-[#1428ae]' : 'text-gray-900'}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Tips */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h3 className="font-bold text-amber-800 text-sm mb-2">💡 Mortgage Tips</h3>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li>• A larger down payment reduces your interest cost significantly.</li>
                  <li>• Pag-IBIG offers the lowest rates for eligible members.</li>
                  <li>• Pre-qualify at your bank before making an offer.</li>
                  <li>• Budget for additional costs: taxes, registration, move-in fees.</li>
                </ul>
              </div>

              <Link href="/buy"
                className="block w-full text-center bg-[#1428ae] text-white font-bold text-sm py-3.5 rounded-xl hover:bg-amber-500 hover:text-[#1428ae] transition-colors">
                Browse Properties to Buy →
              </Link>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Mortgage Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { q: 'How much can I borrow?', a: 'Most banks lend up to 80–90% of the property\'s appraised value. Pag-IBIG lends up to ₱6.5M. Your income will also determine the maximum loan you can handle.' },
              { q: 'What documents are needed?', a: 'Typically: valid government ID, Certificate of Employment, latest 3 months payslips, ITR, and the contract to sell or reservation agreement.' },
              { q: 'How long does approval take?', a: 'Bank approval usually takes 5–15 business days. Pag-IBIG can take 30–60 days. Having complete documents speeds up the process.' },
              { q: 'Can I pay off early?', a: 'Yes. Most lenders allow early or extra payments. Some charge a pre-payment penalty during the fixed-rate period — check your loan terms.' },
              { q: 'What is an amortization schedule?', a: 'A breakdown of each monthly payment showing the split between principal repayment and interest. Early payments are mostly interest; later payments are mostly principal.' },
              { q: 'Is my income sufficient?', a: 'A general rule: your monthly amortization should not exceed 30–35% of your gross monthly income.' },
            ].map(faq => (
              <details key={faq.q} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
                <summary className="font-semibold text-sm text-gray-900 cursor-pointer list-none flex justify-between items-center px-5 py-4 bg-gray-50 hover:bg-[#1428ae]/5 transition-colors">
                  {faq.q}
                  <span className="text-[#1428ae] group-open:rotate-180 transition-transform shrink-0 ml-2">▾</span>
                </summary>
                <p className="px-5 py-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0c1f4a] mt-16 py-8 px-4 text-center">
        <p className="text-white/40 text-xs">
          © {new Date().getFullYear()} HomesPH. Mortgage calculations are estimates only. Consult a licensed financial advisor before making decisions.
        </p>
        <div className="mt-3 flex justify-center gap-4 text-xs text-white/50">
          <Link href="/buy" className="hover:text-white transition-colors">Buy</Link>
          <Link href="/rent" className="hover:text-white transition-colors">Rent</Link>
          <Link href="/news" className="hover:text-white transition-colors">News</Link>
          <Link href="/legal" className="hover:text-white transition-colors">Legal Guide</Link>
        </div>
      </footer>
    </div>
  )
}
