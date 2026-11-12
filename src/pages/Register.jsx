import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

export default function Register() {
  const { signUp } = useAuth()
  const { t } = useI18n()
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' })
  const [msg, setMsg] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setMsg(''); setLoading(true)
    const { error } = await signUp(form.email, form.password, { name: form.name, phone: form.phone })
    setLoading(false)
    if (error) return setError(error.message)
    setMsg(t('registerSuccess'))
  }
  return (
    <div className="auth-wrap">
      <div className="panel auth-card reveal">
        <h2>{t('joinKayro')}</h2>
        <p className="sub">{t('createAccountBegin')}</p>
        <form onSubmit={onSubmit}>
          <label>{t('fullName')}</label><input name="name" value={form.name} onChange={onChange} required placeholder={t('fullName')} />
          <label>{t('email')}</label><input name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
          <label>{t('phone')}</label><input name="phone" value={form.phone} onChange={onChange} required placeholder="01xxxxxxxxx" />
          <label>{t('password')}</label><input name="password" type="password" value={form.password} onChange={onChange} required minLength={6} placeholder={t('minPassword')} />
          {error && <p className="error">{error}</p>}
          {msg && <p className="success">{msg}</p>}
          <button className="btn block" disabled={loading}>{loading ? t('creatingAccount') : t('createAccount')}</button>
        </form>
        <p className="muted center" style={{marginTop:18}}>{t('alreadyMember')} <Link to="/login">{t('signIn')}</Link></p>
      </div>
    </div>
  )
}
