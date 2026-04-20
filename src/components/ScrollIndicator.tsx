import { useEffect, useState } from 'react'

// Page-level scroll affordance:
//   1. A thin progress bar fixed to the top of the viewport — shows how
//      far down the page the visitor has scrolled (top → bottom).
//   2. A floating "back to top" button that appears after the first
//      viewport-height of scroll, so long pages feel navigable.
export function ScrollIndicator() {
  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0
      setProgress(Math.min(100, Math.max(0, pct)))
      setShowTop(doc.scrollTop > doc.clientHeight * 0.8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <>
      <div
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="fixed top-0 left-0 right-0 h-1 z-[70] pointer-events-none"
      >
        <div
          className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        className={`
          fixed bottom-6 right-6 z-[65] w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-400 text-white
          shadow-lg shadow-teal-500/30 flex items-center justify-center transition-all duration-300
          ${showTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  )
}
