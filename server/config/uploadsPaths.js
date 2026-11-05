import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The starter pictures that come with the code (server/uploads). They are never changed by the app.
export const starterDir = path.join(__dirname, '..', 'uploads')

// Where photos uploaded through the app are saved.
// Locally this is the same folder. On Railway, set UPLOADS_DIR to the Volume path (for example /data/uploads)
// so the photos are kept when the app is redeployed.
export const uploadsDir = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : starterDir

fs.mkdirSync(uploadsDir, { recursive: true })
