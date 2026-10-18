import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, FlaskConical, Pause, Play, RotateCcw } from 'lucide-react'
import CodeEditor from '../components/CodeEditor'
import MemoryView from '../components/MemoryView'
import { Feedback, PageHeader, VIRTUAL_NOTE } from '../components/ui'
import { runProgram, SAMPLES } from '../engine/interpreter'
import type { RunResult } from '../engine/types'
import { useProgress } from '../store/progress'

export default function Playground() {
  const pending = useProgress((s) => s.pendingCode)
  const setPending = useProgress((s) => s.setPendingCode)
  const addRun = useProgress((s) => s.addRun)
  const setLastTopic = useProgress((s) => s.setLastTopic)

  const [code, setCode] = useState(() => pending ?? SAMPLES[0].code)
  const [result, setResult] = useState<RunResult | null>(null)
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setLastTopic('Memory Playground')
    if (pending) setPending(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const steps = result?.steps ?? []
  const last = steps.length - 1
  const step = steps[idx]
  const errors = result?.errors ?? []

  useEffect(() => {
    if (!playing) return
    if (idx >= last) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setIdx((i) => i + 1), 1100)
    return () => clearTimeout(t)
  }, [playing, idx, last])

  const analyze = (): RunResult => {
    const r = runProgram(code)
    setResult(r)
    setIdx(0)
    if (r.errors.length === 0) addRun()
    return r
  }

  const run = () => {
    if (playing) return setPlaying(false)
    let r = result
    let start = idx
    if (!r) {
      r = analyze()
      start = 0
    } else if (idx >= last) {
      start = 0
    }
    if (r.errors.length === 0) {
      setIdx(start)
      setPlaying(true)
    }
  }
  const next = () => {
    setPlaying(false)
    if (!result) {
      const r = analyze()
      if (r.errors.length === 0) setIdx(1)
      return
    }
    setIdx((i) => Math.min(i + 1, last))
  }
  const prev = () => {
    setPlaying(false)
    setIdx((i) => Math.max(i - 1, 0))
  }
  const reset = () => {
    setPlaying(false)
    setResult(null)
    setIdx(0)
  }
  const edit = (v: string) => {
    setCode(v)
    setResult(null)
    setIdx(0)
    setPlaying(false)
  }

  const memory = step?.memory ?? []
  const stepKey = useMemo(() => `${idx}-${result ? steps.length : 0}`, [idx, result, steps.length])

  return (
    <div>
      <PageHeader
        eyebrow="Memory Playground"
        title="Kodu yaz, belleği izle"
        subtitle="Basitleştirilmiş bir C yorumlayıcısı kodunu adım adım çalıştırır; her adımda belleğin anlık görüntüsünü (snapshot) gösterir."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Sol: editör */}
        <section className="card flex flex-col p-4" aria-label="Kod editörü">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={run}>
              {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Duraklat' : 'Çalıştır'}
            </button>
            <button className="btn" onClick={prev} disabled={!result || idx === 0}>
              <ChevronLeft size={16} /> Önceki Adım
            </button>
            <button className="btn" onClick={next} disabled={!!result && (idx >= last || errors.length > 0)}>
              Sonraki Adım <ChevronRight size={16} />
            </button>
            <button className="btn" onClick={reset} disabled={!result}>
              <RotateCcw size={16} /> Sıfırla
            </button>
            <label className="ml-auto flex items-center gap-2 text-sm text-slate-300">
              <FlaskConical size={16} className="text-cyan" />
              <span className="sr-only">Örnek Yükle</span>
              <select
                className="input py-1.5"
                aria-label="Örnek Yükle"
                value=""
                onChange={(e) => {
                  const i = Number(e.target.value)
                  if (!Number.isNaN(i)) edit(SAMPLES[i].code)
                }}
              >
                <option value="">Örnek Yükle…</option>
                {SAMPLES.map((s, i) => (
                  <option key={s.title} value={i}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-hidden rounded-lg border border-line">
            <CodeEditor value={code} onChange={edit} activeLine={step?.line ?? 0} activeKind={step?.status} errors={errors} height={300} />
          </div>

          <div className="mt-3 space-y-2.5">
            {errors.length > 0 && (
              <Feedback kind="bad" title="Kod çalıştırılamadı">
                <ul className="space-y-1.5">
                  {errors.map((e, i) => (
                    <li key={i}>
                      <span className="font-mono text-bad">Satır {e.line}</span>
                      <span className="mx-1.5 rounded bg-slate-800 px-1.5 text-xs">{e.kind === 'unsupported' ? 'desteklenmiyor' : e.kind === 'syntax' ? 'sözdizimi' : 'anlam hatası'}</span>
                      {e.message}
                    </li>
                  ))}
                </ul>
              </Feedback>
            )}
            {!result && <Feedback kind="info">Kodu düzenleyebilirsin. <b>Çalıştır</b> ile otomatik oynat, <b>Sonraki Adım</b> ile tek tek ilerle.</Feedback>}
            {step && errors.length === 0 && (
              <Feedback kind={step.status === 'ub' ? 'warn' : 'info'} title={`Adım ${idx} / ${last}${step.line ? ` · Satır ${step.line}` : ''}`}>
                {step.explanation}
              </Feedback>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Desteklenen: <code>int</code>/<code>int *</code> bildirimi, atama, <code>&amp;</code>, <code>*</code>, <code>+ - * / %</code>, <code>NULL</code>, <code>+= -=</code>. Diğer sözdizimi açıklamalı hata verir.
          </p>
        </section>

        {/* Sağ: bellek */}
        <section className="card p-4" aria-label="Bellek görselleştirmesi">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="h-section !mb-0">Bellek (RAM)</h2>
            <div className="flex gap-3 text-xs">
              <span className="chip bg-cyan/20 text-cyan">int</span>
              <span className="chip bg-ptr/25 text-ptr">int* (pointer)</span>
            </div>
          </div>
          <MemoryView memory={memory} changed={step?.changed} stepKey={stepKey} />
          <div className="mt-4 rounded-lg border border-line bg-ink/60 p-3 text-xs leading-relaxed text-slate-400">
            <b className="text-slate-200">Dikkat:</b> Bir pointer kartında iki farklı adres vardır. <b className="text-slate-200">Kendi adresi</b> pointer değişkeninin bellekteki yeri,
            <b className="text-ptr"> içindeki değer</b> ise gösterdiği değişkenin adresidir. Ok bu ikinci adresi izler.
            <div className="mt-1.5">{VIRTUAL_NOTE}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
