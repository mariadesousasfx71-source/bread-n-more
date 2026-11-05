// Express 4 does not catch errors thrown inside async functions.
// This wrapper sends any error to next(), which reaches the central error handler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export default asyncHandler
