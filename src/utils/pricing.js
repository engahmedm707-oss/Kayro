export function getEffectivePrice(price, discountType, discountValue) {
  const p = Number(price) || 0
  const v = Number(discountValue) || 0
  if (!discountType || discountType === 'none' || v <= 0) return { finalPrice: p, discountAmount: 0 }
  if (discountType === 'percentage') {
    const pct = Math.min(Math.max(v, 0), 100)
    const discountAmount = +(p * pct / 100).toFixed(2)
    return { finalPrice: Math.max(+(p - discountAmount).toFixed(2), 0), discountAmount }
  }
  if (discountType === 'fixed') {
    const discountAmount = Math.min(v, p)
    return { finalPrice: Math.max(+(p - discountAmount).toFixed(2), 0), discountAmount: +discountAmount.toFixed(2) }
  }
  return { finalPrice: p, discountAmount: 0 }
}

export function formatEGP(n) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(Number(n) || 0)
}
