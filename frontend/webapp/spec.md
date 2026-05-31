# geaudiobooks — Frontend Spec

Full reference for the Next.js 16 SPA. Read this before touching any component.

---

## 1. Entry points

| File | Role |
|---|---|
| `app/layout.tsx` | Root HTML shell. Loads four Google Fonts via `next/font/google`. Sets CSS vars on `<html>`. No `<body>` class beyond the font variables — dark background comes from `globals.css`. |
| `app/globals.css` | `@import "tailwindcss"` (v4 syntax). Declares `ge-eq` keyframe, `.ge-scroll` scrollbar hiding, `.ge-card:hover .ge-cardplay` hover reveal, `::selection` colour. Body `background: #0B0B12; overflow: hidden`. |
| `app/page.tsx` | `'use client'` + `dynamic(() => import('./components/App'), { ssr: false })`. The `'use client'` is required — Next.js 16 forbids `ssr: false` in Server Components. `ssr: false` is required because `localStorage` and `window.innerWidth` are read at initialisation. |

---

## 2. Fonts

Loaded in `layout.tsx` via `next/font/google`. Available as CSS custom properties on `<html>`:

| Variable | Font | Weights |
|---|---|---|
| `--font-display` | Space Grotesk | 400 500 600 700 |
| `--font-body` | Manrope | 400 500 600 700 800 |
| `--font-sora` | Sora | 400 500 600 700 800 |
| `--font-outfit` | Outfit | 400 500 600 700 800 |

`T.disp` and `T.body` reference these via `var(--font-display, 'Space Grotesk'), sans-serif`. Sora and Outfit are Tweaks-panel alternatives for the display font only.

---

## 3. Design tokens (`app/components/theme.ts`)

The `T` object is a plain mutable singleton. `Shell` mutates it on every render before children paint to apply Tweaks. **Never read `T` values at module scope or in useMemo — always read in render.**

```ts
T.bg        = '#0B0B12'   // page background
T.bg2       = '#08080E'   // sidebar / mini-player background
T.surface   = '#14141D'   // card backgrounds
T.elev      = '#1B1B27'   // elevated UI (active nav item, pill bg)
T.elev2     = '#22222F'   // double-elevated (speed menu, tweaks btn)
T.line      = 'rgba(255,255,255,0.08)'   // dividers
T.line2     = 'rgba(255,255,255,0.14)'   // stronger borders (inputs, player)
T.accent    = '#8B5CF6'   // primary action colour (violet)
T.accent2   = '#A78BFA'   // lighter accent (progress bars, active state)
T.accentDim = 'rgba(139,92,246,0.16)'   // accent tint backgrounds
T.text      = '#ECECF2'   // primary text
T.mut       = '#9595AA'   // muted text / inactive nav
T.dim       = '#6A6A80'   // secondary / meta text
T.good      = '#34D399'   // success / check marks
T.star      = '#F0B86E'   // star rating colour
T.disp      = "var(--font-display, 'Space Grotesk'), sans-serif"
T.body      = "var(--font-body, 'Manrope'), sans-serif"
T.shadow    = '0 10px 40px rgba(0,0,0,0.45)'
```

Background alternatives (Tweaks):

| Name | `T.bg` | `T.bg2` |
|---|---|---|
| Indigo (default) | `#0B0B12` | `#08080E` |
| True black | `#000000` | `#060608` |
| Slate | `#0E1117` | `#090C11` |

---

## 4. Data model (`app/components/bookdata.ts`)

### `Book`
```ts
interface Book {
  id: string
  title: string
  author: string
  narrator: string
  genre: string          // used for chapter title lookup
  dur: string            // display string e.g. "11h 42m"
  secs: number           // total seconds (source of truth for progress)
  rating: number
  reviews: number
  price: number
  palette: [string, string, string]  // [darkest, mid, accent] — used by BookCover
  motif: 'lines' | 'wave' | 'grid' | 'soft'
  year: number
  tags: string[]         // genre pills on detail page, used for similarity matching
  blurb: string
}
```

The catalog has 12 books. `GE_BOOK_BY_ID` is a pre-built `Record<string, Book>` map.

### `GE_CHAPTERS(book)`
Returns `Chapter[]` — 10 chapters per book, derived from `book.secs`. Chapter titles are genre-specific. Chapter `start` values are cumulative seconds. Chapter `len` has a small per-chapter offset (`(i % 3) * 180s`) so lengths aren't all identical.

```ts
interface Chapter { i: number; title: string; len: number; start: number }
```

### Helper formatters
- `fmt(s)` → `"h:mm:ss"` or `"m:ss"` (omits hours if zero)
- `fmtClock(s)` → `"7h 12m"` or `"45m"` (used in sidebar recents, mini-player)

---

## 5. App state (`app/components/AppContext.tsx`)

Single React Context. Access with `useApp()` inside any component.

### State fields
```ts
authed: boolean
view: string          // 'home' | 'search' | 'detail' | 'cart' | 'checkout' | 'confirm' | 'library' | 'profile' | 'settings'
bookId: string        // id of book currently shown in Detail
library: string[]     // owned book ids
cart: string[]        // cart book ids
wishlist: string[]    // wishlisted book ids
progress: Record<string, number>   // bookId → position in seconds
premium: boolean
search: string        // live search query (synced between TopBar and Search screen)
lastOrder: string[]   // ids from the most recent checkout (shown on Confirm screen)
nowPlaying: NowPlaying | null
playerOpen: boolean
mobile: boolean       // true when window.innerWidth < 760
w: number             // raw window.innerWidth
tweaks: { accent: [string, string]; base: string; displayFont: string }
```

### `NowPlaying`
```ts
interface NowPlaying {
  bookId: string
  chapter: number   // index into GE_CHAPTERS(book)
  pos: number       // current position in seconds
  playing: boolean
  speed: number     // one of [0.8, 1, 1.25, 1.5, 1.75, 2]
}
```

### Navigation actions
| Action | Behaviour |
|---|---|
| `nav(view)` | Push current view onto history stack, set new view, close player |
| `back()` | Pop history stack, restore previous view |
| `openDetail(id)` | Set `bookId`, then `nav('detail')` |

### Player actions
| Action | Behaviour |
|---|---|
| `openPlayer(id)` | `startBook(id)` + `setPlayerOpen(true)` |
| `openPlayerAt(id, chapter)` | Start at specific chapter |
| `closePlayer()` | `setPlayerOpen(false)` (NowPlaying keeps running) |
| `togglePlay()` | Flip `np.playing` |
| `seekRel(s)` | ±seconds, clamped to `[0, book.secs]` |
| `seekPct(pct)` | Seek to percentage of total duration |
| `skipChapter(d)` | ±1 chapter |
| `goChapter(i)` | Jump to chapter `i`, set `playing: true` |
| `cycleSpeed()` | Rotate through `[0.8, 1, 1.25, 1.5, 1.75, 2]` |
| `setSpeed(s)` | Set exact speed |

### Commerce actions
| Action | Behaviour |
|---|---|
| `addToCart(id)` / `removeFromCart(id)` | Mutate `cart` |
| `inCart(id)` | Boolean check |
| `isOwned(id)` | Boolean check against `library` |
| `buyNow(id)` | Add to library, set `lastOrder`, clear from cart, `nav('confirm')` |
| `placeOrder()` | Add all cart items to library, set `lastOrder`, clear cart, `nav('confirm')` |
| `toggleWishlist(id)` | Add or remove from `wishlist` |

### `continueBooks`
Derived field — books from `library` that have `progress[id] > 0`, sorted by highest percentage complete. Shown in Home "Continue listening" row and Library "Listening" tab.

### Persistence
`useEffect` in `AppProvider` writes to `localStorage` key `'geaudio.state.v1'` on every change to `authed, library, progress, wishlist, cart, premium, nowPlaying`. `nowPlaying` is saved with `playing: false` (never resumes playing across sessions). Loaded once on mount via `useMemo(loadState, [])`.

### Playback engine
`useEffect` with `setInterval(1000ms)` in `AppProvider`. Runs only when `np.playing === true`. Advances `pos` by `speed` each tick, auto-stops at `book.secs`, tracks current chapter index, writes progress for owned books.

---

## 6. Responsive layout

Breakpoint: `window.innerWidth < 760` → `mobile: true` via `useResponsive()` hook (resize listener).

**Desktop layout** (inside `Shell`):
```
<div style={{ display: 'flex', height: '100vh' }}>
  <Sidebar />                    // 252px fixed width
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <TopBar />                   // 66px fixed height
    <ScreenComponent />          // flex: 1, scrollable
    <MiniPlayer />               // 84px fixed height (only when nowPlaying)
  </div>
  {playerOpen && <PlayerDesktop />}   // absolute inset: 0, z-index: 50
</div>
```

**Mobile layout**:
```
<div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
  {view === 'home' && <MobileTop />}
  <ScreenComponent />
  <MiniPlayer mobile />          // compact card, above BottomNav
  <BottomNav />                  // 4-tab bar
</div>
{playerOpen && <PlayerMobile />}  // absolute inset: 0, z-index: 50
```

---

## 7. Components

### `BookCover` (`app/components/BookCover.tsx`)
Generates a square typographic cover from `book.palette` and `book.motif`. No external images.

```tsx
<BookCover book={b} w={180} radius={10} style={...} onClick={...} />
```

- `w` is the fixed pixel width (and height — covers are always square).
- Font sizes are computed as proportions of `w` via `fs(multiplier)`.
- Uses `ResizeObserver` to track actual rendered width so font scales correctly when `w` is omitted and the cover is sized by CSS (e.g. `style={{ width: '100%', aspectRatio: '1' }}`).
- Motifs: `lines` (diagonal SVG strokes), `wave` (SVG wave fills), `grid` (SVG dot pattern), `soft` (radial gradient blobs).

### `BookCard` (`Chrome.tsx`)
```tsx
<BookCard b={book} w={158} progress={null} onClick={fn} />
```
- `w` can be a `number` (fixed px) or `"100%"` (grid usage). When `"100%"`, the outer div fills the grid cell and `BookCover` receives no `w` (self-sizes via CSS + ResizeObserver).
- `progress` (0–100) shows a progress bar instead of star/price line when non-null.
- Hover reveals a play button (`.ge-cardplay`) via CSS `.ge-card:hover .ge-cardplay`.

### `Row` (`Chrome.tsx`)
Horizontal scrolling carousel section. Hidden scrollbars via `.ge-scroll`.
```tsx
<Row title="New & trending" books={books} progressMap={map} onShowAll={fn} />
```
`progressMap` is `Record<string, number>` where values are raw seconds (converted to percentage internally).

### Atom components (`Atoms.tsx`)

| Component | Key props |
|---|---|
| `Btn` | `kind: 'primary'｜'light'｜'ghost'｜'soft'`, `size: 'sm'｜'md'｜'lg'`, `icon`, `full` |
| `IconBtn` | `size` (px, default 40), `active` (tints background with `accentDim`) |
| `Pill` | `active` — inverts colours (white bg, dark text) when active |
| `Stars` | `r` (rating value), `s` (icon size), `showNum` (review count) |
| `Screen` | Scrollable flex-1 container with `.ge-scroll` |
| `Scrubber` | Draggable scrub bar. `pct` 0–100, `onSeek(pct)` callback |
| `PageHead` | Title + optional subtitle; sizes differ between mobile/desktop |

### `Sidebar` (`Chrome.tsx`)
Width 252px. Shows Logo, nav items (Home/Search/Your Library), "Jump back in" recents (last 3 library items), and a "Go Premium" upsell card when `!app.premium`.

### `MiniPlayer` (`Chrome.tsx`)
Desktop: 84px bar at bottom of content column. Shows cover, title, narrator, scrubber, transport controls (skip ±15/30s, prev/next chapter, play/pause), speed badge, sleep and chapter-list icon buttons.

Mobile: compact card above `BottomNav`. Shows cover, title, time remaining, play/pause. Progress bar as 2.5px bottom strip.

### `PlayerDesktop` / `PlayerMobile` (`Player.tsx`)
Full-screen overlays (`position: absolute, inset: 0, z-index: 50`). Background is a radial gradient using `book.palette[1]`.

Desktop: 440px cover column on the left, scrollable chapter list on the right, transport bar pinned to bottom (`position: absolute, bottom: 40px`).

Mobile: cover centered, waveform + transport below, speed/sleep/bookmark/list row at very bottom.

### `Waveform` (`Player.tsx`)
Renders 130 bars (desktop) or 50 bars (mobile). Bar height is deterministic from `Math.sin(i * 0.5)`. Bars left of `pct` are coloured `T.accent2`, right are `rgba(255,255,255,0.13)`. Pointer drag supported.

### Equalizer animation
Active chapter shows 4 animated bars (`.ge-eq`) when `playing === true`. Class is defined in `globals.css`:
```css
@keyframes ge-eq { 0%, 100% { height: 5px; } 50% { height: 16px; } }
.ge-eq { animation: ge-eq 0.7s ease-in-out infinite; }
```
**Do not set inline `height` on `.ge-eq` spans** — it overrides the animation. Each bar gets only `width`, `background`, `borderRadius`, and `animationDelay`.

---

## 8. Screens

| View key | Component | File |
|---|---|---|
| `'home'` | `Home` | `Home.tsx` |
| `'search'` | `Search` | `Search.tsx` |
| `'detail'` | `Detail` | `Detail.tsx` |
| `'cart'` | `Cart` | `Commerce.tsx` |
| `'checkout'` | `Checkout` | `Commerce.tsx` |
| `'confirm'` | `Confirm` | `Commerce.tsx` |
| `'library'` | `Library` | `Account.tsx` |
| `'profile'` | `Profile` | `Account.tsx` |
| `'settings'` | `Settings` | `Account.tsx` |

Auth (`Auth.tsx`) is rendered outside the screen router — `Shell` returns `<Auth />` when `!app.authed`.

### Home
- Featured hero: hardcoded to `GE_BOOK_BY_ID['machine']` (The Quiet Machine)
- "Continue listening" row: only shown if `continueBooks.length > 0`
- "New & trending": `['neon', 'ashfall', 'cobalt', 'vermillion', 'hollow', 'glass']`
- "Fresh this year": `GE_BOOKS.filter(b => b.year >= 2025).slice(0, 6)`

### Search
Local state: `q` (query), `genre` (pill filter), `sort` ('Popular'|'Top rated'|'Newest'|'Price'). Filters `GE_BOOKS` array on every render. Input autofocused on desktop. Sort pills not shown on mobile.

### Detail
Tabs: Overview / Chapters / Reviews. Tab state resets to 'Overview' when `bookId` changes.
- Overview: `book.blurb` + tags
- Chapters: clickable list; owned users → `openPlayerAt`; non-owned → `openPlayer`
- Reviews: hardcoded 3 sample reviews + rating breakdown
- "Listeners also enjoyed": books sharing genre or tags, limit 6

### Cart / Checkout / Confirm
Cart shows empty state when `app.cart.length === 0`. Order summary computes: subtotal → −30% Premium discount → +8% tax → total. Checkout has card/PayPal/Apple Pay selector; card fields shown conditionally. Confirm shows `lastOrder` books with play buttons.

### Library
Three tabs: Listening / Owned / Wishlist. Listening tab shows a resume-card list (not a grid). Owned and Wishlist show `BookCard` grids.

### Settings
Premium toggle calls `app.setPremium(!app.premium)`. Sign out calls `app.signOut()` which sets `authed: false`. Other controls are local state only (Toggle, Seg).

---

## 9. CSS conventions

All layout and visual styling uses **inline `style` props**. Tailwind classes are only used in `layout.tsx` for the outer HTML/body wrapper. This is intentional — the design requires pixel-level fidelity to the prototype.

The only CSS classes used in components:
- `.ge-scroll` — apply to any scrollable container to hide scrollbars
- `.ge-card` — apply to `BookCard` outer div to enable `.ge-cardplay` hover reveal
- `.ge-cardplay` — apply to the hover play button inside a `.ge-card`
- `.ge-eq` — apply to equalizer bar `<span>` elements; never set inline `height`

---

## 10. Known patterns and pitfalls

**Theme mutation:** `T` is mutated in `Shell`'s render body before children render. This means all components that read `T` get the tweaked values. Don't cache `T.accent` etc. outside render.

**Player stays mounted when closed:** `closePlayer()` sets `playerOpen: false` but does not stop playback. Music continues playing while navigating. The `MiniPlayer` shows progress and play/pause even when the full player is closed.

**`openPlayer` vs `openPlayerAt`:** Both open the full player. `openPlayer` resumes from saved progress or start. `openPlayerAt` jumps to a specific chapter index.

**BookCover in grid:** Pass `w` as `undefined` (not a string number). Set the size via `style={{ width: '100%', aspectRatio: '1', height: 'auto' }}`. The `ResizeObserver` inside `BookCover` will measure and scale typography correctly.

**Adding a new screen:** Add the component to the `SCREENS` record in `App.tsx`. Add a nav call in whatever component navigates to it. No routing config needed.

**Adding a nav item:** Add an `<Item>` to `Sidebar` (desktop) and `BottomNav` (mobile).
