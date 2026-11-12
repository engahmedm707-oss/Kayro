const KEY = 'perfume_cart'
export function getCart() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
export function saveCart(items) { localStorage.setItem(KEY, JSON.stringify(items)) }
export function addToCart(item) {
  const cart = getCart()
  const idx = cart.findIndex(i => i.variantId === item.variantId)
  if (idx >= 0) cart[idx].quantity += item.quantity
  else cart.push(item)
  saveCart(cart); return cart
}
export function updateQty(variantId, quantity) {
  let cart = getCart().map(i => i.variantId === variantId ? { ...i, quantity } : i).filter(i => i.quantity > 0)
  saveCart(cart); return cart
}
export function removeFromCart(variantId) { const cart = getCart().filter(i => i.variantId !== variantId); saveCart(cart); return cart }
export function clearCart() { saveCart([]) }
