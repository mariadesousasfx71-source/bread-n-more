import mongoose from 'mongoose'

export const ORDER_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

// One line of an order. The name and price are COPIED from the product at the moment of ordering,
// so changing the product's price later does not change old orders.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // link to the Product
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // the staff member who took the order
    customerName: { type: String, trim: true, maxlength: 60, default: '' }, // optional: who the order is for
    items: {
      type: [orderItemSchema],
      validate: [(lines) => lines.length > 0, 'An order needs at least one item'],
    },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    note: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema)
export default Order
