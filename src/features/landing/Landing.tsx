import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900/30 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.25),transparent)]" />
        <div className="relative px-6 pt-12 pb-20 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            ElectroGrid
          </h1>
          <p className="text-teal-200/90 text-lg mb-2">
            Smart electricity recharge
          </p>
          <p className="text-slate-400 text-sm mb-10 max-w-md mx-auto">
            Verify meters, top up credit, and track usage — all from one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button
                className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-white border-0 px-8"
                size="lg"
              >
                Get started
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="secondary"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/30"
                size="lg"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto grid sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-3 text-xl">
              ⚡
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Meter verify</h3>
            <p className="text-slate-500 text-sm">Confirm your meter in seconds</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-3 text-xl">
              💳
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Top up</h3>
            <p className="text-slate-500 text-sm">Pay and sync credit wirelessly</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 mb-3 text-xl">
              📊
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Track usage</h3>
            <p className="text-slate-500 text-sm">Monitor your consumption</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-200 bg-white">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-slate-500 text-sm">© ElectroGrid</span>
        </div>
      </footer>
    </div>
  )
}
