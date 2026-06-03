'use client'

import React, { useEffect, useRef } from 'react'
import { T } from './theme'
import { AppProvider, useApp } from './AppContext'
import { Sidebar, BottomNav, TopBar, MobileTop, MiniPlayer } from './Chrome'
import { PlayerDesktop, PlayerMobile, BuyPrompt } from './Player'
import { Auth } from './Auth'
import { Home } from './Home'
import { Search } from './Search'
import { Detail } from './Detail'
import { Cart, Checkout, Confirm } from './Commerce'
import { Library, Profile, Settings } from './Account'

// ── Screen router ──
const SCREENS: Record<string, React.ComponentType> = {
  home: Home, search: Search, detail: Detail,
  cart: Cart, checkout: Checkout, confirm: Confirm,
  library: Library, profile: Profile, settings: Settings,
}

// ── Main shell ──
function Shell() {
  const app = useApp()
  const appRef = useRef(app)
  useEffect(() => { appRef.current = app })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!appRef.current.nowPlaying) return
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); appRef.current.togglePlay() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); appRef.current.seekRel(-10) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); appRef.current.seekRel(10) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  if (app.loading) {
    return <div style={{ position: 'relative', height: '100vh', background: T.bg }} />
  }

  if (!app.authed) {
    return (
      <div style={{ position: 'relative', height: '100vh', background: T.bg }}>
        <Auth />
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
          <div key={app.view} className="ge-viewenter" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ScreenComp />
          </div>
          <MiniPlayer mobile />
          <BottomNav />
        </div>
      ) : (
        <>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <TopBar search={app.view === 'search' ? app.search : ''} />
            <div key={app.view} className="ge-viewenter" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <ScreenComp />
            </div>
            <MiniPlayer />
          </div>
        </>
      )}
      {app.playerOpen && app.nowPlaying && (
        mobile ? <PlayerMobile /> : <PlayerDesktop />
      )}
      <BuyPrompt />
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
