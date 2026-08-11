'use client'

import { useState } from 'react'
import { formatCAD } from '@/lib/utils'

const CESG_ANNUAL_MAX = 500
const CESG_LIFETIME_MAX = 7200

const PRESETS = [
  { label: 'S&P 500 (SPY)', roi: 10.5, mer: 0.09 },
  { label: 'Nasdaq 100 (QQQ)', roi: 14.5, mer: 0.20 },
  { label: 'Canadian Market (XIU)', roi: 8, mer: 0.18 },
  { label: 'Conservative', roi: 4.5, mer: 0.10 },
  { label: 'Custom', roi: 0, mer: 0 },
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
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Investment Vehicle</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { if (p.roi > 0) { setRoi(p.roi); setMer(p.mer); setActivePreset(p.label) } else { setActivePreset('Custom') } }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activePreset === p.label ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'}`}
              >
                {p.label}
                {p.roi > 0 && <span className="ml-1 text-xs opacity-70">{p.roi}%</span>}
              </button>
            ))}
          </div>
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
