import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../../api/client'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

// The admin adds, renames and deletes categories (Breads, Cakes...)
const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState(null) // the category being edited, or null when adding

  const load = () => {
    setLoading(true)
    setError('')
    api
      .get('/categories')
      .then(({ data }) => setCategories(data.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const reset = () => {
    setName('')
    setDescription('')
    setEditingId(null)
  }

  const save = async (event) => {
    event.preventDefault()
    try {
      if (editingId) await api.put(`/categories/${editingId}`, { name, description })
      else await api.post('/categories', { name, description })
      toast.success(editingId ? 'Category updated' : 'Category added')
      reset()
      load()
    } catch (err) {
      toast.error(errorMessage(err)) // e.g. "That name is already in use"
    }
  }

  const edit = (category) => {
    setEditingId(category._id)
    setName(category.name)
    setDescription(category.description || '')
  }

  const remove = async (category) => {
    if (!window.confirm(`Delete the category "${category.name}"?`)) return
    try {
      await api.delete(`/categories/${category._id}`)
      toast.success('Category deleted')
      load()
    } catch (err) {
      toast.error(errorMessage(err)) // 409 when it still has products
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl">Categories</h2>

      <form onSubmit={save} className="card mb-8 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
        <input className="input" placeholder="Name (e.g. Breads)" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
        <input className="input" placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        <div className="flex gap-2">
          <button className="btn-primary">{editingId ? 'SAVE' : 'ADD'}</button>
          {editingId && <button type="button" onClick={reset} className="btn-outline">Cancel</button>}
        </div>
      </form>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : categories.length === 0 ? (
        <EmptyState text="No categories yet." />
      ) : (
        <div className="card divide-y divide-bread-latte p-0">
          {categories.map((category) => (
            <div key={category._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{category.name} <span className="text-xs text-bread-brown">({category.productCount} products)</span></p>
                <p className="text-xs text-bread-brown">{category.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => edit(category)} className="btn-outline px-4 py-1">Edit</button>
                <button onClick={() => remove(category)} className="btn-danger px-4 py-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Categories
