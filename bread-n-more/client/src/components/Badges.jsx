// Coloured labels. Each one only decides which colour goes with which word.

const badge = (colour, text) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${colour}`}>{text}</span>
)

// A product's stock: "Out of stock", "Low: 3 left" or "In stock: 40"
export const StockBadge = ({ product }) => {
  if (product.stock <= 0) return badge('bg-red-100 text-red-800', 'Out of stock')
  if (product.stock <= product.lowStockThreshold) return badge('bg-amber-100 text-amber-800', `Low: ${product.stock} left`)
  return badge('bg-green-100 text-green-800', `In stock: ${product.stock}`)
}

const orderColours = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
}
export const OrderStatusBadge = ({ status }) => badge(orderColours[status] || 'bg-gray-100', status)

const cakeColours = {
  requested: 'bg-amber-100 text-amber-800',
  quoted: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-blue-100 text-blue-800',
  ready: 'bg-teal-100 text-teal-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-700',
}
export const CakeStatusBadge = ({ status }) => badge(cakeColours[status] || 'bg-gray-100', status)

const userColours = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
}
export const UserStatusBadge = ({ status }) => badge(userColours[status] || 'bg-gray-100', status)
