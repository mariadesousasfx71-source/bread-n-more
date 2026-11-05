import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui'

// Guards a group of pages.
//   <Route element={<ProtectedRoute />}>            -> any logged-in person
//   <Route element={<ProtectedRoute role="admin" />}> -> admins only
// NOTE: this only hides pages. The REAL protection is on the server (403).
const ProtectedRoute = ({ role }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader text="Checking your login..." />

  // not logged in -> go to the login page, and come back here afterwards
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  // logged in, but the wrong role
  if (role && user.role !== role) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-4xl">403</h1>
        <p className="mt-3 text-bread-brown">You do not have permission to see this page.</p>
      </div>
    )
  }

  return <Outlet />
}

export default ProtectedRoute
