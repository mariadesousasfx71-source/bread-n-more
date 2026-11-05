import { useEffect, useState } from 'react'

// Returns the value only after it has stopped changing for a moment.
// Used on search boxes, so we do not call the server on every single key press.
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebounce
