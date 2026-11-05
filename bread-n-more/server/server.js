// Starts the API: loads the settings from .env, connects to MongoDB, then listens for requests.
//   npm run dev     (restarts by itself when you save a file)
//   npm start
// "dotenv/config" must stay the FIRST import: the other files read their settings from .env when they load.
import 'dotenv/config'
import app from './app.js'
import connectDB from './config/db.js'

// Stop early, with a clear message, when a needed setting is missing from server/.env
for (const name of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Missing ${name} in server/.env. Copy .env.example to .env and fill it in.`)
    process.exit(1)
  }
}

const PORT = process.env.PORT || 4000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message)
    process.exit(1)
  })
