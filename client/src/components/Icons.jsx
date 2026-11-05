// Small line icons used around the site. Usage:  <Icon name="cart" className="w-5 h-5" />
const paths = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  bag: (
    <>
      <path d="M6 7h12l1 14H5L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  cup: (
    <>
      <path d="M5 9h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V9z" />
      <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3v3M12 3v3" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2 5.3" />
      <path d="M20 4v7h-7" />
    </>
  ),
  headset: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1" />
      <rect x="17" y="14" width="4" height="6" rx="1" />
    </>
  ),
}

export const Icon = ({ name, className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {paths[name]}
  </svg>
)

export const Star = ({ filled = true, className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill={filled ? '#c8873a' : '#e8d5b9'}>
    <polygon points="12 2 15 9 22 9.3 16.5 14 18.2 21 12 17 5.8 21 7.5 14 2 9.3 9 9" />
  </svg>
)
