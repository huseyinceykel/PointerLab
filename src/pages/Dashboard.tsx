import { ArrowRight, Bug, ClipboardCheck, Cpu, FlaskConical, GraduationCap, Puzzle, Trophy, Target, CheckCircle2, BookOpen, History } from 'lucide-react'
import { Bar } from '../components/ui'
import { overallPercent, TOTALS, useProgress } from '../store/progress'

export default function Dashboard({ go }: { go: (to: string) => void }) {
  const s = useProgress()
  const lessons = Object.values(s.lessons).filter(Boolean).length
  const puzzles = Object.values(s.puzzles).filter(Boolean).length
  const bugs = Object.values(s.bugs).filter(Boolean).length
  const tasks = puzzles + bugs
  const percent = overallPercent(s)

  const modules = [
    { to: 'learn', icon: GraduationCap, title: 'Learn', text: '6 etkileşimli ders: bellek, adres, pointer, dereference.', done: lessons, total: TOTALS.lessons },
    { to: 'playground', icon: FlaskConical, title: 'Memory Playground', text: 'Kendi C kodunu yaz, belleği adım adım izle.', done: Math.min(s.playgroundRuns, 1), total: 1, label: s.playgroundRuns ? `${s.playgroundRuns} çalıştırma` : 'Henüz denenmedi' },
    { to: 'puzzle', icon: Puzzle, title: 'Pointer Puzzle', text: 'Kod yazmadan bağlantı kur, adres seç, tahmin et.', done: puzzles, total: TOTALS.puzzles },
    { to: 'bugs', icon: Bug, title: 'Bug Hunter', text: 'Pointer hatalarını bul, nedenini öğren, düzelt.', done: bugs, total: TOTALS.bugs },
    { to: 'assessment', icon: ClipboardCheck, title: 'Ön Test / Son Test', text: 'Öğrenmeni ölç ve karşılaştır.', done: (s.pre ? 1 : 0) + (s.post ? 1 : 0), total: TOTALS.tests },
    { to: 'progress', icon: Target, title: 'Learning Progress', text: 'İlerleme, puan, zorlandığın kavramlar, dışa aktarma.', done: percent, total: 100, label: `%${percent}` },
  ]
  const roadmap = [
    { t: 'Ön test', ok: !!s.pre, to: 'assessment' },
    { t: 'Dersler 1–6', ok: lessons === 6, to: 'learn' },
    { t: 'Playground', ok: s.playgroundRuns > 0, to: 'playground' },
    { t: 'Puzzle', ok: puzzles === TOTALS.puzzles, to: 'puzzle' },
    { t: 'Bug Hunter', ok: bugs === TOTALS.bugs, to: 'bugs' },
    { t: 'Son test', ok: !!s.post, to: 'assessment' },
  ]

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden p-6 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan"><Cpu size={18} /> Eğitsel Yazılım · C Programlama</div>
          <h1 className="bg-gradient-to-r from-white via-cyan to-ptr bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">PointerLab</h1>
          <p className="mt-2 text-xl font-medium text-slate-100">Belleği Gör. Pointer'ı Anla. Kodla Öğren.</p>
          <p className="mt-3 text-slate-400">C programlama dilindeki pointer kavramını etkileşimli simülasyonlar, görsel anlatımlar ve uygulamalı görevlerle keşfet.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn btn-primary !px-5 !py-2.5" onClick={() => go('learn')}>Öğrenmeye Başla <ArrowRight size={16} /></button>
            <button className="btn !px-5 !py-2.5" onClick={() => go('playground')}><FlaskConical size={16} /> Memory Playground'a Git</button>
          </div>
        </div>
      </section>

      <section aria-label="Özet" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<BookOpen size={18} />} label="Tamamlanan ders" value={`${lessons} / ${TOTALS.lessons}`} />
        <Stat icon={<Trophy size={18} />} label="Kazanılan puan" value={String(s.points)} />
        <Stat icon={<CheckCircle2 size={18} />} label="Tamamlanan görev" value={`${tasks} / ${TOTALS.puzzles + TOTALS.bugs}`} />
        <Stat icon={<History size={18} />} label="Son çalışılan" value={s.lastTopic ?? 'Henüz yok'} small />
      </section>

      <section className="card p-5">
        <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-white">Toplam ilerleme</span><span className="text-slate-300">%{percent}</span></div>
        <Bar value={percent} label="Toplam ilerleme" />
      </section>

      <section aria-label="Öğrenme yol haritası">
        <h2 className="h-section">Öğrenme yol haritası</h2>
        <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {roadmap.map((r, i) => (
            <li key={r.t}>
              <button onClick={() => go(r.to)} className={`card flex h-full w-full flex-col items-start gap-1 p-3 text-left transition hover:border-cyan/60 ${r.ok ? '!border-ok/50' : ''}`}>
                <span className={`text-xs font-bold ${r.ok ? 'text-ok' : 'text-slate-500'}`}>{r.ok ? '✔ Tamam' : `Adım ${i + 1}`}</span>
                <span className="text-sm font-medium text-white">{r.t}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Modüller">
        <h2 className="h-section">Modüller</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => (
            <button key={m.to} onClick={() => go(m.to)} className="card group p-5 text-left transition hover:-translate-y-1 hover:border-cyan/60 hover:shadow-lg hover:shadow-cyan/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan/25 to-ptr/25 text-cyan"><m.icon size={20} /></span>
                <ArrowRight size={16} className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan" />
              </div>
              <div className="font-semibold text-white">{m.title}</div>
              <p className="mb-3 mt-1 text-sm text-slate-400">{m.text}</p>
              <Bar value={(m.done / m.total) * 100} label={`${m.title} ilerlemesi`} />
              <div className="mt-1.5 text-xs text-slate-500">{m.label ?? `${m.done} / ${m.total} tamamlandı`}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-400"><span className="text-cyan">{icon}</span>{label}</div>
      <div className={`font-bold text-white ${small ? 'text-sm leading-snug' : 'text-2xl'}`}>{value}</div>
    </div>
  )
}
