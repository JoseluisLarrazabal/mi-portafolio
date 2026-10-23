import type { ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const ArrowRight = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
export const ArrowUpRight = () => <Svg><path d="M7 17L17 7M9 7h8v8" /></Svg>
export const Check = () => <Svg><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
export const Close = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const List = () => <Svg><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Svg>
export const ChevronDown = () => <Svg><path d="M6 9l6 6 6-6" /></Svg>
export const Copy = () => <Svg><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 012-2h9" /></Svg>
export const SoundOn = () => <Svg><path d="M4 10v4h4l5 4V6L8 10H4zM16.5 9a4 4 0 010 6M19 6.5a8 8 0 010 11" /></Svg>
export const SoundOff = () => <Svg><path d="M4 10v4h4l5 4V6L8 10H4zM17 9.5l4 5M21 9.5l-4 5" /></Svg>
