import { toast } from 'react-toastify'
import { useCart } from '../context/CartContext'
import { formatMoney } from '../config/siteConfig'
import ProductImage from './ProductImage'
import { StockBadge } from './Badges'

// One product in the shop: photo, name, price, stock label and the Add button
const ProductCard = ({ product }) => {
  const { addItem, quantityInCart } = useCart()
  const inCart = quantityInCart(product._id)
  const soldOut = product.stock <= 0

  const add = () => {
    if (inCart >= product.stock) {
      toast.error(`Only ${product.stock} in stock`)
      return
    }
    addItem(product)
    toast.success(`${product.name} added to the cart`)
  }

  return (
    <div className="card flex flex-col p-3">
      <div className="overflow-hidden rounded-lg">
        <ProductImage src={product.image} name={product.name} className="aspect-square w-full" />
      </div>
      <p className="pt-3 text-xs text-bread-brown">{product.category?.name}</p>
      <p className="font-medium">{product.name}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-bread-brown">
          {formatMoney(product.price)} <span className="text-xs">/ {product.unit}</span>
        </p>
        <StockBadge product={product} />
      </div>
      <button onClick={add} disabled={soldOut} className="btn-primary mt-3">
        {soldOut ? 'Out of stock' : inCart > 0 ? `ADD MORE (${inCart} in cart)` : 'ADD TO CART'}
      </button>
    </div>
  )
}

export default ProductCard
