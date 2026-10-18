import { useMemo, useState } from 'react'
import { Check, Eraser, Undo2 } from 'lucide-react'
import MemoryView from './MemoryView'
import { Feedback } from './ui'
import { runProgram } from '../engine/interpreter'
import type { MemoryCell } from '../engine/types'

export interface GoalResult {
  ok: boolean
  message: string
}

interface Props {
  instruction: string
  /** Önceden yazılmış (değiştirilemez) başlangıç kodu. */
  base: string
  /** Öğrencinin ekleyebileceği ifadeler (bazıları bilerek hatalı/yanlıştır). */
  chips: string[]
  goal: (ctx: { memory: MemoryCell[]; chosen: string[] }) => GoalResult
  onSuccess: () => void
  onMistake: () => void
  done?: boolean
  /** Hedef durumu gösteren isteğe bağlı panel. */
  target?: React.ReactNode
}

export default function ChipActivity({ instruction, base, chips, goal, onSuccess, onMistake, done, target }: Props) {
  const [chosen, setChosen] = useState<string[]>([])
  const [fb, setFb] = useState<{ kind: 'ok' | 'bad' | 'warn'; text: string } | null>(null)

  const program = [base, ...chosen].filter(Boolean).join('\n')
  const run = useMemo(() => runProgram(program), [program])
  const last = run.steps[run.steps.length - 1]
  const baseLines = base ? base.split('\n').length : 0

  const check = () => {
    if (run.errors.length > 0) {
      onMistake()
      return setFb({ kind: 'bad', text: `Bu program C'de derlenmezdi — ${run.errors[0].message}` })
    }
    if (last.status === 'ub') {
      onMistake()
      return setFb({ kind: 'warn', text: last.explanation })
    }
    const r = goal({ memory: last.memory, chosen })
    if (r.ok) {
      setFb({ kind: 'ok', text: r.message })
      onSuccess()
    } else {
      onMistake()
      setFb({ kind: 'bad', text: r.message })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-200">{instruction}</p>
      {target}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="h-section">Programın</div>
          <pre className="rounded-lg border border-line bg-ink p-3 font-mono text-[13px] leading-6" aria-label="Program kodu">
            {base.split('\n').filter(Boolean).map((l, i) => (
              <div key={'b' + i} className="text-slate-500">
                <span className="mr-3 select-none text-slate-600">{i + 1}</span>
                {l}
              </div>
            ))}
            {chosen.map((l, i) => (
              <div key={'c' + i} className="text-cyan">
                <span className="mr-3 select-none text-slate-600">{baseLines + i + 1}</span>
                {l}
              </div>
            ))}
            {chosen.length === 0 && <div className="text-slate-600">{'// aşağıdan ifade ekle'}</div>}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Eklenebilir ifadeler">
            {chips.map((c) => (
              <button key={c} type="button" className="btn font-mono !text-[13px]" onClick={() => { setChosen((x) => [...x, c]); setFb(null) }}>
                + {c}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn" onClick={() => { setChosen((x) => x.slice(0, -1)); setFb(null) }} disabled={!chosen.length}>
              <Undo2 size={15} /> Geri al
            </button>
            <button className="btn" onClick={() => { setChosen([]); setFb(null) }} disabled={!chosen.length}>
              <Eraser size={15} /> Temizle
            </button>
            <button className="btn btn-primary ml-auto" onClick={check} disabled={!chosen.length}>
              <Check size={16} /> Kontrol Et
            </button>
          </div>
        </div>
        <div>
          <div className="h-section">Sonuçta bellek</div>
          {run.errors.length > 0 ? (
            <Feedback kind="bad" title={`Satır ${run.errors[0].line}: derleme hatası`}>
              {run.errors[0].message}
            </Feedback>
          ) : (
            <MemoryView memory={last.memory} changed={last.changed} stepKey={chosen.length} />
          )}
        </div>
      </div>
      {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
      {done && !fb && <Feedback kind="ok">Bu etkinliği daha önce tamamladın. İstersen tekrar deneyebilirsin.</Feedback>}
    </div>
  )
}
