import multer from 'multer'
import path from 'path'
import AppError from '../utils/AppError.js'
import { uploadsDir } from '../config/uploadsPaths.js'

// Saves an uploaded product photo into the uploads folder with a unique name
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    callback(null, `${Date.now()}-${safeName}`)
  },
})

const fileFilter = (req, file, callback) => {
  const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)
  callback(ok ? null : new AppError('Only JPG, PNG, WEBP or GIF images are allowed', 400), ok)
}

// Only JPG, PNG, WEBP or GIF, up to 5 MB
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } })

export default upload
