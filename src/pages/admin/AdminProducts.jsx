import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getEffectivePrice, formatEGP } from '../../utils/pricing'

const emptyProduct = { brand:'', name:'', description:'', fragrance_notes:'', category:'', gender:'', images:[], is_active:true }
const emptyVariant = { size_capacity:'', sku:'', price:0, stock_quantity:0, discount_type:'none', discount_value:0, is_active:true }

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyProduct)
  const [editingId, setEditingId] = useState(null)
  const [variants, setVariants] = useState([])
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('')
  const load = async () => {
    const { data } = await supabase.from('products').select('*, product_variants(*)').order('created_at',{ascending:false})
    setProducts(data||[])
  }
  useEffect(()=>{ load() }, [])

  const saveProduct = async (e) => {
    e.preventDefault(); setMsg(''); setErr('')
    const payload = { ...form }
    let prodId = editingId
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId)
      if (error) return setErr(error.message)
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single()
      if (error) return setErr(error.message)
      prodId = data.id
    }
    // upsert variants for this product (simple approach: delete missing handled manually not done; here we insert/update existing by id)
    for (const v of variants) {
      const vp = { product_id: prodId, size_capacity: v.size_capacity, sku: v.sku||null, price: Number(v.price)||0, stock_quantity: Number(v.stock_quantity)||0, discount_type: v.discount_type, discount_value: Number(v.discount_value)||0, is_active: v.is_active!==false }
      if (v.id) await supabase.from('product_variants').update(vp).eq('id', v.id)
      else await supabase.from('product_variants').insert(vp)
    }
    setMsg('Saved.'); setForm(emptyProduct); setEditingId(null); setVariants([]); load()
  }

  const edit = (p) => { setEditingId(p.id); setForm({ brand:p.brand||'', name:p.name||'', description:p.description||'', fragrance_notes:p.fragrance_notes||'', category:p.category||'', gender:p.gender||'', images:p.images||[], is_active:p.is_active }); setVariants(p.product_variants||[]) }
  const del = async (id) => { if(!confirm('Delete product?')) return; await supabase.from('products').delete().eq('id', id); load() }
  const addVariant = () => setVariants([...variants, { ...emptyVariant }])
  const setV = (i, key, val) => { const copy=[...variants]; copy[i] = { ...copy[i], [key]: val }; setVariants(copy) }
  const delVariant = async (i) => { const v = variants[i]; if (v.id) await supabase.from('product_variants').delete().eq('id', v.id); setVariants(variants.filter((_,idx)=>idx!==i)) }

  const uploadImage = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const path = `products/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) return setErr(error.message)
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    setForm(f => ({ ...f, images: [...(f.images||[]), data.publicUrl] }))
  }

  return (
    <div className="admin-stack">
      <div className="panel">
        <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
        <p className="muted" style={{ marginBottom: 14 }}>Create and manage perfume products, images, and size/capacity variants.</p>
        <form onSubmit={saveProduct}>
          <div className="row"><div><label>Brand</label><input value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} required /></div><div><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div></div>
          <label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <div className="row"><div><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div><div><label>Gender</label><input value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} placeholder="e.g. Men/Women/Unisex" /></div></div>
          <label>Fragrance Notes</label><textarea value={form.fragrance_notes} onChange={e=>setForm({...form,fragrance_notes:e.target.value})} placeholder="Top / Middle / Base notes" />
          <label>Images</label><input type="file" accept="image/*" onChange={uploadImage} />
          <div className="row" style={{ marginTop: 6 }}>{(form.images||[]).map((url,idx)=><div key={idx} style={{flex:'0 0 auto', minWidth:0}}><img src={url} alt="" style={{width:90,height:90,objectFit:'cover', borderRadius:10, border:'1px solid var(--border)'}} /><div style={{marginTop:6}}><button type="button" className="btn secondary" onClick={()=>setForm(f=>({...f,images:f.images.filter((_,i)=>i!==idx)}))}>Remove</button></div></div>)}</div>
          <label style={{display:'flex', alignItems:'center', gap:8, textTransform:'none', marginTop:8}}><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} style={{width:'auto', margin:0}} /> Active</label>

          <h4>Size / Capacity Variants (price, stock, discount)</h4>
          <div className="admin-stack">
            {variants.map((v,i)=> (
              <div key={i} className="panel soft" style={{ margin: 0 }}>
                <div className="row">
                  <div><label>Size/Capacity</label><input value={v.size_capacity} onChange={e=>setV(i,'size_capacity',e.target.value)} placeholder="e.g. 100ml" /></div>
                  <div><label>Price (EGP)</label><input type="number" value={v.price} onChange={e=>setV(i,'price',e.target.value)} /></div>
                  <div><label>Stock</label><input type="number" value={v.stock_quantity} onChange={e=>setV(i,'stock_quantity',e.target.value)} /></div>
                </div>
                <div className="row">
                  <div><label>Discount Type</label><select value={v.discount_type} onChange={e=>setV(i,'discount_type',e.target.value)}><option value="none">none</option><option value="percentage">percentage</option><option value="fixed">fixed</option></select></div>
                  <div><label>Discount Value</label><input type="number" value={v.discount_value} onChange={e=>setV(i,'discount_value',e.target.value)} /></div>
                  <div><label>Effective</label><div style={{padding:'12px 0'}}>{formatEGP(getEffectivePrice(v.price,v.discount_type,v.discount_value).finalPrice)}</div></div>
                </div>
                <div className="admin-toolbar"><button type="button" className="btn secondary" onClick={()=>delVariant(i)}>Remove Variant</button></div>
              </div>
            ))}
          </div>
          <div className="admin-toolbar"><button type="button" className="btn secondary" onClick={addVariant}>+ Add Variant</button></div>
          {err && <p className="error">{err}</p>}{msg && <p className="success">{msg}</p>}
          <div className="admin-toolbar"><button className="btn" type="submit">Save Product</button> {editingId && <button type="button" className="btn secondary" onClick={()=>{setEditingId(null);setForm(emptyProduct);setVariants([])}}>Cancel</button>}</div>
        </form>
      </div>

      <div className="panel">
        <h3>Products</h3>
        <p className="muted" style={{ marginBottom: 12 }}>Existing products and variants.</p>
        <div className="admin-stack">
          {products.map(p => (
            <div key={p.id} className="panel soft" style={{ margin: 0 }}>
              <div className="row"><strong style={{fontSize:'1.2rem'}}>{p.brand} — {p.name}</strong><span className="badge">{p.is_active?'active':'inactive'}</span><span className="spacer" /><button className="btn secondary" onClick={()=>edit(p)}>Edit</button><button className="btn secondary" onClick={()=>del(p.id)}>Delete</button></div>
              <div className="muted" style={{marginTop:6}}>{p.category} · {p.gender}</div>
              <div style={{marginTop:10, display:'grid', gap:4}}>{(p.product_variants||[]).map(v => { const eff=getEffectivePrice(v.price,v.discount_type,v.discount_value); return <div key={v.id}>{v.size_capacity}: {formatEGP(v.price)} → {formatEGP(eff.finalPrice)} ({v.discount_type} {v.discount_value}) · stock {v.stock_quantity}</div> })}</div>
            </div>
          ))}
          {products.length === 0 && <p className="muted">No products yet.</p>}
        </div>
      </div>
    </div>
  )
}
