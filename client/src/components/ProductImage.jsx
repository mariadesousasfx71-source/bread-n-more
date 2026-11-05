import { imageUrl } from '../config/siteConfig'

// Shows the product photo, or a plain square with the first letter when there is no photo
const ProductImage = ({ src, name, className = '' }) =>
  src ? (
    <img src={imageUrl(src)} alt={name} loading="lazy" className={`object-contain ${className}`} />
  ) : (
    <div className={`flex items-center justify-center bg-bread-latte font-display text-2xl text-bread-brown ${className}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )

export default ProductImage
