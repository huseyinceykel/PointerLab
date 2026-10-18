import { useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { MemoryCell } from '../engine/types'
import { fmtAddr } from '../engine/interpreter'

interface Props {
  memory: MemoryCell[]
  /** Son adımda değişen hücreler (kısa süre vurgulanır). */
  changed?: string[]
  /** Vurguyu yeniden tetiklemek için her adımda değişen anahtar. */
  stepKey?: string | number
  /** Hücre adres rozetine tıklanınca (ör. adres seçme görevi). */
  onAddressClick?: (cell: MemoryCell) => void
  /** Kart gövdesine tıklanınca (ör. bağlantı kurma). */
  onCellClick?: (cell: MemoryCell) => void
  selected?: string | null
  emptyText?: string
  compact?: boolean
}

interface Arrow {
  id: string
  d: string
}

export default function MemoryView({ memory, changed = [], stepKey = 0, onAddressClick, onCellClick, selected, emptyText, compact }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const [arrows, setArrows] = useState<Arrow[]>([])

  const links = memory.filter((c) => c.type === 'int*' && c.pointsTo !== undefined)
  const linkSig = links.map((l) => `${l.name}>${l.pointsTo}`).join('|') + '#' + memory.length

  useLayoutEffect(() => {
    const compute = () => {
      const root = wrap.current
      if (!root) return
      const rr = root.getBoundingClientRect()
      const next: Arrow[] = []
      links.forEach((l, lane) => {
        const target = memory.find((c) => c.address === l.pointsTo)
        const a = refs.current[l.name]
        const b = target && refs.current[target.name]
        if (!a || !b) return
        const ra = a.getBoundingClientRect()
        const rb = b.getBoundingClientRect()
        const x1 = ra.right - rr.left
        const y1 = ra.top + ra.height / 2 - rr.top
        const x2 = rb.right - rr.left + 3
        const y2 = rb.top + rb.height / 2 - rr.top
        const off = 46 + lane * 18
        next.push({ id: l.name, d: `M ${x1} ${y1} C ${x1 + off} ${y1}, ${x2 + off} ${y2}, ${x2} ${y2}` })
      })
      setArrows(next)
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (wrap.current) ro.observe(wrap.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkSig])

  if (memory.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-line p-6 text-center text-sm text-slate-400">
        {emptyText ?? 'Bellek şu an boş. Kod çalıştıkça değişkenler burada oluşacak.'}
      </div>
    )
  }

  return (
    <div ref={wrap} className="relative pr-24" role="group" aria-label="Bellek görünümü">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {arrows.map((a) => (
          <motion.path
            key={a.id}
            initial={{ d: a.d, pathLength: 0, opacity: 0 }}
            animate={{ d: a.d, pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={2.5}
            strokeLinecap="round"
            markerEnd="url(#pl-arrow)"
          />
        ))}
        <defs>
          <marker id="pl-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a78bfa" />
          </marker>
        </defs>
      </svg>

      <ul className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        {memory.map((c) => {
          const isPtr = c.type === 'int*'
          const flash = changed.includes(c.name)
          const target = isPtr && c.pointsTo !== undefined ? memory.find((m) => m.address === c.pointsTo) : undefined
          return (
            <motion.li
              key={c.name}
              layout
              initial={{ opacity: 0, x: -16, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              ref={(el: HTMLLIElement | null) => {
                refs.current[c.name] = el
              }}
            >
              <div
                key={flash ? `f-${stepKey}` : 'n'}
                onClick={onCellClick ? () => onCellClick(c) : undefined}
                onKeyDown={
                  onCellClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onCellClick(c)
                        }
                      }
                    : undefined
                }
                role={onCellClick ? 'button' : undefined}
                tabIndex={onCellClick ? 0 : undefined}
                aria-label={`${c.name}, tür ${c.type}, adres ${fmtAddr(c.address)}`}
                className={`rounded-xl border-2 px-4 py-2.5 transition ${flash ? 'flash' : ''} ${
                  isPtr ? 'border-ptr/70 bg-ptr/10' : 'border-cyan/50 bg-cyan/5'
                } ${selected === c.name ? 'ring-2 ring-warn' : ''} ${onCellClick ? 'cursor-pointer hover:brightness-125 focus-visible:outline-2 focus-visible:outline-warn' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold">{c.name}</span>
                  <span className={`chip ${isPtr ? 'bg-ptr/25 text-ptr' : 'bg-cyan/20 text-cyan'}`}>{c.type}</span>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-400">{isPtr ? 'Kendi adresi' : 'Adres'}</div>
                    {onAddressClick ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddressClick(c)
                        }}
                        className="mt-0.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-slate-100 hover:bg-warn hover:text-slate-900"
                      >
                        {fmtAddr(c.address)}
                      </button>
                    ) : (
                      <div className="font-mono text-sm text-slate-200">{fmtAddr(c.address)}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-400">{isPtr ? 'İçindeki değer (tuttuğu adres)' : 'Değer'}</div>
                    <div className={`font-mono text-sm ${isPtr ? 'text-ptr' : 'text-slate-100'}`}>
                      {c.value === null ? (
                        <span className="text-warn">? (belirsiz)</span>
                      ) : isPtr ? (
                        c.value === 0 ? (
                          <span className="text-bad">NULL (0)</span>
                        ) : (
                          <>
                            {fmtAddr(c.value)}
                            {target && <span className="text-slate-400"> → {target.name}</span>}
                          </>
                        )
                      ) : (
                        <span className="text-lg font-bold">{c.value}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
