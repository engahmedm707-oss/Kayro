import React from 'react'

export default function AdminDashboard() {
  return (
    <div className="panel">
      <h3>Dashboard</h3>
      <p className="muted" style={{ marginBottom: 14 }}>
        Welcome to the KAYRO admin panel. Use the navigation to manage products & variants, governorate shipping fees, orders, and admin accounts.
      </p>
      <ul>
        <li>Set shipping fees per Egypt governorate in <strong>Governorate Shipping</strong>.</li>
        <li>Add perfumes with brand, description, images, fragrance notes, category/gender, and size/capacity variants (price, stock, discounts).</li>
        <li>Review orders, verify Vodafone Cash payments (reference + screenshot), and update statuses.</li>
      </ul>
    </div>
  )
}
