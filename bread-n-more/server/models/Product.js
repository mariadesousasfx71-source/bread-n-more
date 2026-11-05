import mongoose from 'mongoose'

const wholeNumber = { validator: Number.isInteger, message: '{PATH} must be a whole number' }

export const UNITS = ['piece', 'loaf', 'pack', 'kg', 'slice']

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 80 },
    // SKU = the bakery's own product code, e.g. BRD-001. Optional, but unique when given.
    sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
    description: { type: String, trim: true, default: '', maxlength: 500 },

    // RELATION: every product belongs to ONE category (a link to a document in the "categories" collection)
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },

    unit: { type: String, enum: UNITS, default: 'piece' }, // how it is counted: 1 loaf, 1 pack, 1 kg...
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },

    // ---- inventory ----
    stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'], validate: wholeNumber },
    // "low stock" means stock is at or below this number
    lowStockThreshold: { type: Number, default: 5, min: [0, 'Low-stock level cannot be negative'], validate: wholeNumber },

    image: { type: String, default: '' }, // e.g. "/uploads/long-bread.svg"
    // Removing a product only switches this off. Old orders still point to the product.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
)

productSchema.index({ name: 1 })
productSchema.index({ category: 1 })

// A calculated field (not stored): "out", "low" or "ok"
productSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) return 'out'
  if (this.stock <= this.lowStockThreshold) return 'low'
  return 'ok'
})

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)
export default Product
