import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getEffectivePrice, formatEGP } from '../../utils/pricing'
import { useI18n } from '../../i18n'

export default function Home() {
  const { t } = useI18n()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('products').select('*, product_variants(*)').eq('is_active', true).order('created_at', { ascending: false })
      setProducts(data || []); setLoading(false)
    })()
  }, [])
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-kicker">{t('heroKicker')}</div>
          <h1>{t('heroTitleA')}<em>{t('heroTitleB')}</em>{t('heroTitleC')}</h1>
          <p>{t('heroDesc')}</p>
          <div className="hero-actions">
            <a href="#collection" className="btn">{t('exploreCollection')}</a>
            <Link to="/register" className="btn secondary">{t('joinMaison')}</Link>
          </div>
        </div>
      </section>

      <div className="container page" id="collection">
        <div className="center" style={{marginBottom: 30}}>
          <h2 className="section-title">{t('theCollection')}</h2>
          <p className="section-sub">{t('collectionSub')}</p>
        </div>
        {loading ? <div className="loader"></div> : products.length === 0 ? (
          <div className="panel center"><p className="muted">{t('noProducts')}</p></div>
        ) : (
          <div className="grid">
            {products.map((p, idx) => {
              const variants = (p.product_variants||[]).filter(v=>v.is_active)
              const prices = variants.map(v => getEffectivePrice(v.price, v.discount_type, v.discount_value).finalPrice)
              const from = prices.length ? Math.min(...prices) : null
              const hasDiscount = variants.some(v => v.discount_type && v.discount_type !== 'none' && Number(v.discount_value) > 0)
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="card product-card" style={{animationDelay: `${(idx%6)*0.07}s`}}>
                  <div className="product-media">
                    {p.images?.[0] ? <img className="thumb" src={p.images[0]} alt={p.name} /> : <div className="thumb" />}
                    {hasDiscount && <span className="badge" style={{position:'absolute', top:12, left:12}}>{t('offer')}</span>}
                  </div>
                  <div className="product-body">
                    <div className="product-brand">{p.brand}</div>
                    <div className="product-name">{p.name}</div>
                    <div className="product-meta">{p.gender || ''}{p.gender && p.category ? ' · ' : ''}{p.category || ''}</div>
                    {from != null && <div className="price">{t('from')} <strong>{formatEGP(from)}</strong></div>}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
