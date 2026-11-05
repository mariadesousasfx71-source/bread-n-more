import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products & stock' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/cakes', label: 'Special cakes' },
  { to: '/admin/staff', label: 'Staff' },
]

// The frame around every admin page: a row of tabs, then the page itself (<Outlet />)
const AdminLayout = () => {
  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2 border-b border-bread-latte pb-3">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-full px-5 py-2 text-sm font-medium ${isActive ? 'bg-bread-red text-white' : 'bg-white text-bread-dark border border-bread-latte hover:bg-bread-latte'}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  )
}

export default AdminLayout
