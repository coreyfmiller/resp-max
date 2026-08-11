'use client'

import { useState } from 'react'
import { formatCAD } from '@/lib/utils'

const CESG_ANNUAL_MAX = 500
const CESG_LIFETIME_MAX = 7200

const PRESETS = [
  { label: 'S&P 500 (SPY)', roi: 10.5, mer: 0.09, info: 'Tracks the 500 largest US companies. The most popular index fund in the world. Includes Apple, Microsoft, Amazon, Google, etc. 30-year average return ~10.5%. Extremely diversified across US large-cap. Currency risk for Canadians (USD denominated). MER of 0.09% means you pay $0.90 per $1,000 invested annually.' },
  { label: 'Nasdaq 100 (QQQ)', roi: 14.5, mer: 0.20, info: 'Tracks the 100 largest non-financial companies on Nasdaq. Heavy tech weighting: Apple, Microsoft, Nvidia, Meta, Google, Amazon, Tesla. Higher growth but more volatile. 30-year average ~14.5% but with bigger drawdowns (dropped 80% in 2000, 33% in 2022). MER of 0.20% means $2 per $1,000 annually. Best for long time horizons where you can ride out crashes.' },
  { label: 'Balanced Growth (VGRO)', roi: 8.5, mer: 0.24, info: 'Vanguard Growth ETF. 80% stocks / 20% bonds. All-in-one portfolio: holds Canadian, US, international stocks plus Canadian and global bonds. Less volatile than pure equity. 5-year average ~8.5%. Automatically rebalances. Great "set and forget" option. MER of 0.24% means $2.40 per $1,000 annually. Popular choice for RESPs due to built-in diversification.' },
  { label: 'Custom', roi: 0, mer: 0, info: '' },
]

// Three contribution strategies, all totaling $50,000
const STRATEGIES = [
  {
    id: 'aggressive',
    name: 'Aggressive Front-Load',
    description: '$10,000/yr for 5 years. Maximum compound time.',
    schedule: [...Array(5).fill(10000), ...Array(31).fill(0)],
  },
  {
    id: 'moderate',
    name: 'Moderate Front-Load',
    description: '$5,000/yr for 10 years. Balanced approach.',
    schedule: [...Array(10).fill(5000), ...Array(26).fill(0)],
  },
  {
    id: 'standard',
    name: 'Standard (Max CESG)',
    description: '$2,941/yr for 17 years. Captures most CESG.',
    schedule: [...Array(17).fill(2941), ...Array(19).fill(0)],
  },
]

function buildProjection(schedule: number[], effectiveRoi: number) {
  const monthlyRate = effectiveRoi / 100 / 12
  let balance = 0
  let totalContributed = 0
  let totalCESG = 0
  let csgRemaining = CESG_LIFETIME_MAX

  const rows = []

  for (let age = 0; age <= 35; age++) {
    const yearStart = balance
    const contribution = schedule[age] ?? 0

    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate)
      if (contribution > 0) balance += contribution / 12
    }

    let cesg = 0
    if (contribution > 0 && csgRemaining > 0 && age <= 17) {
      cesg = Math.min(CESG_ANNUAL_MAX, contribution * 0.2, csgRemaining)
      csgRemaining -= cesg
      totalCESG += cesg
      balance += cesg
    }

    totalContributed += contribution
    const growth = Math.round(balance - yearStart - contribution - cesg)

    rows.push({ age, contribution, cesg: Math.round(cesg), growth, totalContributed: Math.round(totalContributed), balance: Math.round(balance) })
  }

  return { rows, totalCESG: Math.round(totalCESG), finalBalance: rows[rows.length - 1].balance, valueAt18: rows.find(r => r.age === 18)?.balance ?? 0, valueAt32: rows.find(r => r.age === 32)?.balance ?? 0 }
}

export default function RespMaxPage() {
  const [roi, setRoi] = useState(10.5)
  const [mer, setMer] = useState(0.09)
  const [activePreset, setActivePreset] = useState('S&P 500 (SPY)')
  const [activeStrategy, setActiveStrategy] = useState('aggressive')
  const [showInfo, setShowInfo] = useState<string | null>(null)
  const effectiveRoi = roi - mer

  const projections = STRATEGIES.map(s => ({
    ...s,
    ...buildProjection(s.schedule, effectiveRoi),
  }))

  const active = projections.find(p => p.id === activeStrategy)!
  const best = projections.reduce((a, b) => a.finalBalance > b.finalBalance ? a : b)
  const worst = projections.reduce((a, b) => a.finalBalance < b.finalBalance ? a : b)

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">RESP Maximum Growth Calculator</h1>
        <p className="text-gray-500 mb-8">$50,000 lifetime cap. Three strategies. Same money in, different outcomes.</p>

        {/* Investment selection */}
        <div className="rounded-xl border bg-gray-50 p-5 mb-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Investment Vehicle (Historical Annual Returns)</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <div key={p.label} className="flex items-center gap-1">
                <button
                  onClick={() => { if (p.roi > 0) { setRoi(p.roi); setMer(p.mer); setActivePreset(p.label) } else { setActivePreset('Custom') } }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activePreset === p.label ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'}`}
                >
                  {p.label}
                  {p.roi > 0 && <span className="ml-1 text-xs opacity-70">{p.roi}%</span>}
                </button>
                {p.info && (
                  <button
                    onClick={() => setShowInfo(showInfo === p.label ? null : p.label)}
                    className="w-6 h-6 rounded-full border border-gray-300 text-gray-400 text-xs font-bold hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center"
                    aria-label={`Info about ${p.label}`}
                  >
                    i
                  </button>
                )}
              </div>
            ))}
          </div>
          {showInfo && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 leading-relaxed">
              <div className="flex justify-between items-start gap-2">
                <p>{PRESETS.find(p => p.label === showInfo)?.info}</p>
                <button onClick={() => setShowInfo(null)} className="text-blue-400 hover:text-blue-600 text-lg leading-none shrink-0">&times;</button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4">
            <input type="range" min={4} max={20} step={0.5} value={roi} onChange={e => { setRoi(Number(e.target.value)); setActivePreset('Custom') }} className="flex-1 accent-blue-600" />
            <span className="text-sm font-bold tnum w-20 text-right">{effectiveRoi.toFixed(2)}% net</span>
          </div>
          <p className="text-xs text-gray-400">{roi}% gross return - {mer}% MER = {effectiveRoi.toFixed(2)}% effective annual return</p>
        </div>

        {/* Strategy comparison cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {projections.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveStrategy(p.id)}
              className={`rounded-xl border p-5 text-left transition ${activeStrategy === p.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-200'}`}
            >
              <p className="text-sm font-semibold mb-1">{p.name}</p>
              <p className="text-xs text-gray-500 mb-4">{p.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CESG captured</span>
                  <span className="font-semibold text-blue-600">{formatCAD(p.totalCESG)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Value at 18</span>
                  <span className="font-semibold">{formatCAD(p.valueAt18)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Value at 32</span>
                  <span className="font-semibold">{formatCAD(p.valueAt32)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-medium">Value at 35</span>
                  <span className="font-bold text-green-700">{formatCAD(p.finalBalance)}</span>
                </div>
              </div>
              {p.id === best.id && <span className="inline-block mt-3 text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Best outcome</span>}
            </button>
          ))}
        </div>

        {/* Advantage callout */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-8">
          <p className="text-sm text-green-900">
            <strong>Front-loading advantage:</strong> {best.name} beats {worst.name} by <strong>{formatCAD(best.finalBalance - worst.finalBalance)}</strong> at age 35.
            Same $50,000 contributed. The difference is pure compound growth from getting money in earlier.
            {best.totalCESG < worst.totalCESG && ` (Even though it captures ${formatCAD(worst.totalCESG - best.totalCESG)} less in CESG grants.)`}
          </p>
        </div>

        {/* Active strategy table */}
        <h2 className="text-lg font-bold mb-4">{active.name} - Year by Year</h2>
        <div className="overflow-x-auto rounded-lg border mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="p-3">Age</th>
                <th className="p-3 text-right">Contribution</th>
                <th className="p-3 text-right">CESG</th>
                <th className="p-3 text-right">Growth</th>
                <th className="p-3 text-right">Total In</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {active.rows.map(r => (
                <tr key={r.age} className={`border-b last:border-0 ${r.age === 18 || r.age === 32 ? 'bg-blue-50 font-medium' : ''}`}>
                  <td className="p-3 font-medium">{r.age}</td>
                  <td className="p-3 text-right tnum">{r.contribution > 0 ? formatCAD(r.contribution) : ''}</td>
                  <td className="p-3 text-right tnum text-blue-600">{r.cesg > 0 ? formatCAD(r.cesg) : ''}</td>
                  <td className="p-3 text-right tnum text-green-600">{r.growth > 0 ? `+${formatCAD(r.growth)}` : ''}</td>
                  <td className="p-3 text-right tnum text-gray-400">{formatCAD(r.totalContributed)}</td>
                  <td className="p-3 text-right tnum font-semibold">{formatCAD(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Withdrawal Scenarios */}
        <h2 className="text-lg font-bold mb-2 mt-12">What Happens at Withdrawal?</h2>
        <p className="text-gray-500 text-sm mb-6">Same RESP balance, three different life paths. Tax impact changes everything.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(() => {
            const balance = active.finalBalance
            const contributions = 50000
            const cesg = active.totalCESG
            const growth = balance - contributions - cesg

            // Progressive NB tax calculator (combined federal + provincial, 2024 rates)
            const calcProgressiveTax = (income: number) => {
              let tax = 0
              const brackets = [
                { limit: 15705, rate: 0 },
                { limit: 55867, rate: 0.244 },
                { limit: 111733, rate: 0.304 },
                { limit: 154906, rate: 0.36 },
                { limit: 221708, rate: 0.42 },
                { limit: Infinity, rate: 0.528 },
              ]
              let prev = 0
              for (const b of brackets) {
                const taxable = Math.min(income, b.limit) - prev
                if (taxable > 0) tax += taxable * b.rate
                prev = b.limit
                if (income <= b.limit) break
              }
              return tax
            }

            // Scenario 1: School at 20 (withdraw during undergrad over 4 years)
            const balanceAt20 = active.valueAt18
            const growthAt20 = Math.max(0, balanceAt20 - contributions - cesg)
            const eapAt20 = growthAt20 + cesg
            const taxAt20 = calcProgressiveTax(eapAt20 / 4) * 4 // Spread over 4 years as student
            const effectiveTaxAt20 = eapAt20 > 0 ? Math.round((taxAt20 / eapAt20) * 100) : 0
            const netAt20 = contributions + (eapAt20 - taxAt20)

            // Scenario 2: Collapse at 35 (no school ever)
            const cesgReturned = cesg
            // AIP: taxed at marginal + 20% penalty
            // CRA treats AIP as regular income (marginal tax) plus Part X.5 tax (flat 20% on AIP amount)
            const aipIncomeTax = calcProgressiveTax(growth / 3) * 3 // Progressive income tax spread over 3 years
            const aipPenalty = growth * 0.20 // Flat 20% additional penalty
            const penaltyTax = aipIncomeTax + aipPenalty
            const incomeTaxRate = growth > 0 ? Math.round((aipIncomeTax / growth) * 100) : 0
            const effectiveTaxCollapse = growth > 0 ? Math.round((penaltyTax / growth) * 100) : 0
            const netCollapse = contributions + Math.max(0, growth - penaltyTax) // Contributions back tax-free, growth hammered

            // Scenario 3: Optimal (Enroll part-time at 32, withdraw over 3 years 32-34, buffer before 35)
            const balanceAt32 = active.valueAt32
            const growthAt32 = Math.max(0, balanceAt32 - contributions - cesg)
            const eapAt32 = growthAt32 + cesg
            // Progressive tax on EAP split over 3 years (no employment income assumed)
            const annualEAP = eapAt32 / 3
            const taxPerYear = calcProgressiveTax(annualEAP)
            const taxAt32 = taxPerYear * 3
            const effectiveTaxRate = Math.round((taxAt32 / eapAt32) * 100)
            const netAt32 = contributions + (eapAt32 - taxAt32)

            // Sort by net cash: lowest to highest
            const scenarios = [
              {
                title: 'Collapse at 35',
                subtitle: 'Never enrolled in school',
                icon: '⚠️',
                balance: balance,
                taxRate: `~${incomeTaxRate}%`,
                penalty: aipPenalty,
                taxPaid: penaltyTax,
                cesgKept: false,
                net: netCollapse,
                color: 'red',
                note: `CESG (${formatCAD(cesgReturned)}) returned to government. Growth taxed at marginal rate (~${incomeTaxRate}%) plus 20% CRA penalty = ~${effectiveTaxCollapse}% effective. This is intentional: CRA penalizes non-educational use.`,
                optimal: false,
              },
              {
                title: 'School at 20',
                subtitle: 'Undergrad, withdraw over 4 years as student',
                icon: '🎓',
                balance: balanceAt20,
                taxRate: `~${effectiveTaxAt20}%`,
                penalty: 0,
                taxPaid: taxAt20,
                cesgKept: true,
                net: netAt20,
                color: 'green',
                note: 'Low bracket as full-time student with no other income. Smallest balance due to fewer years of growth.',
                optimal: false,
              },
              {
                title: 'Part-time MBA at 32',
                subtitle: 'Enroll in part-time MBA or additional schooling at 32. Withdraw over 3 years (32-34).',
                icon: '💎',
                balance: balanceAt32,
                taxRate: `~${effectiveTaxRate}%`,
                penalty: 0,
                taxPaid: taxAt32,
                cesgKept: true,
                net: netAt32,
                color: 'green',
                note: `Enroll part-time at 32, stay enrolled through 34. ${formatCAD(annualEAP)}/yr EAP income over 3 years (no employment income). 1 year buffer before mandatory close at 35.`,
                optimal: true,
              },
            ].sort((a, b) => a.net - b.net)

            return scenarios.map(s => (
              <div key={s.title} className={`rounded-xl border p-5 ${s.optimal ? 'border-green-400 bg-green-50 ring-2 ring-green-400' : s.color === 'green' ? 'border-green-200' : s.color === 'blue' ? 'border-blue-200' : 'border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.subtitle}</p>
                  </div>
                </div>
                {s.optimal && <span className="inline-block mb-3 text-xs font-medium bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Recommended: Max cash in hand</span>}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">RESP Balance</span>
                    <span className="font-semibold">{formatCAD(s.balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Income Tax</span>
                    <span className="font-medium">{s.taxRate}</span>
                  </div>
                  {s.penalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">20% CRA Penalty</span>
                      <span className="font-medium text-red-600">-{formatCAD(s.penalty)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Tax</span>
                    <span className="font-medium text-red-600">-{formatCAD(s.taxPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CESG</span>
                    <span className={s.cesgKept ? 'text-green-600' : 'text-red-600'}>{s.cesgKept ? 'Kept' : 'Returned to gov'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="font-semibold">Cash in Hand</span>
                    <span className="font-bold text-green-700">{formatCAD(s.net)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">{s.note}</p>
              </div>
            ))
          })()}
        </div>

        {/* Footnotes */}
        <div className="space-y-2 text-xs text-gray-400 text-center">
          <p>{effectiveRoi.toFixed(2)}% effective annual return ({roi}% gross - {mer}% MER) compounded monthly.</p>
          <p>$50,000 lifetime contribution cap. CESG: 20% on first $2,500/yr, $7,200 lifetime max. All strategies contribute exactly $50,000.</p>
          <p>Age 18 = typical post-secondary start. Age 32 = optimal withdrawal window (enroll in qualifying program, extract over 3 tax years).</p>
        </div>
      </div>
    </div>
  )
}
