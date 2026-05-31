'use client'

import React, { useState, useEffect, useRef } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { Pill, Screen } from './Atoms'
import { BookCard } from './Chrome'
import { GE_BOOKS } from './bookdata'
import { useApp } from './AppContext'

const GENRES = ['All', 'Literary', 'Thriller', 'Sci-Fi', 'Fantasy', 'Romance', 'Mystery', 'Historical', 'Nonfiction', 'Adventure']

export function Search() {
  const app = useApp()
  const [q, setQ] = useState(app.search || '')
  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState('Popular')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current && !app.mobile) inputRef.current.focus()
  }, [app.mobile])

  let results = GE_BOOKS.filter(b => {
    const mq = !q || (b.title + ' ' + b.author + ' ' + b.narrator + ' ' + b.genre).toLowerCase().includes(q.toLowerCase())
    const mg = genre === 'All' || b.genre === genre || b.tags.includes(genre)
    return mq && mg
  })
  results = [...results].sort((a, b2) =>
    sort === 'Top rated' ? b2.rating - a.rating
    : sort === 'Price' ? a.price - b2.price
    : sort === 'Newest' ? b2.year - a.year
    : b2.reviews - a.reviews
  )

  const mob = app.mobile
  const colW = mob ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(168px, 1fr))'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: mob ? '4px 20px 0' : '24px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface, border: '1px solid ' + T.line2, borderRadius: 26, padding: mob ? '11px 16px' : '13px 18px' }}>
          <GEIcon.search s={20} style={{ color: T.mut }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); app.setSearch(e.target.value) }}
            placeholder="Search titles, authors, narrators…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontFamily: T.body, fontSize: 15, fontWeight: 500 }}
          />
          {q && (
            <div onClick={() => { setQ(''); app.setSearch('') }} style={{ cursor: 'pointer', color: T.mut }}>
              <GEIcon.plus s={18} style={{ transform: 'rotate(45deg)' }} />
            </div>
          )}
        </div>
        <div className="ge-scroll" style={{ display: 'flex', gap: 9, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {GENRES.map(g => <Pill key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Pill>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 16px' }}>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 17 : 19, color: T.text }}>
            {results.length} {results.length === 1 ? 'result' : 'results'}{q ? ` for "${q}"` : ''}
          </span>
          {!mob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: T.dim }}>Sort</span>
              {['Popular', 'Top rated', 'Newest', 'Price'].map(s => <Pill key={s} active={sort === s} onClick={() => setSort(s)}>{s}</Pill>)}
            </div>
          )}
        </div>
      </div>
      <Screen style={{ padding: mob ? '0 20px 12px' : '0 28px 12px' }}>
        {results.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: T.dim }}>
            <GEIcon.search s={40} style={{ color: T.dim, marginBottom: 12 }} />
            <div style={{ fontFamily: T.disp, fontSize: 18, color: T.mut }}>No matches</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Try a different title or genre.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: colW, gap: mob ? 18 : 24, rowGap: 28 }}>
            {results.map(b => <BookCard key={b.id} b={b} w="100%" />)}
          </div>
        )}
      </Screen>
    </div>
  )
}
