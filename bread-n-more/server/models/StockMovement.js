import mongoose from 'mongoose'

export const MOVEMENT_TYPES = ['initial', 'restock', 'sale', 'order_cancelled', 'adjustment', 'waste']

// The STOCK LEDGER: one line every time a product's stock changes, like a bank statement.
// It answers "why is the stock 12?" and "who changed it?".
// It links to three other collections: the product, the person, and (for sales) the order.
const stockMovementSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who did it (empty for the seed)
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // set for sales and cancellations
    type: { type: String, enum: MOVEMENT_TYPES, required: true },
    change: { type: Number, required: true }, // +20 (delivery) or -3 (sale)
    balanceAfter: { type: Number, required: true, min: 0 }, // the stock after this change
    reason: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { timestamps: true }
)

stockMovementSchema.index({ product: 1, createdAt: -1 })

const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema)
export default StockMovement
