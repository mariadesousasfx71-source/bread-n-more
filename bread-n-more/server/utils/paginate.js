// Reads ?page=2&limit=10 from the address and makes them safe numbers.
export const getPaging = (query, defaultLimit = 10, maxLimit = 50) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit)
  return { page, limit, skip: (page - 1) * limit }
}

// The "pagination" block that goes in every list reply
export const pageInfo = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
})

// Makes user text safe to use inside a search (so "a.b*" is searched literally)
export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
