const cadWhole = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
})

export function formatCAD(value: number) {
  return cadWhole.format(Number.isFinite(value) ? value : 0)
}
