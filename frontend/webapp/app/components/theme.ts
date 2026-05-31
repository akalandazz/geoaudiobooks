'use client'

export interface Theme {
  bg: string; bg2: string; surface: string; elev: string; elev2: string;
  line: string; line2: string;
  accent: string; accent2: string; accentDim: string;
  text: string; mut: string; dim: string;
  good: string; star: string;
  disp: string; body: string;
  shadow: string;
}

export const T: Theme = {
  bg: '#0B0B12', bg2: '#08080E', surface: '#14141D', elev: '#1B1B27', elev2: '#22222F',
  line: 'rgba(255,255,255,0.08)', line2: 'rgba(255,255,255,0.14)',
  accent: '#8B5CF6', accent2: '#A78BFA', accentDim: 'rgba(139,92,246,0.16)',
  text: '#ECECF2', mut: '#9595AA', dim: '#6A6A80',
  good: '#34D399', star: '#F0B86E',
  disp: "var(--font-display, 'Space Grotesk'), sans-serif",
  body: "var(--font-body, 'Manrope'), sans-serif",
  shadow: '0 10px 40px rgba(0,0,0,0.45)',
};

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const BASES: Record<string, [string, string]> = {
  Indigo: ['#0B0B12', '#08080E'],
  'True black': ['#000000', '#060608'],
  Slate: ['#0E1117', '#090C11'],
};
