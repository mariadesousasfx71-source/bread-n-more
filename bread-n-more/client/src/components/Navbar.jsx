import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { site } from '../config/siteConfig'
import { Icon } from './Icons'
import LogoEmblem from './LogoEmblem'

// ROLE-AWARE MENU: each kind of visitor sees different links.
// (The link bar is hidden on screens narrower than 1280 px, because the logo sits in the middle. They use the menu button instead.)
const linksFor = (user) => {
  if (!user) return [{ to: '/', label: 'HOME' }, { to: '/login', label: 'LOGIN' }]
  if (user.role === 'admin') return [{ to: '/', label: 'HOME' }, { to: '/admin', label: 'ADMIN' }]
  return [
    { to: '/', label: 'HOME' },
    { to: '/products', label: 'SHOP' },
    { to: '/cakes', label: 'CAKES' },
    { to: '/orders', label: 'ORDERS' },
  ]
}

const Navbar = () => {
  const [sidebar, setSidebar] = useState(false) // the full-screen menu on phones
  const [account, setAccount] = useState(false) // the little account box
  const { user, logout } = useAuth()
  const { count } = useCart()
  const links = linksFor(user)
  const awning = { backgroundImage: `url(${site.images.navbar})` }

  return (
    // Vintage red-check awning. The negative side margins cancel the page padding from App.jsx,
    // so the awning reaches the screen edges. The bottom margin leaves room for the hanging logo.
    <header className="relative z-20 -mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw] mb-14 sm:mb-16 lg:mb-24">
      <div
        className="gingham vintage-awning flex h-20 items-center justify-between px-4 sm:px-[5vw] md:px-[7vw] lg:h-24 lg:px-[9vw]"
        style={awning}
      >
        {/* left: page links (big screens) or the menu button (phones and tablets) */}
        <ul className="plaque hidden gap-6 px-6 py-2.5 font-display text-sm tracking-[0.16em] text-bread-dark xl:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className="flex flex-col items-center gap-1">
              <p>{link.label}</p>
              <hr className="hidden h-[1.5px] w-2/4 border-none bg-bread-caramel" />
            </NavLink>
          ))}
        </ul>
        <button onClick={() => setSidebar(true)} className="plaque px-3 py-2.5 xl:hidden" aria-label="Open menu">
          <Icon name="menu" className="h-5 w-5" />
        </button>

        {/* right: account and (for staff) the cart */}
        <div className="plaque flex items-center gap-4 px-4 py-2.5 text-bread-dark sm:gap-5">
          <div className="relative">
            <button aria-label="Account" onClick={() => setAccount((open) => !open)}>
              <Icon name="user" className="h-5 w-5 cursor-pointer" />
            </button>
            {account && (
              <div className="absolute right-0 z-30 pt-4">
                <div className="flex w-48 flex-col gap-2 rounded bg-white px-5 py-3 text-bread-brown shadow-lg">
                  {user ? (
                    <>
                      <p className="font-medium text-bread-dark">{user.name}</p>
                      <p className="text-xs uppercase tracking-wide">{user.role}</p>
                      <button
                        className="text-left hover:text-bread-dark"
                        onClick={() => {
                          setAccount(false)
                          logout()
                        }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setAccount(false)} className="hover:text-bread-dark">
                      Login / Register
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* the cart is only for staff (role "user"), never shown to admins or visitors */}
          {user?.role === 'user' && (
            <NavLink to="/cart" className="relative" aria-label="Cart">
              <Icon name="bag" className="h-5 w-5" />
              <p className="absolute bottom-[-6px] right-[-6px] aspect-square w-4 rounded-full bg-bread-dark text-center text-[8px] leading-4 text-white">
                {count}
              </p>
            </NavLink>
          )}
        </div>
      </div>

      {/* scalloped awning edge hanging below the bar */}
      <div className="awning-shadow pointer-events-none absolute left-0 right-0 top-full">
        <div className="gingham awning-edge" style={awning} />
      </div>

      {/* the logo + name ribbon, centred on the awning */}
      <LogoEmblem />

      {/* sidebar for phones and tablets */}
      <div className={`fixed bottom-0 right-0 top-0 z-40 overflow-hidden bg-white transition-all ${sidebar ? 'w-full' : 'w-0'}`}>
        <div className="flex flex-col text-bread-brown">
          <div onClick={() => setSidebar(false)} className="flex cursor-pointer items-center gap-3 p-4">
            <Icon name="back" className="h-5 w-5" />
            <p>Back</p>
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setSidebar(false)}
              className="border-t border-bread-latte py-3 pl-6"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  )
}

export default Navbar
