import { Routes, Route, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import ErrorBoundary from './components/ErrorBoundary'

import Home from './pages/Home'
import Login from './pages/Login'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import CakeOrders from './pages/CakeOrders'
import NewCakeOrder from './pages/NewCakeOrder'
import NotFound from './pages/NotFound'
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/AdminProducts'
import ProductForm from './pages/admin/ProductForm'
import AdminOrders from './pages/admin/AdminOrders'
import Staff from './pages/admin/Staff'
import Categories from './pages/admin/Categories'
import StockHistory from './pages/admin/StockHistory'
import AdminCakeOrders from './pages/admin/AdminCakeOrders'

const App = () => {
  const location = useLocation() // the key below gives every page a fresh start after a crash
  return (
    <div className="mx-auto min-h-screen max-w-[1280px] px-4 sm:px-8 lg:px-12">
      <ToastContainer position="top-right" autoClose={2500} />
      <Navbar />
      <ErrorBoundary key={location.pathname}>
      <Routes>
        {/* public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* pages for staff (role "user") */}
        <Route element={<ProtectedRoute role="user" />}>
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/cakes" element={<CakeOrders />} />
          <Route path="/cakes/new" element={<NewCakeOrder />} />
        </Route>

        {/* pages for admins only */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="products/:id/history" element={<StockHistory />} />
            <Route path="categories" element={<Categories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="cakes" element={<AdminCakeOrders />} />
            <Route path="staff" element={<Staff />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
      <Footer />
    </div>
  )
}

export default App
