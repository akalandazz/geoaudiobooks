'use client'

import React, { useRef } from 'react'
import { T } from './theme'
import { GEIcon } from './Icons'

// ── Btn ──
interface BtnProps {
  children: React.ReactNode;
  kind?: 'primary' | 'light' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  full?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}
export function Btn({ children, kind = 'primary', size = 'md', icon, full, style, onClick, disabled }: BtnProps) {
  const pad = size === 'lg' ? '14px 28px' : size === 'sm' ? '8px 16px' : '11px 22px'
  const fs = size === 'lg' ? 15.5 : size === 'sm' ? 13 : 14.5
  const base: React.CSSProperties = {
    primary: { background: T.accent, color: '#fff', boxShadow: '0 6px 20px rgba(139,92,246,0.35)' },
    light:   { background: '#fff', color: '#15101f' },
    ghost:   { background: 'transparent', color: T.text, border: '1px solid ' + T.line2 },
    soft:    { background: T.elev, color: T.text },
  }[kind]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        padding: pad, borderRadius: 99, border: 'none', cursor: 'pointer',
        fontFamily: T.disp, fontWeight: 700, fontSize: fs, whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        transition: 'transform .12s, filter .12s, background .15s',
        ...base, ...style,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
    >
      {icon}{children}
    </button>
  )
}

// ── IconBtn ──
interface IconBtnProps {
  children: React.ReactNode;
  active?: boolean;
  size?: number;
  title?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}
export function IconBtn({ children, active, size = 40, title, style, onClick }: IconBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: size, height: size, borderRadius: 99, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? T.accentDim : 'transparent',
        color: active ? T.accent2 : T.mut,
        transition: 'background .15s, color .15s', flexShrink: 0, ...style,
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = T.elev }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ── Pill ──
interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function Pill({ children, active, onClick, style }: PillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 15px', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap',
        border: '1px solid ' + (active ? 'transparent' : T.line),
        background: active ? T.text : 'transparent',
        color: active ? '#0B0B12' : T.mut,
        fontFamily: T.body, fontWeight: 700, fontSize: 13,
        transition: 'all .15s', ...style,
      }}
    >
      {children}
    </button>
  )
}

// ── Stars ──
interface StarsProps { r: number | string; s?: number; showNum?: number }
export function Stars({ r, s = 13, showNum }: StarsProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <GEIcon.star s={s} style={{ color: T.star }} />
      <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: s + 0.5, color: T.text }}>{r}</span>
      {showNum != null && <span style={{ fontSize: s - 0.5, color: T.dim }}>({showNum.toLocaleString()})</span>}
    </span>
  )
}

// ── Screen (scrollable container) ──
interface ScreenProps { children: React.ReactNode; style?: React.CSSProperties; }
export function Screen({ children, style }: ScreenProps) {
  return (
    <div className="ge-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', ...style }}>
      {children}
    </div>
  )
}

// ── Scrubber ──
interface ScrubberProps { pct: number; onSeek: (pct: number) => void; height?: number; glow?: boolean }
export function Scrubber({ pct, onSeek, height = 4, glow }: ScrubberProps) {
  const ref = useRef<HTMLDivElement>(null)
  const seek = (clientX: number) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    onSeek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * 100)
  }
  const down = (e: React.PointerEvent) => {
    e.preventDefault(); seek(e.clientX)
    const mv = (ev: PointerEvent) => seek(ev.clientX)
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up)
  }
  return (
    <div ref={ref} onPointerDown={down}
      style={{ flex: 1, height: 14, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
      <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.14)', borderRadius: 3, position: 'relative' }}>
        <div style={{ width: pct + '%', height: '100%', background: T.accent2, borderRadius: 3, boxShadow: glow ? '0 0 10px rgba(167,139,250,0.6)' : 'none' }} />
        <div style={{ position: 'absolute', left: pct + '%', top: '50%', width: height + 7, height: height + 7, borderRadius: 99, background: '#fff', transform: 'translate(-50%,-50%)' }} />
      </div>
    </div>
  )
}

// ── PageHead ──
interface PageHeadProps { title: string; sub?: string; mobile?: boolean }
export function PageHead({ title, sub, mobile }: PageHeadProps) {
  if (mobile) return (
    <div style={{ marginBottom: 18 }}>
      <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 24, color: T.text, letterSpacing: '-0.02em' }}>{title}</span>
      {sub && <span style={{ fontSize: 14, color: T.mut, marginLeft: 10 }}>{sub}</span>}
    </div>
  )
  return (
    <div style={{ marginBottom: 26 }}>
      <span style={{ fontFamily: T.disp, fontWeight: 700, fontSize: 32, color: T.text, letterSpacing: '-0.02em' }}>{title}</span>
      {sub && <span style={{ fontSize: 15, color: T.mut, marginLeft: 12 }}>{sub}</span>}
    </div>
  )
}
