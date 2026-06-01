'use client'

import React from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { IconBtn, Scrubber } from './Atoms'
import { SleepControl } from './Player'
import { GE_BOOK_BY_ID, GE_BOOKS, Book, fmtClock, fmt } from './bookdata'
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
    return (
      <div onClick={() => app.nav(view)} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px',
        borderRadius: 10, cursor: 'pointer', color: active ? T.text : T.mut,
        background: active ? T.elev : 'transparent',
        fontFamily: T.body, fontWeight: 600, fontSize: 14.5, transition: 'all .15s',
      }}>
        {icon}{label}
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
      }}>
        {icon}
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

// ── Top bar (desktop) ──
export function TopBar({ search }: { search?: string }) {
  const app = useApp()
  return (
    <div style={{ height: 66, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', borderBottom: '1px solid ' + T.line }}>
      <div onClick={() => app.nav('search')} style={{
        display: 'flex', alignItems: 'center', gap: 9, background: T.surface,
        border: '1px solid ' + T.line, borderRadius: 22, padding: '9px 16px', width: 380, cursor: 'text',
      }}>
        <GEIcon.search s={18} style={{ color: T.mut }} />
        <span style={{ color: T.dim, fontSize: 14 }}>{search || 'Search titles, authors, narrators…'}</span>
      </div>
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
      <IconBtn style={{ background: T.surface }} title="Notifications"><GEIcon.bell s={18} /></IconBtn>
      <div onClick={() => app.nav('profile')} style={{ width: 38, height: 38, borderRadius: 19, background: 'linear-gradient(135deg,#8B5CF6,#E94BD0)', cursor: 'pointer', flexShrink: 0 }} />
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
        <IconBtn size={38} style={{ background: T.surface }}><GEIcon.bell s={18} /></IconBtn>
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
        <button onClick={e => { e.stopPropagation(); app.openPlayer(b.id) }}
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
    <div style={{ marginBottom: 34 }}>
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
  const b = GE_BOOK_BY_ID[np.bookId]
  if (!b) return null
  const pct = (np.pos / b.secs) * 100
  if (mobile) {
    return (
      <div onClick={() => app.openPlayer(b.id)} style={{ flexShrink: 0, margin: '0 8px 4px', background: T.elev, borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
        <BookCover book={b} w={42} radius={7} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 13.5, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
          <div style={{ fontSize: 11.5, color: T.mut }}>{fmtClock(b.secs - np.pos)} left</div>
        </div>
        <IconBtn size={40} onClick={e => { e.stopPropagation(); app.togglePlay() }} style={{ color: T.text }}>
          {np.playing ? <GEIcon.pause s={22} /> : <GEIcon.play s={22} />}
        </IconBtn>
        <div style={{ position: 'absolute', left: 0, bottom: 0, height: 2.5, width: pct + '%', background: T.accent2 }} />
      </div>
    )
  }
  return (
    <div style={{ height: 84, flexShrink: 0, borderTop: '1px solid ' + T.line, background: '#0d0d15', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 18 }}>
      <div onClick={() => app.openPlayer(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 13, width: 270, cursor: 'pointer' }}>
        <BookCover book={b} w={52} radius={8} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
          <div style={{ fontSize: 12, color: T.mut }}>{b.narrator}</div>
        </div>
        <IconBtn size={32} onClick={e => { e.stopPropagation(); app.toggleWishlist(b.id) }}>
          {app.wishlist.includes(b.id) ? <GEIcon.heartFill s={18} style={{ color: T.accent2 }} /> : <GEIcon.heart s={18} />}
        </IconBtn>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <IconBtn size={34} onClick={() => app.seekRel(-15)}><GEIcon.back15 s={20} /></IconBtn>
          <IconBtn size={34} onClick={() => app.skipChapter(-1)}><GEIcon.prev s={20} /></IconBtn>
          <button onClick={() => app.togglePlay()} style={{ width: 42, height: 42, borderRadius: 21, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {np.playing ? <GEIcon.pause s={19} style={{ color: '#000' }} /> : <GEIcon.play s={19} style={{ color: '#000' }} />}
          </button>
          <IconBtn size={34} onClick={() => app.skipChapter(1)}><GEIcon.next s={20} /></IconBtn>
          <IconBtn size={34} onClick={() => app.seekRel(30)}><GEIcon.fwd30 s={20} /></IconBtn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '74%' }}>
          <span style={{ fontSize: 11, color: T.mut, fontVariantNumeric: 'tabular-nums' }}>{fmt(np.pos)}</span>
          <Scrubber pct={pct} onSeek={p => app.seekPct(p)} />
          <span style={{ fontSize: 11, color: T.mut, fontVariantNumeric: 'tabular-nums' }}>{fmt(b.secs)}</span>
        </div>
      </div>
      <div style={{ width: 200, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, color: T.mut }}>
        <button onClick={() => app.cycleSpeed()} style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 12.5, border: '1px solid ' + T.line, padding: '5px 9px', borderRadius: 7, background: 'transparent', color: T.text, cursor: 'pointer' }}>{np.speed}×</button>
        <SleepControl size={34} dir="up" iconSize={19} />
        <IconBtn size={34} onClick={() => app.openPlayer(b.id)}><GEIcon.list s={19} /></IconBtn>
      </div>
    </div>
  )
}
