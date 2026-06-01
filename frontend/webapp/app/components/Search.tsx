'use client'

import React, { useState, useEffect, useRef } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { Pill, Screen } from './Atoms'
import { BookCard } from './Chrome'
import { Book } from './bookdata'
import { useApp } from './AppContext'
import * as Api from '../lib/api'

const GENRES = ['All', 'Literary', 'Thriller', 'Sci-Fi', 'Fantasy', 'Romance', 'Mystery', 'Historical', 'Nonfiction', 'Adventure']
const SORT_MAP: Record<string, string> = { 'Top rated': 'rating', 'Newest': 'newest', 'Price': 'price_asc' }

export function Search() {
  const app = useApp()
  const [q, setQ] = useState(app.search || '')
  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState('Popular')
  const [results, setResults] = useState<Book[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [fetching, setFetching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const appendRef = useRef(false)

  useEffect(() => {
    if (inputRef.current && !app.mobile) inputRef.current.focus()
  }, [app.mobile])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setFetching(true)
      try {
        const data = await Api.getBooks({
          q: q || undefined,
          genre: genre === 'All' ? undefined : genre,
          sort: SORT_MAP[sort],
          limit: 20,
          page,
        })
        if (!cancelled) {
          const mapped = data.items.map(Api.toBook)
          setResults(prev => appendRef.current ? [...prev, ...mapped] : mapped)
          setTotal(data.total)
        }
      } catch {
        if (!cancelled) {
          // fallback: filter local cache
          const all = Object.values(app.booksById)
          const filtered = all.filter(b => {
            const mq = !q || (b.title + ' ' + b.author + ' ' + b.narrator).toLowerCase().includes(q.toLowerCase())
            const mg = genre === 'All' || b.genre === genre || b.tags.includes(genre)
            return mq && mg
          }).sort((a, b2) =>
            sort === 'Top rated' ? b2.rating - a.rating
            : sort === 'Price' ? a.price - b2.price
            : sort === 'Newest' ? b2.year - a.year
            : b2.reviews - a.reviews
          )
          setResults(filtered)
          setTotal(filtered.length)
        }
      } finally {
        if (!cancelled) setFetching(false)
      }
    }
    const delay = q && page === 1 ? 300 : 0
    const timer = setTimeout(run, delay)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [q, genre, sort, page]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQ = (v: string) => { setQ(v); app.setSearch(v); appendRef.current = false; setPage(1) }
  const handleGenre = (g: string) => { setGenre(g); appendRef.current = false; setPage(1) }
  const handleSort = (s: string) => { setSort(s); appendRef.current = false; setPage(1) }
  const loadMore = () => { appendRef.current = true; setPage(p => p + 1) }

  const mob = app.mobile
  const colW = mob ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(168px, 1fr))'
  const hasMore = results.length < total

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: mob ? '4px 20px 0' : '24px 28px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface, border: '1px solid ' + T.line2, borderRadius: 26, padding: mob ? '11px 16px' : '13px 18px' }}>
          <GEIcon.search s={20} style={{ color: T.mut }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => handleQ(e.target.value)}
            placeholder="Search titles, authors, narrators…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.text, fontFamily: T.body, fontSize: 15, fontWeight: 500 }}
          />
          {q && (
            <div onClick={() => handleQ('')} style={{ cursor: 'pointer', color: T.mut }}>
              <GEIcon.plus s={18} style={{ transform: 'rotate(45deg)' }} />
            </div>
          )}
        </div>
        <div className="ge-scroll" style={{ display: 'flex', gap: 9, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {GENRES.map(g => <Pill key={g} active={genre === g} onClick={() => handleGenre(g)}>{g}</Pill>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 16px' }}>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 17 : 19, color: T.text }}>
            {fetching && results.length === 0 ? 'Searching…' : `${total} ${total === 1 ? 'result' : 'results'}${q ? ` for "${q}"` : ''}`}
          </span>
          {!mob && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: T.dim }}>Sort</span>
              {['Popular', 'Top rated', 'Newest', 'Price'].map(s => <Pill key={s} active={sort === s} onClick={() => handleSort(s)}>{s}</Pill>)}
            </div>
          )}
        </div>
      </div>
      <Screen style={{ padding: mob ? '0 20px 12px' : '0 28px 12px' }}>
        {!fetching && results.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: T.dim }}>
            <GEIcon.search s={40} style={{ color: T.dim, marginBottom: 12 }} />
            <div style={{ fontFamily: T.disp, fontSize: 18, color: T.mut }}>No matches</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Try a different title or genre.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: colW, gap: mob ? 18 : 24, rowGap: 28 }}>
              {results.map(b => <BookCard key={b.id} b={b} w="100%" />)}
            </div>
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button onClick={loadMore} disabled={fetching} style={{ background: T.surface, border: '1px solid ' + T.line2, borderRadius: 99, padding: '11px 28px', color: T.text, fontFamily: T.disp, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {fetching ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </Screen>
    </div>
  )
}
