'use client'

import React, { useState } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'
import { BookCover } from './BookCover'
import { Btn, Stars, Screen } from './Atoms'
import { GE_BOOK_BY_ID, Book } from './bookdata'
import { useApp } from './AppContext'

const money = (n: number) => '$' + n.toFixed(2)

function OrderLine({ k, v, big, good, dim }: { k: string; v: string; big?: boolean; good?: boolean; dim?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: big ? 0 : '0 0 10px' }}>
      <span style={{ fontFamily: big ? T.disp : T.body, fontSize: big ? 17 : 14, fontWeight: big ? 700 : 500, color: big ? T.text : (dim ? T.dim : T.mut) }}>{k}</span>
      <span style={{ fontFamily: T.disp, fontSize: big ? 22 : 14.5, fontWeight: 700, color: good ? T.good : T.text, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  )
}

function OrderSummary({ items, premium, cta, onCta, note }: { items: Book[]; premium: boolean; cta: string; onCta: () => void; note?: string }) {
  const subtotal = items.reduce((s, b) => s + b.price, 0)
  const discount = premium ? subtotal * 0.3 : 0
  const total = subtotal - discount
  return (
    <div style={{ background: T.surface, border: '1px solid ' + T.line, borderRadius: 16, padding: 24, alignSelf: 'flex-start' }}>
      <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 16 }}>Order summary</div>
      <OrderLine k={`Subtotal (${items.length} ${items.length === 1 ? 'item' : 'items'})`} v={money(subtotal)} />
      {premium && <OrderLine k="Premium member −30%" v={'−' + money(discount)} good />}
      <OrderLine k="Estimated tax" v={money(total * 0.08)} dim />
      <div style={{ height: 1, background: T.line, margin: '14px 0' }} />
      <OrderLine k="Total" v={money(total * 1.08)} big />
      <div style={{ marginTop: 18 }}><Btn kind="primary" size="lg" full onClick={onCta}>{cta}</Btn></div>
      {note && <div style={{ marginTop: 14, fontSize: 12.5, color: T.dim, textAlign: 'center', lineHeight: 1.5 }}>{note}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

// ── CART ──
export function Cart() {
  const app = useApp()
  const items = app.cart.map(id => GE_BOOK_BY_ID[id]).filter(Boolean)
  const mob = app.mobile

  if (items.length === 0) {
    return (
      <Screen style={{ padding: mob ? '20px' : '40px' }}>
        <div style={{ marginBottom: mob ? 18 : 26 }}>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 24 : 32, color: T.text, letterSpacing: '-0.02em' }}>Your cart</span>
        </div>
        <div style={{ textAlign: 'center', padding: '80px 0', color: T.dim }}>
          <GEIcon.cart s={48} style={{ color: T.elev2, marginBottom: 16 }} />
          <div style={{ fontFamily: T.disp, fontSize: 20, color: T.mut }}>Your cart is empty</div>
          <div style={{ fontSize: 14.5, marginTop: 6, marginBottom: 22 }}>Browse the catalog and add a few listens.</div>
          <Btn kind="primary" onClick={() => app.nav('home')}>Explore audiobooks</Btn>
        </div>
      </Screen>
    )
  }

  return (
    <Screen style={{ padding: mob ? '4px 20px 20px' : '24px 40px 40px' }}>
      <div style={{ marginBottom: mob ? 18 : 26 }}>
        <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 24 : 32, color: T.text, letterSpacing: '-0.02em' }}>Your cart</span>
        <span style={{ fontSize: mob ? 14 : 15, color: T.mut, marginLeft: mob ? 10 : 12 }}>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, width: mob ? '100%' : 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(b => (
            <div key={b.id} style={{ display: 'flex', gap: 16, background: T.surface, border: '1px solid ' + T.line, borderRadius: 14, padding: 14 }}>
              <BookCover book={b} w={mob ? 76 : 96} radius={10} onClick={() => app.openDetail(b.id)} />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 16 : 18, color: T.text }}>{b.title}</div>
                <div style={{ fontSize: 13.5, color: T.mut, marginTop: 3 }}>{b.author} · {b.narrator}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.dim, marginTop: 6 }}>
                  <Stars r={b.rating} s={13} /> · {b.dur}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <span onClick={() => app.removeFromCart(b.id)} style={{ fontSize: 13, fontWeight: 700, color: T.mut, cursor: 'pointer', fontFamily: T.body }}>Remove</span>
                </div>
              </div>
              <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 17 : 19, color: T.text }}>{money(b.price)}</div>
            </div>
          ))}
        </div>
        <div style={{ width: mob ? '100%' : 340, flexShrink: 0 }}>
          <OrderSummary items={items} premium={app.premium} cta="Checkout" onCta={() => app.nav('checkout')} note="Secure checkout · 30-day money-back guarantee" />
        </div>
      </div>
    </Screen>
  )
}

// ── CHECKOUT ──
export function Checkout() {
  const app = useApp()
  const items = app.cart.map(id => GE_BOOK_BY_ID[id]).filter(Boolean)
  const mob = app.mobile
  const [pay, setPay] = useState('card')

  const Field = ({ label, ph, w, val }: { label: string; ph: string; w?: string; val?: string }) => (
    <label style={{ display: 'block', flex: w || '1 1 100%' }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.mut, marginBottom: 7, fontFamily: T.body }}>{label}</span>
      <input defaultValue={val} placeholder={ph} style={{ width: '100%', background: T.bg2, border: '1px solid ' + T.line2, borderRadius: 10, padding: '12px 14px', color: T.text, fontFamily: T.body, fontSize: 14.5, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.target.style.borderColor = T.accent)} onBlur={e => (e.target.style.borderColor = T.line2)} />
    </label>
  )

  return (
    <Screen style={{ padding: mob ? '4px 20px 20px' : '24px 40px 40px' }}>
      <div onClick={() => app.nav('cart')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.mut, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 18 }}>
        <GEIcon.chevR s={16} style={{ transform: 'rotate(180deg)' }} />Back to cart
      </div>
      <div style={{ marginBottom: mob ? 18 : 26 }}>
        <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 24 : 32, color: T.text, letterSpacing: '-0.02em' }}>Checkout</span>
      </div>
      <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, width: mob ? '100%' : 'auto' }}>
          <Section title="Payment method">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['card', 'Card'], ['paypal', 'PayPal'], ['apple', 'Apple Pay']].map(([k, l]) => (
                <div key={k} onClick={() => setPay(k)} style={{ flex: '1 1 120px', padding: '14px', borderRadius: 12, border: '1.5px solid ' + (pay === k ? T.accent : T.line2), background: pay === k ? T.accentDim : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 9, border: '2px solid ' + (pay === k ? T.accent : T.dim), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pay === k && <span style={{ width: 8, height: 8, borderRadius: 4, background: T.accent }} />}
                  </span>
                  <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 14.5, color: T.text }}>{l}</span>
                </div>
              ))}
            </div>
          </Section>
          {pay === 'card' && (
            <Section title="Card details">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <Field label="Cardholder name" ph="Jordan Avery" />
                <Field label="Card number" ph="4242 4242 4242 4242" />
                <Field label="Expiry" ph="MM / YY" w="1 1 120px" />
                <Field label="CVC" ph="123" w="1 1 120px" />
              </div>
            </Section>
          )}
          <Section title="Billing email">
            <Field label="Email" ph="you@example.com" val="jordan.avery@example.com" />
          </Section>
        </div>
        <div style={{ width: mob ? '100%' : 360, flexShrink: 0 }}>
          <div style={{ background: T.surface, border: '1px solid ' + T.line, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 14 }}>{items.length} {items.length === 1 ? 'item' : 'items'}</div>
            {items.map(b => (
              <div key={b.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <BookCover book={b} w={44} radius={7} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 13.5, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: T.mut }}>{b.author}</div>
                </div>
                <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 14, color: T.text }}>{money(b.price)}</span>
              </div>
            ))}
          </div>
          <OrderSummary items={items} premium={app.premium} cta="Place order" onCta={() => app.placeOrder()} note="By placing this order you agree to the Terms. Files are yours to keep forever." />
        </div>
      </div>
    </Screen>
  )
}

// ── CONFIRM ──
export function Confirm() {
  const app = useApp()
  const items = app.lastOrder.map(id => GE_BOOK_BY_ID[id]).filter(Boolean)
  const mob = app.mobile
  return (
    <Screen style={{ padding: mob ? '20px' : '40px' }}>
      <div style={{ maxWidth: 560, margin: '20px auto 0', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'rgba(52,211,153,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <GEIcon.check s={36} style={{ color: T.good }} />
        </div>
        <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 28 : 34, letterSpacing: '-0.02em', color: T.text }}>You&apos;re all set</div>
        <div style={{ fontSize: 15.5, color: T.mut, marginTop: 10, lineHeight: 1.6 }}>
          {items.length} {items.length === 1 ? 'audiobook is' : 'audiobooks are'} now in your library. A receipt is on its way to your email.
        </div>
        <div style={{ background: T.surface, border: '1px solid ' + T.line, borderRadius: 16, padding: 18, margin: '28px 0', textAlign: 'left' }}>
          {items.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 0', borderTop: i ? '1px solid ' + T.line : 'none' }}>
              <BookCover book={b} w={52} radius={8} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.disp, fontWeight: 600, fontSize: 15, color: T.text }}>{b.title}</div>
                <div style={{ fontSize: 13, color: T.mut }}>{b.author} · {b.dur}</div>
              </div>
              <Btn kind="soft" size="sm" icon={<GEIcon.play s={14} />} onClick={() => app.openPlayer(b.id)}>Play</Btn>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn kind="primary" size="lg" onClick={() => app.nav('library')}>Go to library</Btn>
          <Btn kind="ghost" size="lg" onClick={() => app.nav('home')}>Keep browsing</Btn>
        </div>
      </div>
    </Screen>
  )
}
