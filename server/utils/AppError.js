// An error we throw on purpose, with the HTTP status code to send back.
//   throw new AppError('Product not found', 404)
// The central error handler (middleware/errorHandler.js) turns it into a JSON reply.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true // "expected" error, safe to show the message to the user
  }
}

export default AppError
