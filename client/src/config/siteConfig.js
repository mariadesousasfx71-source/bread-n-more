// =====================================================================
//  BREAD & MORE - SITE SETTINGS
//  Almost everything you will want to change (name, contact details,
//  pictures, backgrounds) is in THIS file.
// =====================================================================

// Where the API lives (it must end with /api). Set in client/.env  (VITE_API_URL)
export const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '')
// The same address without /api. Product photos are served from here.
export const serverUrl = apiUrl.replace(/\/api$/, '')

export const site = {
  name: 'Bread & More',
  tagline: 'Fresh from our oven, every day',

  currency: '₹', // symbol shown before every price

  contact: {
    phone: '+91 12345 54321',
    email: 'hello@breadandmore.com',
    address: 'Navelim, Salcete, Goa. 403 507',
    hours: 'Open every day, 7:00 AM - 8:00 PM',
  },

  // ---------------------------------------------------------------
  //  PICTURES AND BACKGROUNDS
  //  These files live in  client/public/images/
  //  Put your own picture in that folder, then change the file name here.
  //  (A path that starts with "/" means "inside the public folder".)
  // ---------------------------------------------------------------
  images: {
    logo: '/images/logo.png?v=2', // (?v=2 makes the browser load the new picture; change the number whenever you replace the logo file) // round badge: long bread, sliced bread and corn (navbar + footer)
    navbar: '/images/backgrounds/awning.svg', // golden check awning behind the navbar
    hero: '/images/backgrounds/hero-bread.png', // picture on the right of the home page banner (a cut-out photo with a see-through background looks best)
    loginSide: '/images/backgrounds/hero-bread.png', // picture shown beside the Login / Register form (on top on phones)
  },

  // The picture cards on the home page. "file" is inside client/public/images/categories/
  showcase: [
    { title: 'Breads', text: 'Long bread, sliced bread, loaves and pav', file: 'breads.svg' },
    { title: 'Cakes', text: 'Whole cakes, cupcakes and special orders', file: 'cakes.svg' },
    { title: 'Pastries', text: 'Pastries, cream rolls and puffs', file: 'pastries.svg' },
    { title: 'Biscuits & Cookies', text: 'Tea-time favourites', file: 'biscuits.svg' },
    { title: 'Burgers & Sandwiches', text: 'Made fresh to order', file: 'burgers-sandwiches.svg' },
    { title: 'Savouries', text: 'Patties, croquettes, rissois and samosas', file: 'savouries.svg' },
  ],
}

// Turns an image path stored in the database into a full address.
// Photos uploaded through the app are stored on the server ("/uploads/...").
export const imageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('/uploads')) return serverUrl + path
  return path
}

// 1234.5 -> "₹1,234.5"
export const formatMoney = (amount) =>
  `${site.currency}${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// 2026-11-03T08:30:00Z -> "3 Nov 2026, 2:00 pm" (in the visitor's own time zone)
export const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

// 2026-12-24T00:00:00+05:30 -> "24 Dec 2026" (a date without a time)
export const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
