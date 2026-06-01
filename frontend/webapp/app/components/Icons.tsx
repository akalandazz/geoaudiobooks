'use client'

import React from 'react'

type IconProps = { s?: number; style?: React.CSSProperties; onClick?: () => void }

function SI(paths: React.ReactNode, fill?: boolean) {
  return function Icon({ s = 20, style, ...p }: IconProps) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24"
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'}
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
        style={style} {...p}>{paths}</svg>
    )
  }
}

export const GEIcon = {
  home:     SI(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>),
  search:   SI(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  library:  SI(<><path d="M4 5v14M9 5v14" /><rect x="13" y="4" width="7" height="16" rx="1" transform="rotate(8 16 12)" /></>),
  heart:    SI(<path d="M12 20s-7-4.6-9.2-9C1.3 8 2.8 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.4 0 4.9 3.5 3.4 6.5C19 15.4 12 20 12 20Z" />),
  heartFill:SI(<path d="M12 20s-7-4.6-9.2-9C1.3 8 2.8 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.4 0 4.9 3.5 3.4 6.5C19 15.4 12 20 12 20Z" />, true),
  play:     SI(<path d="M7 4.5v15l13-7.5-13-7.5Z" />, true),
  pause:    SI(<><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>, true),
  back15:   SI(<><path d="M11 4 7 8l4 4" /><path d="M7 8h7a5 5 0 1 1-5 5" /></>),
  fwd30:    SI(<><path d="M13 4l4 4-4 4" /><path d="M17 8h-7a5 5 0 1 0 5 5" /></>),
  next:     SI(<><path d="M6 5l9 7-9 7Z" fill="currentColor" stroke="none" /><rect x="17" y="5" width="2.2" height="14" rx="1" fill="currentColor" stroke="none" /></>),
  prev:     SI(<><path d="M18 5l-9 7 9 7Z" fill="currentColor" stroke="none" /><rect x="4.8" y="5" width="2.2" height="14" rx="1" fill="currentColor" stroke="none" /></>),
  list:     SI(<><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></>),
  star:     SI(<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8L12 3Z" />, true),
  plus:     SI(<><path d="M12 5v14M5 12h14" /></>),
  cart:     SI(<><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.2 12.5a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L21 7H6" /></>),
  bell:     SI(<><path d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7Z" /><path d="M10.5 20a2 2 0 0 0 3 0" /></>),
  speed:    SI(<><path d="M12 14 16 9" /><circle cx="12" cy="14" r="8" /><path d="M12 6V4" /></>),
  moon:     SI(<path d="M20 13a8 8 0 1 1-9-9 6 6 0 0 0 9 9Z" />),
  chevR:    SI(<path d="m9 6 6 6-6 6" />),
  chevD:    SI(<path d="m6 9 6 6 6-6" />),
  check:    SI(<path d="m5 12 5 5L20 7" />),
  sleep:    SI(<><path d="M12 3a9 9 0 1 0 9 9" /><path d="M15 3h6l-6 7h6" /></>),
  bookmark: SI(<path d="M6 4h12v17l-6-4-6 4V4Z" />),
  download: SI(<><path d="M12 3v12M7 10l5 5 5-5" /><path d="M5 21h14" /></>),
  sliders:  SI(<><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" /></>),
  person:   SI(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>),
  gear:     SI(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>),
  logout:   SI(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>),
}
