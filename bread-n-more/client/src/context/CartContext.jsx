import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const KEY = 'breadCart'

const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

// The cart lives in the browser (localStorage). It is only a shopping list:
// the SERVER checks the stock and the prices again when the order is placed.
// Each item: { product: "<id>", name, price, image, stock, quantity }
export const CartProvider = ({ children }) => {
  const { user, loading } = useAuth()
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  // empty the cart when the person logs out
  useEffect(() => {
    if (!loading && !user) setItems([])
  }, [user, loading])

  const quantityInCart = (productId) => items.find((item) => item.product === productId)?.quantity || 0

  // Adds one more. Never more than the stock we know about.
  const addItem = (product) => {
    setItems((current) => {
      const found = current.find((item) => item.product === product._id)
      const next = Math.min((found ? found.quantity : 0) + 1, product.stock)
      if (found) {
        return current.map((item) =>
          item.product === product._id ? { ...item, quantity: next, stock: product.stock, price: product.price } : item
        )
      }
      return [
        ...current,
        { product: product._id, name: product.name, price: product.price, image: product.image, stock: product.stock, quantity: next },
      ]
    })
  }

  const setQuantity = (productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.product === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item
      )
    )
  }

  const removeItem = (productId) => setItems((current) => current.filter((item) => item.product !== productId))
  const clearCart = () => setItems([])

  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const value = { items, count, total, quantityInCart, addItem, setQuantity, removeItem, clearCart }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
