'use client'

import React, { useState } from 'react'
import { T, BASES, hexA } from './theme'
import { AppProvider, useApp } from './AppContext'
import { Sidebar, BottomNav, TopBar, MobileTop, MiniPlayer } from './Chrome'
import { PlayerDesktop, PlayerMobile } from './Player'
import { Auth } from './Auth'
import { Home } from './Home'
import { Search } from './Search'
import { Detail } from './Detail'
import { Cart, Checkout, Confirm } from './Commerce'
import { Library, Profile, Settings } from './Account'

// ── Tweaks panel ──
function TweaksPanel() {
  const app = useApp()
  const [open, setOpen] = useState(false)
  const tw = app.tweaks

  const ACCENT_OPTIONS: [string, string][] = [
    ['#8B5CF6', '#A78BFA'],
    ['#22D3EE', '#67E8F9'],
    ['#34D399', '#6EE7B7'],
    ['#F43F5E', '#FB7185'],
    ['#E0A458', '#EFC07A'],
  ]

  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
        background: T.elev2, border: '1px solid ' + T.line2,
        borderRadius: 99, padding: '9px 16px', cursor: 'pointer',
        color: T.mut, fontFamily: T.body, fontWeight: 700, fontSize: 13,
        display: 'flex', alignItems: 'center', gap: 8, boxShadow: T.shadow,
      }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
          <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
        </svg>
        Tweaks
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'fixed', bottom: 72, right: 24, zIndex: 99,
            background: T.elev, border: '1px solid ' + T.line2, borderRadius: 16,
            padding: 20, boxShadow: T.shadow, minWidth: 240,
          }}>
            <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>Tweaks</div>
            {/* Accent */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.mut, marginBottom: 10 }}>Accent</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {ACCENT_OPTIONS.map(([a, a2]) => (
                  <div key={a} onClick={() => app.setTweak('accent', [a, a2])} style={{ width: 26, height: 26, borderRadius: 13, background: a, cursor: 'pointer', boxShadow: tw.accent[0] === a ? `0 0 0 2px ${T.bg}, 0 0 0 4px ${a}` : 'none', transition: 'box-shadow .15s' }} />
                ))}
              </div>
            </div>
            {/* Background */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.mut, marginBottom: 10 }}>Background</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.keys(BASES).map(k => (
                  <button key={k} onClick={() => app.setTweak('base', k)} style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid ' + (tw.base === k ? T.accent : T.line), background: 'transparent', color: tw.base === k ? T.accent2 : T.mut, fontFamily: T.body, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{k}</button>
                ))}
              </div>
            </div>
            {/* Font */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.mut, marginBottom: 10 }}>Display font</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Space Grotesk', 'Sora', 'Outfit'].map(f => (
                  <button key={f} onClick={() => app.setTweak('displayFont', f)} style={{ padding: '6px 10px', borderRadius: 7, border: '1.5px solid ' + (tw.displayFont === f ? T.accent : T.line), background: 'transparent', color: tw.displayFont === f ? T.accent2 : T.mut, fontFamily: T.body, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Screen router ──
const SCREENS: Record<string, React.ComponentType> = {
  home: Home, search: Search, detail: Detail,
  cart: Cart, checkout: Checkout, confirm: Confirm,
  library: Library, profile: Profile, settings: Settings,
}

// ── Main shell ──
function Shell() {
  const app = useApp()

  // Apply tweaks to theme tokens
  const tw = app.tweaks
  T.accent = tw.accent[0]
  T.accent2 = tw.accent[1]
  T.accentDim = hexA(tw.accent[0], 0.16)
  const base = BASES[tw.base] || BASES.Indigo
  T.bg = base[0]; T.bg2 = base[1]
  const fontMap: Record<string, string> = {
    'Space Grotesk': "var(--font-display, 'Space Grotesk'), sans-serif",
    'Sora': "var(--font-sora, 'Sora'), sans-serif",
    'Outfit': "var(--font-outfit, 'Outfit'), sans-serif",
  }
  T.disp = fontMap[tw.displayFont] || fontMap['Space Grotesk']

  if (!app.authed) {
    return (
      <div style={{ position: 'relative', height: '100vh', background: T.bg }}>
        <Auth />
        <TweaksPanel />
      </div>
    )
  }

  const ScreenComp = SCREENS[app.view] || Home
  const { mobile } = app

  return (
    <div style={{ position: 'relative', height: '100vh', display: 'flex', background: T.bg, color: T.text, fontFamily: T.body }}>
      {mobile ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {app.view === 'home' && <MobileTop />}
          <ScreenComp />
          <MiniPlayer mobile />
          <BottomNav />
        </div>
      ) : (
        <>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <TopBar search={app.view === 'search' ? app.search : ''} />
            <ScreenComp />
            <MiniPlayer />
          </div>
        </>
      )}
      {app.playerOpen && app.nowPlaying && (
        mobile ? <PlayerMobile /> : <PlayerDesktop />
      )}
      <TweaksPanel />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
