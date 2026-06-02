'use client'

import React from 'react'
import { T } from './theme'
import { AppProvider, useApp } from './AppContext'
import { Sidebar, BottomNav, TopBar, MobileTop, MiniPlayer } from './Chrome'
import { PlayerDesktop, PlayerMobile } from './Player'
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
