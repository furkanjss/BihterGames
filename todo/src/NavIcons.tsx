import type { View } from './views'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function NavIcon({ id }: { id: View }) {
  switch (id) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="5" rx="1.5" />
          <rect x="13" y="10" width="8" height="11" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
        </svg>
      )
    case 'tasks':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="M4 6h.01M4 12h.01M4 18h.01" />
        </svg>
      )
    case 'projects':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        </svg>
      )
    case 'docs':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <path d="M8 4h7l5 5v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
          <path d="M15 4v5h5M10 13h6M10 17h4" />
        </svg>
      )
    case 'hours':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4.5l3 1.5" />
        </svg>
      )
    case 'ideas':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1.1 2V17h4.8v-.4c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
        </svg>
      )
    case 'management':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...stroke}>
          <path d="M4 19V9l8-5 8 5v10" />
          <path d="M9 19v-6h6v6" />
        </svg>
      )
    default:
      return null
  }
}

export function GameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...stroke}>
      <path d="M7 10h10v5a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3v-5Z" />
      <path d="M9 10V8a3 3 0 0 1 6 0v2M9 14h.01M15 14h.01" />
    </svg>
  )
}
