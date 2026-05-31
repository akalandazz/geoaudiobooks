'use client'

import React, { useMemo, useRef, useState } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { IconBtn } from './Atoms'
import { GE_BOOK_BY_ID, GE_CHAPTERS, fmt } from './bookdata'
import { useApp } from './AppContext'

// ── Waveform ──
interface WaveformProps { pct: number; count: number; onSeek: (pct: number) => void; height?: number }
export function Waveform({ pct, count, onSeek, height = 40 }: WaveformProps) {
  const ref = useRef<HTMLDivElement>(null)
  const bars = useMemo(() => Array.from({ length: count }).map((_, i) => 6 + Math.abs(Math.sin(i * 0.5) * 14) + (i % 5) * 2), [count])
  const seek = (x: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (x - r.left) / r.width)) * 100)
  }
  const down = (e: React.PointerEvent) => {
    e.preventDefault(); seek(e.clientX)
    const mv = (ev: PointerEvent) => seek(ev.clientX)
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  return (
    <div ref={ref} onPointerDown={down} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height, cursor: 'pointer' }}>
      {bars.map((h, i) => (
        <span key={i} style={{ flex: 1, height: h, borderRadius: 2, background: (i / count) < (pct / 100) ? T.accent2 : 'rgba(255,255,255,0.13)' }} />
      ))}
    </div>
  )
}

// ── SpeedMenu ──
function SpeedMenu({ speeds, value, onPick }: { speeds: number[]; value: number; onPick: (s: number) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 14, border: '1px solid ' + T.line, padding: '8px 13px', borderRadius: 10, color: T.text, background: 'transparent', cursor: 'pointer' }}>{value}×</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
          <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: T.elev2, borderRadius: 12, padding: 6, boxShadow: T.shadow, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
            {speeds.map(s => (
              <button key={s} onClick={() => { onPick(s); setOpen(false) }} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: s === value ? T.accent : 'transparent', color: s === value ? '#fff' : T.text, fontFamily: T.disp, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', textAlign: 'center' }}>{s}×</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── PlayerDesktop ──
export function PlayerDesktop() {
  const app = useApp()
  const np = app.nowPlaying
  if (!np) return null
  const b = GE_BOOK_BY_ID[np.bookId]
  if (!b) return null
  const chapters = GE_CHAPTERS(b)
  const pct = (np.pos / b.secs) * 100
  const speeds = [0.8, 1, 1.25, 1.5, 1.75, 2]
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, fontFamily: T.body, color: T.text, overflow: 'hidden',
      background: `radial-gradient(90% 70% at 22% 6%, ${b.palette[1]}66 0%, transparent 55%), linear-gradient(180deg,#0b0b12,#08080d)`,
    }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' }}>
        <IconBtn size={42} style={{ background: T.surface, color: T.text }} onClick={() => app.closePlayer()} title="Minimize">
          <GEIcon.chevD s={20} />
        </IconBtn>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.mut, fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap' }}>Now Playing</div>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14, lineHeight: 1.3, whiteSpace: 'nowrap' }}>Your Library</div>
        </div>
        <IconBtn size={42} style={{ background: T.surface, color: T.text }} onClick={() => app.toggleWishlist(b.id)}>
          {app.wishlist.includes(b.id) ? <GEIcon.heartFill s={19} style={{ color: T.accent2 }} /> : <GEIcon.heart s={19} />}
        </IconBtn>
      </div>

      <div style={{ display: 'flex', padding: '14px 44px 0', gap: 48, height: 'calc(100% - 64px - 200px)' }}>
        <div style={{ width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <BookCover book={b} w={440} radius={20} style={{ boxShadow: '0 40px 90px rgba(0,0,0,0.6)' }} />
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{b.title}</div>
              <div style={{ fontSize: 15, color: T.mut, marginTop: 7 }}>{b.author} · {b.narrator}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 18 }}>Chapters</span>
            <span style={{ fontSize: 12.5, color: T.mut }}>{b.dur} · {chapters.length} chapters</span>
          </div>
          <div className="ge-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chapters.map(c => {
              const active = c.i === np.chapter
              return (
                <div key={c.i} onClick={() => app.goChapter(c.i)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 11, background: active ? T.elev : 'transparent', cursor: 'pointer' }}>
                  <span style={{ width: 22, fontVariantNumeric: 'tabular-nums', fontSize: 13, color: active ? T.accent2 : T.dim, fontWeight: 700 }}>{c.i === 0 ? '–' : c.i}</span>
                  {active && np.playing
                    ? <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', height: 16, width: 18 }}>
                        {[0, 1, 2, 3].map(k => <span key={k} className="ge-eq" style={{ width: 3, background: T.accent2, borderRadius: 2, animationDelay: (k * 0.15) + 's' }} />)}
                      </div>
                    : <GEIcon.play s={14} style={{ color: T.dim, width: 18 }} />
                  }
                  <span style={{ flex: 1, fontSize: 14, color: active ? T.text : T.mut, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                  <span style={{ fontSize: 12.5, color: T.dim, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.len)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* transport */}
      <div style={{ position: 'absolute', left: 44, right: 44, bottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12.5, color: T.mut, fontVariantNumeric: 'tabular-nums', width: 60 }}>{fmt(np.pos)}</span>
          <Waveform pct={pct} count={130} onSeek={app.seekPct} />
          <span style={{ fontSize: 12.5, color: T.mut, fontVariantNumeric: 'tabular-nums', width: 60, textAlign: 'right' }}>{fmt(b.secs)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 24 }}>
          <SpeedMenu speeds={speeds} value={np.speed} onPick={app.setSpeed} />
          <IconBtn size={44} onClick={() => app.skipChapter(-1)}><GEIcon.prev s={26} /></IconBtn>
          <IconBtn size={48} onClick={() => app.seekRel(-15)} style={{ color: T.text }}><GEIcon.back15 s={30} /></IconBtn>
          <button onClick={() => app.togglePlay()} style={{ width: 76, height: 76, borderRadius: 38, background: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 40px rgba(139,92,246,0.55)' }}>
            {np.playing ? <GEIcon.pause s={30} style={{ color: '#fff' }} /> : <GEIcon.play s={30} style={{ color: '#fff' }} />}
          </button>
          <IconBtn size={48} onClick={() => app.seekRel(30)} style={{ color: T.text }}><GEIcon.fwd30 s={30} /></IconBtn>
          <IconBtn size={44} onClick={() => app.skipChapter(1)}><GEIcon.next s={26} /></IconBtn>
          <IconBtn size={44}><GEIcon.sleep s={24} /></IconBtn>
        </div>
      </div>
    </div>
  )
}

// ── PlayerMobile ──
export function PlayerMobile() {
  const app = useApp()
  const np = app.nowPlaying
  if (!np) return null
  const b = GE_BOOK_BY_ID[np.bookId]
  if (!b) return null
  const chapters = GE_CHAPTERS(b)
  const pct = (np.pos / b.secs) * 100
  const ch = chapters[np.chapter] || chapters[0]
  const coverW = Math.min(330, app.w - 60)
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, fontFamily: T.body, color: T.text, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: `radial-gradient(80% 46% at 50% 0%, ${b.palette[1]} 0%, transparent 58%), linear-gradient(180deg,#0c0716,#08060d)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 0', color: T.text }}>
        <IconBtn size={40} onClick={() => app.closePlayer()} style={{ color: T.text }}><GEIcon.chevD s={24} /></IconBtn>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.mut, fontWeight: 700 }}>Playing from Library</div>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 13, marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
        </div>
        <IconBtn size={40} onClick={() => app.toggleWishlist(b.id)} style={{ color: T.text }}>
          {app.wishlist.includes(b.id) ? <GEIcon.heartFill s={22} style={{ color: T.accent2 }} /> : <GEIcon.heart s={22} />}
        </IconBtn>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px' }}>
        <BookCover book={b} w={coverW} radius={20} style={{ alignSelf: 'center', boxShadow: '0 30px 70px rgba(0,0,0,0.6)', maxWidth: '100%' }} />
        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{b.title}</div>
            <div style={{ fontSize: 14, color: T.mut, marginTop: 5 }}>{ch.title} · {b.narrator}</div>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <Waveform pct={pct} count={50} onSeek={app.seekPct} height={34} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: T.mut, fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>
            <span>{fmt(np.pos)}</span><span>-{fmt(b.secs - np.pos)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 22 }}>
          <IconBtn size={46} onClick={() => app.seekRel(-15)} style={{ color: T.text }}><GEIcon.back15 s={30} /></IconBtn>
          <IconBtn size={40} onClick={() => app.skipChapter(-1)}><GEIcon.prev s={24} /></IconBtn>
          <button onClick={() => app.togglePlay()} style={{ width: 76, height: 76, borderRadius: 38, background: 'linear-gradient(135deg,#A78BFA,#8B5CF6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 40px rgba(139,92,246,0.55)' }}>
            {np.playing ? <GEIcon.pause s={30} style={{ color: '#fff' }} /> : <GEIcon.play s={30} style={{ color: '#fff' }} />}
          </button>
          <IconBtn size={40} onClick={() => app.skipChapter(1)}><GEIcon.next s={24} /></IconBtn>
          <IconBtn size={46} onClick={() => app.seekRel(30)} style={{ color: T.text }}><GEIcon.fwd30 s={30} /></IconBtn>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px 38px', color: T.mut }}>
        <button onClick={() => app.cycleSpeed()} style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 13, color: T.text, background: 'transparent', border: 'none', cursor: 'pointer' }}>{np.speed}×</button>
        <IconBtn size={38}><GEIcon.sleep s={21} /></IconBtn>
        <IconBtn size={38}><GEIcon.bookmark s={20} /></IconBtn>
        <IconBtn size={38}><GEIcon.list s={21} /></IconBtn>
      </div>
    </div>
  )
}
