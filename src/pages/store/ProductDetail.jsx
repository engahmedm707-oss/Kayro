import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getEffectivePrice, formatEGP } from '../../utils/pricing'
import { addToCart } from '../../lib/cart'
import { useI18n } from '../../i18n'

export default function ProductDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { t } = useI18n()
  const [product, setProduct] = useState(null)
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products').select('*, product_variants(*)').eq('id', id).single()
      setProduct(data)
      const first = (data?.product_variants||[]).find(v=>v.is_active)
      if (first) setVariantId(String(first.id))
      setLoading(false)
    })()
  }, [id])
  if (loading) return <div className="container page"><div className="loader"></div></div>
  if (!product) return <div className="container page"><div className="panel">{t('productNotFound')} <Link to="/">{t('collection')}</Link></div></div>
  const variants = (product.product_variants||[]).filter(v=>v.is_active)
  const variant = variants.find(v => String(v.id) === String(variantId))
  const eff = variant ? getEffectivePrice(variant.price, variant.discount_type, variant.discount_value) : null
  const add = () => {
    if (!variant) return
    addToCart({
      productId: product.id, variantId: variant.id, name: product.name, brand: product.brand,
      image: product.images?.[0] || '', sizeCapacity: variant.size_capacity,
      unitPrice: variant.price, discountType: variant.discount_type, discountValue: variant.discount_value,
      finalPrice: eff.finalPrice, quantity: Number(qty), stock: variant.stock_quantity
    })
    nav('/cart')
  }
  return (
    <div className="container page">
      <Link to="/" className="muted" style={{display:'inline-block', marginBottom:16}}>{t('backToCollection')}</Link>
      <div className="detail-grid">
        <div className="detail-media reveal">
          {product.images?.[0] ? <img src={product.images[0]} alt={product.name} /> : <div style={{height:520, background:'#111'}} />}
        </div>
        <div className="detail-info reveal delay-1">
          <div className="product-brand">{product.brand}</div>
          <h1>{product.name}</h1>
          <div style={{margin:'8px 0 14px'}}>
            {product.category && <span className="pill">{product.category}</span>}
            {product.gender && <span className="pill">{product.gender}</span>}
          </div>
          <p className="muted" style={{marginBottom:16, fontSize:'1rem'}}>{product.description}</p>
          <div className="panel soft" style={{marginBottom:16}}>
            <div style={{color:'var(--gold)', fontSize:'.8rem', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:6}}>{t('fragranceNotes')}</div>
            <div>{product.fragrance_notes || '—'}</div>
          </div>

          <label>{t('sizeCapacity')}</label>
          <select value={variantId} onChange={e=>setVariantId(e.target.value)}>
            {variants.map(v => <option key={v.id} value={v.id}>{v.size_capacity} — {v.stock_quantity > 0 ? `${v.stock_quantity} ${t('inStock')}` : t('outOfStock')}</option>)}
          </select>
          {variant && eff && (
            <div style={{margin:'6px 0 14px'}}>
              {eff.discountAmount > 0 ? (
                <div className="price" style={{fontSize:'1.6rem'}}><s>{formatEGP(variant.price)}</s> <strong>{formatEGP(eff.finalPrice)}</strong> <span className="badge" style={{marginLeft:8}}>{t('specialOffer')}</span></div>
              ) : (
                <div className="price" style={{fontSize:'1.6rem'}}><strong>{formatEGP(variant.price)}</strong></div>
              )}
            </div>
          )}
          <div className="row" style={{alignItems:'flex-end'}}>
            <div style={{maxWidth:140}}>
              <label>{t('quantity')}</label>
              <input type="number" min="1" max={variant?.stock_quantity || 1} value={qty} onChange={e=>setQty(e.target.value)} />
            </div>
            <div>
              <button className="btn" onClick={add} disabled={!variant || variant.stock_quantity < 1} style={{marginBottom:14}}>
                {variant && variant.stock_quantity < 1 ? t('outOfStock') : t('addToCart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
