import { lazy, Suspense } from 'react'
import { MotionConfig } from 'framer-motion'
import { Bug, ClipboardCheck, Cpu, FlaskConical, GraduationCap, LayoutDashboard, Puzzle as PuzzleIcon, TrendingUp } from 'lucide-react'
import { useRoute } from './router'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import Puzzle from './pages/Puzzle'
import BugHunter from './pages/BugHunter'
import Assessment from './pages/Assessment'
import Progress from './pages/Progress'

const Playground = lazy(() => import('./pages/Playground'))

const NAV = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'learn', label: 'Learn', icon: GraduationCap },
  { to: 'playground', label: 'Memory Playground', icon: FlaskConical },
  { to: 'puzzle', label: 'Pointer Puzzle', icon: PuzzleIcon },
  { to: 'bugs', label: 'Bug Hunter', icon: Bug },
  { to: 'assessment', label: 'Ön Test / Son Test', icon: ClipboardCheck },
  { to: 'progress', label: 'Learning Progress', icon: TrendingUp },
]

export default function App() {
  const [route, go] = useRoute()
  const [section, arg] = route.split('/')
  const active = NAV.some((n) => n.to === section) ? section : 'dashboard'

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-full lg:pl-64">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-cyan focus:px-3 focus:py-1 focus:text-slate-900">İçeriğe geç</a>
        <aside className="border-b border-line bg-panel/90 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 px-4 py-3 lg:py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan to-indigo-500 text-slate-950"><Cpu size={20} /></span>
            <div>
              <div className="font-bold leading-none text-white">PointerLab</div>
              <div className="text-[11px] text-slate-400">C Pointer Öğrenme Platformu</div>
            </div>
          </div>
          <nav aria-label="Ana gezinme" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible lg:px-3">
            {NAV.map((n) => (
              <button
                key={n.to}
                onClick={() => go(n.to)}
                aria-current={active === n.to ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-cyan ${active === n.to ? 'bg-cyan/15 font-semibold text-cyan' : 'text-slate-300 hover:bg-white/5'}`}
              >
                <n.icon size={17} /> <span className="whitespace-nowrap">{n.label}</span>
              </button>
            ))}
          </nav>
        </aside>
        <main id="main" className="mx-auto max-w-7xl p-4 md:p-8">
          {active === 'dashboard' && <Dashboard go={go} />}
          {active === 'learn' && <Learn lessonId={arg ? Number(arg) : null} go={go} />}
          {active === 'playground' && (
            <Suspense fallback={<div className="p-10 text-center text-slate-400">Editör yükleniyor…</div>}>
              <Playground />
            </Suspense>
          )}
          {active === 'puzzle' && <Puzzle />}
          {active === 'bugs' && <BugHunter go={go} />}
          {active === 'assessment' && <Assessment />}
          {active === 'progress' && <Progress />}
        </main>
      </div>
    </MotionConfig>
  )
}
