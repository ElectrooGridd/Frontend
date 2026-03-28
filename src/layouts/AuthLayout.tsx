import { Outlet, Link } from 'react-router-dom'

function MeterIllustration() {
  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      {/* Outer orbiting ring */}
      <div className="absolute inset-[-40px] animate-orbit opacity-30">
        <svg viewBox="0 0 460 460" fill="none" className="w-full h-full">
          <circle cx="230" cy="230" r="220" stroke="white" strokeWidth="0.5" strokeDasharray="4 8" />
          <circle cx="230" cy="10" r="4" fill="white" opacity="0.8" />
          <circle cx="450" cy="230" r="3" fill="#22C55E" opacity="0.6" />
          <circle cx="50" cy="380" r="3" fill="#F59E0B" opacity="0.6" />
        </svg>
      </div>

      {/* Inner reverse orbit */}
      <div className="absolute inset-[10px] animate-orbit-reverse opacity-20">
        <svg viewBox="0 0 360 360" fill="none" className="w-full h-full">
          <circle cx="180" cy="180" r="170" stroke="white" strokeWidth="0.5" strokeDasharray="2 12" />
          <circle cx="180" cy="10" r="3" fill="#22C55E" opacity="0.8" />
          <circle cx="350" cy="180" r="2.5" fill="white" opacity="0.6" />
        </svg>
      </div>

      {/* Main meter SVG */}
      <svg viewBox="0 0 380 420" fill="none" className="w-full h-auto relative z-10 drop-shadow-2xl">
        <defs>
          <linearGradient id="meterBody" x1="90" y1="40" x2="290" y2="380">
            <stop offset="0%" stopColor="white" stopOpacity="0.18" />
            <stop offset="100%" stopColor="white" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="110" y1="80" x2="270" y2="200">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="100%" stopColor="white" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="barGrad1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Meter body — rounded rectangle */}
        <rect x="70" y="30" width="240" height="340" rx="24" fill="url(#meterBody)" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
        {/* Inner border highlight */}
        <rect x="78" y="38" width="224" height="324" rx="20" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" />

        {/* Top branding strip */}
        <rect x="90" y="50" width="200" height="28" rx="6" fill="white" fillOpacity="0.06" />
        <text x="190" y="69" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" opacity="0.5" letterSpacing="3">ELECTROGRID</text>

        {/* Main screen area */}
        <rect x="90" y="90" width="200" height="180" rx="16" fill="url(#screenGrad)" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />

        {/* Gauge arc background */}
        <path d="M 130 190 A 60 60 0 1 1 250 190" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="8" strokeLinecap="round" />

        {/* Gauge arc filled — animated */}
        <path d="M 130 190 A 60 60 0 1 1 250 190" fill="none" stroke="url(#arcGrad)" strokeWidth="8" strokeLinecap="round" className="animate-arc-fill" filter="url(#glow)" />

        {/* Gauge tick marks */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const angle = -180 + i * (180 / 8)
          const rad = (angle * Math.PI) / 180
          const x1 = 190 + 52 * Math.cos(rad)
          const y1 = 190 + 52 * Math.sin(rad)
          const x2 = 190 + 46 * Math.cos(rad)
          const y2 = 190 + 46 * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" />
        })}

        {/* Center reading */}
        <text x="190" y="178" textAnchor="middle" fill="white" fontFamily="'Plus Jakarta Sans', system-ui" fontSize="32" fontWeight="800" className="animate-digit-count" style={{ animationDelay: '0.8s' }}>
          4,280
        </text>
        <text x="190" y="200" textAnchor="middle" fill="white" fontSize="12" fontWeight="500" opacity="0.5" letterSpacing="1">kWh</text>

        {/* Mini bar chart below gauge */}
        {[
          { x: 118, h: 22 },
          { x: 138, h: 35 },
          { x: 158, h: 28 },
          { x: 178, h: 42 },
          { x: 198, h: 38 },
          { x: 218, h: 30 },
          { x: 238, h: 18 },
        ].map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={255 - bar.h}
            width="14"
            height={bar.h}
            rx="3"
            fill="url(#barGrad1)"
            className="animate-bar-grow"
            style={{ animationDelay: `${1.2 + i * 0.1}s`, transformOrigin: `${bar.x + 7}px 255px` }}
          />
        ))}
        {/* Chart baseline */}
        <line x1="112" y1="258" x2="258" y2="258" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
        {/* Day labels */}
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <text key={i} x={125 + i * 20} y="270" textAnchor="middle" fill="white" fontSize="8" opacity="0.3">{d}</text>
        ))}

        {/* Status LED — bottom of meter */}
        <circle cx="190" cy="310" r="14" fill="#22C55E" opacity="0.15" className="animate-led-glow" />
        <circle cx="190" cy="310" r="5" fill="#22C55E" className="animate-led-pulse" filter="url(#glow)" />

        {/* Status text */}
        <text x="190" y="340" textAnchor="middle" fill="white" fontSize="9" fontWeight="500" opacity="0.4" letterSpacing="2">CONNECTED</text>

        {/* Bottom connector ports */}
        <rect x="130" y="355" width="16" height="10" rx="3" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
        <rect x="172" y="355" width="36" height="10" rx="3" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
        <rect x="234" y="355" width="16" height="10" rx="3" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />

        {/* Floating energy particles */}
        {[
          { cx: 120, delay: '0s' },
          { cx: 160, delay: '1.5s' },
          { cx: 220, delay: '0.8s' },
          { cx: 260, delay: '2.2s' },
        ].map((p, i) => (
          <circle key={i} cx={p.cx} cy="300" r="2" fill="#22C55E" opacity="0.7">
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0 0; ${(i % 2 === 0 ? -1 : 1) * 8} -70; ${(i % 2 === 0 ? -1 : 1) * 12} -100`}
              dur="3.5s"
              begin={p.delay}
              repeatCount="indefinite"
            />
            <animate attributeName="opacity" values="0;0.8;0" dur="3.5s" begin={p.delay} repeatCount="indefinite" />
            <animate attributeName="r" values="0;2.5;0" dur="3.5s" begin={p.delay} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Small bolt icons floating */}
        <g className="animate-bolt-flicker" style={{ animationDelay: '0s' }}>
          <path d="M 80 150 l-3 8h6l-3 8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </g>
        <g className="animate-bolt-flicker" style={{ animationDelay: '1.5s' }}>
          <path d="M 300 120 l-3 8h6l-3 8" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        </g>
        <g className="animate-bolt-flicker" style={{ animationDelay: '3s' }}>
          <path d="M 310 260 l-2.5 7h5l-2.5 7" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
        </g>
      </svg>
    </div>
  )
}

function GridNetwork() {
  return (
    <svg viewBox="0 0 600 60" fill="none" className="w-full opacity-30 mt-6">
      {/* Network nodes and lines */}
      {[50, 150, 250, 350, 450, 550].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="30" r="3" fill="white" className="animate-node-glow" style={{ animationDelay: `${i * 0.4}s` }} />
          {i < 5 && (
            <line x1={x + 6} y1="30" x2={x + 94} y2="30" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
          )}
        </g>
      ))}
      {/* Branch connections */}
      <line x1="150" y1="30" x2="200" y2="8" stroke="white" strokeWidth="0.5" opacity="0.3" />
      <circle cx="200" cy="8" r="2" fill="#22C55E" opacity="0.6" />
      <line x1="350" y1="30" x2="400" y2="52" stroke="white" strokeWidth="0.5" opacity="0.3" />
      <circle cx="400" cy="52" r="2" fill="#F59E0B" opacity="0.6" />
      <line x1="450" y1="30" x2="420" y2="10" stroke="white" strokeWidth="0.5" opacity="0.3" />
      <circle cx="420" cy="10" r="2" fill="white" opacity="0.5" />
    </svg>
  )
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Branded left panel — 2/3 on desktop */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-950 flex-col justify-between p-10 xl:p-14">
        {/* Ambient background effects */}
        <div className="absolute inset-0">
          {/* Large gradient orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/8 blur-[80px]" />
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-teal-400/5 blur-[60px]" />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        {/* Logo — top left */}
        <Link to="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all duration-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-teal-300">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white/90 tracking-tight">ElectroGrid</span>
        </Link>

        {/* Center illustration */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-8">
          <div className="animate-float w-full max-w-[420px]">
            <MeterIllustration />
          </div>
        </div>

        {/* Bottom section — tagline + stats + network */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-end justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-2xl xl:text-3xl font-bold text-white leading-tight">
                Smart energy,<br />at your fingertips.
              </h2>
              <p className="text-teal-300/60 text-sm leading-relaxed max-w-sm">
                Monitor usage, top up your meter, and stay in control of your electricity — all from one place.
              </p>
            </div>
            <div className="flex gap-8 shrink-0 pb-1">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">50K+</p>
                <p className="text-xs text-teal-300/50 mt-0.5">Active meters</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-teal-300/50 mt-0.5">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-xs text-teal-300/50 mt-0.5">Support</p>
              </div>
            </div>
          </div>
          <GridNetwork />
        </div>
      </div>

      {/* Form side — 1/3 */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 p-4 sm:p-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center group-hover:bg-teal-700 transition-colors shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">ElectroGrid</span>
          </Link>
        </header>

        {/* Form container */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 lg:px-10 pb-8 lg:pb-0">
          <div className="w-full max-w-[420px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
