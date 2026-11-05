import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../api/client'
import { formatDate, formatMoney } from '../config/siteConfig'
import Title from '../components/Title'
import Pagination from '../components/Pagination'
import { CakeStatusBadge } from '../components/Badges'
import { PageLoader, ErrorBox, EmptyState } from '../components/ui'

// "Special cakes": the cake requests this staff member took, and what happens next
const CakeOrders = () => {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const load = () => {
    let ignore = false
    setLoading(true)
    setError('')
    api
      .get('/cake-orders/mine', { params: { page, limit: 10, status } })
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
  useEffect(load, [page, status])

  // the customer agreed to the price: confirm, and note any advance they paid
  const accept = async (order) => {
    const answer = window.prompt(`The price is ${formatMoney(order.quotedPrice)}. How much advance did the customer pay? (0 if none)`, '0')
    if (answer === null) return
    try {
      await api.patch(`/cake-orders/${order._id}/accept`, { advancePaid: answer })
      toast.success('Cake order confirmed')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const cancel = async (order) => {
    if (!window.confirm('Cancel this cake request?')) return
    try {
      await api.patch(`/cake-orders/${order._id}/cancel`)
      toast.success('Cake request cancelled')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="border-t border-bread-latte pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-2xl">
          <Title text1="SPECIAL" text2="CAKES" />
        </div>
        <Link to="/cakes/new" className="btn-primary">+ New cake request</Link>
      </div>

      <div className="my-6 max-w-xs">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="input" aria-label="Status">
          <option value="">All statuses</option>
          <option value="requested">Requested (waiting for a price)</option>
          <option value="quoted">Quoted (ask the customer)</option>
          <option value="confirmed">Confirmed</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <PageLoader text="Loading cake requests..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState text="No cake requests yet." />
      ) : (
        orders.map((order) => (
          <div key={order._id} className="card mb-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                {order.weightKg} kg {order.flavour} cake for {order.customerName}
              </p>
              <CakeStatusBadge status={order.status} />
            </div>
            <p className="text-sm text-bread-brown">
              Needed on <b>{formatDate(order.requiredDate)}</b> · phone {order.customerPhone}
              {order.baseCake && ` · based on ${order.baseCake.name}`}
            </p>
            {order.messageOnCake && <p className="mt-1 text-sm">Message: “{order.messageOnCake}”</p>}
            {order.designNotes && <p className="text-sm text-bread-brown">Design: {order.designNotes}</p>}
            {order.adminNote && <p className="text-sm italic text-bread-brown">Bakery note: {order.adminNote}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-bread-latte pt-3">
              <p className="text-sm">
                {order.quotedPrice != null ? (
                  <>
                    Price: <b>{formatMoney(order.quotedPrice)}</b> · advance paid: {formatMoney(order.advancePaid)} · balance:{' '}
                    <b>{formatMoney(order.quotedPrice - order.advancePaid)}</b>
                  </>
                ) : (
                  'Waiting for the admin to set a price'
                )}
              </p>
              <div className="flex gap-2">
                {order.status === 'quoted' && <button onClick={() => accept(order)} className="btn-primary">Customer agreed</button>}
                {['requested', 'quoted'].includes(order.status) && <button onClick={() => cancel(order)} className="btn-danger">Cancel</button>}
              </div>
            </div>
          </div>
        ))
      )}

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  )
}

export default CakeOrders
