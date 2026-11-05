import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../../api/client'
import { imageUrl } from '../../config/siteConfig'
import { PageLoader, ErrorBox } from '../../components/ui'

const empty = { name: '', sku: '', category: '', unit: 'piece', price: '', stock: 0, lowStockThreshold: 5, description: '', isActive: true }
const units = ['piece', 'loaf', 'pack', 'kg', 'slice']

// ONE form for two jobs: add a product (/admin/products/new) and edit one (/admin/products/:id/edit)
const ProductForm = () => {
  const { id } = useParams() // there is an id only when editing
  const editing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(empty)
  const [photo, setPhoto] = useState(null) // a newly chosen file
  const [currentImage, setCurrentImage] = useState('') // the photo already saved
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data)).catch(() => {})
  }, [])

  // when editing: load the product and fill the form
  useEffect(() => {
    if (!editing) return
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.data
        setForm({ name: p.name, sku: p.sku || '', category: p.category?._id || '', unit: p.unit, price: p.price, stock: p.stock, lowStockThreshold: p.lowStockThreshold, description: p.description || '', isActive: p.isActive })
        setCurrentImage(p.image)
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [id, editing])

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      // a form with a file must be sent as FormData (not plain JSON)
      const body = new FormData()
      Object.entries(form).forEach(([key, value]) => body.append(key, value))
      if (photo) body.append('image', photo)

      if (editing) await api.put(`/products/${id}`, body)
      else await api.post('/products', body)

      toast.success(editing ? 'Product updated' : 'Product added')
      navigate('/admin/products')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />
  if (error) return <ErrorBox message={error} />

  const preview = photo ? URL.createObjectURL(photo) : imageUrl(currentImage)

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <h2 className="text-2xl">{editing ? 'Edit product' : 'Add a product'}</h2>

      <div>
        <p className="mb-2 text-sm">Photo (JPG, PNG or WEBP, up to 5 MB)</p>
        <label className="inline-block cursor-pointer">
          {preview ? (
            <img src={preview} alt="" className="h-28 w-28 rounded border border-bread-latte object-cover" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded border-2 border-dashed border-bread-brown/40 bg-white text-xs text-bread-brown">+ Photo</div>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => setPhoto(e.target.files[0] || null)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Name<input className="input mt-1" value={form.name} onChange={update('name')} required maxLength={80} /></label>
        <label className="text-sm">Product code (SKU), optional<input className="input mt-1" value={form.sku} onChange={update('sku')} placeholder="COF-008" /></label>
        <label className="text-sm">Category
          <select className="input mt-1" value={form.category} onChange={update('category')} required>
            <option value="">Choose a category</option>
            {categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Sold by
          <select className="input mt-1" value={form.unit} onChange={update('unit')}>
            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </label>
        <label className="text-sm">Price<input type="number" min="0" step="0.01" className="input mt-1" value={form.price} onChange={update('price')} required /></label>
        <label className="text-sm">Stock (how many we have)<input type="number" min="0" step="1" className="input mt-1" value={form.stock} onChange={update('stock')} required /></label>
        <label className="text-sm">Low-stock level (warn at or below)<input type="number" min="0" step="1" className="input mt-1" value={form.lowStockThreshold} onChange={update('lowStockThreshold')} required /></label>
      </div>

      <label className="block text-sm">Description<textarea className="input mt-1" rows={3} maxLength={500} value={form.description} onChange={update('description')} /></label>

      {editing && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Shown in the shop
        </label>
      )}

      <div className="flex gap-3">
        <button disabled={saving} className="btn-primary">{saving ? 'SAVING...' : editing ? 'SAVE CHANGES' : 'ADD PRODUCT'}</button>
        <Link to="/admin/products" className="btn-outline">Cancel</Link>
      </div>
    </form>
  )
}

export default ProductForm
