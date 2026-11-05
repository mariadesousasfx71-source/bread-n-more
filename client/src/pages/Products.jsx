import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { errorMessage } from '../api/client'
import useDebounce from '../hooks/useDebounce'
import Title from '../components/Title'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import { PageLoader, ErrorBox, EmptyState } from '../components/ui'

// The shop page. Search, filter, sort and paging are done by the SERVER: this page only sends the choices.
const Products = () => {
  const [searchParams] = useSearchParams() // ?category=Breads comes from the pictures on the home page
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  // load the categories once (each one has an _id, a name and a productCount)
  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => {
        setCategories(data.data)
        const wanted = searchParams.get('category')
        const found = wanted && data.data.find((item) => item.name.toLowerCase() === wanted.toLowerCase())
        if (found) setCategory(found._id)
      })
      .catch(() => {})
  }, [])

  // load the products again whenever a choice changes
  const load = () => {
    let ignore = false // if the choices change again before the answer arrives, drop the old answer
    setLoading(true)
    setError('')
    api
      .get('/products', { params: { page, limit: 12, search: debouncedSearch, category, sort, stock: inStockOnly ? 'in' : '' } })
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
  useEffect(load, [page, debouncedSearch, category, sort, inStockOnly])

  // any change of search/filter starts again from page 1
  const change = (setter) => (event) => {
    setter(event.target.type === 'checkbox' ? event.target.checked : event.target.value)
    setPage(1)
  }

  return (
    <div className="border-t border-bread-latte pt-10">
      <div className="mb-6 text-2xl">
        <Title text1="THE" text2="BAKERY" />
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
        <input value={search} onChange={change(setSearch)} className="input" placeholder="Search by name or code" />
        <select value={category} onChange={change(setCategory)} className="input">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item._id} value={item._id}>{item.name} ({item.productCount})</option>
          ))}
        </select>
        <select value={sort} onChange={change(setSort)} className="input">
          <option value="newest">Newest first</option>
          <option value="name">Name A-Z</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStockOnly} onChange={change(setInStockOnly)} />
          In stock only
        </label>
      </div>

      {loading ? (
        <PageLoader text="Loading products..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState text="No products match your search." />
      ) : (
        <div className="grid grid-cols-2 gap-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  )
}

export default Products
