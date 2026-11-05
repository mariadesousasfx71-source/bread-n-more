import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { site } from '../config/siteConfig'
import { Icon } from '../components/Icons'
import Title from '../components/Title'

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
      <section
        className="relative overflow-hidden rounded-2xl bg-bread-dark bg-cover bg-center"
        style={{ backgroundImage: `url(${site.images.hero})` }}
      >
        {/* dark layer so the white text stays readable on any photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
        <div className="relative max-w-xl px-6 py-20 text-bread-cream sm:px-14 sm:py-32">
          <div className="flex items-center gap-2">
            <p className="h-[2px] w-8 bg-bread-caramel md:w-11"></p>
            <p className="text-sm font-medium tracking-wide md:text-base">
              {user ? `WELCOME BACK, ${user.name.toUpperCase()}` : 'WELCOME TO'}
            </p>
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:py-3 lg:text-6xl">{site.name}</h1>
          <p className="mb-6 text-base text-bread-latte sm:text-lg">{site.tagline}</p>
          <Link to={cta.to} className="inline-flex items-center gap-2 rounded-full bg-bread-caramel px-8 py-3 text-sm font-semibold text-white hover:bg-bread-caramel/90">
            {cta.text}
            <span className="h-[1px] w-8 bg-white"></span>
          </Link>
        </div>
      </section>

      {/* WHAT WE BAKE: static picture cards from site.showcase */}
      <div className="my-14 text-center">
        <div className="py-6 text-3xl">
          <Title text1="WHAT WE" text2="BAKE" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {site.showcase.map((item) => (
            <div key={item.title} className="card overflow-hidden p-0 text-left">
              <img src={`/images/categories/${item.file}`} alt={item.title} className="aspect-[3/2] w-full object-cover" />
              <div className="p-4">
                <p className="font-display text-xl">{item.title}</p>
                <p className="text-sm text-bread-brown">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 justify-around gap-8 py-10 text-center text-bread-brown sm:grid-cols-3">
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
