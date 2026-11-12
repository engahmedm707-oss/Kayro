import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error.message); else nav('/')
  }
  return (
    <div className="auth-wrap">
      <div className="panel auth-card reveal">
        <h2>{t('welcomeBack')}</h2>
        <p className="sub">{t('signInContinue')}</p>
        <form onSubmit={onSubmit}>
          <label>{t('email')}</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" />
          <label>{t('password')}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" />
          {error && <p className="error">{error}</p>}
          <button className="btn block" disabled={loading}>{loading ? t('signingIn') : t('signIn')}</button>
        </form>
        <p className="muted center" style={{marginTop:18}}>{t('noAccount')} <Link to="/register">{t('createOne')}</Link></p>
      </div>
    </div>
  )
}
