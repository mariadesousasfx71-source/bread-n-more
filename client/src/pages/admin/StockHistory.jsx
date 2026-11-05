import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api, { errorMessage } from '../../api/client'
import { formatDateTime } from '../../config/siteConfig'
import { StockBadge } from '../../components/Badges'
import Pagination from '../../components/Pagination'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

const typeLabels = {
  initial: 'Starting stock',
  restock: 'Baked / delivered',
  sale: 'Sold in an order',
  order_cancelled: 'Order cancelled',
  adjustment: 'Adjusted',
  waste: 'Waste / unsold',
}

// The stock ledger of ONE product: every change, who did it, and the stock after it
const StockHistory = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [movements, setMovements] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    api
      .get(`/products/${id}/movements`, { params: { page, limit: 15 } })
      .then(({ data }) => {
        setProduct(data.product)
        setMovements(data.data)
        setPagination(data.pagination)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id, page])

  if (loading && !product) return <PageLoader text="Loading the stock history..." />
  if (error) return <ErrorBox message={error} onRetry={load} />

  return (
    <div>
      <Link to="/admin/products" className="text-sm text-bread-brown hover:text-bread-dark">← Back to products</Link>
      <div className="my-4 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl">Stock history: {product.name}</h2>
        <StockBadge product={product} />
      </div>

      {movements.length === 0 ? (
        <EmptyState text="No stock changes recorded yet." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-bread-latte/60 text-xs uppercase text-bread-brown">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">What happened</th>
                <th className="p-3">Change</th>
                <th className="p-3">Stock after</th>
                <th className="p-3">By</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bread-latte">
              {movements.map((row) => (
                <tr key={row._id}>
                  <td className="p-3">{formatDateTime(row.createdAt)}</td>
                  <td className="p-3">{typeLabels[row.type] || row.type}</td>
                  <td className={`p-3 font-medium ${row.change > 0 ? 'text-green-700' : 'text-red-700'}`}>{row.change > 0 ? `+${row.change}` : row.change}</td>
                  <td className="p-3">{row.balanceAfter}</td>
                  <td className="p-3">{row.user?.name || '-'}</td>
                  <td className="p-3 text-xs text-bread-brown">
                    {row.reason}
                    {row.order?.customerName && ` (customer: ${row.order.customerName})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  )
}

export default StockHistory
