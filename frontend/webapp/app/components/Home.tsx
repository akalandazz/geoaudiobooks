'use client'

import React from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { Btn, Screen } from './Atoms'
import { Row } from './Chrome'
import { useApp } from './AppContext'

export function Home() {
  const app = useApp()
  const books = Object.values(app.booksById)
  const cont = app.continueBooks
  const progMap: Record<string, number> = {}
  cont.forEach(b => { progMap[b.id] = app.progress[b.id] || 0 })

  // Featured: highest rated book
  const feat = app.booksById['machine'] || books.sort((a, b) => b.rating - a.rating)[0]
  // Trending: most reviewed
  const trending = books.sort((a, b) => b.reviews - a.reviews).slice(0, 6)
  // Newest: most recent year
  const newest = [...books].sort((a, b) => b.year - a.year).filter(b => b.year >= 2025).slice(0, 6)
  const mob = app.mobile

  if (!feat) return null

  return (
    <Screen style={{ padding: mob ? '4px 0 12px' : '24px 28px 12px' }}>
      <div style={{ padding: mob ? '0 20px' : 0 }}>
        {/* hero */}
        <div style={{
          position: 'relative', borderRadius: 18, overflow: 'hidden',
          background: `linear-gradient(110deg, #1a0b2e 0%, #3a1f6e 55%, ${feat.palette[2]}44 100%)`,
          display: 'flex', flexDirection: mob ? 'column' : 'row',
          alignItems: mob ? 'flex-start' : 'center',
          padding: mob ? 22 : 30, gap: mob ? 18 : 30, marginBottom: 34,
        }}>
          <BookCover book={feat} w={mob ? 130 : 174} radius={14}
            style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.5)', cursor: 'pointer' }}
            onClick={() => app.openDetail(feat.id)} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.accent2 }}>Featured this week</div>
            <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 28 : 40, color: '#fff', letterSpacing: '-0.02em', margin: '8px 0 6px', lineHeight: 1 }}>{feat.title}</div>
            <div style={{ fontSize: mob ? 13 : 14.5, color: 'rgba(255,255,255,0.8)' }}>{feat.author} · {feat.narrator} · {feat.dur}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <Btn kind="light" icon={<GEIcon.play s={16} />} onClick={() => app.openPlayer(feat.id)}>Play sample</Btn>
              <Btn kind="ghost" onClick={() => app.openDetail(feat.id)}>${feat.price}</Btn>
            </div>
          </div>
        </div>

        {cont.length > 0 && (
          <Row title="Continue listening" books={cont} progressMap={progMap} onShowAll={() => app.nav('library')} />
        )}
        {trending.length > 0 && <Row title="New & trending" books={trending} onShowAll={() => app.nav('search')} />}
        {newest.length > 0 && <Row title="Fresh this year" books={newest} onShowAll={() => app.nav('search')} />}
      </div>
    </Screen>
  )
}
