import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { site } from '../config/siteConfig'
import { Icon } from '../components/Icons'
import Title from '../components/Title'
import BrandName from '../components/BrandName'

const features = [
  { icon: 'cup', title: 'Baked fresh daily', text: 'Breads, pastries and savouries from our own oven.' },
  { icon: 'refresh', title: 'Stock you can trust', text: 'Every order takes its items off the shelf, and a cancelled order puts them back.' },
  { icon: 'truck', title: 'Special cakes', text: 'Birthdays, weddings, Christmas: we take cake orders with 2 days notice.' },
]

const Home = () => {
  const { user } = useAuth()

  // ONE button that changes with the visitor (role-aware)
  const cta = !user
    ? { to: '/login', text: 'LOGIN OR REGISTER' }
    : user.role === 'admin'
      ? { to: '/admin', text: 'OPEN THE DASHBOARD' }
      : { to: '/products', text: 'GO TO THE SHOP' }

  return (
    <div>
      {/* HERO: cream card, text on the left, the bread picture (site.images.hero) on the right */}
      <section className="relative overflow-hidden rounded-3xl border border-bread-latte bg-bread-cream/90 shadow-lg">
        <div className="grid items-center gap-4 px-6 py-8 sm:px-12 lg:grid-cols-2 lg:py-8">
          <div className="text-bread-dark">
            <div className="flex items-center gap-2 text-bread-brown">
              <p className="h-[2px] w-8 bg-bread-red md:w-11"></p>
              <p className="text-sm font-medium tracking-wide md:text-base">
                {user ? `WELCOME BACK, ${user.name.toUpperCase()}` : 'WELCOME TO'}
              </p>
            </div>
            <h1 className="py-3 text-5xl font-semibold leading-tight lg:text-6xl"><BrandName /></h1>
            <p className="mb-8 max-w-md text-base text-bread-brown sm:text-lg">{site.tagline}</p>
            <Link to={cta.to} className="inline-flex items-center gap-3 rounded-full bg-bread-red px-8 py-3 text-sm font-semibold text-white transition hover:bg-bread-reddark">
              {cta.text}
              <span className="h-[1px] w-8 bg-white"></span>
            </Link>
          </div>
          <img src={site.images.hero} alt="Fresh breads from our oven" className="mx-auto max-h-64 w-full object-contain drop-shadow-xl lg:max-h-72" />
        </div>
      </section>

      {/* CATEGORIES: small round pictures right under the banner (from site.showcase in siteConfig.js) */}
      <div className="mb-6 mt-6 grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-6">
        {site.showcase.map((item) => (
          <div key={item.title} className="group flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-bread-red/30 bg-bread-latte/60 p-2 shadow-sm transition group-hover:scale-105 group-hover:border-bread-red sm:h-24 sm:w-24">
              <img src={`/images/categories/${item.file}`} alt={item.title} className="h-full w-full object-contain" />
            </span>
            <span className="mt-2 text-xs font-medium text-bread-dark sm:text-sm">{item.title}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 justify-around gap-8 py-8 text-center text-bread-brown sm:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title}>
            <div className="m-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bread-latte text-bread-dark">
              <Icon name={feature.icon} className="h-6 w-6" />
            </div>
            <p className="font-semibold text-bread-dark">{feature.title}</p>
            <p className="text-sm">{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
