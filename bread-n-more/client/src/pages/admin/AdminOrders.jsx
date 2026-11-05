import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../../api/client'
import useDebounce from '../../hooks/useDebounce'
import { formatDateTime, formatMoney } from '../../config/siteConfig'
import { OrderStatusBadge } from '../../components/Badges'
import Pagination from '../../components/Pagination'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

// Which buttons an order gets, depending on its status (the server enforces the same rules)
const nextSteps = {
  pending: [
    { status: 'confirmed', label: 'Confirm', style: 'btn-primary' },
    { status: 'cancelled', label: 'Cancel', style: 'btn-danger' },
  ],
  confirmed: [
    { status: 'completed', label: 'Mark completed', style: 'btn-primary' },
    { status: 'cancelled', label: 'Cancel', style: 'btn-danger' },
  ],
  completed: [],
  cancelled: [],
}

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const load = () => {
    let ignore = false
    setLoading(true)
    setError('')
    api
      .get('/orders', { params: { page, limit: 10, status, from, to, search: debouncedSearch } })
      .then(({ data }) => {
        if (ignore) return
        setOrders(data.data)
        setPagination(data.pagination)
      })
      .catch((err) => !ignore && setError(errorMessage(err)))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }
  useEffect(load, [page, status, from, to, debouncedSearch])

  const changeStatus = async (order, newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Cancel this order? The items go back into stock.')) return
    try {
      await api.patch(`/orders/${order._id}/status`, { status: newStatus })
      toast.success(`Order is now ${newStatus}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const change = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl">Orders</h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input value={search} onChange={change(setSearch)} className="input" placeholder="Search by customer or staff name" />
        <select value={status} onChange={change(setStatus)} className="input" aria-label="Status">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label className="flex items-center gap-2 text-sm">From <input type="date" value={from} onChange={change(setFrom)} className="input" /></label>
        <label className="flex items-center gap-2 text-sm">To <input type="date" value={to} onChange={change(setTo)} className="input" /></label>
      </div>

      {loading ? (
        <PageLoader text="Loading orders..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState text="No orders found." />
      ) : (
        orders.map((order) => (
          <div key={order._id} className="card mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-medium">
                  Order #{order._id.slice(-6).toUpperCase()} · taken by {order.user ? order.user.name : 'deleted user'}
                  {order.customerName && ` · for ${order.customerName}`}
                </p>
                <p className="text-xs text-bread-brown">{order.user?.email} · {formatDateTime(order.createdAt)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            {order.items.map((item) => (
              <div key={item.product} className="flex justify-between py-1 text-sm">
                <p>{item.name} × {item.quantity}</p>
                <p>{formatMoney(item.price * item.quantity)}</p>
              </div>
            ))}
            {order.note && <p className="mt-2 text-xs italic text-bread-brown">Note: {order.note}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-bread-latte pt-3">
              <p className="font-medium">Total: {formatMoney(order.total)}</p>
              <div className="flex gap-2">
                {nextSteps[order.status].map((step) => (
                  <button key={step.status} onClick={() => changeStatus(order, step.status)} className={step.style}>
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  )
}

export default AdminOrders
