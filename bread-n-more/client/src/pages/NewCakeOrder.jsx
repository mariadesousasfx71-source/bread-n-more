import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../api/client'
import Title from '../components/Title'
import { ErrorBox } from '../components/ui'

// The earliest date we accept: today + 2 days (the server checks this too)
const addDays = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const empty = { customerName: '', customerPhone: '', baseCake: '', flavour: '', weightKg: 1, requiredDate: '', messageOnCake: '', designNotes: '' }

// A staff member writes down a special-cake request from a customer
const NewCakeOrder = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [cakes, setCakes] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // the cakes on the menu, for the optional "based on" box (Cakes is a category, so we find it by name)
  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => data.data.find((category) => category.name === 'Cakes'))
      .then((cakesCategory) => (cakesCategory ? api.get('/products', { params: { category: cakesCategory._id, limit: 50 } }) : null))
      .then((response) => response && setCakes(response.data.data))
      .catch(() => {})
  }, [])

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/cake-orders', { ...form, baseCake: form.baseCake || undefined })
      toast.success('Cake request saved')
      navigate('/cakes')
    } catch (err) {
      setError(errorMessage(err)) // e.g. "Special cakes need at least 2 days' notice."
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 border-t border-bread-latte pt-10">
      <div className="text-2xl">
        <Title text1="NEW" text2="CAKE REQUEST" />
      </div>
      <p className="text-sm text-bread-brown">Write down what the customer wants. The admin will set the price, and you tell the customer.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Customer name<input className="input mt-1" value={form.customerName} onChange={update('customerName')} required maxLength={60} /></label>
        <label className="text-sm">Customer phone<input className="input mt-1" value={form.customerPhone} onChange={update('customerPhone')} required maxLength={20} /></label>
        <label className="text-sm">Based on a cake from our menu (optional)
          <select className="input mt-1" value={form.baseCake} onChange={update('baseCake')}>
            <option value="">None: a completely custom cake</option>
            {cakes.map((cake) => <option key={cake._id} value={cake._id}>{cake.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Flavour<input className="input mt-1" value={form.flavour} onChange={update('flavour')} required maxLength={40} placeholder="Chocolate, vanilla, pineapple..." /></label>
        <label className="text-sm">Weight (kg)<input type="number" min="0.5" max="10" step="0.5" className="input mt-1" value={form.weightKg} onChange={update('weightKg')} required /></label>
        <label className="text-sm">Date needed (at least 2 days from today)<input type="date" min={addDays(2)} max={addDays(90)} className="input mt-1" value={form.requiredDate} onChange={update('requiredDate')} required /></label>
      </div>

      <label className="block text-sm">Message on the cake<input className="input mt-1" value={form.messageOnCake} onChange={update('messageOnCake')} maxLength={40} placeholder="Happy Birthday Anna" /></label>
      <label className="block text-sm">Design notes<textarea className="input mt-1" rows={3} maxLength={300} value={form.designNotes} onChange={update('designNotes')} placeholder="Colours, theme, toppers, allergies..." /></label>

      {error && <ErrorBox message={error} />}

      <div className="flex gap-3">
        <button disabled={busy} className="btn-primary">{busy ? 'SAVING...' : 'SAVE REQUEST'}</button>
        <Link to="/cakes" className="btn-outline">Cancel</Link>
      </div>
    </form>
  )
}

export default NewCakeOrder
