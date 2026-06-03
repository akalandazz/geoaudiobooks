'use client'

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { GE_BOOK_BY_ID, GE_CHAPTERS, Book, Chapter } from './bookdata'
import * as Api from '../lib/api'
import type { UserOut } from '../lib/api'
import { getAudioEngine } from '../lib/audioEngine'

export type { UserOut }

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
  loading: boolean;
  user: UserOut | null;
  booksById: Record<string, Book>;
  chaptersById: Record<string, Chapter[]>;
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
  placeOrder: () => Promise<void>;
  lastOrder: string[];
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  premium: boolean;
  setPremium: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  progress: Record<string, number>;
  continueBooks: Book[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  setChapters: (bookId: string, chs: Chapter[]) => void;
  buyPrompt: string | null;
  dismissBuyPrompt: () => void;
}

export const AppCtx = createContext<AppState | null>(null)
export const useApp = () => useContext(AppCtx)!

const SPEEDS = [0.8, 1, 1.25, 1.5, 1.75, 2]
const SAMPLE_CH = 1
const chapterLocked = (i: number, owned: boolean) => !owned && i >= SAMPLE_CH
const LS_KEY = 'geaudio.state.v1'
const LS_TOKEN = 'geaudio.token'

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

export function AppProvider({ children, startView = 'home' }: AppProviderProps) {
  const saved = useMemo(loadState, [])
  const { mobile, w } = useResponsive()

  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserOut | null>(null)
  const [booksById, setBooksById] = useState<Record<string, Book>>({})
  const [chaptersById, setChaptersById] = useState<Record<string, Chapter[]>>({})
  const [view, setView] = useState(startView)
  const [bookId, setBookId] = useState('salt')
  const [, setHist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])
  const [library, setLibrary] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, number>>(saved?.progress || {})
  const [wishlist, setWishlist] = useState<string[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [sleep, setSleep] = useState<Sleep | null>(null)
  const [search, setSearch] = useState('')
  const [lastOrder, setLastOrder] = useState<string[]>([])
  const [np, setNp] = useState<NowPlaying | null>(saved?.np || null)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [buyPrompt, setBuyPrompt] = useState<string | null>(null)
  const samplePrevPlaying = useRef(false)

  // Refs for use inside setInterval/debounce closures
  const npRef = useRef(np)
  useEffect(() => { npRef.current = np }, [np])
  const libraryRef = useRef(library)
  useEffect(() => { libraryRef.current = library }, [library])
  const authedRef = useRef(authed)
  useEffect(() => { authedRef.current = authed }, [authed])
  const booksByIdRef = useRef(booksById)
  useEffect(() => { booksByIdRef.current = booksById }, [booksById])
  const chaptersByIdRef = useRef(chaptersById)
  useEffect(() => { chaptersByIdRef.current = chaptersById }, [chaptersById])
  const hlsActiveRef = useRef(false)

  // Book lookup helpers — fallback to static seed data
  const getBook = (id: string) => booksById[id] || GE_BOOK_BY_ID[id]
  const getChapters = (id: string) => {
    if (chaptersById[id]) return chaptersById[id]
    const b = booksById[id] || GE_BOOK_BY_ID[id]
    return b ? GE_CHAPTERS(b) : []
  }

  // Persist only playback state and progress (user data comes from API)
  useEffect(() => {
    const data = {
      np: np ? { bookId: np.bookId, chapter: np.chapter, pos: np.pos, speed: np.speed, playing: false } : null,
      progress,
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
  }, [np, progress])

  // Helper: load all user-specific data from API
  const loadUserData = async () => {
    const [cartData, libData, wishData, bmsData, progData] = await Promise.all([
      Api.getCart(),
      Api.getLibrary(),
      Api.getWishlist(),
      Api.getBookmarks(),
      Api.getProgress(),
    ])
    setCart(cartData.items.map(i => i.book_id))
    setLibrary(libData.map(b => b.id))
    setWishlist(wishData.map(b => b.id))
    setBookmarks(bmsData.map(Api.toBookmark))
    const apiProg: Record<string, number> = {}
    progData.forEach(p => { apiProg[p.book_id] = p.position_secs })
    setProgress(prev => ({ ...prev, ...apiProg }))
  }

  // App initialisation
  useEffect(() => {
    const init = async () => {
      // Always load book catalog
      try {
        const list = await Api.getBooks({ limit: 100 })
        const byId: Record<string, Book> = {}
        list.items.forEach(b => { byId[b.id] = Api.toBook(b) })
        if (list.items.length > 0) setBooksById(byId)
      } catch { /* keep GE_BOOK_BY_ID as fallback */ }

      // Restore session if token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem(LS_TOKEN) : null
      if (token) {
        Api.setToken(token)
        try {
          const me = await Api.getMe()
          setUser(me)
          setAuthed(true)
          await loadUserData()
        } catch {
          localStorage.removeItem(LS_TOKEN)
          Api.setToken(null)
        }
      }
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Wire up audio engine callbacks once
  useEffect(() => {
    const engine = getAudioEngine()
    engine.onTimeUpdate = (sec) => {
      setNp(p => {
        if (!p) return p
        const chs = chaptersByIdRef.current[p.bookId] || GE_CHAPTERS(booksByIdRef.current[p.bookId] || GE_BOOK_BY_ID[p.bookId])
        const ch = chs[p.chapter]
        const pos = ch ? ch.start + sec : sec
        if (libraryRef.current.includes(p.bookId)) setProgress(pg => ({ ...pg, [p.bookId]: pos }))
        return { ...p, pos }
      })
    }
    engine.onEnded = () => {
      setNp(p => {
        if (!p) return p
        const chs = chaptersByIdRef.current[p.bookId] || GE_CHAPTERS(booksByIdRef.current[p.bookId] || GE_BOOK_BY_ID[p.bookId])
        const ni = p.chapter + 1
        if (ni >= chs.length) {
          getAudioEngine().pause()
          return { ...p, playing: false }
        }
        return { ...p, chapter: ni, pos: chs[ni]?.start ?? p.pos }
      })
    }
    return () => {
      engine.onTimeUpdate = null
      engine.onEnded = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure chapters are fetched whenever nowPlaying is set (covers the MiniPlayer path
  // where openPlayer is never called, so fetchAndCacheChapters would otherwise never run).
  useEffect(() => {
    if (!np?.bookId || chaptersById[np.bookId]) return
    fetchAndCacheChapters(np.bookId)
  }, [np?.bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load HLS when the book or chapter changes.
  // Chapter 0 (free sample) is always loadable; other chapters require ownership.
  const SAMPLE_CH_IDX = 0
  const currentChapterDbId = np ? chaptersById[np.bookId]?.[np.chapter]?.dbId : undefined
  const isCurrentBookOwned = authed && np ? library.includes(np.bookId) : false
  const isSampleChapter = np?.chapter === SAMPLE_CH_IDX
  useEffect(() => {
    if (!np) return
    if (!isCurrentBookOwned && !isSampleChapter) return
    if (!currentChapterDbId) return
    const { bookId, chapter } = np
    const chs = chaptersByIdRef.current[bookId]
    const ch = chs?.[chapter]
    if (!ch) return
    const chapterRelativePos = Math.max(0, np.pos - ch.start)
    let cancelled = false
    Api.getChapterHLS(bookId, currentChapterDbId).then(m3u8Text => {
      if (cancelled) return
      hlsActiveRef.current = true
      getAudioEngine().load(m3u8Text, chapterRelativePos)
      if (npRef.current?.playing) getAudioEngine().play()
    }).catch((err) => {
      console.error('[AudioEngine] HLS load failed:', err)
      hlsActiveRef.current = false
    })
    return () => { cancelled = true }
  }, [np?.bookId, np?.chapter, isCurrentBookOwned, isSampleChapter, currentChapterDbId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sleep countdown — always ticks while playing (regardless of HLS)
  useEffect(() => {
    if (!np?.playing) return
    const id = setInterval(() => {
      setSleep(s => {
        if (!s || s.remaining == null) return s
        const remaining = s.remaining - 1
        if (remaining <= 0) {
          getAudioEngine().pause()
          setNp(p => p ? { ...p, playing: false } : p)
          return null
        }
        return { ...s, remaining }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [np?.playing])

  // Simulated position timer — fallback when HLS is not active (preview / not signed in)
  useEffect(() => {
    if (!np?.playing) return
    const id = setInterval(() => {
      if (hlsActiveRef.current) return
      setNp(p => {
        if (!p || !p.playing) return p
        const b = booksByIdRef.current[p.bookId] || GE_BOOK_BY_ID[p.bookId]
        if (!b) return p
        let pos = p.pos + p.speed
        let playing = true
        if (pos >= b.secs) { pos = b.secs; playing = false }
        const chs = chaptersByIdRef.current[p.bookId] || GE_CHAPTERS(b)
        let chapter = p.chapter
        for (let i = 0; i < chs.length; i++) if (pos >= chs[i].start) chapter = i
        if (libraryRef.current.includes(p.bookId)) setProgress(pg => ({ ...pg, [p.bookId]: pos }))
        return { ...p, pos, playing, chapter }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [np?.playing, np?.bookId, np?.speed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fire buy prompt the instant a free sample finishes
  useEffect(() => {
    if (!np) { samplePrevPlaying.current = false; return }
    const b = booksByIdRef.current[np.bookId] || GE_BOOK_BY_ID[np.bookId]
    if (!b) return
    const owned = libraryRef.current.includes(np.bookId)
    if (owned) { samplePrevPlaying.current = np.playing; return }
    const chs = chaptersByIdRef.current[np.bookId] || GE_CHAPTERS(b)
    const limit = chs.length > SAMPLE_CH ? (chs[SAMPLE_CH]?.start ?? b.secs) : b.secs
    const justEnded = samplePrevPlaying.current && !np.playing
      && np.pos >= limit - 1 && !chapterLocked(np.chapter, owned)
    if (justEnded) setBuyPrompt(np.bookId)
    samplePrevPlaying.current = np.playing
  }, [np?.playing, np?.pos]) // eslint-disable-line react-hooks/exhaustive-deps

  // Progress sync to API — every 10 seconds while playing
  useEffect(() => {
    if (!authed) return
    const id = setInterval(() => {
      const cur = npRef.current
      if (cur?.playing && libraryRef.current.includes(cur.bookId)) {
        Api.updateProgress(cur.bookId, cur.chapter, cur.pos).catch(() => {})
      }
    }, 10000)
    return () => clearInterval(id)
  }, [authed])

  const nav = (v: string) => { setHist(h => [...h, view]); setView(v); setPlayerOpen(false) }
  const back = () => setHist(h => {
    if (!h.length) { setView('home'); return h }
    const nv = h[h.length - 1]; setView(nv); return h.slice(0, -1)
  })
  const openDetail = (id: string) => { setBookId(id); nav('detail') }

  const startBook = (id: string, chapter?: number) => {
    const b = getBook(id)
    if (!b) return
    const chs = getChapters(id)
    const owned = libraryRef.current.includes(id)
    setNp(p => {
      let pos: number, ch: number
      if (chapter != null) { ch = chapter; pos = chs[chapter]?.start ?? 0 }
      else if (p && p.bookId === id) {
        if (!chapterLocked(p.chapter, owned)) getAudioEngine().play()
        return { ...p, playing: !chapterLocked(p.chapter, owned) }
      }
      else if (progress[id]) {
        pos = progress[id]; ch = 0
        for (let i = 0; i < chs.length; i++) if (pos >= chs[i].start) ch = i
      } else { pos = 0; ch = 0 }
      const locked = chapterLocked(ch, owned)
      return { bookId: id, chapter: ch, pos, playing: !locked, speed: p?.speed || 1 }
    })
  }

  const fetchAndCacheChapters = (id: string) => {
    if (chaptersByIdRef.current[id]) return
    const b = booksByIdRef.current[id] || GE_BOOK_BY_ID[id]
    if (b) setChaptersById(prev => ({ ...prev, [id]: GE_CHAPTERS(b) }))
    Api.getChapters(id).then(chs => {
      setChaptersById(prev => ({ ...prev, [id]: chs.map(Api.toChapter) }))
    }).catch(() => {})
  }

  const openPlayer = (id: string) => { startBook(id); setPlayerOpen(true); fetchAndCacheChapters(id) }
  const openPlayerAt = (id: string, ch: number) => { startBook(id, ch); setPlayerOpen(true); fetchAndCacheChapters(id) }
  const closePlayer = () => setPlayerOpen(false)

  const togglePlay = () => setNp(p => {
    if (!p) return p
    if (chapterLocked(p.chapter, libraryRef.current.includes(p.bookId))) return { ...p, playing: false }
    const willPlay = !p.playing
    if (willPlay) getAudioEngine().play(); else getAudioEngine().pause()
    return { ...p, playing: willPlay }
  })
  const seekRel = (s: number) => setNp(p => {
    if (!p) return p
    const b = getBook(p.bookId)
    if (!b) return p
    const newPos = Math.max(0, Math.min(b.secs, p.pos + s))
    const chs = getChapters(p.bookId)
    let newChapter = p.chapter
    for (let i = 0; i < chs.length; i++) if (newPos >= chs[i].start) newChapter = i
    if (newChapter === p.chapter) {
      const ch = chs[p.chapter]
      if (ch && hlsActiveRef.current) getAudioEngine().seek(newPos - ch.start)
    }
    return { ...p, pos: newPos, chapter: newChapter }
  })
  const seekPct = (pct: number) => setNp(p => {
    if (!p) return p
    const b = getBook(p.bookId)
    if (!b) return p
    const chs = getChapters(p.bookId)
    const pos = (pct / 100) * b.secs
    let ch = 0
    for (let i = 0; i < chs.length; i++) if (pos >= chs[i].start) ch = i
    if (ch === p.chapter) {
      const chapter = chs[p.chapter]
      if (chapter && hlsActiveRef.current) getAudioEngine().seek(pos - chapter.start)
    }
    return { ...p, pos, chapter: ch }
  })
  const skipChapter = (d: number) => setNp(p => {
    if (!p) return p
    const chs = getChapters(p.bookId)
    const owned = libraryRef.current.includes(p.bookId)
    const ni = Math.max(0, Math.min(chs.length - 1, p.chapter + d))
    if (ni === p.chapter) return p
    const locked = chapterLocked(ni, owned)
    if (locked) getAudioEngine().pause()
    return { ...p, chapter: ni, pos: chs[ni]?.start ?? p.pos, playing: locked ? false : p.playing }
  })
  const goChapter = (i: number) => setNp(p => {
    if (!p) return p
    const owned = libraryRef.current.includes(p.bookId)
    const locked = chapterLocked(i, owned)
    const chs = getChapters(p.bookId)
    if (locked) getAudioEngine().pause()
    return { ...p, chapter: i, pos: chs[i]?.start ?? p.pos, playing: !locked }
  })
  const setSpeed = (s: number) => {
    getAudioEngine().setRate(s)
    setNp(p => p ? { ...p, speed: s } : p)
  }
  const cycleSpeed = () => setNp(p => {
    if (!p) return p
    const i = SPEEDS.indexOf(p.speed)
    const s = SPEEDS[(i + 1) % SPEEDS.length]
    getAudioEngine().setRate(s)
    return { ...p, speed: s }
  })

  // Bookmarks
  const addBookmark = useCallback((note?: string) => {
    if (!npRef.current) return
    const cur = npRef.current
    const chs = chaptersByIdRef.current[cur.bookId] || GE_CHAPTERS(booksByIdRef.current[cur.bookId] || GE_BOOK_BY_ID[cur.bookId])
    const ch = chs[cur.chapter] || chs[0]
    const bookmarkNote = note || ch?.title || 'Bookmark'
    setBookmarks(bs => {
      if (bs.some(x => x.bookId === cur.bookId && Math.abs(x.pos - cur.pos) < 2)) return bs
      const optimistic: Bookmark = { id: 'bm' + Date.now(), bookId: cur.bookId, chapter: cur.chapter, pos: cur.pos, note: bookmarkNote, ts: Date.now() }
      if (authedRef.current) {
        Api.addBookmark({ book_id: cur.bookId, chapter_idx: cur.chapter, position_secs: cur.pos, note: bookmarkNote })
          .then(bm => setBookmarks(prev => [Api.toBookmark(bm), ...prev.filter(x => x.id !== optimistic.id)]))
          .catch(() => {})
      }
      return [optimistic, ...bs]
    })
  }, [])

  const removeBookmark = (id: string) => {
    setBookmarks(bs => bs.filter(x => x.id !== id))
    if (authed) Api.deleteBookmark(id).catch(() => {})
  }

  const goBookmark = (bm: Bookmark) => {
    const p = npRef.current
    if (p && p.bookId === bm.bookId && p.chapter === bm.chapter && hlsActiveRef.current) {
      const chs = chaptersByIdRef.current[p.bookId] || GE_CHAPTERS(booksByIdRef.current[p.bookId] || GE_BOOK_BY_ID[p.bookId])
      const ch = chs[bm.chapter]
      if (ch) getAudioEngine().seek(bm.pos - ch.start)
    }
    setNp(() => ({ bookId: bm.bookId, chapter: bm.chapter, pos: bm.pos, playing: true, speed: p?.speed || 1 }))
  }

  // Sleep timer
  const setSleepTimer = (opt: 'off' | 'chapter' | number | null) => {
    if (opt === 'off' || opt == null) { setSleep(null); return }
    if (opt === 'chapter') {
      setNp(p => {
        if (!p) return p
        const chs = chaptersByIdRef.current[p.bookId] || GE_CHAPTERS(booksByIdRef.current[p.bookId] || GE_BOOK_BY_ID[p.bookId])
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

  // Cart
  const addToCart = (id: string) => {
    setCart(c => c.includes(id) ? c : [...c, id])
    if (authed) Api.addToCart(id).catch(() => setCart(c => c.filter(x => x !== id)))
  }
  const removeFromCart = (id: string) => {
    setCart(c => c.filter(x => x !== id))
    if (authed) Api.removeFromCart(id).catch(() => {})
  }
  const inCart = (id: string) => cart.includes(id)
  const isOwned = (id: string) => library.includes(id)

  const toggleWishlist = (id: string) => {
    const inWish = wishlist.includes(id)
    setWishlist(w => inWish ? w.filter(x => x !== id) : [...w, id])
    if (authed) {
      const fn = inWish ? Api.removeFromWishlist : Api.addToWishlist
      fn(id).catch(() => setWishlist(w => inWish ? [...w, id] : w.filter(x => x !== id)))
    }
  }

  const buyNow = (id: string) => {
    setBuyPrompt(null)
    addToCart(id)
    nav('checkout')
  }

  const dismissBuyPrompt = () => setBuyPrompt(null)

  const placeOrder = async (): Promise<void> => {
    const order = await Api.checkout()
    const newIds = order.items.map(i => i.book.id)
    setLibrary(l => [...new Set([...l, ...newIds])])
    setLastOrder(newIds)
    setCart([])
    nav('confirm')
  }

  const premium = user?.is_premium ?? false

  const setPremium = (v: boolean) => {
    setUser(u => u ? { ...u, is_premium: v } : u)
    if (authed) Api.updateMe({ is_premium: v }).then(setUser).catch(() => setUser(u => u ? { ...u, is_premium: !v } : u))
  }

  // Auth
  const signIn = async (email: string, password: string): Promise<void> => {
    const data = await Api.signIn(email, password)
    localStorage.setItem(LS_TOKEN, data.access_token)
    Api.setToken(data.access_token)
    const me = await Api.getMe()
    setUser(me)
    setAuthed(true)
    await loadUserData()
    setView('home')
  }

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
    const data = await Api.signUp(email, password, name)
    localStorage.setItem(LS_TOKEN, data.access_token)
    Api.setToken(data.access_token)
    const me = await Api.getMe()
    setUser(me)
    setAuthed(true)
    await loadUserData()
    setView('home')
  }

  const signOut = () => {
    localStorage.removeItem(LS_TOKEN)
    Api.setToken(null)
    getAudioEngine().pause()
    hlsActiveRef.current = false
    setAuthed(false)
    setUser(null)
    setCart([])
    setLibrary([])
    setWishlist([])
    setBookmarks([])
    setNp(p => p ? { ...p, playing: false } : p)
  }

  const setChapters = (bookId: string, chs: Chapter[]) => {
    setChaptersById(prev => ({ ...prev, [bookId]: chs }))
  }

  const allBooks = Object.keys(booksById).length > 0 ? booksById : GE_BOOK_BY_ID
  const continueBooks = library
    .filter(id => (progress[id] || 0) > 0)
    .map(id => allBooks[id])
    .filter(Boolean)
    .sort((a, b) => (progress[b.id] / b.secs) - (progress[a.id] / a.secs))

  const value: AppState = {
    mobile, w, authed, loading, user, booksById: allBooks, chaptersById, view, bookId, nav, back, openDetail,
    nowPlaying: np, openPlayer, openPlayerAt, closePlayer, playerOpen,
    togglePlay, seekRel, seekPct, skipChapter, goChapter, setSpeed, cycleSpeed,
    bookmarks, addBookmark, removeBookmark, goBookmark,
    sleep, setSleepTimer, cancelSleep,
    cart, addToCart, removeFromCart, inCart, library, isOwned, buyNow, placeOrder, lastOrder,
    wishlist, toggleWishlist, premium, setPremium, search, setSearch,
    progress, continueBooks, signIn, signOut, signUp, setChapters,
    buyPrompt, dismissBuyPrompt,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

