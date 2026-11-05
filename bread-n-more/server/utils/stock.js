import StockMovement from '../models/StockMovement.js'

// Writes lines in the stock ledger. Each entry is { product, user, order, type, change, balanceAfter, reason }.
// The ledger is a RECORD, so a problem while writing it must never undo a sale:
// we log the problem in the terminal and carry on.
export const logMovements = async (entries) => {
  if (!entries || entries.length === 0) return
  try {
    await StockMovement.insertMany(entries)
  } catch (error) {
    console.error('Could not write the stock ledger:', error.message)
  }
}
