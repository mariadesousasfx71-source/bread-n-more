import { Link } from 'react-router-dom'

const NotFound = () => (
  <div className="py-24 text-center">
    <h1 className="text-5xl">404</h1>
    <p className="mt-3 text-bread-brown">We could not find that page.</p>
    <Link to="/" className="btn-primary mt-6">
      Back to home
    </Link>
  </div>
)

export default NotFound
