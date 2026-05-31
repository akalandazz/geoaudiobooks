'use client'

import React from 'react'
import { Book } from './bookdata'

function CoverMotif({ motif, c }: { motif: Book['motif']; c: Book['palette'] }) {
  const stroke = 'rgba(255,255,255,0.16)'
  if (motif === 'lines') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={-20 + i * 16} y1="120" x2={40 + i * 16} y2="-20"
            stroke={stroke} strokeWidth="0.6" />
        ))}
      </svg>
    )
  }
  if (motif === 'wave') {
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M0 62 Q 25 48 50 62 T 100 62 V100 H0 Z" fill={c[2]} opacity="0.28" />
        <path d="M0 74 Q 25 60 50 74 T 100 74 V100 H0 Z" fill={c[2]} opacity="0.18" />
        <path d="M0 86 Q 25 74 50 86 T 100 86 V100 H0 Z" fill="#fff" opacity="0.07" />
      </svg>
    )
  }
  if (motif === 'grid') {
    const patId = 'gd' + c[2].replace('#', '')
    return (
      <svg viewBox="0 0 100 100"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id={patId} width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.18)" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#${patId})`} />
      </svg>
    )
  }
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `radial-gradient(60% 50% at 75% 25%, ${c[2]}55 0%, transparent 60%), radial-gradient(50% 45% at 20% 80%, ${c[2]}33 0%, transparent 65%)`,
    }} />
  )
}

interface BookCoverProps {
  book: Book;
  w?: number;
  radius?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function BookCover({ book, w = 180, radius = 10, style = {}, onClick }: BookCoverProps) {
  const c = book.palette
  const fs = (m: number) => Math.round(w * m)
  return (
    <div onClick={onClick} style={{
      width: w, height: w, borderRadius: radius, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(150deg, ${c[0]} 0%, ${c[1]} 100%)`,
      boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
      flexShrink: 0, cursor: onClick ? 'pointer' : undefined, ...style,
    }}>
      <CoverMotif motif={book.motif} c={c} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, padding: w * 0.09, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ width: fs(0.16), height: fs(0.016), background: c[2], borderRadius: 2, display: 'block' }} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: fs(0.05), letterSpacing: fs(0.012), textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{book.genre}</span>
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#fff', fontSize: fs(0.135), lineHeight: 1.02, letterSpacing: '-0.01em' }}>
            {book.title}
          </div>
          <div style={{ marginTop: w * 0.05, display: 'flex', alignItems: 'center', gap: w * 0.04 }}>
            <span style={{ width: fs(0.05), height: 1, background: 'rgba(255,255,255,0.5)' }} />
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: fs(0.052), color: 'rgba(255,255,255,0.82)', fontWeight: 500, letterSpacing: '0.02em' }}>{book.author}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
