'use client'

import React, { useState } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { Btn, IconBtn, Screen } from './Atoms'
import { BookCard } from './Chrome'
import { fmtClock } from './bookdata'
import { useApp } from './AppContext'

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.mut, marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 46, height: 27, borderRadius: 99, border: 'none', cursor: 'pointer', background: on ? T.accent : T.elev2, position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: 99, background: '#fff', transition: 'left .15s', display: 'block' }} />
    </button>
  )
}

function Seg({ opts, val, onChange }: { opts: string[]; val: string; onChange?: (v: string) => void }) {
  const [v, setV] = useState(val)
  return (
    <div style={{ display: 'flex', background: T.elev, borderRadius: 9, padding: 3, gap: 2 }}>
      {opts.map(o => (
        <button key={o} onClick={() => { setV(o); onChange?.(o) }} style={{ padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', background: v === o ? T.accent : 'transparent', color: v === o ? '#fff' : T.mut, fontFamily: T.disp, fontWeight: 700, fontSize: 13 }}>{o}</button>
      ))}
    </div>
  )
}

const LIBRARY_EMPTY: Record<string, [string, string]> = {
  Listening: ['Nothing in progress', "Start a book and it'll appear here."],
  Owned: ['No audiobooks yet', 'Purchases land in your library instantly.'],
  Wishlist: ['Your wishlist is empty', 'Tap the heart on any book to save it.'],
}

function LibraryEmpty({ t, onBrowse }: { t: string; onBrowse: () => void }) {
  const [title, sub] = LIBRARY_EMPTY[t] || ['Empty', '']
  return (
    <div style={{ textAlign: 'center', padding: '70px 0', color: T.dim }}>
      <GEIcon.library s={42} style={{ color: T.elev2, marginBottom: 14 }} />
      <div style={{ fontFamily: T.disp, fontSize: 19, color: T.mut }}>{title}</div>
      <div style={{ fontSize: 14, marginTop: 5, marginBottom: 20 }}>{sub}</div>
      <Btn kind="primary" onClick={onBrowse}>Browse catalog</Btn>
    </div>
  )
}

// ── LIBRARY ──
export function Library() {
  const app = useApp()
  const [tab, setTab] = useState('Listening')
  const mob = app.mobile
  const owned = app.library.map(id => app.booksById[id]).filter(Boolean)
  const listening = app.continueBooks
  const wish = app.wishlist.map(id => app.booksById[id]).filter(Boolean)
  const tabs: [string, number][] = [['Listening', listening.length], ['Owned', owned.length], ['Wishlist', wish.length]]
  const show = tab === 'Listening' ? listening : tab === 'Owned' ? owned : wish
  const colW = mob ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(168px, 1fr))'
  const onBrowse = () => app.nav('home')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: mob ? '4px 20px 0' : '24px 40px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: mob ? 18 : 26 }}>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 24 : 32, color: T.text, letterSpacing: '-0.02em' }}>Your Library</span>
        </div>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid ' + T.line }}>
          {tabs.map(([t, n]) => (
            <div key={t} onClick={() => setTab(t)} style={{ padding: '0 0 14px', cursor: 'pointer', fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: tab === t ? T.text : T.mut, borderBottom: '2px solid ' + (tab === t ? T.accent : 'transparent'), marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {t}<span style={{ fontSize: 12, background: tab === t ? T.accentDim : T.elev, color: tab === t ? T.accent2 : T.dim, borderRadius: 99, padding: '1px 8px', fontWeight: 700 }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <Screen style={{ padding: mob ? '20px' : '24px 40px 40px' }}>
        {tab === 'Listening' && listening.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 8 }}>
            {listening.map(b => {
              const pct = Math.round((app.progress[b.id] / b.secs) * 100)
              return (
                <div key={b.id} onClick={() => app.openPlayer(b.id)} style={{ display: 'flex', gap: 16, background: T.surface, border: '1px solid ' + T.line, borderRadius: 14, padding: 14, cursor: 'pointer', alignItems: 'center' }}>
                  <BookCover book={b} w={mob ? 64 : 80} radius={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 15 : 17, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                    <div style={{ fontSize: 13, color: T.mut, marginTop: 3 }}>{fmtClock(b.secs - (app.progress[b.id] || 0))} left · {pct}%</div>
                    <div style={{ marginTop: 10, height: 4, background: T.elev, borderRadius: 2, maxWidth: 320 }}>
                      <div style={{ width: pct + '%', height: '100%', background: T.accent2, borderRadius: 2 }} />
                    </div>
                  </div>
                  <IconBtn size={48} style={{ background: T.accent, color: '#fff', flexShrink: 0 }}>
                    <GEIcon.play s={20} style={{ color: '#fff' }} />
                  </IconBtn>
                </div>
              )
            })}
          </div>
        )}
        {tab !== 'Listening' && (
          show.length === 0
            ? <LibraryEmpty t={tab} onBrowse={onBrowse} />
            : <div style={{ display: 'grid', gridTemplateColumns: colW, gap: mob ? 18 : 24, rowGap: 28 }}>
                {show.map(b => <BookCard key={b.id} b={b} w="100%" />)}
              </div>
        )}
        {tab === 'Listening' && listening.length === 0 && <LibraryEmpty t={tab} onBrowse={onBrowse} />}
      </Screen>
    </div>
  )
}

// ── PROFILE ──
export function Profile() {
  const app = useApp()
  const mob = app.mobile
  const displayName = app.user?.name || 'Listener'
  const displayEmail = app.user?.email || ''
  const initial = displayName[0]?.toUpperCase() || '?'
  const hoursListened = Math.round(Object.values(app.progress).reduce((s, p) => s + p, 0) / 3600)
  const stats: [string, number][] = [['Books', app.library.length], ['Hours', hoursListened], ['Day streak', 12], ['Reviews', 7]]
  const history = app.library.slice(0, 5).map(id => app.booksById[id]).filter(Boolean)

  return (
    <Screen style={{ padding: mob ? '4px 20px 20px' : '24px 40px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 16 : 24, marginBottom: 30, flexWrap: 'wrap' }}>
        <div style={{ width: mob ? 72 : 92, height: mob ? 72 : 92, borderRadius: 99, background: 'linear-gradient(135deg,#8B5CF6,#E94BD0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 28 : 36, color: '#fff' }}>{initial}</div>
        <div>
          <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 26 : 34, letterSpacing: '-0.02em', color: T.text }}>{displayName}</div>
          <div style={{ fontSize: 14.5, color: T.mut, marginTop: 4 }}>{displayEmail}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, background: app.premium ? T.accentDim : T.elev, color: app.premium ? T.accent2 : T.mut, padding: '5px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, fontFamily: T.disp }}>
            {app.premium ? '★ Premium member' : 'Free plan'}
          </div>
        </div>
        <div style={{ marginLeft: mob ? 0 : 'auto' }}>
          <Btn kind="ghost" onClick={() => app.nav('settings')}>Edit profile</Btn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4,1fr)', gap: 14, marginBottom: 34 }}>
        {stats.map(([k, v]) => (
          <div key={k} style={{ background: T.surface, border: '1px solid ' + T.line, borderRadius: 14, padding: '20px 18px' }}>
            <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 30, color: T.text, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 13, color: T.mut, marginTop: 7 }}>{k}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 19, color: T.text, marginBottom: 16 }}>Purchase history</div>
      {history.length === 0
        ? <div style={{ color: T.dim, fontSize: 14.5, padding: '20px 0' }}>No purchases yet.</div>
        : (
          <div style={{ background: T.surface, border: '1px solid ' + T.line, borderRadius: 14, overflow: 'hidden' }}>
            {history.map((b, i) => (
              <div key={b.id} onClick={() => app.openDetail(b.id)} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '13px 16px', borderTop: i ? '1px solid ' + T.line : 'none', cursor: 'pointer' }}>
                <BookCover book={b} w={44} radius={7} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14.5, color: T.text }}>{b.title}</div>
                  <div style={{ fontSize: 12.5, color: T.mut }}>Order #GE{(10428 + i)} · {b.year}</div>
                </div>
                <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 14.5, color: T.text }}>${b.price}</span>
              </div>
            ))}
          </div>
        )
      }
    </Screen>
  )
}

// ── SETTINGS ──
export function Settings() {
  const app = useApp()
  const mob = app.mobile
  const [t1, setT1] = useState(true), [t2, setT2] = useState(false), [t3, setT3] = useState(true)

  const SettingsRow = ({ label, desc, control }: { label: string; desc?: string; control: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderTop: '1px solid ' + T.line }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 14.5, color: T.text }}>{label}</div>
        {desc && <div style={{ fontSize: 13, color: T.mut, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
      </div>
      {control}
    </div>
  )

  return (
    <Screen style={{ padding: mob ? '4px 20px 20px' : '24px 40px 40px' }}>
      <div style={{ marginBottom: mob ? 18 : 26 }}>
        <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 24 : 32, color: T.text, letterSpacing: '-0.02em' }}>Settings</span>
      </div>
      <div style={{ maxWidth: 680 }}>
        <Group title="Membership">
          <div style={{ background: app.premium ? 'linear-gradient(135deg,#2a1d52,#181030)' : T.surface, border: '1px solid ' + T.line, borderRadius: 16, padding: 22, marginBottom: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 19, color: T.text }}>{app.premium ? 'Premium' : 'Free plan'}</div>
                <div style={{ fontSize: 13.5, color: T.mut, marginTop: 4 }}>{app.premium ? '$11.99/mo · renews Jun 30, 2026 · 1 credit each month' : 'À-la-carte purchases only'}</div>
              </div>
              <Btn kind={app.premium ? 'ghost' : 'primary'} onClick={() => app.setPremium(!app.premium)}>
                {app.premium ? 'Manage plan' : 'Upgrade — 30% off books'}
              </Btn>
            </div>
            {!app.premium && (
              <div style={{ display: 'flex', gap: 18, marginTop: 18, flexWrap: 'wrap' }}>
                {['30% off every purchase', '1 credit / month', 'Lossless & offline'].map(f => (
                  <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.mut }}>
                    <GEIcon.check s={15} style={{ color: T.good }} />{f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Group>
        <Group title="Playback">
          <SettingsRow label="Default speed" desc="Applied to new books" control={<Seg opts={['1×', '1.25×', '1.5×', '2×']} val="1×" />} />
          <SettingsRow label="Skip-back interval" control={<Seg opts={['10s', '15s', '30s']} val="15s" />} />
          <SettingsRow label="Skip-forward interval" control={<Seg opts={['15s', '30s', '60s']} val="30s" />} />
          <SettingsRow label="Auto-play next chapter" control={<Toggle on={t1} onClick={() => setT1(!t1)} />} />
        </Group>
        <Group title="Notifications">
          <SettingsRow label="New releases from followed authors" control={<Toggle on={t3} onClick={() => setT3(!t3)} />} />
          <SettingsRow label="Price drops on wishlist" control={<Toggle on={t2} onClick={() => setT2(!t2)} />} />
        </Group>
        <Group title="Account">
          <SettingsRow label="Email" desc={app.user?.email || ''} control={<Btn kind="ghost" size="sm">Change</Btn>} />
          <SettingsRow label="Password" desc="Last changed 3 months ago" control={<Btn kind="ghost" size="sm">Update</Btn>} />
          <SettingsRow label="Sign out" control={<Btn kind="ghost" size="sm" onClick={() => app.signOut()}>Sign out</Btn>} />
        </Group>
      </div>
    </Screen>
  )
}
