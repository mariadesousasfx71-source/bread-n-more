import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import { formatDate, formatMoney } from '../../config/siteConfig'
import { StockBadge, CakeStatusBadge } from '../../components/Badges'
import ProductImage from '../../components/ProductImage'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

// A number card. If "to" is given, the whole card is a link.
const Stat = ({ label, value, to, warn }) => {
  const body = (
    <div className={`card h-full ${warn ? 'border-amber-300 bg-amber-50' : ''}`}>
      <p className="text-sm text-bread-brown">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

// A horizontal bar chart made of plain divs: label, bar, value
const Bars = ({ rows, valueOf, labelOf, textOf }) => {
  const biggest = Math.max(...rows.map(valueOf), 1)
  return (
    <div>
      {rows.map((row) => (
        <div key={labelOf(row)} className="grid grid-cols-[8rem_1fr_9rem] items-center gap-3 py-1 text-sm">
          <p className="truncate">{labelOf(row)}</p>
          <div className="h-3 rounded bg-bread-latte/60">
            <div className="h-3 rounded bg-bread-caramel" style={{ width: `${(valueOf(row) / biggest) * 100}%` }}></div>
          </div>
          <p className="text-right">{textOf(row)}</p>
        </div>
      ))}
    </div>
  )
}

const Dashboard = () => {
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [revenue, setRevenue] = useState({ data: [], totals: { orders: 0, revenue: 0 } })
  const [topProducts, setTopProducts] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    // five requests at the same time. The dates apply to the three reports.
    const range = { from, to }
    Promise.all([
      api.get('/reports/summary'),
      api.get('/products/low-stock'),
      api.get('/reports/daily-revenue', { params: range }),
      api.get('/reports/top-products', { params: range }),
      api.get('/reports/sales-by-category', { params: range }),
    ])
      .then(([summaryRes, lowRes, revenueRes, topRes, categoryRes]) => {
        setSummary(summaryRes.data.data)
        setLowStock(lowRes.data.data)
        setRevenue({ data: revenueRes.data.data, totals: revenueRes.data.totals })
        setTopProducts(topRes.data.data)
        setByCategory(categoryRes.data.data)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading && !summary) return <PageLoader text="Loading the dashboard..." />
  if (error) return <ErrorBox message={error} onRetry={load} />

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Products in the shop" value={summary.totalProducts} to="/admin/products" />
        <Stat label="Low on stock" value={summary.lowStock} to="/admin/products?stock=low" warn={summary.lowStock > 0} />
        <Stat label="Out of stock" value={summary.outOfStock} to="/admin/products?stock=out" warn={summary.outOfStock > 0} />
        <Stat label="Staff waiting for approval" value={summary.pendingStaff} to="/admin/staff?status=pending" warn={summary.pendingStaff > 0} />
        <Stat label="Orders today" value={summary.ordersToday} to="/admin/orders" />
        <Stat label="Revenue today" value={formatMoney(summary.revenueToday)} />
        <Stat label="Cake requests to price" value={summary.newCakeRequests} to="/admin/cakes" warn={summary.newCakeRequests > 0} />
        <Stat label="Cakes needed in 3 days" value={summary.cakesDueSoon} to="/admin/cakes" warn={summary.cakesDueSoon > 0} />
        <Stat label="Open special cake orders" value={summary.cakesActive} to="/admin/cakes" />
      </div>

      {/* SPECIAL CAKES: the next open cake orders, earliest date first */}
      <section>
        <h2 className="mb-3 text-2xl">Upcoming special cakes</h2>
        {summary.upcomingCakes.length === 0 ? (
          <EmptyState text="No open special cake orders." />
        ) : (
          <div className="card divide-y divide-bread-latte p-0">
            {summary.upcomingCakes.map((cake) => (
              <div key={cake._id} className="flex flex-wrap items-center gap-4 p-3">
                <div className="flex-1">
                  <p className="font-medium">{cake.customerName} · {cake.flavour}, {cake.weightKg} kg</p>
                  <p className="text-xs text-bread-brown">Needed on {formatDate(cake.requiredDate)}{cake.quotedPrice != null ? ` · ${formatMoney(cake.quotedPrice)}` : ' · price not set yet'}</p>
                </div>
                <CakeStatusBadge status={cake.status} />
                <Link to="/admin/cakes" className="btn-outline">Open</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOW STOCK LIST */}
      <section>
        <h2 className="mb-3 text-2xl">Needs baking or re-ordering</h2>
        {lowStock.length === 0 ? (
          <EmptyState text="Every product has enough stock." />
        ) : (
          <div className="card divide-y divide-bread-latte p-0">
            {lowStock.map((product) => (
              <div key={product._id} className="flex items-center gap-4 p-3">
                <ProductImage src={product.image} name={product.name} className="h-12 w-12 rounded" />
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-bread-brown">{product.category?.name} · {product.sku}</p>
                </div>
                <StockBadge product={product} />
                <Link to={`/admin/products/${product._id}/history`} className="btn-outline">History</Link>
                <Link to={`/admin/products/${product._id}/edit`} className="btn-outline">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* REPORTS: one date range for all three */}
      <section>
        <h2 className="mb-3 text-2xl">Sales reports</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            load()
          }}
          className="mb-4 flex flex-wrap items-end gap-3"
        >
          <label className="text-sm">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input mt-1" /></label>
          <label className="text-sm">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input mt-1" /></label>
          <button className="btn-primary" disabled={loading}>Show</button>
          <p className="text-xs text-bread-brown">Leave both empty for the default: 7 days for daily revenue, 30 days for the other two. Cancelled orders are not counted.</p>
        </form>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card lg:col-span-2">
            <h3 className="mb-2 text-lg">Daily revenue</h3>
            <Bars rows={revenue.data} labelOf={(row) => row.date} valueOf={(row) => row.revenue} textOf={(row) => `${formatMoney(row.revenue)} · ${row.orders} orders`} />
            <p className="mt-3 border-t border-bread-latte pt-3 text-right font-medium">
              Total: {formatMoney(revenue.totals.revenue)} from {revenue.totals.orders} orders
            </p>
          </div>

          <div className="card">
            <h3 className="mb-2 text-lg">Best sellers</h3>
            {topProducts.length === 0 ? (
              <EmptyState text="No sales in this period." />
            ) : (
              <Bars rows={topProducts} labelOf={(row) => row.name} valueOf={(row) => row.quantity} textOf={(row) => `${row.quantity} sold · ${formatMoney(row.revenue)}`} />
            )}
          </div>

          <div className="card">
            <h3 className="mb-2 text-lg">Sales by category</h3>
            {byCategory.length === 0 ? (
              <EmptyState text="No sales in this period." />
            ) : (
              <Bars rows={byCategory} labelOf={(row) => row.category} valueOf={(row) => row.revenue} textOf={(row) => `${formatMoney(row.revenue)} · ${row.quantity} items`} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
