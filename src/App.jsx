import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useI18n } from './i18n'
import Home from './pages/store/Home'
import ProductDetail from './pages/store/ProductDetail'
import Cart from './pages/store/Cart'
import Checkout from './pages/store/Checkout'
import MyOrders from './pages/store/MyOrders'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminShipping from './pages/admin/AdminShipping'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="container page"><div className="loader"></div></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
function RequireStaff({ children }) {
  const { role, loading } = useAuth()
  if (loading) return <div className="container page"><div className="loader"></div></div>
  if (role !== 'owner' && role !== 'admin') return <Navigate to="/" replace />
  return children
}

function Nav() {
  const { user, role, signOut } = useAuth()
  const { t, lang, toggle } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const linkClass = ({ isActive }) => isActive ? 'active' : ''

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <nav className={`nav ${menuOpen ? 'menu-open' : ''}`}>
      <div className="nav-top">
        <Link to="/" className="brand">{t('brand')}</Link>
        <button
          type="button"
          className="btn secondary nav-toggle-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
        >
          {menuOpen ? t('close') : t('menu')}
        </button>
      </div>
      <div id="nav-menu" className={`nav-menu ${menuOpen ? 'open' : ''}`}>
        <div className="nav-links">
          <NavLink to="/" end className={linkClass}>{t('collection')}</NavLink>
          <NavLink to="/cart" className={linkClass}>{t('cart')}</NavLink>
          {user && <NavLink to="/orders" className={linkClass}>{t('myOrders')}</NavLink>}
          {user && <NavLink to="/profile" className={linkClass}>{t('profile')}</NavLink>}
          {user && <NavLink to="/notifications" className={linkClass}>{t('notifications')}</NavLink>}
          {(role === 'owner' || role === 'admin') && <NavLink to="/admin" className={linkClass}>{t('admin')}</NavLink>}
        </div>
        <div className="nav-actions">
          <button className="btn secondary nav-btn" onClick={toggle} aria-label="Toggle language">{lang === 'en' ? 'AR' : 'EN'}</button>
          {user ? (
            <button className="btn secondary nav-btn" onClick={() => { setMenuOpen(false); signOut() }}>{t('logout')}</button>
          ) : (
            <>
              <Link to="/login" className="btn secondary nav-btn">{t('login')}</Link>
              <Link to="/register" className="btn nav-btn">{t('register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <div className="brand">{t('brand')}</div>
      <p style={{marginTop:8}}>{t('footerTag')}</p>
      <p className="muted" style={{marginTop:12, fontSize:'.8rem'}}>© {new Date().getFullYear()} KAYRO. {t('footerRights')}</p>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<RequireStaff><AdminLayout /></RequireStaff>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="shipping" element={<AdminShipping />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
      <Footer />
    </>
  )
}
