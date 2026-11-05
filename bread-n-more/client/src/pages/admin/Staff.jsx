import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api, { errorMessage } from '../../api/client'
import useDebounce from '../../hooks/useDebounce'
import { formatDateTime } from '../../config/siteConfig'
import { UserStatusBadge } from '../../components/Badges'
import Pagination from '../../components/Pagination'
import { PageLoader, ErrorBox, EmptyState } from '../../components/ui'

const tabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'blocked', label: 'Blocked' },
]

// The admin approves or blocks staff accounts here
const Staff = () => {
  const [searchParams] = useSearchParams() // the dashboard opens this page with ?status=pending
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const load = () => {
    let ignore = false
    setLoading(true)
    setError('')
    api
      .get('/users', { params: { page, limit: 10, status, search: debouncedSearch } })
      .then(({ data }) => {
        if (ignore) return
        setUsers(data.data)
        setPagination(data.pagination)
      })
      .catch((err) => !ignore && setError(errorMessage(err)))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }
  useEffect(load, [page, status, debouncedSearch])

  const setUserStatus = async (user, newStatus) => {
    try {
      await api.patch(`/users/${user._id}/status`, { status: newStatus })
      toast.success(`${user.name} is now ${newStatus}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl">Staff accounts</h2>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1) }}
            className={status === tab.value ? 'btn-primary' : 'btn-outline'}
          >
            {tab.label}
          </button>
        ))}
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input max-w-xs" placeholder="Search name or email" />
      </div>

      {loading ? (
        <PageLoader text="Loading staff..." />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : users.length === 0 ? (
        <EmptyState text="No staff accounts found." />
      ) : (
        <div className="card divide-y divide-bread-latte p-0">
          {users.map((user) => (
            <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-bread-brown">{user.email} · joined {formatDateTime(user.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <UserStatusBadge status={user.status} />
                {user.status !== 'approved' && (
                  <button onClick={() => setUserStatus(user, 'approved')} className="btn-primary px-4 py-1">Approve</button>
                )}
                {user.status !== 'blocked' && (
                  <button onClick={() => setUserStatus(user, 'blocked')} className="btn-danger px-4 py-1">Block</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination pagination={pagination} onPage={setPage} />
    </div>
  )
}

export default Staff
