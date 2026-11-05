import { Link } from 'react-router-dom'
import { site } from '../config/siteConfig'

const Footer = () => {
  return (
    <div>
      <div className="my-10 mt-20 flex flex-col gap-10 text-sm sm:grid sm:grid-cols-[3fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <img src={site.images.logo} className="h-20 w-20" alt={`${site.name} logo`} />
            <span className="font-display text-xl font-semibold">{site.name}</span>
          </div>
          <p className="w-full text-bread-brown md:w-2/3">{site.tagline}</p>
        </div>

        <div>
          <p className="mb-5 text-xl font-medium">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-bread-brown">
            <li>{site.contact.phone}</li>
            <li>{site.contact.email}</li>
            <li>{site.contact.hours}</li>
            <li>
              <Link to="/">Home</Link>
            </li>
          </ul>
        </div>
      </div>

      <hr className="border-bread-latte" />
      <p className="py-5 text-center text-sm text-bread-brown">
        Copyright {new Date().getFullYear()} © {site.name}. All rights reserved.
      </p>
    </div>
  )
}

export default Footer
