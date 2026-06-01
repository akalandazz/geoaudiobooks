'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { GE_BOOKS, GE_BOOK_BY_ID, GE_CHAPTERS, Book } from './bookdata'

export interface NowPlaying {
  bookId: string;
  chapter: number;
  pos: number;
  playing: boolean;
  speed: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  chapter: number;
  pos: number;
  note: string;
  ts: number;
}

export interface Sleep {
  mode: 'time' | 'chapter';
  minutes?: number;
  remaining: number;
  total: number;
}

export interface AppState {
  mobile: boolean;
  w: number;
  authed: boolean;
  view: string;
  bookId: string;
  nav: (v: string) => void;
  back: () => void;
  openDetail: (id: string) => void;
  nowPlaying: NowPlaying | null;
  openPlayer: (id: string) => void;
  openPlayerAt: (id: string, ch: number) => void;
  closePlayer: () => void;
  playerOpen: boolean;
  togglePlay: () => void;
  seekRel: (s: number) => void;
  seekPct: (pct: number) => void;
  skipChapter: (d: number) => void;
  goChapter: (i: number) => void;
  setSpeed: (s: number) => void;
  cycleSpeed: () => void;
  bookmarks: Bookmark[];
  addBookmark: (note?: string) => void;
  removeBookmark: (id: string) => void;
  goBookmark: (bm: Bookmark) => void;
  sleep: Sleep | null;
  setSleepTimer: (opt: 'off' | 'chapter' | number | null) => void;
  cancelSleep: () => void;
  cart: string[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  inCart: (id: string) => boolean;
  library: string[];
  isOwned: (id: string) => boolean;
  buyNow: (id: string) => void;
  placeOrder: () => void;
  lastOrder: string[];
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  premium: boolean;
  setPremium: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  progress: Record<string, number>;
  continueBooks: Book[];
  signIn: () => void;
  signOut: () => void;
}

export const AppCtx = createContext<AppState | null>(null)
export const useApp = () => useContext(AppCtx)!

const SEED_BOOKMARKS: Bookmark[] = [
  { id: 'bm1', bookId: 'salt', chapter: 2, pos: 14760, note: 'The cliffside passage', ts: Date.now() - 86400000 },
  { id: 'bm2', bookId: 'ashfall', chapter: 4, pos: 38040, note: '', ts: Date.now() - 3600000 },
]

const SEED = {
  authed: false,
  library: ['salt', 'machine', 'ashfall', 'lighthouse'] as string[],
  progress: { salt: 14880, machine: 5400, ashfall: 38280 } as Record<string, number>,
  wishlist: ['neon', 'glass'] as string[],
  cart: ['cobalt'] as string[],
  premium: false,
  bookmarks: SEED_BOOKMARKS,
}

const SPEEDS = [0.8, 1, 1.25, 1.5, 1.75, 2]
const LS_KEY = 'geaudio.state.v1'

function loadState() {
  if (typeof window === 'undefined') return null
  try { const s = JSON.parse(localStorage.getItem(LS_KEY) || ''); return s || null } catch { return null }
}

export function useResponsive() {
  const get = () => (typeof window !== 'undefined' ? window.innerWidth : 1280)
  const [w, setW] = useState(get)
  useEffect(() => {
    const on = () => setW(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return { w, mobile: w < 760 }
}

interface AppProviderProps {
  children: React.ReactNode;
  startAuthed?: boolean;
  startView?: string;
}

export function AppProvider({ children, startAuthed = false, startView = 'home' }: AppProviderProps) {
  const saved = useMemo(loadState, [])
  const init = saved || SEED
  const { mobile, w } = useResponsive()

  const [authed, setAuthed] = useState(startAuthed || init.authed)
  const [view, setView] = useState(startView)
  const [bookId, setBookId] = useState('salt')
  const [hist, setHist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>(init.cart || [])
  const [library, setLibrary] = useState<string[]>(init.library || [])
  const [progress, setProgress] = useState<Record<string, number>>(init.progress || {})
  const [wishlist, setWishlist] = useState<string[]>(init.wishlist || [])
  const [premium, setPremium] = useState<boolean>(init.premium || false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(init.bookmarks || SEED_BOOKMARKS)
  const [sleep, setSleep] = useState<Sleep | null>(null)
  const [search, setSearch] = useState('')
  const [lastOrder, setLastOrder] = useState<string[]>([])
  const [np, setNp] = useState<NowPlaying | null>(init.np || null)
  const [playerOpen, setPlayerOpen] = useState(false)

  // Persist
  useEffect(() => {
    const data = {
      authed, library, progress, wishlist, cart, premium, bookmarks,
      np: np ? { bookId: np.bookId, chapter: np.chapter, pos: np.pos, speed: np.speed, playing: false } : null,
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [authed, library, progress, wishlist, cart, premium, bookmarks, np])

  // Playback engine with sleep countdown
  useEffect(() => {
    if (!np || !np.playing) return
    const id = setInterval(() => {
      setNp(p => {
        if (!p || !p.playing) return p
        const b = GE_BOOK_BY_ID[p.bookId]
        let pos = p.pos + p.speed
        let playing = true
        if (pos >= b.secs) { pos = b.secs; playing = false }
        const chs = GE_CHAPTERS(b)
        let chapter = p.chapter
        for (let i = 0; i < chs.length; i++) if (pos >= chs[i].start) chapter = i
        if (library.includes(p.bookId)) setProgress(pg => ({ ...pg, [p.bookId]: pos }))
        return { ...p, pos, playing, chapter }
      })
      // sleep countdown
      setSleep(s => {
        if (!s || s.remaining == null) return s
        const remaining = s.remaining - 1
        if (remaining <= 0) {
          setNp(p => p ? { ...p, playing: false } : p)
          return null
        }
        return { ...s, remaining }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [np?.playing, np?.bookId, np?.speed, library]) // eslint-disable-line react-hooks/exhaustive-deps

  const nav = (v: string) => { setHist(h => [...h, view]); setView(v); setPlayerOpen(false) }
  const back = () => setHist(h => {
    if (!h.length) { setView('home'); return h }
    const nv = h[h.length - 1]; setView(nv); return h.slice(0, -1)
  })
  const openDetail = (id: string) => { setBookId(id); nav('detail') }

  const startBook = (id: string, chapter?: number) => {
    const b = GE_BOOK_BY_ID[id]
    const chs = GE_CHAPTERS(b)
    setNp(p => {
      let pos: number, ch: number
      if (chapter != null) { ch = chapter; pos = chs[chapter].start }
      else if (p && p.bookId === id) { return { ...p, playing: true } }
      else if (progress[id]) {
        pos = progress[id]; ch = 0
        for (let i = 0; i < chs.length; i++) if (pos >= chs[i].start) ch = i
      } else { pos = 0; ch = 0 }
      return { bookId: id, chapter: ch, pos, playing: true, speed: (p?.speed) || 1 }
    })
  }
  const openPlayer = (id: string) => { startBook(id); setPlayerOpen(true) }
  const openPlayerAt = (id: string, ch: number) => { startBook(id, ch); setPlayerOpen(true) }
  const closePlayer = () => setPlayerOpen(false)

  const togglePlay = () => setNp(p => p ? { ...p, playing: !p.playing } : p)
  const seekRel = (s: number) => setNp(p => {
    if (!p) return p; const b = GE_BOOK_BY_ID[p.bookId]
    const pos = Math.max(0, Math.min(b.secs, p.pos + s)); return { ...p, pos }
  })
  const seekPct = (pct: number) => setNp(p => {
    if (!p) return p; const b = GE_BOOK_BY_ID[p.bookId]
    const pos = (pct / 100) * b.secs; const chs = GE_CHAPTERS(b)
    let ch = 0; for (let i = 0; i < chs.length; i++) if (pos >= chs[i].start) ch = i
    return { ...p, pos, chapter: ch }
  })
  const skipChapter = (d: number) => setNp(p => {
    if (!p) return p; const b = GE_BOOK_BY_ID[p.bookId]; const chs = GE_CHAPTERS(b)
    const ni = Math.max(0, Math.min(chs.length - 1, p.chapter + d))
    return { ...p, chapter: ni, pos: chs[ni].start }
  })
  const goChapter = (i: number) => setNp(p => {
    if (!p) return p; const b = GE_BOOK_BY_ID[p.bookId]; const chs = GE_CHAPTERS(b)
    return { ...p, chapter: i, pos: chs[i].start, playing: true }
  })
  const setSpeed = (s: number) => setNp(p => p ? { ...p, speed: s } : p)
  const cycleSpeed = () => setNp(p => {
    if (!p) return p; const i = SPEEDS.indexOf(p.speed)
    return { ...p, speed: SPEEDS[(i + 1) % SPEEDS.length] }
  })

  // Bookmarks
  const addBookmark = useCallback((note?: string) => {
    setNp(p => {
      if (!p) return p
      const b = GE_BOOK_BY_ID[p.bookId]
      const chs = GE_CHAPTERS(b)
      const ch = chs[p.chapter] || chs[0]
      setBookmarks(bs => {
        if (bs.some(x => x.bookId === p.bookId && Math.abs(x.pos - p.pos) < 2)) return bs
        return [{ id: 'bm' + Date.now(), bookId: p.bookId, chapter: p.chapter, pos: p.pos, note: note || ch.title, ts: Date.now() }, ...bs]
      })
      return p
    })
  }, [])
  const removeBookmark = (id: string) => setBookmarks(bs => bs.filter(x => x.id !== id))
  const goBookmark = (bm: Bookmark) => {
    setNp(p => ({ bookId: bm.bookId, chapter: bm.chapter, pos: bm.pos, playing: true, speed: (p?.speed) || 1 }))
  }

  // Sleep timer
  const setSleepTimer = (opt: 'off' | 'chapter' | number | null) => {
    if (opt === 'off' || opt == null) { setSleep(null); return }
    if (opt === 'chapter') {
      setNp(p => {
        if (!p) return p
        const b = GE_BOOK_BY_ID[p.bookId]
        const chs = GE_CHAPTERS(b)
        const c = chs[p.chapter] || chs[0]
        const secs = Math.max(5, Math.round((c.start + c.len - p.pos) / (p.speed || 1)))
        setSleep({ mode: 'chapter', remaining: secs, total: secs })
        return { ...p, playing: true }
      })
      return
    }
    const mins = opt as number
    setSleep({ mode: 'time', minutes: mins, remaining: mins * 60, total: mins * 60 })
    setNp(p => p ? { ...p, playing: true } : p)
  }
  const cancelSleep = () => setSleep(null)

  const addToCart = (id: string) => setCart(c => c.includes(id) ? c : [...c, id])
  const removeFromCart = (id: string) => setCart(c => c.filter(x => x !== id))
  const inCart = (id: string) => cart.includes(id)
  const isOwned = (id: string) => library.includes(id)
  const toggleWishlist = (id: string) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id])
  const buyNow = (id: string) => {
    setLibrary(l => l.includes(id) ? l : [...l, id])
    setLastOrder([id]); setCart(c => c.filter(x => x !== id)); nav('confirm')
  }
  const placeOrder = () => {
    setLibrary(l => [...new Set([...l, ...cart])]);
    setLastOrder(cart); setCart([]); nav('confirm')
  }

  const signIn = () => { setAuthed(true); setView('home') }
  const signOut = () => { setAuthed(false) }

  const continueBooks = library
    .filter(id => progress[id] > 0)
    .map(id => GE_BOOK_BY_ID[id])
    .filter(Boolean)
    .sort((a, b) => (progress[b.id] / b.secs) - (progress[a.id] / a.secs))

  const value: AppState = {
    mobile, w, authed, view, bookId, nav, back, openDetail,
    nowPlaying: np, openPlayer, openPlayerAt, closePlayer, playerOpen,
    togglePlay, seekRel, seekPct, skipChapter, goChapter, setSpeed, cycleSpeed,
    bookmarks, addBookmark, removeBookmark, goBookmark,
    sleep, setSleepTimer, cancelSleep,
    cart, addToCart, removeFromCart, inCart, library, isOwned, buyNow, placeOrder, lastOrder,
    wishlist, toggleWishlist, premium, setPremium, search, setSearch,
    progress, continueBooks, signIn, signOut,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export { GE_BOOKS }
