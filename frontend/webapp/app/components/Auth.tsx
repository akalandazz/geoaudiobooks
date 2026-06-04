'use client'

import React, { useState, useRef, useEffect } from 'react'
import { T } from './theme'
import { useApp } from './AppContext'
import * as Api from '../lib/api'

type AuthMode = 'signin' | 'signup' | 'forgot'

const SERIF = "'Spectral', Georgia, 'Times New Roman', serif"

const glow = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// ── Inline SVG icon helpers ──
const Svg = (
  props: { s?: number; sw?: number; style?: React.CSSProperties },
  kids: React.ReactNode,
) => (
  <svg
    width={props.s || 18}
    height={props.s || 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.sw || 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={props.style}
  >
    {kids}
  </svg>
)

const Ico = {
  mail: (p: { s?: number }) =>
    Svg(p, (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m3.5 7.5 8.5 6 8.5-6" />
      </>
    )),
  lock: (p: { s?: number }) =>
    Svg(p, (
      <>
        <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </>
    )),
  eye: (p: { s?: number }) =>
    Svg(p, (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )),
  eyeOff: (p: { s?: number }) =>
    Svg(p, (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.1A10.6 10.6 0 0 1 12 6c6.4 0 10 6 10 6a18.5 18.5 0 0 1-3.1 3.7M6.5 6.6A18.6 18.6 0 0 0 2 12s3.6 7 10 7a10.5 10.5 0 0 0 3.9-.75" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    )),
  arrow: (p: { s?: number }) =>
    Svg(p, (
      <>
        <path d="M4 12h15" />
        <path d="m13 6 6 6-6 6" />
      </>
    )),
  person: (p: { s?: number }) =>
    Svg(p, (
      <>
        <circle cx="12" cy="8.5" r="3.7" />
        <path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" />
      </>
    )),
  book: (p: { s?: number; sw?: number }) =>
    Svg(p, (
      <>
        <path d="M12 6.6C10.4 5.1 7.9 4.6 4 4.6v13c3.9 0 6.4.5 8 2 1.6-1.5 4.1-2 8-2v-13c-3.9 0-6.4.5-8 2Z" />
        <path d="M12 6.6v13" />
      </>
    )),
}

// ── Nebula glows ──
function Nebula() {
  const blobs = [
    { c: glow(T.accent, 0.42), w: 520, top: '14%', left: '46%', anim: 'geNeb1 26s', depth: 5 },
    { c: 'rgba(124,58,237,0.34)', w: 460, top: '40%', left: '30%', anim: 'geNeb2 31s', depth: 3 },
    { c: 'rgba(236,72,160,0.22)', w: 360, top: '56%', left: '54%', anim: 'geNeb1 23s', depth: 7 },
    { c: glow(T.accent2, 0.26), w: 300, top: '4%', left: '60%', anim: 'geNeb2 21s', depth: 4 },
  ]
  return (
    <div className="ge-rev" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transitionDelay: '120ms' }}>
      {blobs.map((o, i) => (
        <div key={i} className="ge-parallax" data-depth={o.depth}
          style={{ position: 'absolute', top: o.top, left: o.left }}>
          <div className="ge-neb" style={{ width: o.w, height: o.w, background: o.c, animation: o.anim + ' ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  )
}

// ── Cozy reading nook background ──
function CozyLayer({ mob }: { mob: boolean }) {
  return (
    <div className="ge-rev" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', transitionDelay: '60ms' }}>
      <div className="ge-parallax" data-depth={3} style={{ position: 'absolute', top: '-4%', left: '-3%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/auth/bg_lamp.png" alt="" style={{ width: mob ? 220 : 320, opacity: 0.92, filter: 'saturate(1.1)' }} />
      </div>
      <div className="ge-parallax" data-depth={6} style={{ position: 'absolute', bottom: '-3%', left: '-2%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/auth/bg_cozy.png" alt="" style={{ width: mob ? 460 : 780, opacity: 1, filter: 'brightness(1.5) contrast(1.08) saturate(1.18)' }} />
      </div>
    </div>
  )
}

// ── Particle starfield ──
function makeParticles(n: number) {
  return Array.from({ length: n }).map(() => {
    const sz = 1 + Math.random() * 2.4
    const dur = 9 + Math.random() * 12
    return { left: Math.random() * 100, top: Math.random() * 100, sz, dur, delay: -Math.random() * dur, op: 0.3 + Math.random() * 0.5 }
  })
}

function Particles({ n = 34 }: { n?: number }) {
  const [parts] = useState(() => makeParticles(n))
  return (
    <div className="ge-rev" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transitionDelay: '300ms' }}>
      {parts.map((p, i) => (
        <span key={i} className="ge-particle" style={{
          left: p.left + '%', top: p.top + '%', width: p.sz, height: p.sz, opacity: p.op,
          boxShadow: '0 0 6px rgba(255,255,255,.6)',
          animation: `geParticle ${p.dur}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Dashed orbital paths ──
function Orbits() {
  return (
    <svg className="ge-rev" viewBox="0 0 600 600" preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5, transitionDelay: '360ms' }}>
      <g fill="none" stroke={glow(T.accent2, 0.55)} strokeWidth="1">
        <ellipse className="ge-orbit" cx="330" cy="300" rx="250" ry="150" transform="rotate(-16 330 300)" />
        <ellipse className="ge-orbit" cx="300" cy="320" rx="190" ry="230" transform="rotate(20 300 320)" style={{ animationDuration: '90s' }} />
      </g>
    </svg>
  )
}

// ── Floating tilt cover card ──
interface FloatCardProps {
  src: string; w: number; top: string; left: string;
  rot: number; depth: number; floatCls: string; delay: number; glowC: string;
}
function FloatCard({ src, w, top, left, rot, depth, floatCls, delay, glowC }: FloatCardProps) {
  const base = `0 26px 42px -12px rgba(0,0,0,.62), 0 8px 20px -6px ${glow(glowC, 0.5)}`
  const hov = `0 42px 64px -14px rgba(0,0,0,.72), 0 0 46px ${glow(glowC, 0.78)}`
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced()) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotate(${rot}deg) rotateY(${px * 15}deg) rotateX(${-py * 15}deg) scale(1.06)`
    el.style.boxShadow = hov
  }
  const onLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = `rotate(${rot}deg)`
    e.currentTarget.style.boxShadow = base
  }
  return (
    <div className="ge-parallax" data-depth={depth}
      style={{ position: 'absolute', top, left, zIndex: 4, pointerEvents: 'auto' }}>
      <div className="ge-rev ge-rev-card" style={{ transitionDelay: delay + 'ms' }}>
        <div className={floatCls} style={{ perspective: 1000 }}>
          <div className="ge-tilt" style={{ width: w, borderRadius: 15, background: '#0e0a1a', border: '1px solid rgba(255,255,255,.09)', transform: `rotate(${rot}deg)`, boxShadow: base }}
            onMouseMove={onMove} onMouseLeave={onLeave}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Glass input field ──
function GlassInput({ label, icon, type = 'text', placeholder, autoComplete, value, onChange, onKeyDown }: {
  label: string; icon: React.ReactNode; type?: string; placeholder: string
  autoComplete?: string; value: string; onChange: (v: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  const [foc, setFoc] = useState(false)
  const [reveal, setReveal] = useState(false)
  const isPw = type === 'password'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: T.body, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.74)', marginBottom: 8 }}>{label}</div>
      <div className="ge-field" style={{
        background: foc ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.035)',
        border: '1px solid ' + (foc ? T.accent : 'rgba(255,255,255,.1)'),
        boxShadow: foc ? `0 0 0 3px ${glow(T.accent, 0.16)}` : 'none',
      }}>
        <span style={{ color: foc ? T.accent2 : T.dim, display: 'flex', flexShrink: 0 }}>{icon}</span>
        <input
          type={isPw && reveal ? 'text' : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
          style={{ color: T.text, fontFamily: T.body, fontSize: 14.5 }}
        />
        {isPw && (
          <span onClick={() => setReveal(r => !r)} title={reveal ? 'Hide' : 'Show'}
            style={{ cursor: 'pointer', color: foc ? T.accent2 : T.dim, display: 'flex', flexShrink: 0, padding: 2 }}>
            {reveal ? <Ico.eyeOff s={19} /> : <Ico.eye s={19} />}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Gradient ripple button ──
function RippleButton({ children, onClick, busy }: { children: React.ReactNode; onClick?: () => void; busy?: boolean }) {
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const click = (e: React.MouseEvent) => {
    if (!busy && ref.current && !reduced()) {
      const r = ref.current.getBoundingClientRect()
      const rip = document.createElement('span')
      rip.className = 'ge-rip'
      const d = Math.max(r.width, r.height) * 1.4
      rip.style.width = rip.style.height = d + 'px'
      rip.style.left = e.clientX - r.left + 'px'
      rip.style.top = e.clientY - r.top + 'px'
      ref.current.appendChild(rip)
      setTimeout(() => rip.remove(), 650)
    }
    if (!busy) onClick?.()
  }
  return (
    <button ref={ref} onClick={click}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      disabled={busy}
      style={{
        position: 'relative', overflow: 'hidden', width: '100%', border: 'none', cursor: busy ? 'default' : 'pointer',
        padding: '16px 24px', borderRadius: 13, color: '#fff', fontFamily: T.disp, fontWeight: 700, fontSize: 15.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        background: `linear-gradient(110deg, ${T.accent} 0%, ${T.accent2} 48%, ${T.accent} 100%)`,
        backgroundSize: '220% 100%', backgroundPosition: hover ? '100% 0' : '0 0',
        transform: hover && !busy ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hover ? `0 18px 40px -8px ${glow(T.accent, 0.62)}` : `0 10px 26px -8px ${glow(T.accent, 0.5)}`,
        transition: 'background-position .6s ease, transform .2s ease, box-shadow .25s ease',
        opacity: busy ? 0.7 : 1,
      }}>
      <span style={{ whiteSpace: 'nowrap' }}>{children}</span>
      {!busy && (
        <span style={{ display: 'flex', flexShrink: 0, transform: hover ? 'translateX(3px)' : 'none', transition: 'transform .2s ease' }}>
          <Ico.arrow s={20} />
        </span>
      )}
    </button>
  )
}

// ── Social login button ──
function Social({ label, mark }: { label: string; mark: React.ReactNode }) {
  const [h, setH] = useState(false)
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: h ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.05)',
      border: '1px solid rgba(255,255,255,' + (h ? '.2' : '.1') + ')',
      borderRadius: 13, padding: '13px', cursor: 'pointer', color: T.text,
      fontFamily: T.disp, fontWeight: 700, fontSize: 14.5,
      transform: h ? 'translateY(-1px)' : 'none', transition: 'all .18s',
    }}>{mark}{label}</button>
  )
}

// ── Mouse parallax driver ──
function useParallax(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (reduced()) return
    const root = rootRef.current
    if (!root) return
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0
    const onMove = (e: MouseEvent) => {
      const r = root.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width - 0.5
      ty = (e.clientY - r.top) / r.height - 0.5
    }
    const tick = () => {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06
      root.querySelectorAll<HTMLElement>('.ge-parallax').forEach(n => {
        const d = parseFloat(n.getAttribute('data-depth') || '0') || 0
        n.style.transform = `translate3d(${(-cx * d).toFixed(2)}px, ${(-cy * d).toFixed(2)}px, 0)`
      })
      raf = requestAnimationFrame(tick)
    }
    root.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => { root.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [rootRef])
}

// ── Auth form ──
function AuthForm({ mob }: { mob: boolean }) {
  const app = useApp()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)

  const reset = (m: AuthMode) => { setMode(m); setError(null); setForgotSent(false) }

  const handleSubmit = async () => {
    setError(null)
    if (!email) { setError('Email is required'); return }
    if (mode !== 'forgot' && !password) { setError('Password is required'); return }
    if (mode === 'signup' && !name) { setError('Name is required'); return }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await app.signIn(email, password)
      } else if (mode === 'signup') {
        await app.signUp(email, password, name)
      } else {
        await Api.forgotPassword(email)
        setForgotSent(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }

  const heads: Record<AuthMode, [string, string]> = {
    signin: ['Welcome ', 'back'],
    signup: ['Create ', 'account'],
    forgot: ['Reset ', 'password'],
  }
  const sub = mode === 'signin' ? 'Pick up right where you left off.' : mode === 'signup' ? 'Thousands of listens, one library.' : 'We\'ll email you a reset link.'
  const [a, b] = heads[mode]

  return (
    <div style={{ width: '100%', maxWidth: 384 }}>
      {/* Emblem */}
      <div className="ge-rev ge-rev-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, transitionDelay: '90ms' }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 35%, rgba(168,139,250,.28), rgba(139,92,246,.06))',
          border: '1px solid ' + glow(T.accent2, 0.5),
          boxShadow: `0 0 24px ${glow(T.accent, 0.45)}, 0 0 0 6px ${glow(T.accent, 0.06)}`,
          color: T.accent2,
        }}>
          <Ico.book s={26} sw={1.6} />
        </div>
      </div>

      {/* Heading */}
      <div className="ge-rev ge-rev-up" style={{ marginBottom: 24, textAlign: 'center', transitionDelay: '140ms' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: mob ? 32 : 38, letterSpacing: '-0.015em', color: '#fff', lineHeight: 1.05 }}>
          {a}<span style={{ color: T.accent2, fontStyle: 'italic' }}>{b}</span>
        </div>
        <div style={{ fontFamily: T.body, fontSize: 15, color: 'rgba(255,255,255,.66)', marginTop: 9 }}>{sub}</div>
      </div>

      {/* Social + divider */}
      {mode !== 'forgot' && (
        <div className="ge-rev ge-rev-up" style={{ transitionDelay: '200ms' }}>
          <div style={{ display: 'flex', gap: 11, marginBottom: 20 }}>
            <Social label="Google" mark={
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M21.6 12.23c0-.66-.06-1.3-.17-1.9H12v3.6h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.22Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
                <path fill="#FBBC05" d="M6.41 13.91a6 6 0 0 1 0-3.82V7.51H3.07a10 10 0 0 0 0 8.98l3.34-2.58Z" />
                <path fill="#EA4335" d="M12 5.97c1.47 0 2.78.5 3.81 1.49l2.85-2.85C16.95 2.99 14.7 2 12 2A10 10 0 0 0 3.07 7.51l3.34 2.58C7.2 7.73 9.4 5.97 12 5.97Z" />
              </svg>
            } />
            <Social label="Apple" mark={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M16 13c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85s-1.8-.83-3-.8c-1.5 0-3 .9-3.7 2.3-1.6 2.8-.4 6.9 1.1 9.2.7 1.1 1.6 2.4 2.8 2.3 1.1-.04 1.5-.7 2.9-.7s1.7.7 2.9.7 2-1.1 2.7-2.2c.86-1.3 1.2-2.5 1.2-2.6-.03 0-2.3-.9-2.3-3.5Zm-2.3-6.4C14.3 5.8 14.8 4.8 14.7 3.8c-.85.04-1.9.6-2.5 1.3-.55.66-1 1.7-.9 2.6.95.08 1.9-.5 2.4-1.1Z" />
              </svg>
            } />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
            <span style={{ fontFamily: T.body, fontSize: 12.5, color: 'rgba(255,255,255,.42)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.12)' }} />
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="ge-rev ge-rev-up" style={{ transitionDelay: '260ms' }}>
        {mode === 'signup' && (
          <GlassInput label="Name" icon={<Ico.person s={19} />} placeholder="Your name" autoComplete="name" value={name} onChange={setName} onKeyDown={onKey} />
        )}
        <GlassInput label="Email" icon={<Ico.mail s={19} />} type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={setEmail} onKeyDown={onKey} />
        {mode !== 'forgot' && (
          <div>
            <GlassInput label="Password" icon={<Ico.lock s={19} />} type="password" placeholder="••••••••" autoComplete="current-password" value={password} onChange={setPassword} onKeyDown={onKey} />
            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: 2, marginBottom: 4 }}>
                <span onClick={() => reset('forgot')} style={{ fontFamily: T.body, fontSize: 13.5, fontWeight: 600, color: T.accent2, cursor: 'pointer' }}>Forgot password?</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error / success */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13.5, color: '#FCA5A5' }}>
          {error}
        </div>
      )}
      {forgotSent && mode === 'forgot' && (
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13.5, color: T.good }}>
          If that email exists, a reset link is on its way.
        </div>
      )}

      {/* CTA */}
      <div className="ge-rev ge-rev-up" style={{ marginTop: 14, transitionDelay: '320ms' }}>
        <RippleButton onClick={handleSubmit} busy={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </RippleButton>
      </div>

      {/* Switch mode */}
      <div className="ge-rev ge-rev-up" style={{ marginTop: 20, textAlign: 'center', fontFamily: T.body, fontSize: 14, color: 'rgba(255,255,255,.62)', transitionDelay: '380ms' }}>
        {mode === 'signin' && <>New to geaudio? <span onClick={() => reset('signup')} style={{ color: T.accent2, fontWeight: 700, cursor: 'pointer' }}>Create an account</span></>}
        {mode === 'signup' && <>Already have an account? <span onClick={() => reset('signin')} style={{ color: T.accent2, fontWeight: 700, cursor: 'pointer' }}>Sign in</span></>}
        {mode === 'forgot' && <span onClick={() => reset('signin')} style={{ color: T.accent2, fontWeight: 700, cursor: 'pointer' }}>← Back to sign in</span>}
      </div>
    </div>
  )
}

// ── Root Auth component ──
export function Auth() {
  const app = useApp()
  const mob = app.mobile
  const rootRef = useRef<HTMLDivElement>(null)
  const [pre, setPre] = useState(true)
  const [shown, setShown] = useState(false)

  useParallax(rootRef)

  useEffect(() => {
    // Inject Spectral serif font
    if (!document.getElementById('ge-spectral-font')) {
      const link = document.createElement('link')
      link.id = 'ge-spectral-font'
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,500&display=swap'
      document.head.appendChild(link)
    }
    const r1 = requestAnimationFrame(() => requestAnimationFrame(() => setPre(false)))
    const fb = setTimeout(() => setPre(false), 1600)
    const pin = setTimeout(() => setShown(true), 1700)
    return () => { cancelAnimationFrame(r1); clearTimeout(fb); clearTimeout(pin) }
  }, [])

  const rootCls = 'ge-auth' + (pre ? ' ge-pre' : '') + (shown ? ' ge-shown' : '')

  const CARDS_DESKTOP = [
    { src: '/assets/auth/cover_vermilion.png', w: 152, top: '11%', left: '2%', rot: -3, depth: 38, floatCls: 'ge-float',  delay: 420, glowC: '#c83e4d' },
    { src: '/assets/auth/cover_neon.png',      w: 168, top: '3%',  left: '46%', rot: 6,  depth: 28, floatCls: 'ge-floatB', delay: 360, glowC: '#8B5CF6' },
    { src: '/assets/auth/cover_machine.png',   w: 174, top: '44%', left: '9%', rot: -3,  depth: 22, floatCls: 'ge-floatC', delay: 540, glowC: '#4fd1c5' },
    { src: '/assets/auth/cover_ashfall.png',   w: 150, top: '49%', left: '53%', rot: 5,  depth: 32, floatCls: 'ge-floatD', delay: 620, glowC: '#e7762f' },
  ]
  const CARDS_MOB = [
    { src: '/assets/auth/cover_neon.png',      w: 104, top: '5%',  left: '50%', rot: -7, depth: 30, floatCls: 'ge-floatB', delay: 360, glowC: '#8B5CF6' },
    { src: '/assets/auth/cover_vermilion.png', w: 86,  top: '11%', left: '5%',  rot: 7,  depth: 40, floatCls: 'ge-floatD', delay: 460, glowC: '#c83e4d' },
    { src: '/assets/auth/cover_ashfall.png',   w: 92,  top: '27%', left: '60%', rot: -5, depth: 26, floatCls: 'ge-floatC', delay: 540, glowC: '#e7762f' },
  ]
  const cards = mob ? CARDS_MOB : CARDS_DESKTOP

  const ambient = (
    <>
      <div className="ge-base" />
      <Nebula />
      <CozyLayer mob={mob} />
      <div className="ge-grain ge-rev" style={{ transitionDelay: '80ms' }} />
      <Particles n={mob ? 18 : 32} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 120%, rgba(6,4,14,.7) 0%, transparent 55%)', pointerEvents: 'none' }} />
    </>
  )

  const cardsLayer = (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      <Orbits />
      {cards.map((c, i) => <FloatCard key={i} {...c} />)}
    </div>
  )

  if (mob) {
    return (
      <div ref={rootRef} className={rootCls} style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: T.body }}>
        {ambient}
        {cardsLayer}
        <div className="ge-scroll" style={{ position: 'relative', zIndex: 6, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '40px 18px 26px' }}>
          <div className="ge-rev ge-rev-up" style={{ marginBottom: 'auto', transitionDelay: '80ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width={22} height={22} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={T.accent} /><path d="M9 7.5v9l7-4.5-7-4.5Z" fill="#fff" /></svg>
              <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: '-0.02em' }}>geaudio</span>
            </div>
          </div>
          <div className="ge-glass ge-rev ge-rev-right" style={{ borderRadius: 24, padding: '28px 22px', marginTop: 170, transitionDelay: '220ms' }}>
            <AuthForm mob />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={rootCls} style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: T.body }}>
      {ambient}
      <div style={{ position: 'relative', zIndex: 6, height: '100%', display: 'flex' }}>
        {/* Scene / left panel */}
        <div style={{ flex: 1.15, position: 'relative', padding: '44px 50px', minWidth: 0 }}>
          {cardsLayer}
          <div className="ge-rev ge-rev-up" style={{ position: 'relative', zIndex: 5, transitionDelay: '80ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width={26} height={26} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={T.accent} /><path d="M9 7.5v9l7-4.5-7-4.5Z" fill="#fff" /></svg>
              <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 22, color: T.text, letterSpacing: '-0.02em' }}>geaudio</span>
            </div>
          </div>
        </div>
        {/* Glass panel / right */}
        <div style={{ width: 512, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 42px' }}>
          <div className="ge-glass ge-rev ge-rev-right" style={{ width: '100%', maxWidth: 432, borderRadius: 28, padding: '40px 42px', transitionDelay: '260ms' }}>
            <AuthForm mob={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
