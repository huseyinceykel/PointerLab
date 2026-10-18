import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { POST_TEST, PRE_TEST } from '../content/tests'
import type { Question } from '../content/tests'
import { CONCEPT_LABELS, download, exportCsv, exportPayload, useProgress } from '../store/progress'
import type { AnswerRecord, Concept, TestResult } from '../store/progress'
import { Bar, Feedback, PageHeader } from '../components/ui'
import { Rich } from '../components/Rich'

type Kind = 'pre' | 'post'

export default function Assessment() {
  const p = useProgress()
  const [tab, setTab] = useState<Kind | 'compare'>('pre')
  useEffect(() => p.setLastTopic('Ön Test / Son Test'), [p.setLastTopic]) // eslint-disable-line react-hooks/exhaustive-deps
  const lessonsDone = Object.values(p.lessons).filter(Boolean).length

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Assessment" title="Ön Test ve Son Test" subtitle="Öğrenmeyi ölçmek için aynı kazanımları ölçen iki farklı 10 soruluk test. Sonuçlar yalnızca bu tarayıcıda saklanır." />
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="pc" className="text-sm text-slate-300">Katılımcı kodu <span className="text-slate-500">(isteğe bağlı, kişisel bilgi yazma)</span></label>
        <input id="pc" className="input w-44" placeholder="örn. K07" value={p.participantCode} onChange={(e) => p.setParticipant(e.target.value)} />
        <div className="ml-auto flex gap-2">
          <button className="btn" disabled={!p.pre && !p.post} onClick={() => download('pointerlab-sonuclar.json', JSON.stringify(exportPayload(p), null, 2), 'application/json')}><FileJson size={15} /> JSON</button>
          <button className="btn" disabled={!p.pre && !p.post} onClick={() => download('pointerlab-sonuclar.csv', exportCsv(p), 'text/csv')}><FileSpreadsheet size={15} /> CSV</button>
        </div>
      </div>
      <div className="flex gap-2" role="tablist">
        {([['pre', 'Ön Test'], ['post', 'Son Test'], ['compare', 'Karşılaştırma']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`btn ${tab === k ? '!border-cyan !bg-cyan/15' : ''}`}>{l}</button>
        ))}
      </div>
      {tab === 'pre' && <TestRunner key="pre" kind="pre" questions={PRE_TEST} />}
      {tab === 'post' && (
        <>
          {lessonsDone < 6 && <Feedback kind="info">Son testi dersleri bitirdikten sonra çözmeni öneririz (şu an {lessonsDone}/6 ders tamamlandı). Yine de çözebilirsin.</Feedback>}
          <TestRunner key="post" kind="post" questions={POST_TEST} />
        </>
      )}
      {tab === 'compare' && <Compare pre={p.pre} post={p.post} />}
    </div>
  )
}

function TestRunner({ kind, questions }: { kind: Kind; questions: Question[] }) {
  const result = useProgress((s) => s[kind])
  const saveTest = useProgress((s) => s.saveTest)
  const addMistake = useProgress((s) => s.addMistake)
  const [running, setRunning] = useState(false)
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const startedAt = useRef(0)

  const start = () => {
    setRunning(true)
    setI(0)
    setAnswers([])
    startedAt.current = Date.now()
  }
  const finish = (ans: number[]) => {
    const records: AnswerRecord[] = questions.map((q, k) => ({ qid: q.id, concept: q.concept, chosen: ans[k], correct: ans[k] === q.correct }))
    const byConcept: TestResult['byConcept'] = {}
    for (const r of records) {
      const c = (byConcept[r.concept] ??= { correct: 0, total: 0 })
      c.total++
      if (r.correct) c.correct++
      else addMistake(r.concept)
    }
    const correct = records.filter((r) => r.correct).length
    saveTest({
      kind,
      takenAt: new Date().toISOString(),
      correct,
      total: questions.length,
      percent: Math.round((correct / questions.length) * 100),
      byConcept,
      answers: records,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
    })
    setRunning(false)
  }

  if (running) {
    const q = questions[i]
    const chosen = answers[i]
    return (
      <section className="card p-5" aria-label={`${kind === 'pre' ? 'Ön' : 'Son'} test, soru ${i + 1}`}>
        <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
          <span>Soru {i + 1} / {questions.length}</span>
          <span>{CONCEPT_LABELS[q.concept]}</span>
        </div>
        <Bar value={((i + 1) / questions.length) * 100} label="Test ilerlemesi" />
        <p className="mb-4 mt-5 text-base font-medium text-white"><Rich text={q.text} /></p>
        <div className="grid gap-2" role="radiogroup" aria-label={q.text}>
          {q.options.map((o, k) => (
            <button key={k} role="radio" aria-checked={chosen === k} onClick={() => setAnswers((a) => { const n = [...a]; n[i] = k; return n })}
              className={`rounded-lg border px-3.5 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-cyan ${chosen === k ? 'border-cyan bg-cyan/15' : 'border-line bg-panel2 hover:border-cyan/50'}`}>
              <span className="mr-2 font-mono text-slate-500">{String.fromCharCode(65 + k)}.</span><Rich text={o} />
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-between">
          <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>Geri</button>
          {i < questions.length - 1 ? (
            <button className="btn btn-primary" disabled={chosen === undefined} onClick={() => setI(i + 1)}>İleri <ArrowRight size={15} /></button>
          ) : (
            <button className="btn btn-primary" disabled={answers.filter((a) => a !== undefined).length < questions.length} onClick={() => finish(answers)}>Testi Bitir</button>
          )}
        </div>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="card p-6 text-center">
        <p className="mb-1 text-lg font-semibold text-white">{kind === 'pre' ? 'Ön Test' : 'Son Test'}</p>
        <p className="mx-auto mb-5 max-w-md text-sm text-slate-400">10 çoktan seçmeli soru. Test sırasında doğru/yanlış gösterilmez; sonunda her sorunun açıklaması verilir. Henüz çözülmedi.</p>
        <button className="btn btn-primary" onClick={start}>Teste Başla</button>
      </section>
    )
  }
  return <ResultView result={result} questions={questions} onRetake={start} />
}

function ResultView({ result, questions, onRetake }: { result: TestResult; questions: Question[]; onRetake: () => void }) {
  const wrong = result.total - result.correct
  const concepts = Object.entries(result.byConcept) as [Concept, { correct: number; total: number }][]
  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Doğru" value={String(result.correct)} />
          <Stat label="Yanlış" value={String(wrong)} />
          <Stat label="Başarı" value={`%${result.percent}`} />
          <Stat label="Süre" value={`${Math.floor(result.durationSec / 60)}dk ${result.durationSec % 60}sn`} />
        </div>
        <div className="mt-5 space-y-2.5">
          <div className="h-section">Konu bazlı sonuç</div>
          {concepts.map(([c, v]) => (
            <div key={c}>
              <div className="mb-1 flex justify-between text-sm"><span>{CONCEPT_LABELS[c]}</span><span className="text-slate-400">{v.correct}/{v.total}</span></div>
              <Bar value={(v.correct / v.total) * 100} color={v.correct === v.total ? 'from-ok to-cyan' : 'from-warn to-bad'} label={CONCEPT_LABELS[c]} />
            </div>
          ))}
        </div>
        <button className="btn mt-5" onClick={onRetake}><Download size={15} className="rotate-180" /> Testi tekrar çöz</button>
      </section>
      <section className="card p-5">
        <div className="h-section">Soru soru inceleme</div>
        <ol className="space-y-3">
          {questions.map((q, k) => {
            const a = result.answers[k]
            return (
              <li key={q.id} className={`rounded-lg border p-3 text-sm ${a.correct ? 'border-ok/40' : 'border-bad/40'}`}>
                <div className="font-medium text-white">{k + 1}. <Rich text={q.text} /></div>
                <div className="mt-1 text-slate-300">Cevabın: <b>{q.options[a.chosen]}</b> {a.correct ? '✔' : '✘'}</div>
                {!a.correct && <div className="text-slate-300">Doğru cevap: <b>{q.options[q.correct]}</b></div>}
                <div className="mt-1 text-slate-400"><Rich text={q.explanation} /></div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink/60 p-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

export function Compare({ pre, post }: { pre: TestResult | null; post: TestResult | null }) {
  const concepts = useMemo(() => {
    const set = new Set<Concept>()
    for (const t of [pre, post]) t && (Object.keys(t.byConcept) as Concept[]).forEach((c) => set.add(c))
    return [...set]
  }, [pre, post])
  if (!pre && !post) return <Feedback kind="info">Henüz hiçbir test çözülmedi. Karşılaştırma için ön ve son testi çöz.</Feedback>
  const pct = (t: TestResult | null, c: Concept) => (t?.byConcept[c] ? Math.round((t.byConcept[c]!.correct / t.byConcept[c]!.total) * 100) : null)
  return (
    <section className="card space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Ön test" value={pre ? `%${pre.percent}` : 'Çözülmedi'} />
        <Stat label="Son test" value={post ? `%${post.percent}` : 'Çözülmedi'} />
        <Stat label="Fark" value={pre && post ? `${post.percent - pre.percent >= 0 ? '+' : ''}${post.percent - pre.percent} puan` : '—'} />
      </div>
      {(!pre || !post) && <Feedback kind="info">Karşılaştırma için hem ön hem son test gerekir. {pre ? 'Son test henüz çözülmedi.' : 'Ön test henüz çözülmedi.'}</Feedback>}
      <div className="space-y-3">
        {concepts.map((c) => (
          <div key={c}>
            <div className="mb-1 text-sm">{CONCEPT_LABELS[c]}</div>
            <div className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-2 text-xs text-slate-400">
              <span>Ön</span><Bar value={pct(pre, c) ?? 0} color="from-slate-500 to-slate-400" label={`${CONCEPT_LABELS[c]} ön test`} /><span>{pct(pre, c) === null ? '—' : `%${pct(pre, c)}`}</span>
              <span>Son</span><Bar value={pct(post, c) ?? 0} label={`${CONCEPT_LABELS[c]} son test`} /><span>{pct(post, c) === null ? '—' : `%${pct(post, c)}`}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
