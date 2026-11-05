// Fills the database with the first admin account, the categories and some starter products.
//   npm run seed            -> creates the admin (if missing); adds categories and products only if there are none
//   npm run seed -- --reset -> deletes ALL products, orders, cake orders, categories and the stock ledger first
//
// To change the starter products: edit the list below. "photo" is a file name inside server/uploads.
import 'dotenv/config'
import mongoose from 'mongoose'
import User from './models/User.js'
import Category from './models/Category.js'
import Product from './models/Product.js'
import Order from './models/Order.js'
import CakeOrder from './models/CakeOrder.js'
import StockMovement from './models/StockMovement.js'

const categories = [
  ['Breads', 'Long bread, sliced bread, loaves, pav and corn bread, baked fresh every morning'],
  ['Biscuits & Cookies', 'Butter biscuits, cookies and tea-time favourites'],
  ['Pastries', 'Pastries, cream rolls and puffs'],
  ['Cakes', 'Whole cakes by the kilo and cupcakes. Special cakes are ordered separately.'],
  ['Burgers & Sandwiches', 'Burgers and sandwiches made to order'],
  ['Savouries', 'Patties, croquettes, rissois and samosas'],
]

// category, sku, name, description, unit, price, photo, stock, low-stock level
// (a few products are deliberately low or empty so the dashboard has something to show)
const products = [
  ['Breads', 'BRD-001', 'Long Bread', 'Our long bread (baguette): crisp crust, soft inside. Best on the day it is baked.', 'loaf', 60, 'long-bread.jpg', 40, 10],
  ['Breads', 'BRD-002', 'Sliced Bread', 'Soft white sandwich loaf, sliced and ready for toast.', 'loaf', 45, 'sliced-bread.png', 50, 12],
  ['Breads', 'BRD-003', 'Whole Wheat Loaf', 'Wholesome brown loaf with a nutty crust.', 'loaf', 55, 'wheat-loaf.png', 25, 8],
  ['Breads', 'BRD-004', 'Pav (pack of 6)', 'Soft little buns, perfect with bhaji or patties.', 'pack', 30, 'pav.jpg', 60, 15],
  ['Breads', 'BRD-005', 'Sweet Corn Bread', 'Golden bread baked with sweet corn kernels.', 'loaf', 70, 'corn-bread.png', 14, 6],
  ['Breads', 'BRD-006', 'Garlic Bread', 'Buttery garlic and herb slices, toasted.', 'pack', 90, 'garlic-bread.png', 4, 6],
  ['Biscuits & Cookies', 'BIS-001', 'Butter Biscuits (250 g)', 'Crumbly butter biscuits, great with tea.', 'pack', 80, 'butter-biscuits.png', 35, 10],
  ['Biscuits & Cookies', 'BIS-002', 'Coconut Biscuits (250 g)', 'Crunchy biscuits with desiccated coconut.', 'pack', 70, 'coconut-biscuits.png', 30, 10],
  ['Biscuits & Cookies', 'BIS-003', 'Choco Chip Cookies', 'Big cookies loaded with chocolate chips.', 'pack', 120, 'choco-cookies.png', 22, 8],
  ['Biscuits & Cookies', 'BIS-004', 'Jeera Biscuits (250 g)', 'Savoury cumin biscuits.', 'pack', 60, '', 28, 10],
  ['Biscuits & Cookies', 'BIS-005', 'Nankhatai (250 g)', 'Melt-in-the-mouth cardamom shortbread.', 'pack', 90, 'nankhatai.jpg', 0, 8],
  ['Pastries', 'PAS-001', 'Chocolate Pastry', 'Layers of chocolate sponge and cream.', 'piece', 60, 'choc-pastry.png', 24, 8],
  ['Pastries', 'PAS-002', 'Pineapple Pastry', 'Light sponge with pineapple cream.', 'piece', 55, 'pineapple-pastry.png', 20, 8],
  ['Pastries', 'PAS-003', 'Black Forest Pastry', 'Cherry, cream and dark chocolate.', 'piece', 65, 'blackforest-pastry.png', 18, 8],
  ['Pastries', 'PAS-004', 'Cream Roll', 'Flaky roll filled with fresh cream.', 'piece', 40, 'cream-roll.png', 26, 8],
  ['Pastries', 'PAS-005', 'Cheese Puff', 'Layers of puff pastry with a cheese drizzle.', 'piece', 50, 'cheese-puff.png', 5, 8],
  ['Cakes', 'CAK-001', 'Black Forest Cake (1 kg)', 'Chocolate sponge, whipped cream and cherries.', 'piece', 650, 'blackforest-cake.png', 6, 2],
  ['Cakes', 'CAK-002', 'Pineapple Cake (1 kg)', 'Vanilla sponge with pineapple and cream.', 'piece', 600, 'pineapple-cake.png', 5, 2],
  ['Cakes', 'CAK-003', 'Plum Cake (1 kg)', 'Rich fruit and nut cake, a Christmas favourite.', 'piece', 550, 'plum-cake.png', 8, 2],
  ['Cakes', 'CAK-004', 'Chocolate Truffle Cake (1 kg)', 'Dark chocolate ganache over moist sponge.', 'piece', 750, 'truffle-cake.png', 2, 2],
  ['Cakes', 'CAK-005', 'Cupcake', 'Vanilla cupcake with buttercream.', 'piece', 35, 'cupcake.png', 30, 10],
  ['Burgers & Sandwiches', 'BUR-001', 'Veg Burger', 'Crispy veg patty, lettuce, tomato and cheese.', 'piece', 70, 'veg-burger.png', 16, 6],
  ['Burgers & Sandwiches', 'BUR-002', 'Chicken Burger', 'Crumb-fried chicken, lettuce and mayo.', 'piece', 95, 'chicken-burger.png', 12, 6],
  ['Burgers & Sandwiches', 'SAN-001', 'Veg Sandwich', 'Cucumber, tomato, lettuce and mint chutney.', 'piece', 50, 'veg-sandwich.png', 20, 6],
  ['Burgers & Sandwiches', 'SAN-002', 'Club Sandwich', 'Triple-decker with chicken, egg and salad.', 'piece', 90, 'club-sandwich.png', 10, 5],
  ['Savouries', 'SAV-001', 'Veg Patty', 'Flaky pastry with a spiced vegetable filling.', 'piece', 25, 'veg-patty.png', 45, 15],
  ['Savouries', 'SAV-002', 'Chicken Patty', 'Flaky pastry with a spicy chicken filling.', 'piece', 35, 'chicken-patty.png', 38, 15],
  ['Savouries', 'SAV-003', 'Veg Croquette', 'Crumb-coated potato and vegetable croquette.', 'piece', 30, 'veg-croquette.png', 30, 10],
  ['Savouries', 'SAV-004', 'Chicken Croquette', 'Crumb-coated creamy chicken croquette.', 'piece', 40, 'chicken-croquette.png', 25, 10],
  ['Savouries', 'SAV-005', 'Prawn Rissois', 'Golden half-moon pastry with a creamy prawn filling.', 'piece', 40, 'prawn-rissois.png', 3, 10],
  ['Savouries', 'SAV-006', 'Veg Samosa', 'Crisp samosa with a spiced potato and pea filling.', 'piece', 20, 'veg-samosa.jpg', 50, 15],
  ['Savouries', 'SAV-007', 'Chicken Samosa', 'Crisp samosa with minced chicken.', 'piece', 25, 'chicken-samosa.png', 40, 15],
]

// Creates the user, or fixes an existing one so that it is an approved account with the given role
const ensureUser = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    existing.role = role
    existing.status = 'approved'
    await existing.save()
    console.log(`${role} account already existed (${email}), made sure it is approved`)
    return existing
  }
  // the password is hashed automatically by the model (pre "save" step)
  const created = await User.create({ name, email, password, role, status: 'approved' })
  console.log(`Created ${role} account: ${email}`)
  return created
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'breadandmore' })

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) in server/.env first')
  }
  const admin = await ensureUser({ name: ADMIN_NAME || 'Bread and More Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' })

  // A practice staff account so you can test the User side. Not created on a live server.
  if (process.env.NODE_ENV !== 'production') {
    await ensureUser({ name: 'Demo Staff', email: 'staff@breadandmore.com', password: 'Staff12345', role: 'user' })
  }

  if (process.argv.includes('--reset')) {
    // the order matters: first the things that point to other things
    await StockMovement.deleteMany({})
    await Order.deleteMany({})
    await CakeOrder.deleteMany({})
    await Product.deleteMany({})
    await Category.deleteMany({})
    console.log('Old categories, products, orders and stock records deleted')
  } else if ((await Product.countDocuments()) > 0) {
    console.log('Products already exist. Nothing added. (Use "npm run seed -- --reset" to start over.)')
    await mongoose.disconnect()
    return
  }

  // 1. categories first, because every product needs one
  const savedCategories = await Category.insertMany(categories.map(([name, description]) => ({ name, description })))
  const idByName = new Map(savedCategories.map((category) => [category.name, category._id]))

  // 2. products, each pointing to its category by id
  const now = Date.now()
  const docs = products.map(([categoryName, sku, name, description, unit, price, photo, stock, lowStockThreshold], i) => ({
    sku,
    name,
    description,
    category: idByName.get(categoryName),
    unit,
    price,
    stock,
    lowStockThreshold,
    image: photo ? `/uploads/${photo}` : '', // no photo yet -> shows the placeholder
    createdAt: new Date(now - i * 1000), // keeps the order above when sorted by newest
  }))
  const savedProducts = await Product.insertMany(docs)

  // 3. one "initial" line in the stock ledger for each product that starts with stock
  await StockMovement.insertMany(
    savedProducts
      .filter((product) => product.stock > 0)
      .map((product) => ({
        product: product._id,
        user: admin._id,
        type: 'initial',
        change: product.stock,
        balanceAfter: product.stock,
        reason: 'Starting stock',
      }))
  )

  console.log(`Added ${savedCategories.length} categories and ${savedProducts.length} products`)
  await mongoose.disconnect()
}

run().catch(async (error) => {
  console.error(error.message)
  await mongoose.disconnect()
  process.exit(1)
})
