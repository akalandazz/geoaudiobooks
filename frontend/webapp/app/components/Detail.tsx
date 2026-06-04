'use client'

import React, { useState, useEffect } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { Btn, IconBtn, Stars, Screen } from './Atoms'
import { Row } from './Chrome'
import { GE_CHAPTERS, fmt, Chapter, Book } from './bookdata'

const SAMPLE_CH = 1
import { useApp } from './AppContext'
import * as Api from '../lib/api'

interface BookMetaProps {
  b: Book; chapters: Chapter[]; owned: boolean; inCart: boolean; mob: boolean;
  onPlay: () => void; onBuy: () => void; onCart: () => void; onWishlist: () => void;
  inWishlist: boolean; progress: number; onSample: () => void;
}

function BookMeta({ b, chapters, owned, inCart, mob, onPlay, onBuy, onCart, onWishlist, inWishlist, progress, onSample }: BookMetaProps) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent2 }}>{b.genre}</div>
      <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 30 : 44, letterSpacing: '-0.025em', lineHeight: 1.04, margin: '10px 0 8px', color: T.text }}>{b.title}</div>
      <div style={{ fontSize: mob ? 15 : 17, color: T.mut }}>by <span style={{ color: T.text, fontWeight: 600 }}>{b.author}</span></div>
      <div style={{ fontSize: 14, color: T.dim, marginTop: 4 }}>Narrated by {b.narrator}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
        <Stars r={b.rating} s={15} showNum={b.reviews} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: T.mut }}><GEIcon.speed s={15} />{b.dur}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: T.mut }}><GEIcon.list s={15} />{chapters.length} chapters</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {owned ? (
          <Btn kind="primary" size="lg" icon={<GEIcon.play s={17} />} onClick={onPlay}>
            {progress ? 'Continue' : 'Start listening'}
          </Btn>
        ) : (
          <>
            <Btn kind="light" size="lg" onClick={onBuy}>Buy now · ${b.price}</Btn>
            <Btn kind="soft" size="lg" icon={<GEIcon.cart s={17} />} onClick={onCart}>
              {inCart ? 'In cart' : 'Add to cart'}
            </Btn>
          </>
        )}
        <IconBtn size={48} onClick={onWishlist} style={{ border: '1px solid ' + T.line2 }}>
          {inWishlist ? <GEIcon.heartFill s={20} style={{ color: T.accent2 }} /> : <GEIcon.heart s={20} />}
        </IconBtn>
        <Btn kind="ghost" size="lg" icon={<GEIcon.play s={15} />} onClick={onSample}>Sample</Btn>
      </div>
      {!owned && (
        <div style={{ marginTop: 14, fontSize: 13, color: T.dim, display: 'flex', alignItems: 'center', gap: 7 }}>
          <GEIcon.check s={15} style={{ color: T.good }} />Included with Premium membership
        </div>
      )}
    </div>
  )
}

export function Detail() {
  const app = useApp()
  const b = app.booksById[app.bookId]
  const [tabState, setTabState] = useState({ bookId: app.bookId, tab: 'Overview' })
  const tab = tabState.bookId === app.bookId ? tabState.tab : 'Overview'
  const setTab = (t: string) => setTabState({ bookId: app.bookId, tab: t })

  // Fetch real chapters from API and cache them in AppContext
  useEffect(() => {
    if (!b || app.chaptersById[b.id]) return
    Api.getChapters(b.id)
      .then(chs => { app.setChapters(b.id, chs.map(Api.toChapter)) })
      .catch(() => { /* keep GE_CHAPTERS fallback */ })
  }, [app.bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!b) return null

  // Chapters: use cached API data or fall back to generated
  const chapters = app.chaptersById[b.id] || GE_CHAPTERS(b)

  const owned = app.isOwned(b.id)
  const inCart = app.inCart(b.id)
  const similar = Object.values(app.booksById)
    .filter(x => x.id !== b.id && (x.genre === b.genre || x.tags.some(t => b.tags.includes(t))))
    .slice(0, 6)
  const mob = app.mobile

  return (
    <Screen style={{ padding: mob ? '4px 0 12px' : '0' }}>
      <div style={{ padding: mob ? '0 20px' : '24px 40px 0' }}>
        <div onClick={() => app.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.mut, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 22 }}>
          <GEIcon.chevR s={16} style={{ transform: 'rotate(180deg)' }} />Back
        </div>
        <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', gap: mob ? 22 : 44, alignItems: mob ? 'center' : 'flex-start' }}>
          <BookCover book={b} w={mob ? 220 : 300} radius={16} style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.55)', flexShrink: 0 }} />
          <BookMeta
            b={b} chapters={chapters} owned={owned} inCart={inCart} mob={mob}
            onPlay={() => app.openPlayer(b.id)}
            onBuy={() => app.buyNow(b.id)}
            onCart={() => inCart ? app.nav('cart') : app.addToCart(b.id)}
            onWishlist={() => app.toggleWishlist(b.id)}
            inWishlist={app.wishlist.includes(b.id)}
            progress={app.progress[b.id] || 0}
            onSample={() => app.openPlayer(b.id)}
          />
        </div>

        {/* tabs */}
        <div style={{ display: 'flex', gap: 28, borderBottom: '1px solid ' + T.line, marginTop: 40 }}>
          {['Overview', 'Chapters', 'Reviews'].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ padding: '0 0 14px', cursor: 'pointer', fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: tab === t ? T.text : T.mut, borderBottom: '2px solid ' + (tab === t ? T.accent : 'transparent'), marginBottom: -1 }}>{t}</div>
          ))}
        </div>

        <div style={{ padding: '24px 0 8px', maxWidth: 760 }}>
          {tab === 'Overview' && (
            <div>
              <p style={{ fontFamily: T.body, fontSize: mob ? 15 : 16.5, lineHeight: 1.7, color: '#C9C9D6', margin: 0 }}>{b.blurb}</p>
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 22 }}>
                {b.tags.map(tag => (
                  <span key={tag} style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid ' + T.line, color: T.mut, fontSize: 13, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          {tab === 'Chapters' && (
            <div>
              {!owned && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: T.surface, border: '1px solid ' + T.line, borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GEIcon.lock s={20} style={{ color: T.accent2 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 15.5, color: T.text }}>Chapter 1 is a free sample</div>
                    <div style={{ fontSize: 13.5, color: T.mut, marginTop: 3, lineHeight: 1.5 }}>Buy the audiobook to unlock all {chapters.length} chapters.</div>
                  </div>
                  <Btn kind="primary" onClick={() => app.buyNow(b.id)}>Buy now · ${b.price}</Btn>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {chapters.map(c => {
                  const locked = !owned && c.i >= SAMPLE_CH
                  return (
                    <div key={c.i}
                      onClick={() => locked ? app.buyNow(b.id) : app.openPlayerAt(b.id, c.i)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', opacity: locked ? 0.5 : 1 }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = T.surface}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                      <span style={{ width: 22, fontVariantNumeric: 'tabular-nums', fontSize: 13, color: T.dim, fontWeight: 700 }}>{c.i === 0 ? '–' : c.i}</span>
                      {locked
                        ? <GEIcon.lock s={14} style={{ color: T.dim, width: 16 }} />
                        : <GEIcon.play s={14} style={{ color: T.mut, width: 16 }} />
                      }
                      <span style={{ flex: 1, fontSize: 14.5, color: T.text, fontWeight: 500 }}>{c.title}</span>
                      {!owned && c.i < SAMPLE_CH && (
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: T.disp, color: T.good, background: 'rgba(52,211,153,0.13)', padding: '2px 9px', borderRadius: 99 }}>Sample</span>
                      )}
                      <span style={{ fontSize: 13, color: T.dim, fontVariantNumeric: 'tabular-nums' }}>{fmt(c.len)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {tab === 'Reviews' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 22, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 48, lineHeight: 1, color: T.text }}>{b.rating}</div>
                  <div style={{ marginTop: 6 }}><Stars r="" s={14} /></div>
                  <div style={{ fontSize: 12.5, color: T.dim, marginTop: 6 }}>{b.reviews.toLocaleString()} reviews</div>
                </div>
                <div style={{ flex: 1, minWidth: 220 }}>
                  {[5, 4, 3, 2, 1].map(n => {
                    const w = [72, 19, 6, 2, 1][5 - n]
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: T.dim, width: 10 }}>{n}</span>
                        <div style={{ flex: 1, height: 6, background: T.elev, borderRadius: 3 }}>
                          <div style={{ width: w + '%', height: '100%', background: T.star, borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              {[
                ['Imani R.', 5, 'The narration is hypnotic — I missed my subway stop twice. Worth every minute of the runtime.'],
                ['Marcus T.', 4, 'A slow burn that pays off. Production quality is genuinely cinematic, especially the ambient sound design.'],
                ['Priya S.', 5, 'Couldn\'t stop listening. The kind of story you immediately want to start again.'],
              ].map(([name, r, txt], i) => (
                <div key={i} style={{ padding: '16px 0', borderTop: '1px solid ' + T.line }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 16, background: T.elev2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.disp, fontWeight: 700, fontSize: 13, color: T.accent2 }}>{(name as string)[0]}</div>
                    <span style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 14, color: T.text }}>{name as string}</span>
                    <span style={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
                      {Array.from({ length: 5 }).map((_, k) => <GEIcon.star key={k} s={13} style={{ color: k < (r as number) ? T.star : T.elev2 }} />)}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: '#B8B8C8' }}>{txt as string}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <Row title="Listeners also enjoyed" books={similar} onShowAll={() => app.nav('search')} />
        </div>
      </div>
    </Screen>
  )
}
