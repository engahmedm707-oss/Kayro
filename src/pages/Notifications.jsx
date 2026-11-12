import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

export default function Notifications() {
  const { user, role } = useAuth()
  const { t } = useI18n()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const load = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at',{ascending:false}).limit(100)
    setItems(data||[]); setLoading(false)
  }
  useEffect(() => { if (user) load() }, [user, role])
  const markRead = async (id) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); load() }
  return (
    <div className="container page">
      <h2 className="section-title">{t('notificationsTitle')}</h2>
      <p className="section-sub">{t('notificationsSub')}</p>
      {loading ? <div className="loader"></div> : items.length===0 ? <div className="panel center"><p className="muted">{t('noNotifications')}</p></div> : items.map(n => (
        <div key={n.id} className="panel" style={{opacity: n.is_read?0.6:1}}>
          <div className="row"><strong style={{fontSize:'1.1rem'}}>{n.title || n.type}</strong>{!n.is_read && <span className="badge">{t('new')}</span>}<span className="spacer" /><span className="muted">{new Date(n.created_at).toLocaleString()}</span></div>
          <p style={{margin:'8px 0'}}>{n.message}</p>
          {!n.is_read && <button className="btn secondary" onClick={()=>markRead(n.id)}>{t('markRead')}</button>}
        </div>
      ))}
    </div>
  )
}
