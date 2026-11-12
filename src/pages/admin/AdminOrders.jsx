import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatEGP } from '../../utils/pricing'

const statuses = ['pending','confirmed','processing','shipped','delivered','cancelled']
const payStatuses = ['pending','awaiting_verification','paid','failed']

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const load = async () => { const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at',{ascending:false}); setOrders(data||[]) }
  useEffect(()=>{ load() }, [])
  const update = async (id, fields) => { await supabase.from('orders').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id); load() }
  return (
    <div className="panel">
      <h3>Orders</h3>
      <p className="muted" style={{ marginBottom: 12 }}>Review customer orders, verify payments, and update fulfillment statuses.</p>
      <div className="admin-stack">
        {orders.map(o => (
          <div key={o.id} className="panel soft" style={{ margin: 0 }}>
            <div className="row"><strong style={{ fontSize: '1.2rem' }}>#{o.id}</strong><span className="muted">{new Date(o.created_at).toLocaleString()}</span><span className="badge">{o.payment_method}</span><span className="badge">{o.payment_status}</span></div>
            <p style={{ marginTop: 10 }}><strong>Customer:</strong> {o.customer_name} · {o.customer_phone} · {o.customer_email}<br/><span className="muted">{o.customer_governorate}, {o.customer_city}, {o.customer_address}</span></p>
            <ul>{(o.order_items||[]).map(it => <li key={it.id}>{it.brand} {it.product_name} ({it.size_capacity}) x{it.quantity} = {formatEGP(it.line_total)}</li>)}</ul>
            <p style={{ marginTop: 8 }}>Subtotal {formatEGP(o.subtotal)} | Ship {formatEGP(o.shipping_fee)} | Tax {formatEGP(o.tax_amount)} | <strong>Total {formatEGP(o.total)}</strong></p>
            {o.vodafone_ref && <p>VC Ref: {o.vodafone_ref} {o.vodafone_screenshot_url && <a href={o.vodafone_screenshot_url} target="_blank" rel="noreferrer"> · View screenshot</a>}</p>}
            <div className="row" style={{ marginTop: 10 }}>
              <div><label>Order Status</label><select value={o.status} onChange={e=>update(o.id,{status:e.target.value})}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
              <div><label>Payment Status</label><select value={o.payment_status} onChange={e=>update(o.id,{payment_status:e.target.value})}>{payStatuses.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
          </div>
        ))}
        {orders.length===0 && <p className="muted">No orders.</p>}
      </div>
    </div>
  )
}
