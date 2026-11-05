import AppError from '../utils/AppError.js'

// Any address that no route matched -> 404
export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

// THE central error handler. Every error in the app ends up here.
// Express knows it is an error handler because it has FOUR parameters.
// The reply never contains a stack trace; the details are only printed in the server terminal.
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500
  let message = err.message

  if (err.name === 'ValidationError') {
    // Mongoose: a field broke a schema rule (required, min, enum...)
    status = 400
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ')
  } else if (err.name === 'CastError') {
    // Mongoose: a value has the wrong type, e.g. an invalid id in the address
    status = 400
    message = `Invalid ${err.path}`
  } else if (err.code === 11000) {
    // MongoDB: a unique field (email, sku) already exists
    status = 409
    const field = Object.keys(err.keyValue || {})[0] || 'value'
    message = `That ${field} is already in use`
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401
    message = 'Your session is invalid or has expired. Please log in again.'
  } else if (err.name === 'MulterError') {
    status = 400
    message = err.code === 'LIMIT_FILE_SIZE' ? 'The photo is too large (maximum 5 MB)' : err.message
  } else if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'The request body is not valid JSON'
  } else if (!err.isOperational) {
    // A real bug. Show details only in the terminal, send a plain message to the client.
    console.error(err)
    status = 500
    message = 'Something went wrong on the server'
  }

  res.status(status).json({ success: false, message })
}
