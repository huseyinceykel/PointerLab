import { useEffect, useState } from 'react'
import { Bug as BugIcon, CheckCircle2, FlaskConical, RotateCcw } from 'lucide-react'
import { BUGS } from '../content/bugs'
import type { Bug, Opt } from '../content/bugs'
import { Code, Feedback, PageHeader } from '../components/ui'
import { Rich } from '../components/Rich'
import { useProgress } from '../store/progress'

export default function BugHunter({ go }: { go: (to: string) => void }) {
  const p = useProgress()
  const [active, setActive] = useState(() => Math.max(0, BUGS.findIndex((b) => !p.bugs[b.id])))
  useEffect(() => p.setLastTopic('Bug Hunter'), [p.setLastTopic]) // eslint-disable-line react-hooks/exhaustive-deps
  const bug = BUGS[active]
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Bug Hunter" title="Pointer hata avcısı" subtitle="Hatayı bul, nedenini anla, doğru düzeltmeyi seç. Her senaryo bir öğrenme kazanımına bağlıdır." />
      <nav className="flex flex-wrap gap-2" aria-label="Senaryolar">
        {BUGS.map((b, i) => (
          <button key={b.id} onClick={() => setActive(i)} aria-current={i === active} className={`btn ${i === active ? '!border-cyan !bg-cyan/15' : ''}`}>
            {p.bugs[b.id] ? <CheckCircle2 size={15} className="text-ok" /> : <BugIcon size={15} className="text-slate-500" />} {b.title}
          </button>
        ))}
      </nav>
      <BugCase key={bug.id} bug={bug} done={!!p.bugs[bug.id]} go={go} />
    </div>
  )
}

function Choice({ opts, picked, correct, onPick, label }: { opts: Opt[]; picked: number | null; correct: number; onPick: (i: number) => void; label: string }) {
  return (
    <div>
      <div className="grid gap-2" role="radiogroup" aria-label={label}>
        {opts.map((o, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={picked === i}
            onClick={() => onPick(i)}
            className={`whitespace-pre-wrap rounded-lg border px-3.5 py-2.5 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-cyan ${
              picked === i ? (i === correct ? 'border-ok bg-ok/10' : 'border-bad bg-bad/10') : 'border-line bg-panel2 hover:border-cyan/60'
            } ${o.text.includes('\n') ? 'font-mono text-[13px]' : ''}`}
          >
            <Rich text={o.text} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="mt-3">
          <Feedback kind={picked === correct ? 'ok' : 'bad'} title={picked === correct ? 'Doğru!' : 'Tam olarak değil'}>
            <Rich text={opts[picked].why} />
          </Feedback>
        </div>
      )}
    </div>
  )
}

function BugCase({ bug, done, go }: { bug: Bug; done: boolean; go: (to: string) => void }) {
  const p = useProgress()
  const [prob, setProb] = useState<number | null>(null)
  const [fix, setFix] = useState<number | null>(null)
  const solvedProblem = prob === bug.correctProblem
  const solvedFix = fix === bug.correctFix
  const finished = solvedProblem && solvedFix

  useEffect(() => {
    if (finished) p.completeBug(bug.id)
  }, [finished]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="card space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{bug.title}</h2>
        <span className="chip bg-slate-800 text-slate-300">+15 puan</span>
      </div>
      <div>
        <div className="h-section">Hatalı kod</div>
        <Code>{bug.code}</Code>
      </div>
      <div>
        <div className="h-section">1) {bug.question}</div>
        <Choice
          label={bug.question}
          opts={bug.problems}
          correct={bug.correctProblem}
          picked={prob}
          onPick={(i) => {
            setProb(i)
            if (i !== bug.correctProblem) p.addMistake(bug.concept)
          }}
        />
      </div>
      {solvedProblem && (
        <div>
          <div className="h-section">2) {bug.fixQuestion}</div>
          <Choice
            label={bug.fixQuestion}
            opts={bug.fixes}
            correct={bug.correctFix}
            picked={fix}
            onPick={(i) => {
              setFix(i)
              if (i !== bug.correctFix) p.addMistake(bug.concept)
            }}
          />
        </div>
      )}
      {(finished || done) && (
        <div className="space-y-3 rounded-xl border border-ok/40 bg-ok/5 p-4">
          <h3 className="font-semibold text-white">Bug çözüldü 🎯</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div><div className="h-section">Doğru çözüm</div><Code>{bug.fixedCode}</Code></div>
            <div className="space-y-2 text-sm text-slate-300">
              <p><b className="text-white">Hatanın sebebi:</b> {bug.cause}</p>
              <p><b className="text-white">Öğrenme kazanımı:</b> {bug.outcome}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {bug.simCode && (
          <button className="btn" onClick={() => { p.setPendingCode(bug.simCode!); go('playground') }}>
            <FlaskConical size={15} /> Hatalı kodu simülatörde dene
          </button>
        )}
        {(prob !== null || fix !== null) && (
          <button className="btn" onClick={() => { setProb(null); setFix(null) }}><RotateCcw size={15} /> Yeniden dene</button>
        )}
      </div>
    </section>
  )
}
