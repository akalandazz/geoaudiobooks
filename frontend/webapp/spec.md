# geaudiobooks — Frontend Spec

Read before touching any component.

---

## 1. Entry points

| File | Role |
|---|---|
| `app/layout.tsx` | Root HTML shell. Loads 4 fonts via `next/font/google`. Sets CSS vars on `<html>`. |
| `app/globals.css` | `@import "tailwindcss"` (v4). Declares auth-screen classes, `ge-eq`, `ge-viewenter`, `ge-rowin`, `ge-playerin` keyframes, `.ge-scroll`, `.ge-card/.ge-cardplay`. `body { background: #0B0B12; overflow: hidden }`. |
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

`GE_BOOK_BY_ID` and `GE_CHAPTERS(book)` are **fallbacks only** — real data comes from the API. Components read `app.booksById` / `app.chaptersById` and fall back to these when the API hasn't loaded yet.  
`fmt(s)` → `"h:mm:ss"` / `"m:ss"` · `fmtClock(s)` → `"7h 12m"` / `"45m"`

---

## 4. API client (`app/lib/api.ts`)

Typed fetch wrapper around the FastAPI backend (`NEXT_PUBLIC_API_URL`, default `http://localhost:8000`).

- `setToken(t)` / `getToken()` — module-level JWT storage (called by AppContext after sign-in)
- `toBook(BookOut)` → `Book` · `toChapter(ChapterOut)` → `Chapter` · `toBookmark(BookmarkOut)` → `Bookmark`
- `ApiError` — thrown on non-2xx; has `.status: number`
- One exported function per endpoint: `signIn`, `signUp`, `getMe`, `updateMe`, `getBooks`, `getChapters`, `getCart`, `addToCart`, `removeFromCart`, `checkout`, `getLibrary`, `getProgress`, `updateProgress`, `getBookmarks`, `addBookmark`, `deleteBookmark`, `getWishlist`, `addToWishlist`, `removeFromWishlist`

---

## 5. App state (`app/components/AppContext.tsx`)

Access with `useApp()`.

```ts
// Auth / user
authed: boolean; loading: boolean; user: UserOut | null
signIn(email, password): Promise<void>   // throws ApiError on failure
signUp(email, password, name): Promise<void>
signOut(): void

// Book catalog (authoritative from API, falls back to GE_BOOK_BY_ID)
booksById: Record<string, Book>
chaptersById: Record<string, Chapter[]>
setChapters(bookId, chs): void   // Detail component calls this after fetch

// User-specific state (authoritative from API when authed)
library: string[]; cart: string[]; wishlist: string[]
progress: Record<string, number>   // bookId → seconds
bookmarks: Bookmark[]
premium: boolean   // mirrors user.is_premium

// Commerce
addToCart(id): void          // optimistic + API
removeFromCart(id): void     // optimistic + API
placeOrder(): Promise<void>  // throws ApiError on failure
buyNow(id): void             // adds to cart + nav('checkout')
toggleWishlist(id): void     // optimistic + API
inCart(id): boolean; isOwned(id): boolean

// Playback
nowPlaying: NowPlaying | null; playerOpen: boolean
openPlayer(id): void; openPlayerAt(id, chapter): void; closePlayer(): void
togglePlay(); seekRel(s); seekPct(pct); skipChapter(d); goChapter(i); cycleSpeed(); setSpeed(s)

// Bookmarks
addBookmark(note?): void   // optimistic; syncs to API when authed
removeBookmark(id): void
goBookmark(bm): void

// Sleep / misc
sleep: Sleep | null; setSleepTimer(...); cancelSleep()
search: string; setSearch(v): void
lastOrder: string[]; continueBooks: Book[]
mobile: boolean; w: number

interface NowPlaying { bookId: string; chapter: number; pos: number; playing: boolean; speed: number }
interface Bookmark   { id: string; bookId: string; chapter: number; pos: number; note: string; ts: number }
interface Sleep      { mode: 'time'|'chapter'; minutes?: number; remaining: number; total: number }
```

**Init flow:** On mount — fetches `GET /books?limit=100`; if `localStorage 'geaudio.token'` exists, calls `GET /users/me` then loads cart/library/wishlist/bookmarks/progress in parallel. `loading: true` until complete (Shell shows blank dark screen to prevent auth flash).

**Persistence (`localStorage 'geaudio.state.v1'`):** Only `nowPlaying` (with `playing:false`) and `progress`. Cart/library/wishlist/bookmarks are backend-authoritative. JWT stored separately under `'geaudio.token'`.

**Playback engine:** 1s interval when `np.playing`. Advances `pos` by `speed`, updates chapter index, uses `booksById`/`chaptersById` with `GE_*` fallbacks. **Progress sync:** every 10s while playing, `PUT /progress/{bookId}` fires via `setInterval` reading state through refs.

**`continueBooks`** — library books with `progress > 0`, sorted by % complete.

---

## 6. Layout

Breakpoint: `window.innerWidth < 760` → `mobile: true` via `useResponsive()`.

**Desktop:** `Sidebar` (252px) + column of `TopBar` (66px) / screen / `MiniPlayer` (84px). `PlayerDesktop` — `position:absolute, inset:0, z-index:50`.

**Mobile:** `MobileTop` (home only) / screen / `MiniPlayer` compact / `BottomNav`. `PlayerMobile` same overlay.

---

## 7. Components

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

## 8. Screens

| View | Component | File |
|---|---|---|
| `home` | `Home` | `Home.tsx` |
| `search` | `Search` | `Search.tsx` |
| `detail` | `Detail` | `Detail.tsx` |
| `cart`/`checkout`/`confirm` | `Cart`, `Checkout`, `Confirm` | `Commerce.tsx` |
| `library`/`profile`/`settings` | `Library`, `Profile`, `Settings` | `Account.tsx` |

Auth (`Auth.tsx`) outside router — `Shell` returns `<Auth />` when `!app.authed`.

- **Home:** Hero = `app.booksById['machine']` (or top-rated fallback). "Continue" row hidden until `continueBooks.length > 0`.
- **Search:** Calls `GET /books?q=...&genre=...&sort=...&page=...`. 300ms debounce on typing. "Load more" pagination. Falls back to `Object.values(booksById)` if API unreachable.
- **Detail:** Fetches `GET /books/{id}/chapters` on open; caches in `app.chaptersById`. Falls back to `GE_CHAPTERS`. Resets tab to Overview on `bookId` change.
- **Cart:** Subtotal → −30% Premium → +8% tax. `placeOrder()` calls `POST /orders/checkout`.
- **Checkout:** Error state for API failures (e.g. cart empty, all items already owned).
- **Library:** Listening (resume cards) / Owned (grid) / Wishlist (grid). All from API state.
- **Profile:** Shows `app.user.name` / `app.user.email`; hours = sum of `app.progress` values.
- **Settings:** `setPremium` calls `PATCH /users/me { is_premium }`. Sign out button clears token + state.
- Adding a screen: add to `SCREENS` in `App.tsx`. No router config needed.

---

## 9. CSS

All styling is **inline `style` props**. Tailwind classes only in `layout.tsx`.

| Class | Use |
|---|---|
| `.ge-scroll` | Hide scrollbars on scrollable containers |
| `.ge-card` / `.ge-cardplay` | Hover-reveal play button on BookCard |
| `.ge-eq` | Equalizer bars — never set inline `height` |
| `.ge-viewenter` | Wraps each screen in `App.tsx` (keyed by `app.view`); triggers fade-up entrance on every nav change |
| `.ge-viewenter [data-stagger]` | Child rows stagger in with 6 nth-child delay steps (.04–.34s); add `data-stagger` to carousel `Row` wrappers |
| `.ge-playerin` | Applied to both `PlayerDesktop` and `PlayerMobile` root divs; slides the player up from the bottom |

**Auth screen classes** (declared in `globals.css`, used only in `Auth.tsx`):

| Class | Use |
|---|---|
| `.ge-auth` | Root auth wrapper; combined with `.ge-pre` (entrance hidden) and `.ge-shown` (entrance complete — removes transitions) |
| `.ge-base` | Deep-space radial gradient layer |
| `.ge-neb` | Blurred nebula glow blob (absolutely positioned) |
| `.ge-grain` | Film-grain overlay via `radial-gradient` background-image |
| `.ge-particle` | Single floating starfield dot |
| `.ge-parallax` | Any element moved by mouse parallax; reads `data-depth` attribute |
| `.ge-float` / `.ge-floatB` / `.ge-floatC` / `.ge-floatD` | Four floating-bob animation variants (9 s / 12.5 s / 15 s / 11 s periods) |
| `.ge-tilt` | Cover card shell — `transform-style: preserve-3d`; inline `transform` from mouse-move handler |
| `.ge-glass` | Glassmorphism panel — `backdrop-filter: blur(30px)`; `::before` adds inner top glow |
| `.ge-field` | Icon + input row inside the glass panel |
| `.ge-rip` | Ripple DOM node injected by `RippleButton` on click |
| `.ge-rev` | Entry animation base — `opacity`/`transform` transition; combined with `.ge-rev-up` / `.ge-rev-right` / `.ge-rev-card` offset variants |
| `.ge-orbit` | Dashed SVG ellipse path — `stroke-dasharray: 2 9`; `geDash` infinite loop |

`prefers-reduced-motion` disables all keyframe animations and collapses transition durations.

---

## 10. Pitfalls

- **Theme mutation:** `T` mutated in `Shell` render — never cache `T.*` outside render.
- **Player stays mounted when closed:** `closePlayer()` hides UI only; playback continues.
- **`openPlayer` vs `openPlayerAt`:** Both open the player; `openPlayerAt` jumps to a chapter.
- **BookCover in grid:** Omit `w`, use `style={{ width: '100%', aspectRatio: '1' }}`.
- **Book lookup:** Always use `app.booksById[id]` — do not import `GE_BOOK_BY_ID` in components. The seed data in `bookdata.ts` is an AppContext-internal fallback only.
- **Chapters:** `app.chaptersById[bookId]` may be empty until Detail or Player fetches them; the playback engine falls back to `GE_CHAPTERS` silently.
- **`signIn` / `placeOrder` throw:** Both are async and reject with `ApiError` on failure. Catch in the calling component and display the error message.
- **Auth loading:** `app.loading === true` while the JWT is being validated on startup. Shell renders a blank screen during this window — don't add loading spinners elsewhere.
- **No components defined inside components:** Defining a component inside another component's function body gives it a new reference on every render. React treats it as a different type, unmounts the old node, and mounts a fresh one — inputs lose focus after each keystroke. Always define helper components at module scope.
