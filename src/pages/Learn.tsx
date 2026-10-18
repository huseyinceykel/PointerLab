import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'
import { LESSONS, LESSON_CHIPS } from '../content/lessons'
import type { Lesson } from '../content/lessons'
import { runProgram } from '../engine/interpreter'
import MemoryView from '../components/MemoryView'
import ChipActivity from '../components/ChipActivity'
import Quiz from '../components/Quiz'
import { ArrayActivity, ArrayVisual } from '../components/ArrayDemo'
import { Rich } from '../components/Rich'
import { Code, Feedback, PageHeader, VIRTUAL_NOTE } from '../components/ui'
import { useProgress } from '../store/progress'

export default function Learn({ lessonId, go }: { lessonId: number | null; go: (to: string) => void }) {
  const lessons = useProgress((s) => s.lessons)
  if (lessonId === null) {
    return (
      <div>
        <PageHeader eyebrow="Learn" title="Etkileşimli Dersler" subtitle="6 ders: her birinde kısa anlatım, canlı animasyon, uygulama etkinliği ve mini değerlendirme var. Sırayla ilerlemeni öneririz." />
        <ol className="grid gap-4 md:grid-cols-2">
          {LESSONS.map((l, i) => {
            const done = lessons[l.id]
            return (
              <li key={l.id}>
                <button onClick={() => go(`learn/${l.id}`)} className="card group flex h-full w-full items-start gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan/60">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold ${done ? 'bg-ok/20 text-ok' : 'bg-cyan/15 text-cyan'}`}>{done ? <CheckCircle2 size={20} /> : i + 1}</span>
                  <span>
                    <span className="block font-semibold text-white">Ders {l.id} — {l.title}</span>
                    <span className="mt-1 block text-sm text-slate-400">{l.summary}</span>
                    <span className="mt-2 block text-xs text-slate-500">{done ? 'Tamamlandı' : 'Başlanmadı / devam ediyor'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }
  const lesson = LESSONS.find((l) => l.id === lessonId)
  if (!lesson) return <Feedback kind="bad">Böyle bir ders yok.</Feedback>
  return <LessonView key={lesson.id} lesson={lesson} go={go} />
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan/20 text-sm text-cyan">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function LessonView({ lesson, go }: { lesson: Lesson; go: (to: string) => void }) {
  const p = useProgress()
  const actDone = !!p.lessonActivities[lesson.id]
  const quizDone = !!p.lessonQuizzes[lesson.id]
  const done = !!p.lessons[lesson.id]
  const { completeLesson, setLastTopic } = p

  useEffect(() => setLastTopic(`Ders ${lesson.id} — ${lesson.title}`), [lesson, setLastTopic])
  useEffect(() => {
    if (actDone && quizDone && !done) completeLesson(lesson.id)
  }, [actDone, quizDone, done, lesson.id, completeLesson])

  const chip = LESSON_CHIPS[lesson.id]
  const prev = LESSONS.find((l) => l.id === lesson.id - 1)
  const next = LESSONS.find((l) => l.id === lesson.id + 1)

  return (
    <div className="space-y-5">
      <button className="btn" onClick={() => go('learn')}><ArrowLeft size={15} /> Tüm dersler</button>
      <PageHeader
        eyebrow={`Ders ${lesson.id} / ${LESSONS.length}`}
        title={lesson.title}
        subtitle={lesson.summary}
        right={
          done ? <span className="chip bg-ok/20 text-ok !text-sm"><CheckCircle2 size={14} className="mr-1" /> Ders tamamlandı</span> : (
            <span className="text-xs text-slate-400">
              {actDone ? '✔' : '○'} Etkinlik · {quizDone ? '✔' : '○'} Mini değerlendirme
            </span>
          )
        }
      />

      <Section n={1} title="Kısa anlatım">
        <div className="mb-3 rounded-lg border border-line bg-ink/60 p-3 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold text-slate-200"><BookOpen size={15} className="text-cyan" /> Bu dersin sonunda…</div>
          <ul className="list-disc space-y-0.5 pl-5 text-slate-300">{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        </div>
        <div className="space-y-3 text-[15px] leading-relaxed text-slate-300">
          {lesson.theory.map((t, i) => <p key={i}><Rich text={t} /></p>)}
        </div>
        <div className="mt-4"><Code>{lesson.displayCode}</Code></div>
      </Section>

      <Section n={2} title="Canlı animasyon">
        {lesson.simCode ? <LessonSim lesson={lesson} /> : <ArrayAnimation />}
        {lesson.id !== 1 && lesson.id !== 6 && <p className="mt-3 text-xs text-slate-500">{VIRTUAL_NOTE}</p>}
      </Section>

      <Section n={3} title="Sen dene: etkinlik">
        {lesson.id === 2 ? (
          <PickAddress onSuccess={() => p.markActivity(lesson.id)} onMistake={() => p.addMistake(lesson.concept)} done={actDone} />
        ) : lesson.id === 6 ? (
          <ArrayActivity onSuccess={() => p.markActivity(6)} onMistake={() => p.addMistake('arrays')} />
        ) : (
          <ChipActivity {...chip} done={actDone} onSuccess={() => p.markActivity(lesson.id)} onMistake={() => p.addMistake(lesson.concept)} />
        )}
        {actDone && <div className="mt-3"><Feedback kind="ok">Etkinlik tamamlandı ✔</Feedback></div>}
      </Section>

      <Section n={4} title="Mini değerlendirme">
        <Quiz
          {...lesson.quiz}
          done={quizDone}
          onAnswer={(ok) => (ok ? p.markQuiz(lesson.id) : p.addMistake(lesson.concept))}
        />
      </Section>

      {done && (
        <Feedback kind="ok" title="Tebrikler, bu dersi tamamladın! (+20 puan)">
          {next ? 'Sıradaki derse geçebilir veya Memory Playground\'da kendi kodunu deneyebilirsin.' : 'Tüm dersler bitti. Pointer Puzzle ve Bug Hunter ile pekiştir; sonra Son Test\'i çöz.'}
        </Feedback>
      )}

      <div className="flex justify-between pb-6">
        {prev ? <button className="btn" onClick={() => go(`learn/${prev.id}`)}><ArrowLeft size={15} /> Ders {prev.id}</button> : <span />}
        {next ? <button className="btn btn-primary" onClick={() => go(`learn/${next.id}`)}>Ders {next.id} <ArrowRight size={15} /></button> : <button className="btn btn-primary" onClick={() => go('puzzle')}>Pointer Puzzle'a geç <ArrowRight size={15} /></button>}
      </div>
    </div>
  )
}

function LessonSim({ lesson }: { lesson: Lesson }) {
  const result = useMemo(() => runProgram(lesson.simCode!), [lesson])
  const steps = result.steps
  const last = steps.length - 1
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    if (idx >= last) return setPlaying(false)
    const t = setTimeout(() => setIdx((i) => i + 1), 1100)
    return () => clearTimeout(t)
  }, [playing, idx, last])
  const step = steps[idx]
  const lines = lesson.simCode!.split('\n')
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <pre className="rounded-lg border border-line bg-ink p-3 font-mono text-sm leading-7" aria-label="Simülasyon kodu">
          {lines.map((l, i) => (
            <div key={i} className={`-mx-3 flex px-3 ${step.line === i + 1 ? 'border-l-[3px] border-cyan bg-cyan/15 text-white' : 'border-l-[3px] border-transparent text-slate-400'}`}>
              <span className="mr-3 w-4 select-none text-right text-slate-600">{i + 1}</span>{l}
            </div>
          ))}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => { if (!playing && idx >= last) setIdx(0); setPlaying((p) => !p) }}>
            {playing ? <Pause size={15} /> : <Play size={15} />} {playing ? 'Duraklat' : 'Oynat'}
          </button>
          <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)) }} disabled={idx === 0}><ChevronLeft size={15} /> Önceki</button>
          <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)) }} disabled={idx >= last}>Sonraki <ChevronRight size={15} /></button>
        </div>
        <div className="mt-3">
          <Feedback kind="info" title={`Adım ${idx} / ${last}`}>{step.explanation}</Feedback>
          {idx === last && lesson.simNote && <div className="mt-2"><Feedback kind="info">{lesson.simNote(step.memory)}</Feedback></div>}
        </div>
      </div>
      <div>
        <div className="h-section">Bellek (RAM)</div>
        <MemoryView memory={step.memory} changed={step.changed} stepKey={idx} />
      </div>
    </div>
  )
}

function ArrayAnimation() {
  const [k, setK] = useState(0)
  return (
    <div>
      <p className="mb-3 text-sm text-slate-300">Düğmelerle <code className="rounded bg-slate-800 px-1 text-cyan">p</code> pointer'ını kaydır. Adres her seferinde 1 değil, <b>4 bayt</b> (bir int) artar. En sağa gidersen dizi sınırını aşarsın.</p>
      <ArrayVisual k={k} onK={setK} />
      <p className="mt-3 text-xs text-slate-500">{VIRTUAL_NOTE}</p>
    </div>
  )
}

function PickAddress({ onSuccess, onMistake, done }: { onSuccess: () => void; onMistake: () => void; done: boolean }) {
  const mem = useMemo(() => runProgram('int x = 10;\nint y = 20;\nint z = 30;').steps.at(-1)!.memory, [])
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-200">
        Aşağıdaki programda <code className="rounded bg-slate-800 px-1 text-cyan">&amp;y</code> ifadesi hangi değeri üretir? <b>y</b> değişkeninin adresine (kartın içindeki adres kutusuna) tıkla.
      </p>
      <div className="max-w-md">
        <MemoryView
          memory={mem}
          onAddressClick={(c) => {
            if (c.name === 'y') {
              setFb({ ok: true, text: `Doğru! &y = 0x${c.address.toString(16)}: y'nin bellekteki yeri. y'nin DEĞERİ ise 20'dir; adres ve değer farklı şeylerdir.` })
              onSuccess()
            } else {
              onMistake()
              setFb({ ok: false, text: `Bu ${c.name} değişkeninin adresi (0x${c.address.toString(16)}). &y ise "y nerede duruyor?" sorusunun cevabıdır; & operatörü yanındaki ismin adresini verir.` })
            }
          }}
        />
      </div>
      {fb && <Feedback kind={fb.ok ? 'ok' : 'bad'}>{fb.text}</Feedback>}
      {done && !fb && <Feedback kind="ok">Bu etkinliği daha önce tamamladın.</Feedback>}
    </div>
  )
}
