import { useEffect, useState } from 'react'
import { FileJson, FileSpreadsheet, Trash2 } from 'lucide-react'
import { BUGS } from '../content/bugs'
import { LESSONS } from '../content/lessons'
import { CONCEPT_LABELS, download, exportCsv, exportPayload, overallPercent, useProgress } from '../store/progress'
import type { Concept } from '../store/progress'
import { Bar, Feedback, PageHeader } from '../components/ui'
import { Compare } from './Assessment'

export default function Progress() {
  const s = useProgress()
  const [confirm, setConfirm] = useState(false)
  useEffect(() => s.setLastTopic('Learning Progress'), [s.setLastTopic]) // eslint-disable-line react-hooks/exhaustive-deps
  const percent = overallPercent(s)
  const mistakes = (Object.entries(s.mistakes) as [Concept, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  const maxM = mistakes[0]?.[1] ?? 1
  const puzzleCount = Object.values(s.puzzles).filter(Boolean).length
  const bugCount = Object.values(s.bugs).filter(Boolean).length

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Learning Progress" title="Öğrenme ilerlemem" subtitle="Tüm veriler yalnızca bu tarayıcıda (localStorage) saklanır." />
      <section className="card p-5">
        <div className="mb-2 flex justify-between text-sm"><span className="font-semibold text-white">Genel ilerleme</span><span>%{percent} · {s.points} puan</span></div>
        <Bar value={percent} label="Genel ilerleme" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="h-section">Dersler</h2>
          <ul className="space-y-1.5 text-sm">
            {LESSONS.map((l) => <li key={l.id} className="flex justify-between"><span>Ders {l.id} — {l.title}</span><span className={s.lessons[l.id] ? 'text-ok' : 'text-slate-500'}>{s.lessons[l.id] ? '✔ Tamam' : '○'}</span></li>)}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="h-section">Görevler</h2>
          <div className="space-y-3 text-sm">
            <div><div className="mb-1 flex justify-between"><span>Pointer Puzzle</span><span>{puzzleCount}/5</span></div><Bar value={(puzzleCount / 5) * 100} label="Puzzle" /></div>
            <div><div className="mb-1 flex justify-between"><span>Bug Hunter</span><span>{bugCount}/{BUGS.length}</span></div><Bar value={(bugCount / BUGS.length) * 100} label="Bug Hunter" /></div>
            <div className="text-slate-400">Playground çalıştırma: {s.playgroundRuns}</div>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="h-section">En çok hata yapılan kavramlar</h2>
        {mistakes.length === 0 ? (
          <p className="text-sm text-slate-400">Henüz kayıtlı bir hata yok. Etkinliklerde, quizlerde ve testlerde yapılan yanlışlar burada toplanır.</p>
        ) : (
          <ul className="space-y-2.5">
            {mistakes.map(([c, n]) => (
              <li key={c}>
                <div className="mb-1 flex justify-between text-sm"><span>{CONCEPT_LABELS[c]}</span><span className="text-slate-400">{n} hata</span></div>
                <Bar value={(n / maxM) * 100} color="from-warn to-bad" label={CONCEPT_LABELS[c]} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="h-section">Ön test / son test</h2>
        <Compare pre={s.pre} post={s.post} />
      </section>

      <section className="card flex flex-wrap items-center gap-3 p-5">
        <div className="mr-auto">
          <h2 className="font-semibold text-white">Veriyi dışa aktar / sıfırla</h2>
          <p className="text-sm text-slate-400">Kullanılabilirlik testleri için JSON/CSV indirebilirsin. Sıfırlama geri alınamaz.</p>
        </div>
        <button className="btn" onClick={() => download('pointerlab-ilerleme.json', JSON.stringify(exportPayload(s), null, 2), 'application/json')}><FileJson size={15} /> JSON</button>
        <button className="btn" disabled={!s.pre && !s.post} onClick={() => download('pointerlab-testler.csv', exportCsv(s), 'text/csv')}><FileSpreadsheet size={15} /> CSV (testler)</button>
        {!confirm ? (
          <button className="btn !border-bad/50 !text-bad" onClick={() => setConfirm(true)}><Trash2 size={15} /> İlerlemeyi sıfırla</button>
        ) : (
          <div className="flex items-center gap-2">
            <Feedback kind="warn">Tüm ilerleme, puan ve test sonuçları silinecek.</Feedback>
            <button className="btn !bg-bad !text-slate-950" onClick={() => { s.reset(); setConfirm(false) }}>Evet, sil</button>
            <button className="btn" onClick={() => setConfirm(false)}>Vazgeç</button>
          </div>
        )}
      </section>
    </div>
  )
}
