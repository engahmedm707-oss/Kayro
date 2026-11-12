import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  const navClass = ({ isActive }) => (isActive ? 'active' : '')
  return (
    <div className="container page admin-page">
      <header className="admin-header">
        <div className="product-brand">Management</div>
        <h2 className="section-title">Admin Panel</h2>
        <p className="section-sub">Manage products, shipping, orders, and user access.</p>
      </header>
      <nav className="admin-nav" aria-label="Admin navigation">
        <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
        <NavLink to="/admin/products" className={navClass}>Products</NavLink>
        <NavLink to="/admin/shipping" className={navClass}>Governorate Shipping</NavLink>
        <NavLink to="/admin/orders" className={navClass}>Orders</NavLink>
        <NavLink to="/admin/users" className={navClass}>Admins/Users</NavLink>
      </nav>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  )
}
