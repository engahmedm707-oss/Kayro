import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateQty, removeFromCart } from '../../lib/cart'
import { formatEGP } from '../../utils/pricing'
import { useI18n } from '../../i18n'

export default function Cart() {
  const [items, setItems] = useState(getCart())
  const nav = useNavigate()
  const { t } = useI18n()
  const change = (id, q) => setItems(updateQty(id, Number(q)))
  const remove = (id) => setItems(removeFromCart(id))
  const subtotal = items.reduce((s,i)=>s + (Number(i.finalPrice)||0) * i.quantity, 0)
  return (
    <div className="container page">
      <h2 className="section-title">{t('yourCart')}</h2>
      <p className="section-sub">{t('cartSub')}</p>
      {items.length === 0 ? (
        <div className="panel center"><p className="muted">{t('cartEmpty')}</p><Link to="/" className="btn" style={{marginTop:14}}>{t('exploreCollection')}</Link></div>
      ) : (
        <div className="panel">
          <div className="table-wrap">
          <table className="table"><thead><tr><th>{t('fragrance')}</th><th>{t('size')}</th><th>{t('price')}</th><th>{t('qty')}</th><th>{t('total')}</th><th></th></tr></thead>
          <tbody>{items.map(i => (
            <tr key={i.variantId}>
              <td><strong style={{fontFamily:'Cormorant Garamond',fontSize:'1.2rem'}}>{i.name}</strong><div className="muted">{i.brand}</div></td>
              <td>{i.sizeCapacity}</td>
              <td>{formatEGP(i.finalPrice)}</td>
              <td><input type="number" min="1" value={i.quantity} onChange={e=>change(i.variantId,e.target.value)} style={{width:90}} /></td>
              <td>{formatEGP(i.finalPrice * i.quantity)}</td>
              <td><button className="btn secondary" onClick={()=>remove(i.variantId)}>{t('remove')}</button></td>
            </tr>
          ))}</tbody></table>
          </div>
          <div className="divider"></div>
          <div className="row"><div className="spacer"></div><div style={{textAlign:'right'}}><div className="muted">{t('subtotal')}</div><h3 style={{fontSize:'1.8rem'}}>{formatEGP(subtotal)}</h3><p className="muted" style={{marginBottom:12}}>{t('shippingCalc')}</p><button className="btn" onClick={()=>nav('/checkout')}>{t('proceedCheckout')}</button></div></div>
        </div>
      )}
    </div>
  )
}
