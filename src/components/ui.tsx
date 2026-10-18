import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'

export function PageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function Feedback({ kind, title, children }: { kind: 'ok' | 'bad' | 'info' | 'warn'; title?: string; children: ReactNode }) {
  const map = {
    ok: { cls: 'border-ok/50 bg-ok/10', icon: <CheckCircle2 className="text-ok" size={20} /> },
    bad: { cls: 'border-bad/50 bg-bad/10', icon: <XCircle className="text-bad" size={20} /> },
    info: { cls: 'border-cyan/40 bg-cyan/10', icon: <Info className="text-cyan" size={20} /> },
    warn: { cls: 'border-warn/50 bg-warn/10', icon: <AlertTriangle className="text-warn" size={20} /> },
  }[kind]
  return (
    <div role={kind === 'bad' || kind === 'warn' ? 'alert' : 'status'} aria-live="polite" className={`flex gap-3 rounded-xl border p-3.5 text-sm ${map.cls}`}>
      <div className="mt-0.5 shrink-0">{map.icon}</div>
      <div>
        {title && <div className="mb-0.5 font-semibold text-white">{title}</div>}
        <div className="leading-relaxed text-slate-200">{children}</div>
      </div>
    </div>
  )
}

export function Bar({ value, color = 'from-cyan to-indigo-500', label }: { value: number; color?: string; label?: string }) {
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-[13px] leading-6 text-slate-200">
      <code>{children}</code>
    </pre>
  )
}

export const VIRTUAL_NOTE =
  'Not: Bu adresler gerçek bilgisayar belleğindeki adresler değildir; öğrenmeyi kolaylaştırmak için üretilmiş sanal (eğitim amaçlı) adreslerdir.'
