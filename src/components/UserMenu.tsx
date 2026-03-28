import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="text-xl leading-none" aria-hidden>☰</span>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-[100]"
          role="menu"
        >
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100"
            role="menuitem"
          >
            Dashboard
          </Link>
          <Link
            to="/recharge"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100"
            role="menuitem"
          >
            Top up
          </Link>
          <Link
            to="/recharge/history"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100"
            role="menuitem"
          >
            History
          </Link>
          <hr className="my-2 border-slate-100 md:hidden" />
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 font-medium touch-manipulation md:hidden"
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
