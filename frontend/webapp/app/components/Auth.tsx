'use client'

import React, { useState } from 'react'
import { T } from './theme'
import { BookCover } from './BookCover'
import { Btn } from './Atoms'
import { GE_BOOKS } from './bookdata'
import { useApp } from './AppContext'
import * as Api from '../lib/api'

type AuthMode = 'signin' | 'signup' | 'forgot'

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: T.text, fontFamily: T.body, fontSize: 14.5,
}

function Field({ label, type = 'text', ph, value, onChange, onKeyDown }: {
  label: string; type?: string; ph: string; value: string
  onChange: (v: string) => void; onKeyDown: (e: React.KeyboardEvent) => void
}) {
  const [focused, setFocused] = useState(false)
  const wrapStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, background: T.bg2,
    border: '1px solid ' + (focused ? T.accent : T.line2), borderRadius: 11, padding: '13px 15px',
  }
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: T.mut, marginBottom: 7, fontFamily: T.body }}>{label}</span>
      <div style={wrapStyle}>
        <input
          type={type} placeholder={ph} value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={inputStyle}
        />
      </div>
    </label>
  )
}

export function Auth() {
  const app = useApp()
  const mob = app.mobile
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotSent, setForgotSent] = useState(false)

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

  const Social = ({ label, mark }: { label: string; mark: React.ReactNode }) => (
    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: T.elev, border: '1px solid ' + T.line, borderRadius: 11, padding: '12px', cursor: 'pointer', color: T.text, fontFamily: T.disp, fontWeight: 700, fontSize: 14 }}>
      {mark}{label}
    </button>
  )

  const title = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset password'
  const sub = mode === 'signin' ? 'Pick up right where you left off.' : mode === 'signup' ? 'Thousands of listens, one library.' : 'We\'ll email you a reset link.'
  const btnLabel = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'

  const Form = (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ marginBottom: 26 }}>
        <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: mob ? 28 : 34, letterSpacing: '-0.025em', color: T.text }}>{title}</div>
        <div style={{ fontSize: 15, color: T.mut, marginTop: 8 }}>{sub}</div>
      </div>
      {mode !== 'forgot' && (
        <>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <Social label="Google" mark={
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1A6.2 6.2 0 0 1 12 5.8c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c5.3 0 8.8-3.7 8.8-9 0-.6-.06-1-.15-1.4Z" />
              </svg>
            } />
            <Social label="Apple" mark={
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
                <path d="M16 13c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85s-1.8-.83-3-.8c-1.5 0-3 .9-3.7 2.3-1.6 2.8-.4 6.9 1.1 9.2.7 1.1 1.6 2.4 2.8 2.3 1.1-.04 1.5-.7 2.9-.7s1.7.7 2.9.7 2-1.1 2.7-2.2c.86-1.3 1.2-2.5 1.2-2.6-.03 0-2.3-.9-2.3-3.5Zm-2.3-6.4C14.3 5.8 14.8 4.8 14.7 3.8c-.85.04-1.9.6-2.5 1.3-.55.66-1 1.7-.9 2.6.95.08 1.9-.5 2.4-1.1Z" />
              </svg>
            } />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 0 20px' }}>
            <div style={{ flex: 1, height: 1, background: T.line }} />
            <span style={{ fontSize: 12.5, color: T.dim }}>or</span>
            <div style={{ flex: 1, height: 1, background: T.line }} />
          </div>
        </>
      )}
      {mode === 'signup' && <Field label="Name" ph="Jordan Avery" value={name} onChange={setName} onKeyDown={onKey} />}
      <Field label="Email" ph="you@example.com" value={email} onChange={setEmail} onKeyDown={onKey} />
      {mode !== 'forgot' && (
        <div>
          <Field label="Password" type="password" ph="••••••••" value={password} onChange={setPassword} onKeyDown={onKey} />
          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 14 }}>
              <span onClick={() => { setMode('forgot'); setError(null); setForgotSent(false) }} style={{ fontSize: 13, fontWeight: 700, color: T.accent2, cursor: 'pointer' }}>Forgot password?</span>
            </div>
          )}
        </div>
      )}
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
      <div style={{ marginTop: 10 }}>
        <Btn kind="primary" size="lg" full onClick={handleSubmit} disabled={busy}>
          {busy ? 'Please wait…' : btnLabel}
        </Btn>
      </div>
      <div style={{ marginTop: 22, textAlign: 'center', fontSize: 14, color: T.mut }}>
        {mode === 'signin' && <>New to geaudio? <span onClick={() => { setMode('signup'); setError(null) }} style={{ color: T.accent2, fontWeight: 700, cursor: 'pointer' }}>Create an account</span></>}
        {mode === 'signup' && <>Already have an account? <span onClick={() => { setMode('signin'); setError(null) }} style={{ color: T.accent2, fontWeight: 700, cursor: 'pointer' }}>Sign in</span></>}
        {mode === 'forgot' && <span onClick={() => { setMode('signin'); setError(null); setForgotSent(false) }} style={{ color: T.accent2, fontWeight: 700, cursor: 'pointer' }}>← Back to sign in</span>}
      </div>
    </div>
  )

  if (mob) {
    return (
      <div className="ge-scroll" style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex', flexDirection: 'column', padding: '60px 28px 28px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 36 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" style={{ marginRight: 9, verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="11" fill={T.accent} />
            <path d="M9 7.5v9l7-4.5-7-4.5Z" fill="#fff" />
          </svg>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 20, color: T.text, letterSpacing: '-0.02em', verticalAlign: 'middle' }}>geaudio</span>
        </div>
        {Form}
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: T.bg, display: 'flex' }}>
      {/* brand panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg,#1a0b2e 0%,#2a1248 50%,#3a1f6e 100%)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <svg width={26} height={26} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={T.accent} /><path d="M9 7.5v9l7-4.5-7-4.5Z" fill="#fff" /></svg>
          <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 22, color: T.text, letterSpacing: '-0.02em' }}>geaudio</span>
        </div>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {([[GE_BOOKS[2], 150, '8%', '54%', -10], [GE_BOOKS[6], 120, '60%', '12%', 8], [GE_BOOKS[7], 130, '64%', '62%', -6], [GE_BOOKS[9], 100, '20%', '8%', 12]] as [typeof GE_BOOKS[0], number, string, string, number][]).map(([b, w, top, left, rot], i) => (
            <div key={i} style={{ position: 'absolute', top, left, transform: `rotate(${rot}deg)`, opacity: 0.9 }}>
              <BookCover book={b} w={w} radius={12} style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
            </div>
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(20,10,35,0.6) 100%)' }} />
        </div>
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <div style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 38, letterSpacing: '-0.025em', lineHeight: 1.08, color: '#fff' }}>Stories that sound the way they were meant to.</div>
          <div style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.75)', marginTop: 16, lineHeight: 1.6 }}>Thousands of audiobooks, immersive narration, and a player built for the long listen.</div>
        </div>
      </div>
      {/* form panel */}
      <div style={{ width: 520, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        {Form}
      </div>
    </div>
  )
}
