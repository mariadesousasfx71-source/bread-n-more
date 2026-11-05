import mongoose from 'mongoose'

// A group of products: Breads, Biscuits, Cakes... One category has MANY products.
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, maxlength: 40, unique: true },
    description: { type: String, trim: true, default: '', maxlength: 200 },
  },
  { timestamps: true }
)

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema)
export default Category
