import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../config/siteConfig'
import Title from '../components/Title'
import Pagination from '../components/Pagination'
import { OrderStatusBadge } from '../components/Badges'
import { PageLoader, ErrorBox, EmptyState } from '../components/ui'

// "My orders": the order history of the logged-in person, with a date filter
const Orders = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const load = () => {
    let ignore = false
    setLoading(true)
    setError('')
    api
      .get('/orders/mine', { params: { page, limit: 10, status, from, to } })
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
  useEffect(load, [page, status, from, to])

  const cancel = async (order) => {
    if (!window.confirm('Cancel this order? The items go back into stock.')) return
    try {
      await api.patch(`/orders/${order._id}/cancel`)
      toast.success('Order cancelled')
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
    <div className="border-t border-bread-latte pt-10">
      <div className="text-2xl">
        <Title text1="MY" text2="ORDERS" />
      </div>

      <div className="my-6 grid gap-3 sm:grid-cols-3">
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
        <PageLoader text="Loading your orders..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState text="No orders found." />
      ) : (
        orders.map((order) => (
          <div key={order._id} className="card mb-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-bread-brown">
              <p>
                Order #{order._id.slice(-6).toUpperCase()} · {formatDateTime(order.createdAt)}
                {order.customerName && ` · for ${order.customerName}`}
              </p>
              <OrderStatusBadge status={order.status} />
            </div>

            {order.items.map((item) => (
              <div key={item.product} className="flex justify-between py-1 text-sm">
                <p>{item.name} × {item.quantity}</p>
                <p>{formatMoney(item.price * item.quantity)}</p>
              </div>
            ))}
            {order.note && <p className="mt-2 text-xs italic text-bread-brown">Note: {order.note}</p>}

            <div className="mt-3 flex items-center justify-between border-t border-bread-latte pt-3">
              <p className="font-medium">Total: {formatMoney(order.total)}</p>
              {order.status === 'pending' && (
                <button onClick={() => cancel(order)} className="btn-danger">
                  Cancel order
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  )
}

export default Orders
