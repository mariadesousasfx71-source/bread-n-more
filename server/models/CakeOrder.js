import mongoose from 'mongoose'

export const CAKE_STATUSES = ['requested', 'quoted', 'confirmed', 'paid', 'ready', 'delivered', 'cancelled']

// A SPECIAL CAKE ORDER (birthday, wedding, Christmas...). It is made to order, so it does NOT touch the stock.
// Life of a cake order:
//   requested (staff took the request) -> quoted (admin set a price) -> confirmed (customer agreed)
//   -> paid (the full price has been paid, advance + balance) -> ready -> delivered.     It can be cancelled before it is ready.
const cakeOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // the staff member who took the request
    baseCake: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // optional: which cake on the menu it is based on

    customerName: { type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 60 },
    customerPhone: { type: String, required: [true, 'Customer phone is required'], trim: true, maxlength: 20 },

    flavour: { type: String, required: [true, 'Flavour is required'], trim: true, maxlength: 40 },
    weightKg: { type: Number, required: [true, 'Weight is required'], min: [0.5, 'The smallest cake is 0.5 kg'], max: [10, 'The biggest cake is 10 kg'] },
    messageOnCake: { type: String, trim: true, maxlength: 40, default: '' }, // e.g. "Happy Birthday Anna"
    designNotes: { type: String, trim: true, maxlength: 300, default: '' },
    requiredDate: { type: Date, required: [true, 'The date the cake is needed is required'] },

    status: { type: String, enum: CAKE_STATUSES, default: 'requested' },
    quotedPrice: { type: Number, min: 0 }, // set by the admin
    advancePaid: { type: Number, min: 0, default: 0 }, // money paid in advance
    adminNote: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
)

cakeOrderSchema.index({ user: 1, createdAt: -1 })
cakeOrderSchema.index({ requiredDate: 1 })

const CakeOrder = mongoose.models.CakeOrder || mongoose.model('CakeOrder', cakeOrderSchema)
export default CakeOrder
