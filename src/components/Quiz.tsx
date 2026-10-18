import { useState } from 'react'
import { Feedback } from './ui'
import { Rich } from './Rich'

interface Opt {
  text: string
  why: string
}

export default function Quiz({
  question,
  options,
  correct,
  onAnswer,
  done,
}: {
  question: string
  options: Opt[]
  correct: number
  onAnswer: (ok: boolean) => void
  done?: boolean
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const ok = picked === correct
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-100"><Rich text={question} /></p>
      <div className="grid gap-2" role="radiogroup" aria-label={question}>
        {options.map((o, i) => {
          const sel = picked === i
          const showOk = picked !== null && i === correct
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => {
                setPicked(i)
                onAnswer(i === correct)
              }}
              className={`rounded-lg border px-3.5 py-2.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-cyan ${
                sel && !ok ? 'border-bad bg-bad/10' : showOk ? 'border-ok bg-ok/10' : 'border-line bg-panel2 hover:border-cyan/60'
              }`}
            >
              <span className="mr-2 font-mono text-slate-500">{String.fromCharCode(65 + i)}.</span>
              <Rich text={o.text} />
            </button>
          )
        })}
      </div>
      <div className="mt-3">
        {picked !== null && (
          <Feedback kind={ok ? 'ok' : 'bad'} title={ok ? 'Doğru!' : 'Tam olarak değil'}>
            <Rich text={options[picked].why} />
            {!ok && <div className="mt-1.5 text-slate-300">Doğru cevap: <b>{String.fromCharCode(65 + correct)}</b> — <Rich text={options[correct].why} /></div>}
          </Feedback>
        )}
        {picked === null && done && <Feedback kind="ok">Bu soruyu daha önce doğru yanıtladın.</Feedback>}
      </div>
    </div>
  )
}
