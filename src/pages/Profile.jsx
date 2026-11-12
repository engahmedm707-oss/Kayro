import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../i18n'

function Field({ label, value }) {
  return (
    <div style={{ minWidth: 180 }}>
      <div className="muted" style={{ fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.05rem', color: 'var(--text)' }}>{value || <span className="muted">—</span>}</div>
    </div>
  )
}

export default function Profile() {
  const { user, profile, role, loading, refreshProfile } = useAuth()
  const { t } = useI18n()

  if (loading) return <div className="container page"><div className="loader"></div></div>

  const name = profile?.name || user?.user_metadata?.name || ''
  const email = profile?.email || user?.email || ''
  const phone = profile?.phone || ''
  const address = profile?.address || ''
  const city = profile?.city || ''
  const governorate = profile?.governorate || ''
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Customer'
  const status = profile ? (profile.is_active ? t('active') : t('inactive')) : '—'
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleString() : (user?.created_at ? new Date(user.created_at).toLocaleString() : '—')

  return (
    <div className="container page">
      <h2 className="section-title">{t('profileTitle')}</h2>
      <p className="section-sub">{t('profileSub')}</p>

      <div className="panel reveal">
        <div className="row" style={{ alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div className="product-brand">{t('account')}</div>
            <h3 style={{ fontSize: '2rem', marginTop: 4 }}>{name || t('brand')}</h3>
            <p className="muted" style={{ marginTop: 4 }}>{email}</p>
          </div>
          <span className="spacer" />
          <div style={{ textAlign: 'right' }}>
            <span className="badge" style={{ marginRight: 8 }}>{roleLabel}</span>
            <span className="badge">{status}</span>
          </div>
        </div>
        <div className="divider"></div>

        <h4 style={{ fontSize: '1.3rem', marginBottom: 14, color: 'var(--gold-light)' }}>{t('personalInfo')}</h4>
        <div className="row" style={{ gap: 24, marginBottom: 18 }}>
          <Field label={t('fullName')} value={name} />
          <Field label={t('email')} value={email} />
        </div>
        <div className="row" style={{ gap: 24, marginBottom: 18 }}>
          <Field label={t('phone')} value={phone} />
          <Field label={t('accountType')} value={roleLabel} />
        </div>

        <div className="divider"></div>
        <h4 style={{ fontSize: '1.3rem', marginBottom: 14, color: 'var(--gold-light)' }}>{t('deliveryInfo')}</h4>
        <div className="row" style={{ gap: 24, marginBottom: 18 }}>
          <Field label={t('governorate')} value={governorate} />
          <Field label={t('city')} value={city} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <Field label={t('address')} value={address} />
        </div>

        <div className="divider"></div>
        <h4 style={{ fontSize: '1.3rem', marginBottom: 14, color: 'var(--gold-light)' }}>{t('accountDetails')}</h4>
        <div className="row" style={{ gap: 24, marginBottom: 6 }}>
          <Field label={t('memberSince')} value={memberSince} />
          <Field label={t('accountStatus')} value={status} />
        </div>
        {user?.id && (
          <div style={{ marginTop: 18 }}>
            <Field label="User ID" value={user.id} />
          </div>
        )}

        <div className="divider"></div>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn secondary" onClick={refreshProfile}>{t('refreshProfile')}</button>
          <Link to="/orders" className="btn secondary">{t('myOrders')}</Link>
          <Link to="/notifications" className="btn secondary">{t('notifications')}</Link>
        </div>
        {!profile && (
          <p className="muted" style={{ marginTop: 14, fontSize: '.9rem' }}>
            {t('profileMissing')}
          </p>
        )}
      </div>
    </div>
  )
}
