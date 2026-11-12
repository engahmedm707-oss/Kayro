import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatEGP } from '../../utils/pricing'
import { useI18n } from '../../i18n'

export default function MyOrders() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if(!user) return
    supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at',{ascending:false}).then(({data})=>{setOrders(data||[]); setLoading(false)})
  }, [user])
  return (
    <div className="container page">
      <h2 className="section-title">{t('myOrdersTitle')}</h2>
      <p className="section-sub">{t('myOrdersSub')}</p>
      {loading ? <div className="loader"></div> : orders.length===0 ? <div className="panel center"><p className="muted">{t('noOrders')}</p></div> : orders.map(o => (
        <div key={o.id} className="panel">
          <div className="row"><h3 style={{fontSize:'1.6rem'}}>#{o.id}</h3><span className="badge">{o.status}</span><span className="badge">{o.payment_method} / {o.payment_status}</span><span className="spacer" /><span className="muted">{new Date(o.created_at).toLocaleString()}</span></div>
          <p className="muted" style={{margin:'8px 0'}}>{o.customer_name} · {o.customer_phone}<br/>{o.customer_governorate}, {o.customer_city}, {o.customer_address}</p>
          <div className="divider"></div>
          {(o.order_items||[]).map(it => <div key={it.id} className="row" style={{padding:'6px 0'}}><span>{it.product_name} <span className="muted">({it.size_capacity})</span> × {it.quantity}</span><span className="spacer"></span><span>{formatEGP(it.line_total)}</span></div>)}
          <div className="divider"></div>
          <div style={{textAlign:'right'}}><span className="muted">{t('subtotal')} {formatEGP(o.subtotal)} + {t('shippingLabel')} {formatEGP(o.shipping_fee)} + {t('tax')} {formatEGP(o.tax_amount)}</span><div style={{fontSize:'1.4rem', marginTop:4}}><strong>{t('total')} {formatEGP(o.total)}</strong></div></div>
          {o.vodafone_ref && <p style={{marginTop:10}}>{t('txRef')}: <strong>{o.vodafone_ref}</strong> {o.vodafone_screenshot_url && <a href={o.vodafone_screenshot_url} target="_blank" rel="noreferrer"> · Screenshot</a>}</p>}
        </div>
      ))}
    </div>
  )
}
