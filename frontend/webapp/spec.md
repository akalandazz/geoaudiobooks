# geaudiobooks — Frontend Spec

Read before touching any component.

---

## 1. Entry points

| File | Role |
|---|---|
| `app/layout.tsx` | Root HTML shell. Loads 4 fonts via `next/font/google`. Sets CSS vars on `<html>`. |
| `app/globals.css` | `@import "tailwindcss"` (v4). Declares `ge-eq` keyframe, `.ge-scroll`, `.ge-card/.ge-cardplay`. `body { background: #0B0B12; overflow: hidden }`. |
| `app/page.tsx` | `'use client'` + `dynamic(() => import('./components/App'), { ssr: false })`. Both required — Next.js 16 forbids `ssr:false` in Server Components; `localStorage`/`window.innerWidth` read at init. |

---

## 2. Design tokens (`app/components/theme.ts`)

`T` is a mutable singleton — `Shell` mutates it before children render. **Read `T` in render only — never at module scope or in `useMemo`.**

Fonts (CSS vars on `<html>`): `--font-display` Space Grotesk · `--font-body` Manrope · `--font-sora` Sora · `--font-outfit` Outfit (400–800 weights via `next/font/google`).

```ts
T.bg = '#0B0B12'  T.bg2 = '#08080E'  T.surface = '#14141D'
T.elev = '#1B1B27'  T.elev2 = '#22222F'
T.line = 'rgba(255,255,255,0.08)'  T.line2 = 'rgba(255,255,255,0.14)'
T.accent = '#8B5CF6'  T.accent2 = '#A78BFA'  T.accentDim = 'rgba(139,92,246,0.16)'
T.text = '#ECECF2'  T.mut = '#9595AA'  T.dim = '#6A6A80'
T.good = '#34D399'  T.star = '#F0B86E'
T.disp = "var(--font-display, 'Space Grotesk'), sans-serif"
T.body = "var(--font-body, 'Manrope'), sans-serif"
T.shadow = '0 10px 40px rgba(0,0,0,0.45)'
```

---

## 3. Data model (`app/components/bookdata.ts`)

```ts
interface Book {
  id: string; title: string; author: string; narrator: string; genre: string
  dur: string; secs: number; rating: number; reviews: number; price: number
  palette: [string, string, string]  // [darkest, mid, accent]
  motif: 'lines' | 'wave' | 'grid' | 'soft'; year: number; tags: string[]; blurb: string
}
interface Chapter { i: number; title: string; len: number; start: number }
```

12 books. `GE_BOOK_BY_ID` — `Record<string, Book>`. `GE_CHAPTERS(book)` — 10 chapters from `book.secs`.  
`fmt(s)` → `"h:mm:ss"` / `"m:ss"` · `fmtClock(s)` → `"7h 12m"` / `"45m"`

---

## 4. App state (`app/components/AppContext.tsx`)

Access with `useApp()`.

```ts
authed: boolean; view: string; bookId: string
library: string[]; cart: string[]; wishlist: string[]
progress: Record<string, number>   // bookId → seconds
premium: boolean; search: string; lastOrder: string[]
nowPlaying: NowPlaying | null; playerOpen: boolean
bookmarks: Bookmark[]; sleep: Sleep | null
mobile: boolean; w: number
tweaks: { accent: [string, string]; base: string; displayFont: string }

interface NowPlaying { bookId: string; chapter: number; pos: number; playing: boolean; speed: number }
// speed cycles: [0.8, 1, 1.25, 1.5, 1.75, 2]
interface Bookmark { id: string; bookId: string; chapter: number; pos: number; note: string; ts: number }
interface Sleep { mode: 'time' | 'chapter'; minutes?: number; remaining: number; total: number }
```

**Navigation:** `nav(view)` pushes history · `back()` pops · `openDetail(id)` sets bookId + nav

**Player:** `openPlayer(id)` · `openPlayerAt(id, chapter)` · `closePlayer()` · `togglePlay()` · `seekRel(s)` · `seekPct(pct)` · `skipChapter(d)` · `goChapter(i)` · `cycleSpeed()` · `setSpeed(s)`

**Bookmarks:** `addBookmark(note?)` (no-op within 2s of existing) · `removeBookmark(id)` · `goBookmark(bm)`

**Sleep:** `setSleepTimer('off'|null|'chapter'|minutes)` · `cancelSleep()`

**Commerce:** `addToCart(id)` · `removeFromCart(id)` · `inCart(id)` · `isOwned(id)` · `buyNow(id)` · `placeOrder()` · `toggleWishlist(id)`

**`continueBooks`** — library books with `progress > 0`, sorted by % complete.

**Persistence:** `localStorage 'geaudio.state.v1'`. `nowPlaying` saved with `playing: false`. `sleep` not persisted.

**Playback engine:** 1s interval when `np.playing`. Advances `pos` by `speed`, updates chapter index, decrements `sleep.remaining` (stops + clears at 0).

---

## 5. Layout

Breakpoint: `window.innerWidth < 760` → `mobile: true` via `useResponsive()`.

**Desktop:** `Sidebar` (252px) + column of `TopBar` (66px) / screen / `MiniPlayer` (84px). `PlayerDesktop` — `position:absolute, inset:0, z-index:50`.

**Mobile:** `MobileTop` (home only) / screen / `MiniPlayer` compact / `BottomNav`. `PlayerMobile` same overlay.

---

## 6. Components

**`BookCover`** — typographic cover from `palette` + `motif`. Omit `w` for CSS sizing (ResizeObserver scales fonts).
```tsx
<BookCover book={b} w={180} radius={10} />
```

**`BookCard`** (`Chrome.tsx`) — `w`: number or `"100%"`. Non-null `progress` (0–100) replaces star/price line.

**`Row`** (`Chrome.tsx`) — horizontal carousel. `progressMap` values are raw seconds.

**Atoms** (`Atoms.tsx`):

| Component | Key props |
|---|---|
| `Btn` | `kind: 'primary'｜'light'｜'ghost'｜'soft'`, `size: 'sm'｜'md'｜'lg'`, `icon`, `full` |
| `IconBtn` | `size` px, `active` (accentDim tint) |
| `Pill` | `active` inverts colours |
| `Stars` | `r`, `s` (icon size), `showNum` |
| `Scrubber` | `pct` 0–100, `onSeek(pct)` |
| `Screen` | Scrollable flex-1 + `.ge-scroll` |
| `PageHead` | Title + optional subtitle |

**`SleepControl`** — popover: Off/15/30/45/60min/End of chapter. Expands with countdown when active. `dir="up"|"down"`.

**`Waveform`** — 130 bars (desktop) / 50 (mobile). Bars left of `pct` = `T.accent2`. Pointer drag supported.

**Equalizer (`.ge-eq` spans):** Never set inline `height` — overrides animation. Only `width`, `background`, `borderRadius`, `animationDelay`.

**`useFlash`:** `const [node, showFlash] = useFlash()` — toast, auto-dismisses after 1600ms.

---

## 7. Screens

| View | Component | File |
|---|---|---|
| `home` | `Home` | `Home.tsx` |
| `search` | `Search` | `Search.tsx` |
| `detail` | `Detail` | `Detail.tsx` |
| `cart`/`checkout`/`confirm` | `Cart`, `Checkout`, `Confirm` | `Commerce.tsx` |
| `library`/`profile`/`settings` | `Library`, `Profile`, `Settings` | `Account.tsx` |

Auth (`Auth.tsx`) outside router — `Shell` returns `<Auth />` when `!app.authed`.

- **Home:** Hero = `GE_BOOK_BY_ID['machine']`. "Continue" row hidden until `continueBooks.length > 0`.
- **Search:** Filters on `q`, `genre` pill, `sort`. Sort pills hidden mobile.
- **Detail:** Overview / Chapters / Reviews tabs. Resets to Overview on `bookId` change.
- **Cart:** Subtotal → −30% Premium → +8% tax.
- **Library:** Listening (resume cards) / Owned (grid) / Wishlist (grid).
- **Settings:** `setPremium` toggle · `signOut()` → `authed: false`.
- Adding a screen: add to `SCREENS` in `App.tsx`. No router config needed.

---

## 8. CSS

All styling is **inline `style` props**. Tailwind classes only in `layout.tsx`.

| Class | Use |
|---|---|
| `.ge-scroll` | Hide scrollbars on scrollable containers |
| `.ge-card` / `.ge-cardplay` | Hover-reveal play button on BookCard |
| `.ge-eq` | Equalizer bars — never set inline `height` |

---

## 9. Pitfalls

- **Theme mutation:** `T` mutated in `Shell` render — never cache `T.*` outside render.
- **Player stays mounted when closed:** `closePlayer()` hides UI only; playback continues.
- **`openPlayer` vs `openPlayerAt`:** Both open the player; `openPlayerAt` jumps to a chapter.
- **BookCover in grid:** Omit `w`, use `style={{ width: '100%', aspectRatio: '1' }}`.
