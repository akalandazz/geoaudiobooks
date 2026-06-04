---
name: frontend-recurring-patterns
description: Recurring readability and code-quality patterns found across the geoaudiobooks frontend codebase
metadata:
  type: project
---

Codebase-wide patterns observed during the first full frontend read (2026-06-03).

**Why:** Establishes a baseline so future review sessions do not re-flag known issues or re-discover known conventions.

**How to apply:** Use these observations to calibrate what is a real issue vs. intentional convention when reviewing frontend files.

## Established conventions (do not flag as issues)
- All styling uses inline `style` props — Tailwind utility classes are not used in JSX (this is intentional per spec).
- Single-page routing via `view` string state in `AppContext`, not the Next.js router.
- `mob` (short for `mobile`) is a widely-used local alias for `app.mobile` — consistent across files; acceptable abbreviation.
- `T` is the imported theme object (from `./theme`) — single-letter import is a deliberate convention.
- `np` for `nowPlaying` in `AppContext.tsx` is the canonical state variable name; components alias it as `const np = app.nowPlaying`.
- `b` as a local alias for the current `Book` object inside component scopes is pervasive and consistent.
- `fmt` / `fmtClock` are utility formatters from `bookdata` — short names acceptable.
- `GE_` prefix on seed-data constants (`GE_BOOK_BY_ID`, `GE_CHAPTERS`, etc.) is intentional namespace prefix.

## Recurring readability anti-patterns found
1. **Single-letter loop variable shadowing**: `books.sort((a, b) => ...)` where `b` also refers to the current Book in outer scope (Home.tsx, Search.tsx). Causes silent shadowing.
2. **`SAMPLE_CH` re-declared in multiple files** (`Player.tsx` line 11, `MiniPlayer` inside `Chrome.tsx` line 378, `Detail.tsx` line 11, `AppContext.tsx` line 96). Should be a shared constant imported from one place.
3. **Magic numbers in inline styles**: pixel values like `0.62`, `0.52`, multiplier ratios in `BookCover.tsx`, ripple animation duration `650` in `Auth.tsx`, flash timeout `1600` in `Player.tsx` — all should be named.
4. **`get`-prefixed helpers defined inside render scope**: `getBook` and `getChapters` in `AppContext.tsx` are plain functions recreated each render (not `useCallback`) and are called inside other callbacks/effects, making dependency tracking opaque.
5. **Over-compressed boolean expressions** in `AppContext.tsx`: e.g. `togglePlay`, `skipChapter`, `goChapter` inline `chapterLocked` checks without intermediate named booleans.
6. **Prop name `b`** passed to `BookCard` and `BookMeta` — cryptic at call sites; caller must already know it means `Book`.
7. **`t1`, `t2`, `t3`** toggle state in `Account.tsx > Settings` — completely opaque names.
8. **`k` and `v`** prop names on `OrderLine` in `Commerce.tsx` — should be `label` / `value`.
9. **Inline component definitions inside parent component render** (`Item` inside `Sidebar` and `BottomNav` in `Chrome.tsx`) — recreated on every render and not hoistable.
10. **`chapterRelativePos`** well-named but the pattern of computing `pos - ch.start` is repeated 5+ times across files without a shared helper.
