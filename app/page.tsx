'use client'

import { useState } from 'react'
import { formatCAD } from '@/lib/utils'

const CESG_ANNUAL_MAX = 500
const CESG_LIFETIME_MAX = 7200

function buildProjection(roi: number) {
  const monthlyRate = roi / 100 / 12
  let balance = 0
  let totalContributed = 0
  let totalCESG = 0
  let csgRemaining = CESG_LIFETIME_MAX

  // Maximum profit strategy:
  // Dump $10,000/yr for 5 years (hits $50K cap fastest)
  // Gets $500 CESG each year on the first $2,500 of each contribution
  // Then 30 years of pure tax-free compound growth
  const schedule: number[] = []
  for (let i = 0; i < 5; i++) schedule.push(10000)
  for (let i = 5; i <= 35; i++) schedule.push(0)

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

    rows.push({
      age,
      contribution,
      cesg: Math.round(cesg),
      growth,
      totalContributed,
      totalCESG: Math.round(totalCESG),
      balance: Math.round(balance),
    })
  }

  return { rows, totalCESG: Math.round(totalCESG), peakBalance: rows[rows.length - 1].balance }
}

export default function RespMaxProfitPage() {
  const [roi, setRoi] = useState(8)
  const { rows, totalCESG, peakBalance } = buildProjection(roi)

  const totalGrowth = peakBalance - 50000 - totalCESG
  const valueAt18 = rows.find(r => r.age === 18)?.balance ?? 0
  const valueAt32 = rows.find(r => r.age === 32)?.balance ?? 0

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">RESP: Maximum Profit Strategy</h1>
        <p className="text-muted-foreground mb-8">
          $10,000/yr for 5 years. Cap hit by age 4. Then 30+ years of tax-free compound growth.
        </p>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-8">
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">You Put In</p>
            <p className="text-2xl font-bold tnum">{formatCAD(50000)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Government Gave</p>
            <p className="text-2xl font-bold tnum text-blue-500">{formatCAD(totalCESG)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Market Grew</p>
            <p className="text-2xl font-bold tnum text-green-600">+{formatCAD(totalGrowth)}</p>
          </div>
          <div className="rounded-lg border p-4 border-green-300 bg-green-50">
            <p className="text-xs uppercase tracking-wide text-green-700">Total at 35</p>
            <p className="text-2xl font-bold tnum text-green-700">{formatCAD(peakBalance)}</p>
          </div>
        </div>

        {/* Key milestones */}
        <div className="rounded-lg border bg-card p-6 mb-8">
          <h2 className="font-semibold mb-3">Key Milestones</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Done Contributing</p>
              <p className="text-lg font-bold">Age 4</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Available at 18</p>
              <p className="text-lg font-bold tnum text-invest">{formatCAD(valueAt18)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Withdraw at 32-34</p>
              <p className="text-lg font-bold tnum text-invest">{formatCAD(valueAt32)}</p>
            </div>
          </div>
        </div>

        {/* Trade-off note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-8">
          <p className="text-sm text-amber-900">
            <strong>Trade-off:</strong> You only capture {formatCAD(totalCESG)} of the possible $7,200 in CESG because contributions stop at age 4 (CESG requires new contributions each year). You sacrifice ~{formatCAD(7200 - totalCESG)} in free government money but gain significantly more in compound growth from front-loading.
          </p>
        </div>

        {/* ROI slider */}
        <div className="flex items-center gap-4 mb-6">
          <label className="text-sm font-medium whitespace-nowrap">Annual Return:</label>
          <input type="range" min={4} max={12} step={0.5} value={roi} onChange={e => setRoi(Number(e.target.value))} className="flex-1" />
          <span className="text-sm font-bold tnum w-12 text-right">{roi}%</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="p-3">Age</th>
                <th className="p-3 text-right">Contribution</th>
                <th className="p-3 text-right">CESG</th>
                <th className="p-3 text-right">Growth</th>
                <th className="p-3 text-right">Total In</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.age} className={`border-b last:border-0 ${r.age === 4 || r.age === 18 || r.age === 32 ? 'bg-blue-50 font-medium' : ''}`}>
                  <td className="p-3 font-medium">{r.age}</td>
                  <td className="p-3 text-right tnum">{r.contribution > 0 ? formatCAD(r.contribution) : ''}</td>
                  <td className="p-3 text-right tnum text-blue-500">{r.cesg > 0 ? formatCAD(r.cesg) : ''}</td>
                  <td className="p-3 text-right tnum text-green-600">{r.growth > 0 ? `+${formatCAD(r.growth)}` : ''}</td>
                  <td className="p-3 text-right tnum text-muted-foreground">{formatCAD(r.totalContributed)}</td>
                  <td className="p-3 text-right tnum font-semibold">{formatCAD(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {roi}% annual return compounded monthly. $50,000 lifetime contribution cap. CESG only earned during contribution years.
        </p>
      </div>
    </div>
  )
}
