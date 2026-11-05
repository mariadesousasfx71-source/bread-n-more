import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../api/client'
import { useCart } from '../context/CartContext'
import { formatMoney } from '../config/siteConfig'
import Title from '../components/Title'
import ProductImage from '../components/ProductImage'
import { Icon } from '../components/Icons'
import { ErrorBox } from '../components/ui'

const Cart = () => {
  const { items, total, setQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const placeOrder = async () => {
    setError('')
    setBusy(true)
    try {
      // we only send WHICH product and HOW MANY. The server looks up prices and checks the stock.
      const lines = items.map((item) => ({ product: item.product, quantity: item.quantity }))
      await api.post('/orders', { items: lines, note, customerName })
      clearCart()
      toast.success('Order placed. Thank you!')
      navigate('/orders')
    } catch (err) {
      setError(errorMessage(err)) // e.g. "Not enough stock for Mocha. Only 2 left."
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-t border-bread-latte pt-10">
      <div className="mb-3 text-2xl">
        <Title text1="YOUR" text2="CART" />
      </div>

      {items.length === 0 ? (
        <p className="py-10 text-bread-brown">Your cart is empty. Pick something from the shop.</p>
      ) : (
        <>
          <div>
            {items.map((item) => (
              <div key={item.product} className="grid grid-cols-[4fr_1fr_auto] items-center gap-4 border-b border-t border-bread-latte py-4 sm:grid-cols-[4fr_1fr_1fr_auto]">
                <div className="flex items-center gap-4">
                  <ProductImage src={item.image} name={item.name} className="h-16 w-16 rounded" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-bread-brown">{formatMoney(item.price)} each</p>
                  </div>
                </div>

                <input
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    if (e.target.value !== '' && value >= 1) setQuantity(item.product, value)
                  }}
                  className="input max-w-20 px-2 py-1"
                  aria-label={`Quantity of ${item.name}`}
                />
                <p className="hidden text-right sm:block">{formatMoney(item.price * item.quantity)}</p>
                <button onClick={() => removeItem(item.product)} aria-label={`Remove ${item.name}`}>
                  <Icon name="trash" className="w-5 cursor-pointer" />
                </button>
              </div>
            ))}
          </div>

          <div className="my-10 flex justify-end">
            <div className="w-full sm:w-[450px]">
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={60}
                className="input mb-3"
                placeholder="Customer name (optional)"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                rows={2}
                className="input mb-4"
                placeholder="Note for this order (optional)"
              />
              <div className="flex justify-between border-t border-bread-latte py-3 text-lg font-medium">
                <p>Total</p>
                <p>{formatMoney(total)}</p>
              </div>
              {error && <ErrorBox message={error} />}
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={clearCart} className="btn-outline" disabled={busy}>
                  Empty cart
                </button>
                <button onClick={placeOrder} className="btn-primary" disabled={busy}>
                  {busy ? 'PLACING...' : 'PLACE ORDER'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Cart
