'use client'

import React from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { IconBtn, PlayButton, Scrubber, useClickOutside } from './Atoms'
import { SleepControl } from './Player'
import { GE_BOOK_BY_ID, GE_BOOKS, GE_CHAPTERS, Book, fmtClock, fmt } from './bookdata'
import { useApp } from './AppContext'

// ── Logo ──
export function Logo({ size = 18 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <svg width={size + 4} height={size + 4} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill={T.accent} />
        <path d="M9 7.5v9l7-4.5-7-4.5Z" fill="#fff" />
      </svg>
      <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: size, color: T.text, letterSpacing: '-0.02em' }}>geaudio</span>
    </div>
  )
}

// ── Sidebar (desktop) ──
export function Sidebar() {
  const app = useApp()
  const Item = ({ icon, label, view }: { icon: React.ReactNode; label: string; view: string }) => {
    const active = app.view === view
    const [hov, setHov] = React.useState(false)
    return (
      <div onClick={() => app.nav(view)}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px',
          borderRadius: 10, cursor: 'pointer',
          color: active || hov ? T.text : T.mut,
          background: active ? T.elev : (hov ? T.surface : 'transparent'),
          transform: hov && !active ? 'translateX(3px)' : 'translateX(0)',
          fontFamily: T.body, fontWeight: 600, fontSize: 14.5,
          transition: 'background .2s ease, color .2s ease, transform .22s cubic-bezier(.22,.61,.36,1)' }}>
        <span style={{ position: 'absolute', left: -2, top: '50%', width: 3, height: active ? 18 : 0,
          borderRadius: 3, background: T.accent2, transform: 'translateY(-50%)',
          transition: 'height .26s cubic-bezier(.34,1.56,.64,1)' }} />
        <span style={{ display: 'flex', transform: active ? 'scale(1.06)' : (hov ? 'scale(1.14)' : 'scale(1)'),
          transition: 'transform .24s cubic-bezier(.34,1.56,.64,1)' }}>{icon}</span>
        {label}
      </div>
    )
  }
  const recents = app.library.slice(0, 3).map(id => GE_BOOK_BY_ID[id]).filter(Boolean)
  return (
    <div style={{
      width: 252, flexShrink: 0, background: T.bg2, borderRight: '1px solid ' + T.line,
      display: 'flex', flexDirection: 'column', padding: '22px 14px',
    }}>
      <div style={{ padding: '0 8px 22px', cursor: 'pointer' }} onClick={() => app.nav('home')}>
        <Logo />
      </div>
      <Item icon={<GEIcon.home s={20} />} label="Home" view="home" />
      <Item icon={<GEIcon.search s={20} />} label="Search" view="search" />
      <Item icon={<GEIcon.library s={20} />} label="Your Library" view="library" />
      <div style={{ height: 1, background: T.line, margin: '16px 8px' }} />
      <div style={{ padding: '0 12px', fontFamily: T.body, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginBottom: 8 }}>Jump back in</div>
      <div className="ge-scroll" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {recents.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 13, color: T.dim, lineHeight: 1.5 }}>Books you own show up here.</div>
        )}
        {recents.map(b => (
          <div key={b.id} onClick={() => app.openPlayer(b.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 12px', borderRadius: 9, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.surface}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <BookCover book={b} w={40} radius={7} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 13.5, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
              <div style={{ fontSize: 11.5, color: T.mut }}>{b.author}</div>
            </div>
          </div>
        ))}
      </div>
      {!app.premium && (
        <div style={{ background: 'linear-gradient(150deg,#2a1d52,#181030)', borderRadius: 14, padding: 16, marginTop: 12 }}>
          <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: T.text }}>Go Premium</div>
          <div style={{ fontSize: 12, color: T.mut, marginTop: 4, lineHeight: 1.4 }}>Unlimited listening, offline & lossless.</div>
          <div onClick={() => app.nav('settings')} style={{ marginTop: 12, background: T.accent, color: '#fff', textAlign: 'center', padding: '8px 0', borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Try 30 days free</div>
        </div>
      )}
    </div>
  )
}

// ── Bottom nav (mobile) ──
export function BottomNav() {
  const app = useApp()
  const Item = ({ icon, label, view }: { icon: React.ReactNode; label: string; view: string }) => {
    const active = app.view === view
    return (
      <div onClick={() => app.nav(view)} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '8px 0', cursor: 'pointer', color: active ? T.accent2 : T.mut,
        transition: 'color .2s ease',
      }}>
        <span style={{ display: 'flex', transform: active ? 'translateY(-2px) scale(1.12)' : 'translateY(0) scale(1)', transition: 'transform .26s cubic-bezier(.34,1.56,.64,1)' }}>{icon}</span>
        <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 10.5 }}>{label}</span>
      </div>
    )
  }
  return (
    <div style={{ flexShrink: 0, display: 'flex', borderTop: '1px solid ' + T.line, background: T.bg2, paddingBottom: 6 }}>
      <Item icon={<GEIcon.home s={22} />} label="Home" view="home" />
      <Item icon={<GEIcon.search s={22} />} label="Search" view="search" />
      <Item icon={<GEIcon.library s={22} />} label="Library" view="library" />
      <Item
        icon={<div style={{ width: 22, height: 22, borderRadius: 11, background: 'linear-gradient(135deg,#8B5CF6,#E94BD0)' }} />}
        label="You" view="profile"
      />
    </div>
  )
}

// ── Notification bell with dropdown ──
interface Notif {
  id: string
  kind: 'book' | 'premium'
  bookId?: string
  title: string
  body: string
  ts: number
  unread: boolean
  action?: (app: ReturnType<typeof useApp>) => void
}

const NOTIF_SEED: Notif[] = [
  { id: 'n1', kind: 'book', bookId: 'neon', title: 'Price drop on your wishlist',
    body: 'Neon Wolves is now $14.99 — 25% off for the next 2 days.', ts: Date.now() - 1000 * 60 * 24, unread: true,
    action: (app) => app.openDetail('neon') },
  { id: 'n2', kind: 'book', bookId: 'machine', title: 'New from authors you follow',
    body: "Cyrus Mbeki’s The Quiet Machine is now available to listen.", ts: Date.now() - 1000 * 60 * 60 * 5, unread: true,
    action: (app) => app.openDetail('machine') },
  { id: 'n3', kind: 'premium', title: 'Your free trial is ready',
    body: '30 days of unlimited, lossless listening — start anytime.', ts: Date.now() - 1000 * 60 * 60 * 27, unread: false,
    action: (app) => app.nav('settings') },
]

function relTime(ts: number) {
  const d = Math.max(0, Date.now() - ts), m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h ago'
  const dd = Math.floor(h / 24)
  return dd === 1 ? 'yesterday' : dd + 'd ago'
}

export function NotifBell({ size = 40, dropRight = 0 }: { size?: number; dropRight?: number }) {
  const app = useApp()
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState(NOTIF_SEED)
  const ref = React.useRef<HTMLDivElement>(null)
  const unread = items.filter(n => n.unread).length
  useClickOutside(ref, () => setOpen(false), open)
  const markAll = () => setItems(xs => xs.map(n => ({ ...n, unread: false })))
  const onItem = (n: Notif) => {
    setItems(xs => xs.map(x => x.id === n.id ? { ...x, unread: false } : x))
    setOpen(false)
    if (n.action) n.action(app)
  }
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <IconBtn size={size} onClick={() => setOpen(o => !o)} title="Notifications"
        style={{ background: open ? T.elev : T.surface, color: open ? T.text : T.mut, position: 'relative' }}>
        <GEIcon.bell s={18} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.body }}>{unread}</span>
        )}
      </IconBtn>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: dropRight, width: 360, maxWidth: '90vw', background: T.surface, border: '1px solid ' + T.line2, borderRadius: 14, boxShadow: T.shadow, padding: 8, zIndex: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 10px' }}>
            <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: T.text }}>Notifications</span>
            {unread > 0 && <button onClick={markAll} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.accent2, fontFamily: T.body, fontWeight: 700, fontSize: 12.5 }}>Mark all read</button>}
          </div>
          <div style={{ height: 1, background: T.line, margin: '0 6px 6px' }} />
          <div className="ge-scroll" style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.length === 0
              ? <div style={{ padding: '26px 14px', textAlign: 'center', color: T.dim, fontSize: 13 }}>You're all caught up.</div>
              : items.map(n => {
                  const b = n.bookId ? GE_BOOK_BY_ID[n.bookId] : null
                  return (
                    <button key={n.id} onClick={() => onItem(n)} style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', padding: '11px 10px', border: 'none', borderRadius: 10, cursor: 'pointer', background: n.unread ? T.accentDim : 'transparent', transition: 'background .12s', marginBottom: 2 }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = n.unread ? T.accentDim : T.elev}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = n.unread ? T.accentDim : 'transparent'}>
                      {b
                        ? <div style={{ flexShrink: 0 }}><BookCover book={b} w={44} radius={8} /></div>
                        : <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(150deg,#2a1d52,#181030)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent2 }}><GEIcon.star s={20} /></div>
                      }
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 13.5, color: T.text, flex: 1 }}>{n.title}</span>
                          <span style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>{relTime(n.ts)}</span>
                        </div>
                        <div style={{ fontFamily: T.body, fontSize: 12.5, color: T.mut, marginTop: 3, lineHeight: 1.45 }}>{n.body}</div>
                      </div>
                      {n.unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: T.accent2, flexShrink: 0, marginTop: 5 }} />}
                    </button>
                  )
                })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Account menu (desktop avatar dropdown) ──
export function AccountMenu() {
  const app = useApp()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)
  const go = (v: string) => { setOpen(false); app.nav(v) }
  const MItem = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: danger ? '#FB7185' : T.text, fontFamily: T.body, fontWeight: 600, fontSize: 14, borderRadius: 9, transition: 'background .12s' }}
      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = danger ? 'rgba(251,113,133,0.12)' : T.elev}
      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
      <span style={{ display: 'flex', color: danger ? '#FB7185' : T.mut }}>{icon}</span>{label}
    </button>
  )
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title="Account" style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid ' + (open ? T.line2 : 'transparent'), background: open ? T.surface : 'transparent', borderRadius: 99, padding: '4px 8px 4px 4px', cursor: 'pointer' }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: 'linear-gradient(135deg,#8B5CF6,#E94BD0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: '#fff' }}>{(app.user?.name?.[0] || 'G').toUpperCase()}</div>
        <GEIcon.chevD s={15} style={{ color: T.mut, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 244, background: T.surface, border: '1px solid ' + T.line2, borderRadius: 14, boxShadow: T.shadow, padding: 8, zIndex: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 10px 12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg,#8B5CF6,#E94BD0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontWeight: 700, fontSize: 17, color: '#fff', flexShrink: 0 }}>{(app.user?.name?.[0] || 'G').toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.user?.name || 'Listener'}</div>
              <div style={{ fontSize: 12, color: T.mut, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.user?.email || ''}</div>
            </div>
          </div>
          <div style={{ height: 1, background: T.line, margin: '0 6px 6px' }} />
          <MItem icon={<GEIcon.person s={18} />} label="Your profile" onClick={() => go('profile')} />
          <MItem icon={<GEIcon.library s={18} />} label="Your library" onClick={() => go('library')} />
          <MItem icon={<GEIcon.gear s={18} />} label="Settings" onClick={() => go('settings')} />
          <div style={{ height: 1, background: T.line, margin: '6px 6px' }} />
          <MItem icon={<GEIcon.logout s={18} />} label="Sign out" danger onClick={() => { setOpen(false); app.signOut() }} />
        </div>
      )}
    </div>
  )
}

// ── Top bar (desktop) ──
export function TopBar({ search }: { search?: string }) {
  const app = useApp()
  const onSearchView = app.view === 'search'
  return (
    <div style={{ height: 66, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', borderBottom: '1px solid ' + T.line }}>
      {!onSearchView && (
        <div onClick={() => app.nav('search')}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = T.elev; el.style.borderColor = T.line2; el.style.transform = 'scale(1.01)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.background = T.surface; el.style.borderColor = T.line; el.style.transform = 'scale(1)' }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.surface,
            border: '1px solid ' + T.line, borderRadius: 22, padding: '9px 16px', width: 380, cursor: 'text',
            transformOrigin: 'left center', transition: 'background .2s ease, border-color .2s ease, transform .2s ease' }}>
          <GEIcon.search s={18} style={{ color: T.mut }} />
          <span style={{ color: T.dim, fontSize: 14 }}>{search || 'Search titles, authors, narrators…'}</span>
        </div>
      )}
      <div style={{ flex: 1 }} />
      {!app.premium && (
        <div onClick={() => app.nav('settings')} style={{ border: '1px solid ' + T.line2, color: T.text, padding: '8px 16px', borderRadius: 20, fontWeight: 700, fontSize: 13, fontFamily: T.disp, cursor: 'pointer' }}>Premium</div>
      )}
      <IconBtn onClick={() => app.nav('cart')} title="Cart" style={{ background: T.surface, position: 'relative' }}>
        <GEIcon.cart s={18} />
        {app.cart.length > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9, background: T.accent, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.body }}>{app.cart.length}</span>
        )}
      </IconBtn>
      <NotifBell />
      <AccountMenu />
    </div>
  )
}

// ── Mobile top bar ──
export function MobileTop({ title }: { title?: string }) {
  const app = useApp()
  return (
    <div style={{ flexShrink: 0, padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      {title
        ? <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', color: T.text }}>{title}</span>
        : <Logo />
      }
      <div style={{ display: 'flex', gap: 6 }}>
        <IconBtn onClick={() => app.nav('cart')} size={38} style={{ background: T.surface, position: 'relative' }}>
          <GEIcon.cart s={18} />
          {app.cart.length > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: 8, background: T.accent, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{app.cart.length}</span>
          )}
        </IconBtn>
        <NotifBell size={38} />
      </div>
    </div>
  )
}

// ── BookCard ──
export function BookCard({ b, w = 158, progress, onClick }: { b: Book; w?: number | string; progress?: number | null; onClick?: () => void }) {
  const app = useApp()
  const go = onClick || (() => app.openDetail(b.id))
  return (
    <div style={{ width: w, flexShrink: 0, cursor: 'pointer' }} onClick={go} className="ge-card">
      <div style={{ position: 'relative' }}>
        <BookCover book={b} w={typeof w === 'number' ? w : undefined} radius={12} style={typeof w === 'string' ? { width: '100%', aspectRatio: '1', height: 'auto' } : undefined} />
        <button onClick={e => { e.stopPropagation(); app.playBook(b.id) }}
          className="ge-cardplay"
          style={{ position: 'absolute', right: 8, bottom: 8, width: 40, height: 40, borderRadius: 20, background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(139,92,246,0.5)', border: 'none', cursor: 'pointer', opacity: 0, transform: 'translateY(6px)', transition: 'all .18s' }}>
          <GEIcon.play s={16} style={{ color: '#fff' }} />
        </button>
      </div>
      <div style={{ marginTop: 10, fontFamily: T.disp, fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
      <div style={{ fontFamily: T.body, fontSize: 12.5, color: T.mut, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.author}</div>
      {progress != null ? (
        <div style={{ marginTop: 9, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}>
          <div style={{ width: progress + '%', height: '100%', background: T.accent2, borderRadius: 2 }} />
        </div>
      ) : (
        <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.dim }}>
          <GEIcon.star s={12} style={{ color: T.star }} />{b.rating} · ${b.price}
        </div>
      )}
    </div>
  )
}

// ── Row (carousel) ──
export function Row({ title, sub, books, progressMap, onShowAll }: { title: string; sub?: string; books: Book[]; progressMap?: Record<string, number> | null; onShowAll?: () => void }) {
  return (
    <div data-stagger style={{ marginBottom: 34 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 21, color: T.text, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{title}</span>
          {sub && <span style={{ fontFamily: T.body, fontSize: 13, color: T.mut, marginLeft: 12 }}>{sub}</span>}
        </div>
        <span onClick={onShowAll} style={{ fontFamily: T.body, fontSize: 12, fontWeight: 700, color: T.mut, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Show all</span>
      </div>
      <div className="ge-scroll" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {books.map(b => <BookCard key={b.id} b={b} progress={progressMap ? (progressMap[b.id] != null ? Math.round((progressMap[b.id] / b.secs) * 100) : null) : null} />)}
      </div>
    </div>
  )
}

// ── Mini player ──
export function MiniPlayer({ mobile }: { mobile?: boolean }) {
  const app = useApp()
  const np = app.nowPlaying
  if (!np) return null
  const b = app.booksById[np.bookId] || GE_BOOK_BY_ID[np.bookId]
  if (!b) return null
  const chapters = app.chaptersById[np.bookId] || GE_CHAPTERS(b)
  const owned = app.isOwned(b.id)
  const SAMPLE_CH = 1
  const blocked = !owned && np.chapter >= SAMPLE_CH
  const hasPrev = np.chapter > 0
  const hasNext = np.chapter < chapters.length - 1 && (owned || np.chapter + 1 < SAMPLE_CH)
  const total = owned ? b.secs : (chapters.length > SAMPLE_CH ? (chapters[SAMPLE_CH]?.start ?? b.secs) : b.secs)
  const ch = chapters[np.chapter] || chapters[0]
  const chapterStart = ch?.start ?? 0
  const chapterLen = ch?.len ?? b.secs
  const chapterPos = Math.max(0, np.pos - chapterStart)
  const pct = chapterLen > 0 ? (chapterPos / chapterLen) * 100 : 0
  const seekInChapter = (p: number) => app.seekPct(((chapterStart + (p / 100) * chapterLen) / b.secs) * 100)
  if (mobile) {
    return (
      <div role="region" aria-label="Now playing" style={{ flexShrink: 0, margin: '0 8px 4px', background: T.elev, borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden' }}>
        <div onClick={() => app.openPlayer(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <BookCover book={b} w={42} radius={7} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 13.5, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
            <div style={{ fontSize: 11.5, color: blocked ? T.accent2 : T.mut }}>{blocked ? 'Chapter locked' : (owned ? fmtClock(total - np.pos) + ' left' : 'Sample preview')}</div>
          </div>
        </div>
        {blocked ? (
          <IconBtn size={40} onClick={() => app.openPlayer(b.id)} style={{ color: T.accent2 }}>
            <GEIcon.lock s={20} />
          </IconBtn>
        ) : (
          <IconBtn size={40} onClick={e => { e.stopPropagation(); app.togglePlay() }} style={{ color: T.text }}>
            {np.playing ? <GEIcon.pause s={22} /> : <GEIcon.play s={22} />}
          </IconBtn>
        )}
        <IconBtn size={36} onClick={e => { e.stopPropagation(); app.stopPlayer() }} title="Stop and dismiss" aria-label="Stop and dismiss player" style={{ color: T.mut, flexShrink: 0 }}>
          <GEIcon.plus s={16} style={{ transform: 'rotate(45deg)' }} />
        </IconBtn>
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 2.5, width: pct + '%', background: T.accent2 }} />
      </div>
    )
  }
  if (blocked) {
    return (
      <div role="region" aria-label="Now playing" style={{ height: 84, flexShrink: 0, borderTop: '1px solid ' + T.line, background: '#0d0d15', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18 }}>
        <div onClick={() => app.openPlayer(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, width: 270, cursor: 'pointer' }}>
          <BookCover book={b} w={52} radius={8} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
            <div style={{ fontSize: 12, color: T.accent2 }}>Chapter locked</div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GEIcon.lock s={18} style={{ color: T.accent2 }} />
          </div>
          <span style={{ fontSize: 13, color: T.mut }}>Purchase to continue listening</span>
        </div>
        <div style={{ width: 200, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconBtn size={34} onClick={() => app.stopPlayer()} title="Stop and dismiss" aria-label="Stop and dismiss player" style={{ color: T.mut }}><GEIcon.plus s={16} style={{ transform: 'rotate(45deg)' }} /></IconBtn>
        </div>
      </div>
    )
  }
  return (
    <div role="region" aria-label="Now playing" style={{ height: 84, flexShrink: 0, borderTop: '1px solid ' + T.line, background: '#0d0d15', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18 }}>
      <div onClick={() => app.openPlayer(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, width: 270, cursor: 'pointer' }}>
        <BookCover book={b} w={52} radius={8} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
          <div style={{ fontSize: 12, color: T.mut }}>{owned ? b.narrator : 'Sample · ' + b.narrator}</div>
        </div>
        <IconBtn size={32} style={{ color: T.text }} onClick={e => { e.stopPropagation(); app.toggleWishlist(b.id) }}>
          {app.wishlist.includes(b.id) ? <GEIcon.heartFill s={18} style={{ color: T.accent2 }} /> : <GEIcon.heart s={18} />}
        </IconBtn>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <IconBtn size={34} className="ge-nudge-l" onClick={() => app.seekRel(-15)}><GEIcon.back15 s={20} /></IconBtn>
          <IconBtn size={34} className="ge-nudge-l" disabled={!hasPrev} onClick={() => app.skipChapter(-1)}><GEIcon.prev s={20} /></IconBtn>
          <PlayButton playing={np.playing} onClick={() => app.togglePlay()} size={42} variant="light" iconSize={19} />
          <IconBtn size={34} className="ge-nudge-r" disabled={!hasNext} onClick={() => app.skipChapter(1)}><GEIcon.next s={20} /></IconBtn>
          <IconBtn size={34} className="ge-nudge-r" onClick={() => app.seekRel(30)}><GEIcon.fwd30 s={20} /></IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '74%' }}>
          <span style={{ fontSize: 11, color: T.mut, fontVariantNumeric: 'tabular-nums' }}>{fmt(chapterPos)}</span>
          <Scrubber pct={pct} onSeek={seekInChapter} />
          <span style={{ fontSize: 11, color: T.mut, fontVariantNumeric: 'tabular-nums' }}>{fmt(chapterLen)}</span>
        </div>
      </div>
      <div style={{ width: 200, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, color: T.mut }}>
        <button onClick={() => app.cycleSpeed()} style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 12.5, border: '1px solid ' + T.line, padding: '5px 9px', borderRadius: 7, background: 'transparent', color: T.text, cursor: 'pointer' }}>{np.speed}×</button>
        <SleepControl size={34} dir="up" iconSize={19} />
        <IconBtn size={34} onClick={() => app.openPlayer(b.id)}><GEIcon.list s={19} /></IconBtn>
        <IconBtn size={34} onClick={() => app.stopPlayer()} title="Stop and dismiss" aria-label="Stop and dismiss player"><GEIcon.plus s={16} style={{ transform: 'rotate(45deg)' }} /></IconBtn>
      </div>
    </div>
  )
}
