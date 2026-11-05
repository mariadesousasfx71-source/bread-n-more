import AppError from './AppError.js'

// "Today" and day boundaries depend on the time zone. UTC_OFFSET in .env sets it (India: +05:30).
const offset = () => process.env.UTC_OFFSET || '+05:30'

const offsetMinutes = () => {
  const match = /^([+-])(\d{2}):(\d{2})$/.exec(offset())
  if (!match) return 0
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
}

export const isDay = (text) => /^\d{4}-\d{2}-\d{2}$/.test(text || '') && !Number.isNaN(Date.parse(text))

export const dayStart = (day) => new Date(`${day}T00:00:00.000${offset()}`)
export const dayEnd = (day) => new Date(`${day}T23:59:59.999${offset()}`)

// Today's date as "YYYY-MM-DD" in the shop's time zone
export const todayString = () => new Date(Date.now() + offsetMinutes() * 60000).toISOString().slice(0, 10)

// Moves a "YYYY-MM-DD" date forward or back by some days
export const addDays = (day, count) => {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

// Turns ?from=2026-11-01&to=2026-11-03 into a MongoDB condition for createdAt.
// Returns null when neither is given. Throws a 400 error when the dates are wrong.
export const dateRangeFilter = (from, to) => {
  if (!from && !to) return null
  if ((from && !isDay(from)) || (to && !isDay(to))) {
    throw new AppError('Dates must look like 2026-11-30 (year-month-day)', 400)
  }
  if (from && to && from > to) throw new AppError('"from" must not be after "to"', 400)

  const range = {}
  if (from) range.$gte = dayStart(from)
  if (to) range.$lte = dayEnd(to)
  return range
}

export const timezoneForMongo = offset
