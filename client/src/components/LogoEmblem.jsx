import { Link } from 'react-router-dom'
import { site } from '../config/siteConfig'

// The round logo on a cream plate, with the store name on a vintage ribbon across its lower edge.
// It sits in the centre of the navbar awning and hangs a little below it, so the red checks never run behind it.
const LogoEmblem = () => {
  return (
    <Link
      to="/"
      aria-label={`${site.name} home`}
      className="absolute left-1/2 -translate-x-1/2 top-2 lg:top-3 z-10 flex flex-col items-center"
    >
      {/* cream plate: keeps the checks away from the logo */}
      <span className="block rounded-full bg-[#f6ecd6] p-1 ring-2 ring-bread-dark/70 shadow-[0_8px_18px_rgba(59,36,23,0.55)]">
        <img src={site.images.logo} alt={`${site.name} logo`} className="block rounded-full w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40" />
      </span>

      {/* name ribbon (an inline drawing, so the text uses the website's Playfair Display font) */}
      <svg
        viewBox="0 0 320 64"
        className="-mt-3 w-52 sm:w-60 lg:w-72 drop-shadow-[0_3px_3px_rgba(59,36,23,0.35)]"
        role="img"
        aria-label="Fresh from the oven, everyday"
      >
        <defs>
          <linearGradient id="ribbonRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a1303a" />
            <stop offset="1" stopColor="#7c1f29" />
          </linearGradient>
        </defs>
        {/* tails */}
        <path d="M0 22 H46 V60 H0 L14 41 Z" fill="#6c1a22" />
        <path d="M320 22 H274 V60 H320 L306 41 Z" fill="#6c1a22" />
        {/* folds where the tails tuck behind */}
        <path d="M30 50 L46 60 V50 Z" fill="#45100f" />
        <path d="M290 50 L274 60 V50 Z" fill="#45100f" />
        {/* main band */}
        <rect x="30" y="8" width="260" height="42" rx="2" fill="url(#ribbonRed)" />
        {/* stitched edge */}
        <rect x="36" y="13" width="248" height="32" fill="none" stroke="#f6ecd6" strokeOpacity="0.6" strokeDasharray="3 3" />
        {/* the words on the ribbon: change them here */}
        <text
          x="160"
          y="34"
          textAnchor="middle"
          fill="#f6ecd6"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="700"
          fontSize="14"
          letterSpacing="1.5"
          textLength="226"
          lengthAdjust="spacingAndGlyphs"
        >
          FRESH FROM THE OVEN, EVERYDAY
        </text>
      </svg>
    </Link>
  )
}

export default LogoEmblem
