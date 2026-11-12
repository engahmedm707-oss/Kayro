import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminShipping() {
  const [rows, setRows] = useState([])
  const load = async () => { const { data } = await supabase.from('governorate_shipping').select('*').order('name'); setRows(data||[]) }
  useEffect(()=>{ load() }, [])
  const save = async (id, fee, active) => {
    await supabase.from('governorate_shipping').update({ shipping_fee: Number(fee), is_active: !!active }).eq('id', id)
    load()
  }
  return (
    <div className="panel">
      <h3>Governorate Shipping (Egypt)</h3>
      <p className="muted" style={{ marginBottom: 12 }}>Manage delivery fees and availability per governorate.</p>
      <div className="table-wrap"><table className="table"><thead><tr><th>Governorate</th><th>Shipping Fee (EGP)</th><th>Active</th><th></th></tr></thead>
        <tbody>{rows.map(r => <Row key={r.id} r={r} onSave={save} />)}</tbody>
      </table></div>
    </div>
  )
}
function Row({ r, onSave }) {
  const [fee, setFee] = useState(r.shipping_fee)
  const [active, setActive] = useState(r.is_active)
  useEffect(()=>{ setFee(r.shipping_fee); setActive(r.is_active) }, [r])
  return <tr><td>{r.name}</td><td><input type="number" value={fee} onChange={e=>setFee(e.target.value)} /></td><td><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} /></td><td><button className="btn secondary" onClick={()=>onSave(r.id, fee, active)}>Save</button></td></tr>
}
