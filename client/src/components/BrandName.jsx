import { site } from '../config/siteConfig'

// Writes the shop name with the red "&" taken from the logo (public/images/ampersand.png)
// instead of a plain font "&". Change the name in siteConfig.js and this follows.
const BrandName = ({ upper = false }) => {
  const parts = site.name.split('&').map((part) => part.trim())
  if (parts.length < 2) return upper ? site.name.toUpperCase() : site.name
  const [first, second] = parts.map((part) => (upper ? part.toUpperCase() : part))
  return (
    <span>
      {/* "Bread" is written in the Anton font, like the logo */}
      <span className="font-anton font-normal uppercase tracking-wide text-neutral-900">{first}</span>{' '}
      <img src="/images/ampersand.png" alt="&" className="inline-block h-[0.8em] w-auto align-[-0.06em]" />{' '}
      <span className="text-neutral-900">{second}</span>
    </span>
  )
}

export default BrandName
