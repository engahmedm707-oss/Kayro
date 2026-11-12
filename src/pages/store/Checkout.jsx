import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { getCart, clearCart } from '../../lib/cart'
import { formatEGP } from '../../utils/pricing'
import { useI18n } from '../../i18n'

export default function Checkout() {
  const { user, profile } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const [items] = useState(getCart())
  const [govs, setGovs] = useState([])
  const [form, setForm] = useState({ name:'', phone:'', email:'', address:'', city:'', governorate:'', payment_method:'cod', vodafone_ref:'', notes:'' })
  const [screenshot, setScreenshot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { supabase.from('governorate_shipping').select('*').eq('is_active', true).order('name').then(({data})=>setGovs(data||[])) }, [])
  useEffect(() => {
    if (profile || user) setForm(f => ({ ...f, name: profile?.name || f.name, phone: profile?.phone || f.phone, email: user?.email || f.email, address: profile?.address || f.address, city: profile?.city || f.city, governorate: profile?.governorate || f.governorate }))
  }, [profile, user])

  const subtotal = items.reduce((s,i)=>s + (Number(i.finalPrice)||0)*i.quantity, 0)
  const discountTotal = items.reduce((s,i)=>s + (Math.max(Number(i.unitPrice)-Number(i.finalPrice),0)||0)*i.quantity, 0)
  const selectedGov = govs.find(g=>g.name===form.governorate)
  const shippingFee = Number(selectedGov?.shipping_fee || 0)
  const taxAmount = 0
  const total = +(subtotal + shippingFee + taxAmount).toFixed(2)

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const placeOrder = async (e) => {
    e.preventDefault(); setError('')
    if (!items.length) return setError(t('cartEmptyTitle'))
    if (!form.governorate) return setError(t('required'))
    if (form.payment_method === 'vodafone_cash' && !form.vodafone_ref) return setError(t('vodafoneRefRequired'))
    setLoading(true)
    try {
      let screenshotUrl = null
      if (form.payment_method === 'vodafone_cash' && screenshot) {
        const path = `payments/${user.id}/${Date.now()}_${screenshot.name}`
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, screenshot)
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path)
        screenshotUrl = pub.publicUrl
      }
      const payment_status = form.payment_method === 'vodafone_cash' ? 'awaiting_verification' : 'pending'
      const { data: order, error: oErr } = await supabase.from('orders').insert({
        user_id: user.id, status: 'pending', payment_method: form.payment_method, payment_status,
        customer_name: form.name, customer_phone: form.phone, customer_email: form.email,
        customer_address: form.address, customer_city: form.city, customer_governorate: form.governorate,
        subtotal, discount_total: discountTotal, shipping_fee: shippingFee, tax_amount: taxAmount, total,
        vodafone_ref: form.vodafone_ref || null, vodafone_screenshot_url: screenshotUrl, notes: form.notes || null
      }).select().single()
      if (oErr) throw oErr
      const orderItems = items.map(i => ({
        order_id: order.id, product_id: i.productId, variant_id: i.variantId,
        product_name: i.name, brand: i.brand, size_capacity: i.sizeCapacity,
        unit_price: i.finalPrice, discount_type: i.discountType, discount_value: i.discountValue,
        quantity: i.quantity, line_total: +(i.finalPrice * i.quantity).toFixed(2)
      }))
      const { error: iErr } = await supabase.from('order_items').insert(orderItems)
      if (iErr) throw iErr
      for (const i of items) {
        const { data: v } = await supabase.from('product_variants').select('stock_quantity').eq('id', i.variantId).single()
        if (v) await supabase.from('product_variants').update({ stock_quantity: Math.max((v.stock_quantity||0) - i.quantity, 0) }).eq('id', i.variantId)
      }
      await supabase.from('notifications').insert([
        { target_user_id: user.id, target_role: 'customer', type: 'order_placed', title: 'Order placed', message: `Your order #${order.id} has been placed.`, payload: { orderId: order.id } },
        { target_role: 'admin', type: 'new_order', title: 'New order', message: `New order #${order.id} placed (${form.payment_method}).`, payload: { orderId: order.id } }
      ])
      clearCart()
      nav('/orders')
    } catch (err) { setError(err.message || t('failedOrder')) }
    setLoading(false)
  }

  if (!items.length) return <div className="container page"><h2 className="section-title">{t('checkout')}</h2><div className="panel center"><p className="muted">{t('cartEmptyTitle')}</p></div></div>

  return (
    <div className="container page">
      <h2 className="section-title">{t('checkout')}</h2>
      <p className="section-sub">{t('checkoutSub')}</p>
      <form onSubmit={placeOrder} className="panel">
        <h3 style={{marginBottom:10}}>{t('deliveryDetails')}</h3>
        <div className="row">
          <div><label>{t('fullName')}</label><input name="name" value={form.name} onChange={onChange} required /></div>
          <div><label>{t('phone')}</label><input name="phone" value={form.phone} onChange={onChange} required /></div>
        </div>
        <div className="row">
          <div><label>{t('email')}</label><input name="email" type="email" value={form.email} onChange={onChange} required /></div>
          <div><label>{t('city')}</label><input name="city" value={form.city} onChange={onChange} required /></div>
        </div>
        <label>{t('address')}</label><input name="address" value={form.address} onChange={onChange} required />
        <label>{t('governorate')}</label>
        <select name="governorate" value={form.governorate} onChange={onChange} required>
          <option value="">{t('selectGovernorate')}</option>
          {govs.map(g => <option key={g.id} value={g.name}>{g.name} — {formatEGP(g.shipping_fee)} {t('shipping')}</option>)}
        </select>

        <div className="divider"></div>
        <h3 style={{marginBottom:10}}>{t('paymentMethod')}</h3>
        <div className="row" style={{marginBottom:8}}>
          <label style={{display:'flex',alignItems:'center',gap:8,textTransform:'none'}}><input type="radio" name="payment_method" value="cod" checked={form.payment_method==='cod'} onChange={onChange} style={{width:'auto',margin:0}} /> {t('cod')}</label>
          <label style={{display:'flex',alignItems:'center',gap:8,textTransform:'none'}}><input type="radio" name="payment_method" value="vodafone_cash" checked={form.payment_method==='vodafone_cash'} onChange={onChange} style={{width:'auto',margin:0}} /> {t('vodafoneCash')}</label>
        </div>
        {form.payment_method === 'vodafone_cash' && (
          <div className="panel soft">
            <p><strong style={{color:'var(--gold)'}}>{t('vodafoneNumber')}</strong> {import.meta.env.VITE_VODAFONE_CASH_NUMBER || '(set in env)'}</p>
            <p className="muted" style={{margin:'6px 0 12px'}}>{import.meta.env.VITE_VODAFONE_CASH_INSTRUCTIONS || 'Transfer the total, then provide reference and screenshot.'}</p>
            <label>{t('txRef')}</label><input name="vodafone_ref" value={form.vodafone_ref} onChange={onChange} required />
            <label>{t('paymentScreenshot')}</label><input type="file" accept="image/*" onChange={e=>setScreenshot(e.target.files[0])} />
          </div>
        )}

        <label>{t('orderNotes')}</label><textarea name="notes" value={form.notes} onChange={onChange} />
        <div className="panel soft">
          <div className="row"><span>{t('subtotal')}</span><span className="spacer"></span><span>{formatEGP(subtotal)}</span></div>
          <div className="row"><span>{t('shippingLabel')}</span><span className="spacer"></span><span>{formatEGP(shippingFee)}</span></div>
          <div className="row"><span>{t('tax')}</span><span className="spacer"></span><span>{formatEGP(taxAmount)} <span className="muted">{t('notApplicable')}</span></span></div>
          <div className="divider"></div>
          <div className="row"><strong style={{fontSize:'1.3rem'}}>{t('total')}</strong><span className="spacer"></span><strong style={{fontSize:'1.5rem', color:'var(--gold-light)'}}>{formatEGP(total)}</strong></div>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn block" disabled={loading} style={{marginTop:10}}>{loading ? t('placingOrder') : t('placeOrder')}</button>
      </form>
    </div>
  )
}
