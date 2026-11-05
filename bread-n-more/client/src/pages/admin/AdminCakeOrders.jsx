import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../../api/client'
import useDebounce from '../../hooks/useDebounce'
import { formatDate, formatMoney } from '../../config/siteConfig'
import { CakeStatusBadge } from '../../components/Badges'
import Pagination from '../../components/Pagination'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

// Which buttons a cake order gets, depending on its status (the server enforces the same rules)
const nextSteps = {
  requested: [{ status: 'cancelled', label: 'Cancel', style: 'btn-danger' }],
  quoted: [{ status: 'cancelled', label: 'Cancel', style: 'btn-danger' }],
  confirmed: [
    { status: 'ready', label: 'Mark ready', style: 'btn-primary' },
    { status: 'cancelled', label: 'Cancel', style: 'btn-danger' },
  ],
  ready: [{ status: 'delivered', label: 'Mark delivered', style: 'btn-primary' }],
  delivered: [],
  cancelled: [],
}

// The baking list: every special-cake order, earliest date first. The admin sets prices here.
const AdminCakeOrders = () => {
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
      .get('/cake-orders', { params: { page, limit: 10, status, from, to, search: debouncedSearch } })
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

  const send = async (request, doneMessage) => {
    try {
      await request()
      toast.success(doneMessage)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const setPrice = (order) => {
    const answer = window.prompt(`Price for ${order.weightKg} kg ${order.flavour} cake (needed on ${formatDate(order.requiredDate)}):`, order.quotedPrice ?? '')
    if (answer === null || answer === '') return
    const note = window.prompt('Note for the staff (optional):', order.adminNote || '') ?? ''
    send(() => api.patch(`/cake-orders/${order._id}/quote`, { quotedPrice: answer, adminNote: note }), 'Price set')
  }

  const recordAdvance = (order) => {
    const answer = window.prompt('Total advance paid so far:', order.advancePaid)
    if (answer === null || answer === '') return
    send(() => api.patch(`/cake-orders/${order._id}/advance`, { advancePaid: answer }), 'Advance recorded')
  }

  const change = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl">Special cake orders</h2>
      <p className="mb-6 text-sm text-bread-brown">Sorted by the day the cake is needed. The dates filter below is also the day the cake is needed.</p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input value={search} onChange={change(setSearch)} className="input" placeholder="Customer, phone or staff name" />
        <select value={status} onChange={change(setStatus)} className="input" aria-label="Status">
          <option value="">All statuses</option>
          <option value="requested">Requested (needs a price)</option>
          <option value="quoted">Quoted</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label className="flex items-center gap-2 text-sm">From <input type="date" value={from} onChange={change(setFrom)} className="input" /></label>
        <label className="flex items-center gap-2 text-sm">To <input type="date" value={to} onChange={change(setTo)} className="input" /></label>
      </div>

      {loading ? (
        <PageLoader text="Loading cake orders..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState text="No cake orders found." />
      ) : (
        orders.map((order) => (
          <div key={order._id} className="card mb-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {formatDate(order.requiredDate)} · {order.weightKg} kg {order.flavour} for {order.customerName}
              </p>
              <CakeStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-bread-brown">
              Phone {order.customerPhone} · taken by {order.user?.name || 'deleted user'}
              {order.baseCake && ` · based on ${order.baseCake.name}`}
            </p>
            {order.messageOnCake && <p className="mt-1 text-sm">Message: “{order.messageOnCake}”</p>}
            {order.designNotes && <p className="text-sm text-bread-brown">Design: {order.designNotes}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-bread-latte pt-3">
              <p className="text-sm">
                {order.quotedPrice != null ? (
                  <>Price <b>{formatMoney(order.quotedPrice)}</b> · advance {formatMoney(order.advancePaid)} · balance <b>{formatMoney(order.quotedPrice - order.advancePaid)}</b></>
                ) : (
                  'No price yet'
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {['requested', 'quoted'].includes(order.status) && (
                  <button onClick={() => setPrice(order)} className="btn-primary">{order.status === 'requested' ? 'Set price' : 'Change price'}</button>
                )}
                {['confirmed', 'ready'].includes(order.status) && (
                  <button onClick={() => recordAdvance(order)} className="btn-outline">Record advance</button>
                )}
                {nextSteps[order.status].map((step) => (
                  <button key={step.status} onClick={() => send(() => api.patch(`/cake-orders/${order._id}/status`, { status: step.status }), `Cake order is now ${step.status}`)} className={step.style}>
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

export default AdminCakeOrders
