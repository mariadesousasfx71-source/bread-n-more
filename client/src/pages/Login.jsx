import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../api/client'
import { site } from '../config/siteConfig'
import { ErrorBox } from '../components/ui'
import BrandName from '../components/BrandName'

// One page, two modes: "Login" and "Register".
const Login = () => {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('Login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // already logged in: go to the right home page for the role
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/products'} replace />

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'Register') {
        const message = await register(name, email, password)
        toast.success(message)
        setMode('Login')
        setPassword('')
      } else {
        const loggedIn = await login(email, password)
        // go back to the page they wanted, or to the home page of their role
        // (only if the role may open it: staff never go back to an admin page, and admins only to admin pages)
        const home = loggedIn.role === 'admin' ? '/admin' : '/products'
        const wanted = location.state?.from?.pathname
        const isAdminPage = Boolean(wanted) && wanted.startsWith('/admin')
        const allowed = Boolean(wanted) && wanted !== '/login' && (loggedIn.role === 'admin' ? isAdminPage : !isAdminPage)
        navigate(allowed ? wanted : home, { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err)) // e.g. "Your account is waiting for admin approval."
    } finally {
      setBusy(false)
    }
  }

  return (
    // Two halves: a photo on one side, the form on the other.
    // On phones the photo becomes a strip across the top, with the form below it.
    <section className="grid overflow-hidden rounded-2xl border border-bread-latte bg-bread-cream shadow-xl lg:min-h-[80vh] lg:grid-cols-2">
      {/* PHOTO SIDE - the picture is site.images.loginSide (src/config/siteConfig.js) */}
      <div className="relative flex h-64 flex-col items-center justify-center gap-4 bg-[#f6ecd6] p-6 sm:h-80 lg:h-auto">
        <img src={site.images.loginSide} alt="" className="max-h-[70%] w-full object-contain drop-shadow-xl" />
        <p className="font-display text-2xl italic text-bread-dark lg:text-3xl">Fresh from our oven.</p>
      </div>

      {/* FORM SIDE */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col items-center gap-4 text-bread-dark">
          <p className="text-sm tracking-widest text-bread-brown">WELCOME TO <BrandName upper /></p>
          <div className="mb-2 inline-flex items-center gap-2">
            <p className="font-display text-3xl">{mode}</p>
            <hr className="h-[2px] w-8 border-none bg-bread-caramel" />
          </div>

          {mode === 'Register' && (
            <input onChange={(e) => setName(e.target.value)} value={name} type="text" className="input" placeholder="Name" required />
          )}
          <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" className="input" placeholder="Email" required />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            className="input"
            placeholder="Password (at least 8 characters)"
            minLength={mode === 'Register' ? 8 : undefined}
            required
          />

          {error && <div className="w-full"><ErrorBox message={error} /></div>}

          <div className="mt-[-4px] flex w-full justify-end text-sm text-bread-brown">
            {mode === 'Login' ? (
              <p onClick={() => { setMode('Register'); setError('') }} className="cursor-pointer hover:text-bread-dark">
                New staff member? Create an account
              </p>
            ) : (
              <p onClick={() => { setMode('Login'); setError('') }} className="cursor-pointer hover:text-bread-dark">
                Already have an account? Login
              </p>
            )}
          </div>

          <button disabled={busy} className="btn-primary mt-2 px-12 py-2.5">
            {busy ? 'Please wait...' : mode === 'Login' ? 'Sign In' : 'Create account'}
          </button>
          {mode === 'Register' && (
            <p className="text-center text-xs text-bread-brown">A new account must be approved by an admin before you can log in.</p>
          )}
        </form>
      </div>
    </section>
  )
}

export default Login
