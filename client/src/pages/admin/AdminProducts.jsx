import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../../api/client'
import useDebounce from '../../hooks/useDebounce'
import { formatMoney } from '../../config/siteConfig'
import { StockBadge } from '../../components/Badges'
import ProductImage from '../../components/ProductImage'
import Pagination from '../../components/Pagination'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

// Add or remove stock of ONE product: type a number, press Add or Remove.
const StockAdjuster = ({ product, onChanged }) => {
  const [amount, setAmount] = useState('')

  const apply = async (sign) => {
    const change = sign * Number(amount)
    try {
      await api.patch(`/products/${product._id}/stock`, { change, reason: change > 0 ? 'Baked / delivered' : 'Removed by admin' })
      toast.success(`${product.name}: stock ${change > 0 ? 'added' : 'removed'}`)
      setAmount('')
      onChanged()
    } catch (err) {
      toast.error(errorMessage(err)) // e.g. "There is not enough stock to remove that many"
    }
  }

  const valid = Number.isInteger(Number(amount)) && Number(amount) > 0

  return (
    <div className="flex items-center gap-1">
      <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="input w-16 px-2 py-1" placeholder="qty" aria-label={`Amount for ${product.name}`} />
      <button disabled={!valid} onClick={() => apply(1)} className="btn-outline px-3 py-1" title="Add stock">+</button>
      <button disabled={!valid} onClick={() => apply(-1)} className="btn-outline px-3 py-1" title="Remove stock">−</button>
    </div>
  )
}

const AdminProducts = () => {
  const [searchParams] = useSearchParams() // so the dashboard can open this page already filtered (?stock=low)
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [stock, setStock] = useState(searchParams.get('stock') || '')
  const [showHidden, setShowHidden] = useState(false)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const load = () => {
    let ignore = false
    setLoading(true)
    setError('')
    api
      .get('/products', { params: { page, limit: 10, search: debouncedSearch, stock, includeInactive: showHidden, sort: 'name' } })
      .then(({ data }) => {
        if (ignore) return
        setProducts(data.data)
        setPagination(data.pagination)
      })
      .catch((err) => !ignore && setError(errorMessage(err)))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }
  useEffect(load, [page, debouncedSearch, stock, showHidden])

  const setActive = async (product, isActive) => {
    if (!isActive && !window.confirm(`Remove "${product.name}" from the shop? Old orders keep their record.`)) return
    try {
      if (isActive) await api.put(`/products/${product._id}`, { isActive: true })
      else await api.delete(`/products/${product._id}`)
      toast.success(isActive ? 'Product is back in the shop' : 'Product removed from the shop')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Products & stock</h2>
        <Link to="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input" placeholder="Search by name or code" />
        <select value={stock} onChange={(e) => { setStock(e.target.value); setPage(1) }} className="input">
          <option value="">All stock levels</option>
          <option value="low">Low on stock</option>
          <option value="out">Out of stock</option>
          <option value="in">In stock</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showHidden} onChange={(e) => { setShowHidden(e.target.checked); setPage(1) }} />
          Show removed products
        </label>
      </div>

      {loading ? (
        <PageLoader text="Loading products..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState text="No products found." />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-bread-latte/60 text-xs uppercase text-bread-brown">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Change stock</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bread-latte">
              {products.map((product) => (
                <tr key={product._id} className={product.isActive ? '' : 'bg-gray-50 opacity-60'}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <ProductImage src={product.image} name={product.name} className="h-10 w-10 rounded" />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-bread-brown">{product.sku}{product.isActive ? '' : ' · removed'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{product.category?.name}</td>
                  <td className="p-3">{formatMoney(product.price)} <span className="text-xs text-bread-brown">/ {product.unit}</span></td>
                  <td className="p-3"><StockBadge product={product} /></td>
                  <td className="p-3"><StockAdjuster product={product} onChanged={load} /></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/products/${product._id}/edit`} className="btn-outline px-4 py-1">Edit</Link>
                      <Link to={`/admin/products/${product._id}/history`} className="btn-outline px-4 py-1">History</Link>
                      {product.isActive ? (
                        <button onClick={() => setActive(product, false)} className="btn-danger px-4 py-1">Remove</button>
                      ) : (
                        <button onClick={() => setActive(product, true)} className="btn-outline px-4 py-1">Restore</button>
                      )}
                    </div>
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

export default AdminProducts
