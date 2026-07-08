/**
 * Server-side pricing engine — mirrors computePricing() in the CRM frontend
 * (wandra-crm/src/store/AppContext.jsx) so quotes/invoices are consistent no
 * matter where they're computed.
 */
export function computePricing(pkg = {}) {
  // Builder mode: totals already computed line-by-line by the QuoteBuilder
  if (pkg.pricing?.mode === 'Builder' && pkg.pricing.grandTotal != null) {
    const p = pkg.pricing
    return {
      cabTotal: p.transportSell || 0,
      hotelTotal: p.hotelSell || 0,
      otherTotal: (p.flightSell || 0) + (p.extraSell || 0),
      subtotal: p.sellingPrice || 0,
      discount: 0,
      gstPercent: p.gstPercent || 0,
      gstAmount: p.gstAmount || 0,
      grandTotal: p.grandTotal || 0,
      componentsCost: p.costPrice || 0,
      profit: p.profit || 0,
    }
  }

  const num = (v) => Number(v) || 0
  const cabTotal = (pkg.cabs || []).reduce((s, c) => s + num(c.km) * num(c.rate), 0)
  const hotelTotal = (pkg.hotelsAlloc || []).reduce((s, h) => s + num(h.price), 0)
  const otherTotal = (pkg.categories || []).reduce((s, c) => s + num(c.amount), 0)
  const base = num(pkg.pricing?.packageCost) + num(pkg.pricing?.childCost)
  const subtotal = base + cabTotal + hotelTotal + otherTotal
  const discount = num(pkg.pricing?.discount)
  const afterDiscount = Math.max(0, subtotal - discount)
  const gstPercent = num(pkg.pricing?.gstPercent)
  const gstAmount = Math.round((afterDiscount * gstPercent) / 100)
  const grandTotal = afterDiscount + gstAmount
  const hotelNet = (pkg.hotelsAlloc || []).reduce((s, h) => s + num(h.net), 0)
  const componentsCost = hotelNet + cabTotal
  const profit = grandTotal - componentsCost - otherTotal
  return { cabTotal, hotelTotal, otherTotal, subtotal, discount, gstPercent, gstAmount, grandTotal, componentsCost, profit }
}

export default computePricing
