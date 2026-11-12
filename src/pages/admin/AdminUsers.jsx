import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminUsers() {
  const { role } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [form, setForm] = useState({ email:'', password:'', name:'', phone:'' })
  const [msg, setMsg] = useState(''); const [error, setError] = useState('')
  const load = async () => { const { data } = await supabase.from('profiles').select('*').order('created_at',{ascending:false}); setProfiles(data||[]) }
  useEffect(()=>{ load() }, [])

  const createAdmin = async (e) => {
    e.preventDefault(); setMsg(''); setError('')
    if (role !== 'owner') return setError('Only the owner can create admin accounts.')
    // Requires a deployed Edge Function 'create-admin' with service role key.
    const { data, error } = await supabase.functions.invoke('create-admin', { body: form })
    if (error) setError(error.message || 'Failed (ensure create-admin Edge Function is deployed).')
    else { setMsg('Admin account created.'); setForm({ email:'', password:'', name:'', phone:'' }); load() }
  }

  return (
    <div className="admin-stack">
      <div className="panel">
        <h3>Create Admin (Owner only)</h3>
        <p className="muted" style={{ marginBottom: 14 }}>Creates an admin auth user + profile via the <code>create-admin</code> Supabase Edge Function (must be deployed with service role). You can also create users in Supabase Auth dashboard and set <code>profiles.role</code> to <code>admin</code>/<code>owner</code>.</p>
        <form onSubmit={createAdmin}>
          <div className="row"><div><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div><div><label>Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div></div>
          <div className="row"><div><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div><div><label>Temp Password</label><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6} /></div></div>
          {error && <p className="error">{error}</p>}{msg && <p className="success">{msg}</p>}
          <div className="admin-toolbar"><button className="btn" disabled={role!=='owner'}>Create Admin</button></div>
        </form>
      </div>
      <div className="panel">
        <h3>Users / Profiles</h3>
        <p className="muted" style={{ marginBottom: 12 }}>View registered users and their roles/status.</p>
        <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Active</th></tr></thead>
          <tbody>{profiles.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.email}</td><td>{p.phone}</td><td><span className="badge">{p.role}</span></td><td>{String(p.is_active)}</td></tr>)}</tbody>
        </table></div>
      </div>
    </div>
  )
}
