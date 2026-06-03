'use client'

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { Btn, IconBtn, PlayButton } from './Atoms'
import { GE_BOOK_BY_ID, GE_CHAPTERS, fmt } from './bookdata'
import { useApp } from './AppContext'

const SAMPLE_CH = 1

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

// ── Flash toast ──
export function useFlash(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null)
  const show = useCallback((m: string) => setMsg(m), [])
  useEffect(() => {
    if (!msg) return
    const id = setTimeout(() => setMsg(null), 1600)
    return () => clearTimeout(id)
  }, [msg])
  const node = msg ? (
    <div style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', background: T.elev2, color: T.text, padding: '11px 20px', borderRadius: 99, boxShadow: T.shadow, fontFamily: T.disp, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, zIndex: 60, whiteSpace: 'nowrap' }}>
      <GEIcon.check s={16} style={{ color: T.good }} />{msg}
    </div>
  ) : null
  return [node, show]
}

// ── Buy prompt ──
// Animated overlay that springs up when a free sample ends.
export function BuyPrompt() {
  const app = useApp()
  const id = app.buyPrompt
  if (!id) return null
  const b = app.booksById[id] || GE_BOOK_BY_ID[id]
  if (!b) return null
  const mobile = app.mobile
  return (
    <div className="ge-promptfade" style={{ position: 'absolute', inset: 0, zIndex: 90, display: 'flex',
      alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', padding: mobile ? 0 : 24,
      background: 'rgba(6,6,12,0.62)', backdropFilter: 'blur(3px)' }}
      onClick={() => app.dismissBuyPrompt()}>
      <div className="ge-promptpop" onClick={e => e.stopPropagation()} style={{ width: mobile ? '100%' : 412,
        maxWidth: '100%', background: T.elev2, border: '1px solid ' + T.line2,
        borderRadius: mobile ? '22px 22px 0 0' : 20, padding: mobile ? '26px 24px 32px' : 28,
        boxShadow: '0 30px 90px rgba(0,0,0,0.6)', position: 'relative' }}>
        <button onClick={() => app.dismissBuyPrompt()} title="Dismiss" style={{ position: 'absolute', top: 16, right: 16,
          width: 32, height: 32, borderRadius: 99, border: 'none', cursor: 'pointer', background: T.surface, color: T.mut,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GEIcon.plus s={17} style={{ transform: 'rotate(45deg)' }} />
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.disp, fontWeight: 700, fontSize: 11.5,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent2 }}>
          <GEIcon.lock s={13} />End of free sample
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'center' }}>
          <BookCover book={b} w={84} radius={11} style={{ flexShrink: 0, boxShadow: '0 14px 34px rgba(0,0,0,0.5)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em', lineHeight: 1.15, color: T.text }}>{b.title}</div>
            <div style={{ fontSize: 13.5, color: T.mut, marginTop: 4 }}>{b.author} · {b.narrator}</div>
            <div style={{ fontSize: 13, color: T.dim, marginTop: 8, lineHeight: 1.5 }}>Loved the preview? Unlock all chapters now.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Btn kind="primary" full onClick={() => app.buyNow(b.id)}>Buy now · ${b.price}</Btn>
          <Btn kind="ghost" onClick={() => app.dismissBuyPrompt()} style={{ flexShrink: 0 }}>Maybe later</Btn>
        </div>
      </div>
    </div>
  )
}

// ── Sleep timer control ──
const SLEEP_OPTS: [string, 'off' | 'chapter' | number][] = [
  ['Off', 'off'], ['15 min', 15], ['30 min', 30], ['45 min', 45], ['1 hour', 60], ['End of chapter', 'chapter'],
]
export function SleepControl({ size = 44, dir = 'up', iconSize }: { size?: number; dir?: 'up' | 'down'; iconSize?: number }) {
  const app = useApp()
  const [open, setOpen] = useState(false)
  const s = app.sleep
  const active = !!s
  const label = active ? (s!.mode === 'chapter' ? 'Chapter' : fmt(s!.remaining)) : null
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Sleep timer"
        style={{ display: 'flex', alignItems: 'center', gap: 7, height: size, padding: active ? '0 12px' : '0', width: active ? 'auto' : size, justifyContent: 'center', borderRadius: 99, border: 'none', cursor: 'pointer', background: active ? T.accentDim : 'transparent', color: active ? T.accent2 : T.mut, transition: 'background .15s, color .15s' }}
        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = T.elev }}
        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <GEIcon.sleep s={iconSize || Math.round(size * 0.52)} />
        {active && <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>{label}</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1 }} />
          <div style={{ position: 'absolute', [dir === 'up' ? 'bottom' : 'top']: '124%', left: '50%', transform: 'translateX(-50%)', background: T.elev2, borderRadius: 13, padding: 7, boxShadow: T.shadow, zIndex: 2, minWidth: 188 }}>
            <div style={{ padding: '6px 12px 8px', fontFamily: T.disp, fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.mut, display: 'flex', alignItems: 'center', gap: 7 }}>
              <GEIcon.sleep s={14} />Sleep timer
            </div>
            {active && (
              <div style={{ margin: '0 6px 7px', padding: '8px 11px', borderRadius: 9, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: T.body, fontSize: 13, color: T.accent2, fontWeight: 600 }}>{s!.mode === 'chapter' ? 'Ends with chapter' : 'Stops in'}</span>
                <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 14, color: T.accent2, fontVariantNumeric: 'tabular-nums' }}>{fmt(s!.remaining)}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {SLEEP_OPTS.map(([lbl, val]) => {
                const isActive = (val === 'off' && !active) || (active && s!.mode === 'time' && s!.minutes === val) || (active && s!.mode === 'chapter' && val === 'chapter')
                return (
                  <button key={lbl} onClick={() => { app.setSleepTimer(val); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? T.accent : 'transparent', color: isActive ? '#fff' : T.text, fontFamily: T.body, fontWeight: 600, fontSize: 13.5, textAlign: 'left', width: '100%' }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = T.elev }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                    {lbl}{isActive && val !== 'off' && <GEIcon.check s={15} />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Bookmarks list ──
export function BookmarksList({ bookId }: { bookId: string }) {
  const app = useApp()
  const list = app.bookmarks.filter(bm => bm.bookId === bookId).sort((a, b) => a.pos - b.pos)
  const b = app.booksById[bookId] || GE_BOOK_BY_ID[bookId]
  const chs = b ? (app.chaptersById[bookId] || GE_CHAPTERS(b)) : []
  if (list.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: T.dim }}>
        <GEIcon.bookmark s={30} style={{ color: T.elev2, marginBottom: 12 }} />
        <div style={{ fontFamily: T.disp, fontSize: 15, color: T.mut }}>No bookmarks yet</div>
        <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>Tap the bookmark button to save your spot.</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {list.map(bm => (
        <div key={bm.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 12px', borderRadius: 11, cursor: 'pointer' }}
          onClick={() => app.goBookmark(bm)}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.elev}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GEIcon.bookmark s={15} style={{ color: T.accent2 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bm.note || (chs[bm.chapter] && chs[bm.chapter].title) || 'Bookmark'}</div>
            <div style={{ fontSize: 12, color: T.mut, marginTop: 1 }}>{(chs[bm.chapter] ? chs[bm.chapter].title + ' · ' : '')}{fmt(bm.pos)}</div>
          </div>
          <button onClick={e => { e.stopPropagation(); app.removeBookmark(bm.id) }} title="Remove"
            style={{ width: 28, height: 28, borderRadius: 99, border: 'none', background: 'transparent', color: T.dim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.elev2; (e.currentTarget as HTMLButtonElement).style.color = T.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.dim }}>
            <GEIcon.plus s={16} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
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
  const [panel, setPanel] = useState<'Chapters' | 'Bookmarks'>('Chapters')
  const [flash, showFlash] = useFlash()
  const np = app.nowPlaying
  if (!np) return null
  const b = app.booksById[np.bookId] || GE_BOOK_BY_ID[np.bookId]
  if (!b) return null
  const owned = app.isOwned(b.id)
  const chapters = app.chaptersById[np.bookId] || GE_CHAPTERS(b)
  const sampleEnd = chapters.length > SAMPLE_CH ? (chapters[SAMPLE_CH]?.start ?? b.secs) : b.secs
  const playLen = owned ? b.secs : sampleEnd
  const ch = chapters[np.chapter] || chapters[0]
  const chapterStart = ch?.start ?? 0
  const chapterLen = ch?.len ?? playLen
  const chapterPos = Math.max(0, np.pos - chapterStart)
  const pct = chapterLen > 0 ? (chapterPos / chapterLen) * 100 : 0
  const seekInChapter = (p: number) => app.seekPct(((chapterStart + (p / 100) * chapterLen) / b.secs) * 100)
  const speeds = [0.8, 1, 1.25, 1.5, 1.75, 2]
  const bmCount = app.bookmarks.filter(x => x.bookId === np.bookId).length
  const blocked = !owned && np.chapter >= SAMPLE_CH
  const hasPrev = np.chapter > 0
  const hasNext = np.chapter < chapters.length - 1 && (owned || np.chapter + 1 < SAMPLE_CH)
  return (
    <div className="ge-playerin" style={{
      position: 'absolute', inset: 0, zIndex: 50, fontFamily: T.body, color: T.text, overflow: 'hidden',
      background: `radial-gradient(90% 70% at 22% 6%, ${b.palette[1]}66 0%, transparent 55%), linear-gradient(180deg,#0b0b12,#08080d)`,
    }}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between' }}>
        <IconBtn size={42} style={{ background: T.surface, color: T.text }} onClick={() => app.closePlayer()} title="Minimize">
          <GEIcon.chevD s={20} />
        </IconBtn>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.mut, fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap' }}>Now Playing</div>
          <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14, lineHeight: 1.3, whiteSpace: 'nowrap' }}>{owned ? 'Your Library' : 'Sample preview'}</div>
        </div>
        <IconBtn size={42} style={{ background: T.surface, color: T.text }} onClick={() => app.toggleWishlist(b.id)}>
          {app.wishlist.includes(b.id) ? <GEIcon.heartFill s={19} style={{ color: T.accent2 }} /> : <GEIcon.heart s={19} />}
        </IconBtn>
      </div>

      <div style={{ display: 'flex', padding: '14px 44px 0', gap: 48, height: 'calc(100% - 64px - 200px)' }}>
        {/* left: cover + title */}
        <div style={{ width: 440, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <BookCover book={b} w={440} radius={20} style={{ boxShadow: '0 40px 90px rgba(0,0,0,0.6)' }} />
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{b.title}</div>
              <div style={{ fontSize: 15, color: T.mut, marginTop: 7 }}>{b.author} · {b.narrator}</div>
            </div>
          </div>
        </div>

        {/* right: chapters / bookmarks panel */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 }}>
            <div style={{ display: 'flex', gap: 4, background: T.surface, borderRadius: 11, padding: 4 }}>
              {(['Chapters', 'Bookmarks'] as const).map(t => (
                <button key={t} onClick={() => setPanel(t)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 15px', borderRadius: 8, border: 'none', cursor: 'pointer', background: panel === t ? T.elev2 : 'transparent', color: panel === t ? T.text : T.mut, fontFamily: T.disp, fontWeight: 700, fontSize: 14 }}>
                  {t}
                  <span style={{ fontSize: 11.5, color: panel === t ? T.accent2 : T.dim }}>{t === 'Chapters' ? chapters.length : bmCount}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { app.addBookmark(); showFlash('Bookmarked'); setPanel('Bookmarks') }}
              title="Bookmark current position"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 15px', borderRadius: 99, border: '1px solid ' + T.line2, background: 'transparent', color: T.text, cursor: 'pointer', fontFamily: T.disp, fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = T.surface}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'transparent'}>
              <GEIcon.bookmark s={15} />Bookmark
            </button>
          </div>

          {panel === 'Bookmarks' ? (
            <div className="ge-scroll" style={{ flex: 1, overflowY: 'auto' }}>
              <BookmarksList bookId={np.bookId} />
            </div>
          ) : (
            <div className="ge-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chapters.map(c => {
                const active = c.i === np.chapter
                const locked = !owned && c.i >= SAMPLE_CH
                return (
                  <div key={c.i} onClick={() => app.goChapter(c.i)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 11, background: active ? T.elev : 'transparent', cursor: 'pointer', opacity: locked ? 0.5 : 1 }}>
                    <span style={{ width: 22, fontVariantNumeric: 'tabular-nums', fontSize: 13, color: active ? T.accent2 : T.dim, fontWeight: 700 }}>{c.i === 0 ? '–' : c.i}</span>
                    {locked
                      ? <GEIcon.lock s={14} style={{ color: T.dim, width: 18 }} />
                      : (active && np.playing
                          ? <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end', height: 16, width: 18 }}>
                              {[0, 1, 2, 3].map(k => <span key={k} className="ge-eq" style={{ width: 3, background: T.accent2, borderRadius: 2, animationDelay: (k * 0.15) + 's' }} />)}
                            </div>
                          : <GEIcon.play s={14} style={{ color: T.dim, width: 18 }} />
                        )
                    }
                    <span style={{ flex: 1, fontSize: 14, color: active ? T.text : T.mut, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                    {!owned && c.i < SAMPLE_CH && <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: T.disp, letterSpacing: '0.04em', color: T.good }}>SAMPLE</span>}
                    <span style={{ fontSize: 12.5, color: T.dim, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.len)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* transport */}
      <div style={{ position: 'absolute', left: 44, right: 44, bottom: 40 }}>
        {blocked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, background: T.surface, border: '1px solid ' + T.line2, borderRadius: 16, padding: '18px 22px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GEIcon.lock s={22} style={{ color: T.accent2 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 16, color: T.text }}>{(chapters[np.chapter] || {}).title} is locked</div>
              <div style={{ fontSize: 13.5, color: T.mut, marginTop: 3 }}>Buy the audiobook to unlock this chapter and keep listening.</div>
            </div>
            <Btn kind="primary" onClick={() => app.buyNow(b.id)} style={{ flexShrink: 0 }}>Buy now · ${b.price}</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 12.5, color: T.mut, fontVariantNumeric: 'tabular-nums', width: 60 }}>{fmt(chapterPos)}</span>
              <Waveform pct={pct} count={130} onSeek={seekInChapter} />
              <span style={{ fontSize: 12.5, color: T.mut, fontVariantNumeric: 'tabular-nums', width: 60, textAlign: 'right' }}>{fmt(chapterLen)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, marginTop: 24 }}>
              <SpeedMenu speeds={speeds} value={np.speed} onPick={app.setSpeed} />
              <IconBtn size={44} className="ge-nudge-l" aria-label="Previous chapter" disabled={!hasPrev} onClick={() => app.skipChapter(-1)}><GEIcon.prev s={26} /></IconBtn>
              <IconBtn size={48} className="ge-nudge-l" aria-label="Rewind 15 seconds" onClick={(e) => { app.seekRel(-15); (e.currentTarget as HTMLElement).blur() }} style={{ color: T.text }}><GEIcon.back15 s={30} /></IconBtn>
              <PlayButton playing={np.playing} onClick={() => app.togglePlay()} size={76} />
              <IconBtn size={48} className="ge-nudge-r" aria-label="Forward 15 seconds" onClick={(e) => { app.seekRel(15); (e.currentTarget as HTMLElement).blur() }} style={{ color: T.text }}><GEIcon.fwd15 s={30} /></IconBtn>
              <IconBtn size={44} className="ge-nudge-r" aria-label="Next chapter" disabled={!hasNext} onClick={() => app.skipChapter(1)}><GEIcon.next s={26} /></IconBtn>
              <SleepControl size={44} dir="up" iconSize={24} />
            </div>
          </>
        )}
      </div>
      {flash}
    </div>
  )
}

// ── Mobile bottom sheet ──
function MobileSheet({ bookId, tab, setTab, onClose, owned }: { bookId: string; tab: 'chapters' | 'bookmarks'; setTab: (t: 'chapters' | 'bookmarks') => void; onClose: () => void; owned: boolean }) {
  const app = useApp()
  const np = app.nowPlaying
  const b = app.booksById[bookId] || GE_BOOK_BY_ID[bookId]
  const chapters = b ? (app.chaptersById[bookId] || GE_CHAPTERS(b)) : []
  const bmCount = app.bookmarks.filter(x => x.bookId === bookId).length
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', background: T.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '72%', display: 'flex', flexDirection: 'column', boxShadow: '0 -20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: T.line2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 14px', gap: 12 }}>
          <div style={{ display: 'flex', gap: 4, background: T.elev, borderRadius: 10, padding: 4 }}>
            {(['chapters', 'bookmarks'] as const).map(k => (
              <button key={k} onClick={() => setTab(k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', background: tab === k ? T.elev2 : 'transparent', color: tab === k ? T.text : T.mut, fontFamily: T.disp, fontWeight: 700, fontSize: 13.5 }}>
                {k === 'chapters' ? 'Chapters' : 'Bookmarks'}
                <span style={{ fontSize: 11, color: tab === k ? T.accent2 : T.dim }}>{k === 'chapters' ? chapters.length : bmCount}</span>
              </button>
            ))}
          </div>
          {tab === 'bookmarks' && (
            <button onClick={() => app.addBookmark()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 99, border: '1px solid ' + T.line2, background: 'transparent', color: T.text, cursor: 'pointer', fontFamily: T.disp, fontWeight: 700, fontSize: 13 }}>
              <GEIcon.plus s={15} />Add
            </button>
          )}
        </div>
        <div className="ge-scroll" style={{ overflowY: 'auto', padding: '0 12px 28px' }}>
          {tab === 'bookmarks' ? (
            <BookmarksList bookId={bookId} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chapters.map(c => {
                const active = np ? c.i === np.chapter : false
                const locked = !owned && c.i >= SAMPLE_CH
                return (
                  <div key={c.i} onClick={() => { app.goChapter(c.i); onClose(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 12px', borderRadius: 11, background: active ? T.elev : 'transparent', cursor: 'pointer', opacity: locked ? 0.5 : 1 }}>
                    <span style={{ width: 20, fontVariantNumeric: 'tabular-nums', fontSize: 13, color: active ? T.accent2 : T.dim, fontWeight: 700 }}>{c.i === 0 ? '–' : c.i}</span>
                    {locked && <GEIcon.lock s={14} style={{ color: T.dim }} />}
                    <span style={{ flex: 1, fontSize: 14.5, color: active ? T.text : T.mut, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                    {!owned && c.i < SAMPLE_CH && <span style={{ fontSize: 10.5, fontWeight: 700, fontFamily: T.disp, letterSpacing: '0.04em', color: T.good }}>SAMPLE</span>}
                    <span style={{ fontSize: 12.5, color: T.dim, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.len)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PlayerMobile ──
export function PlayerMobile() {
  const app = useApp()
  const [sheet, setSheet] = useState<'chapters' | 'bookmarks' | null>(null)
  const [flash, showFlash] = useFlash()
  const np = app.nowPlaying
  if (!np) return null
  const b = app.booksById[np.bookId] || GE_BOOK_BY_ID[np.bookId]
  if (!b) return null
  const owned = app.isOwned(b.id)
  const chapters = app.chaptersById[np.bookId] || GE_CHAPTERS(b)
  const sampleEnd = chapters.length > SAMPLE_CH ? (chapters[SAMPLE_CH]?.start ?? b.secs) : b.secs
  const playLen = owned ? b.secs : sampleEnd
  const ch = chapters[np.chapter] || chapters[0]
  const chapterStart = ch?.start ?? 0
  const chapterLen = ch?.len ?? playLen
  const chapterPos = Math.max(0, np.pos - chapterStart)
  const pct = chapterLen > 0 ? (chapterPos / chapterLen) * 100 : 0
  const seekInChapter = (p: number) => app.seekPct(((chapterStart + (p / 100) * chapterLen) / b.secs) * 100)
  const coverW = Math.min(330, app.w - 60)
  const blocked = !owned && np.chapter >= SAMPLE_CH
  const hasPrev = np.chapter > 0
  const hasNext = np.chapter < chapters.length - 1 && (owned || np.chapter + 1 < SAMPLE_CH)
  return (
    <div className="ge-playerin" style={{
      position: 'absolute', inset: 0, zIndex: 50, fontFamily: T.body, color: T.text, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      background: `radial-gradient(80% 46% at 50% 0%, ${b.palette[1]} 0%, transparent 58%), linear-gradient(180deg,#0c0716,#08060d)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 0', color: T.text }}>
        <IconBtn size={40} onClick={() => app.closePlayer()} style={{ color: T.text }}><GEIcon.chevD s={24} /></IconBtn>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.mut, fontWeight: 700 }}>{owned ? 'Playing from Library' : 'Sample preview'}</div>
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
            <div style={{ fontSize: 14, color: T.mut, marginTop: 5 }}>{ch?.title} · {b.narrator}</div>
          </div>
        </div>
        {blocked ? (
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px 18px', textAlign: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
              <GEIcon.lock s={21} style={{ color: T.accent2 }} />
            </div>
            <div>
              <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 16, color: T.text }}>{ch?.title} is locked</div>
              <div style={{ fontSize: 13, color: T.mut, marginTop: 4, lineHeight: 1.45 }}>Buy the audiobook to unlock this chapter.</div>
            </div>
            <Btn kind="light" full onClick={() => app.buyNow(b.id)}>Buy now · ${b.price}</Btn>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 24 }}>
              <Waveform pct={pct} count={50} onSeek={seekInChapter} height={34} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: T.mut, fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>
                <span>{fmt(chapterPos)}</span><span>-{fmt(chapterLen - chapterPos)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 22 }}>
              <IconBtn size={40} className="ge-nudge-l" aria-label="Previous chapter" disabled={!hasPrev} onClick={() => app.skipChapter(-1)}><GEIcon.prev s={24} /></IconBtn>
              <IconBtn size={46} className="ge-nudge-l" aria-label="Rewind 15 seconds" onClick={(e) => { app.seekRel(-15); (e.currentTarget as HTMLElement).blur() }} style={{ color: T.text }}><GEIcon.back15 s={30} /></IconBtn>
              <PlayButton playing={np.playing} onClick={() => app.togglePlay()} size={76} />
              <IconBtn size={46} className="ge-nudge-r" aria-label="Forward 15 seconds" onClick={(e) => { app.seekRel(15); (e.currentTarget as HTMLElement).blur() }} style={{ color: T.text }}><GEIcon.fwd15 s={30} /></IconBtn>
              <IconBtn size={40} className="ge-nudge-r" aria-label="Next chapter" disabled={!hasNext} onClick={() => app.skipChapter(1)}><GEIcon.next s={24} /></IconBtn>
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px 38px', color: T.mut }}>
        <button onClick={() => app.cycleSpeed()} style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 13, color: T.text, background: 'transparent', border: 'none', cursor: 'pointer' }}>{np.speed}×</button>
        <SleepControl size={38} dir="up" iconSize={21} />
        <IconBtn size={38} onClick={() => { app.addBookmark(); showFlash('Bookmarked') }} title="Add bookmark">
          <GEIcon.bookmark s={20} />
        </IconBtn>
        <IconBtn size={38} onClick={() => setSheet('chapters')} title="Chapters & bookmarks">
          <GEIcon.list s={21} />
        </IconBtn>
      </div>
      {sheet && (
        <MobileSheet
          bookId={np.bookId}
          tab={sheet}
          setTab={setSheet}
          onClose={() => setSheet(null)}
          owned={owned}
        />
      )}
      {flash}
    </div>
  )
}
