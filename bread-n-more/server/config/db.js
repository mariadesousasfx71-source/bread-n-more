import mongoose from 'mongoose'

// Works with a local address (mongodb://127.0.0.1:27017) or a MongoDB Atlas string.
// The database name comes from DB_NAME in .env (default "breadandmore").
const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'breadandmore' })
  console.log('MongoDB connected')
}

export default connectDB
