import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Link2 } from 'lucide-react'
import MemoryView from '../components/MemoryView'
import ChipActivity from '../components/ChipActivity'
import { Feedback, PageHeader } from '../components/ui'
import { fmtAddr, runProgram } from '../engine/interpreter'
import type { MemoryCell } from '../engine/types'
import { useProgress } from '../store/progress'
import type { Concept } from '../store/progress'

interface Task {
  id: string
  title: string
  concept: Concept
  level: string
}

const TASKS: Task[] = [
  { id: 'connect', title: 'Pointer\'ı doğru değişkene bağla', concept: 'define', level: 'Kolay' },
  { id: 'address', title: 'Gösterilen bellek adresini seç', concept: 'address', level: 'Kolay' },
  { id: 'predict', title: 'Dereference sonucunu tahmin et', concept: 'deref', level: 'Orta' },
  { id: 'modify', title: 'Pointer\'ın gösterdiği değişkeni değiştir', concept: 'modify', level: 'Orta' },
  { id: 'target', title: 'Belleği hedef duruma getir', concept: 'redirect', level: 'Zor' },
]

export default function Puzzle() {
  const p = useProgress()
  const [active, setActive] = useState(() => Math.max(0, TASKS.findIndex((t) => !p.puzzles[t.id])))
  useEffect(() => p.setLastTopic('Pointer Puzzle'), [p.setLastTopic]) // eslint-disable-line react-hooks/exhaustive-deps
  const task = TASKS[active]
  const done = !!p.puzzles[task.id]
  const win = () => p.completePuzzle(task.id)
  const miss = () => p.addMistake(task.concept)

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Pointer Puzzle" title="Kod yazmadan pointer'ı keşfet" subtitle="5 görev, kolaydan zora. Her görevde yanlış cevabın nedeni de açıklanır." />
      <nav className="flex flex-wrap gap-2" aria-label="Görevler">
        {TASKS.map((t, i) => (
          <button key={t.id} onClick={() => setActive(i)} aria-current={i === active} className={`btn ${i === active ? '!border-cyan !bg-cyan/15' : ''}`}>
            {p.puzzles[t.id] ? <CheckCircle2 size={15} className="text-ok" /> : <span className="text-slate-500">{i + 1}</span>} {t.title.split(' ').slice(0, 2).join(' ')}…
          </button>
        ))}
      </nav>
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Görev {active + 1}: {task.title}</h2>
          <span className="chip bg-slate-800 text-slate-300">{task.level} · +10 puan</span>
        </div>
        {task.id === 'connect' && <Connect key="c" onWin={win} onMiss={miss} done={done} />}
        {task.id === 'address' && <PickHeld key="a" onWin={win} onMiss={miss} done={done} />}
        {task.id === 'predict' && <Predict key="p" onWin={win} onMiss={miss} done={done} />}
        {task.id === 'modify' && (
          <ChipActivity
            key="m"
            instruction="x'i 99 yap — ama x ismini kullanmadan, yalnızca p pointer'ı üzerinden. Bazı ifadeler bilerek yanlış."
            base={'int x = 5;\nint *p = &x;'}
            chips={['x = 99;', '*p = 99;', 'p = 99;', 'p = &x;']}
            done={done}
            onSuccess={win}
            onMistake={miss}
            goal={({ memory, chosen }) => {
              const x = memory.find((c) => c.name === 'x')!
              if (x.value === 99 && chosen.includes('*p = 99;') && !chosen.includes('x = 99;')) return { ok: true, message: 'Harika! *p = 99 ile p\'nin gösterdiği değişkeni (x) değiştirdin. x ismine hiç dokunmadan sonuç değişti.' }
              if (chosen.includes('x = 99;')) return { ok: false, message: 'x = 99 çalışır ama bu görevde x ismini kullanmak yasak: amaç pointer üzerinden dolaylı erişim (dereference).' }
              return { ok: false, message: `x şu an ${x.value}. Hedef 99. p'nin gösterdiği değeri değiştirmek için hangi operatör gerekir?` }
            }}
          />
        )}
        {task.id === 'target' && (
          <ChipActivity
            key="t"
            instruction="Bellek, aşağıdaki hedef durumla birebir aynı olmalı: a = 1, b = 7 ve p, b'yi göstersin. Hangi ifadeler, hangi sırayla?"
            base={'int a = 1;\nint b = 2;\nint *p = &a;'}
            chips={['p = &b;', '*p = 7;', 'a = 7;', 'b = 7;', 'p = &a;']}
            done={done}
            onSuccess={win}
            onMistake={miss}
            target={
              <div className="rounded-lg border border-dashed border-warn/60 bg-warn/5 p-3 text-sm">
                <b className="text-warn">Hedef:</b> <code>a = 1</code>, <code>b = 7</code>, <code>p → b</code>
              </div>
            }
            goal={({ memory }) => {
              const a = memory.find((c) => c.name === 'a')!
              const b = memory.find((c) => c.name === 'b')!
              const pp = memory.find((c) => c.name === 'p')!
              const ok = a.value === 1 && b.value === 7 && pp.value === b.address
              if (ok) return { ok, message: 'Hedef duruma ulaştın! Önce p\'yi b\'ye yönlendirmek, sonra *p = 7 ile b\'yi değiştirmek bunun yollarından biri. Sıra önemli: yönlendirme önce gelmezse *p yanlış değişkeni değiştirir.' }
              const why: string[] = []
              if (a.value !== 1) why.push(`a = ${a.value} (hedef 1; yanlış değişkeni değiştirdin)`)
              if (b.value !== 7) why.push(`b = ${b.value} (hedef 7)`)
              if (pp.value !== b.address) why.push('p henüz b\'yi göstermiyor')
              return { ok, message: `Henüz hedefte değil: ${why.join('; ')}. İpucu: *p, o an p'nin gösterdiği değişkeni değiştirir.` }
            }}
          />
        )}
      </section>
    </div>
  )
}

/* ---------- Görev 1: bağlantı kur ---------- */
function Connect({ onWin, onMiss, done }: { onWin: () => void; onMiss: () => void; done: boolean }) {
  const initial = useMemo(() => runProgram('int x = 10;\nint y = 20;\nint *p = NULL;').steps.at(-1)!.memory, [])
  const [mem, setMem] = useState<MemoryCell[]>(initial)
  const [sel, setSel] = useState<string | null>(null)
  const [fb, setFb] = useState<{ kind: 'ok' | 'bad' | 'info'; text: string } | null>(null)

  const view = mem.map((c) => {
    const copy = { ...c }
    if (c.type === 'int*') {
      delete copy.pointsTo
      if (c.value && mem.some((m) => m.address === c.value)) copy.pointsTo = c.value
    }
    return copy
  })

  const click = (c: MemoryCell) => {
    if (c.type === 'int*') {
      setSel(c.name)
      setFb({ kind: 'info', text: `${c.name} seçildi. Şimdi göstermesini istediğin değişkenin kartına tıkla.` })
    } else if (sel) {
      setMem((m) => m.map((x) => (x.name === sel ? { ...x, value: c.address } : x)))
      setFb(null)
    } else {
      setFb({ kind: 'info', text: 'Önce pointer kartına (p) tıkla, sonra hedef değişkene.' })
    }
  }
  const check = () => {
    const p = mem.find((c) => c.name === 'p')!
    const x = mem.find((c) => c.name === 'x')!
    const y = mem.find((c) => c.name === 'y')!
    if (p.value === x.address) {
      setFb({ kind: 'ok', text: `Harika! p artık x değişkeninin adresini (${fmtAddr(x.address)}) tutuyor.` })
      onWin()
    } else {
      onMiss()
      setFb({
        kind: 'bad',
        text: p.value === y.address ? `p şu an y'yi gösteriyor (içinde ${fmtAddr(y.address)} var). Görev x'i istiyor: pointer'ın hangi değişkenin adresini tutması gerektiğini tekrar düşün.` : 'p henüz hiçbir değişkeni göstermiyor (NULL). Pointer\'ı seçip x\'e tıklayarak bağla.',
      })
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-200"><Link2 size={15} className="mr-1 inline text-cyan" /> <b>p pointer'ını x değişkenine bağla.</b> Önce <b>p</b> kartına, sonra <b>x</b> kartına tıkla (klavyede Enter/Boşluk da çalışır).</p>
      <div className="max-w-md"><MemoryView memory={view} onCellClick={click} selected={sel} stepKey={mem.map((m) => m.value).join()} /></div>
      <button className="btn btn-primary" onClick={check}>Kontrol Et</button>
      {fb && <Feedback kind={fb.kind}>{fb.text}</Feedback>}
      {done && !fb && <Feedback kind="ok">Bu görevi daha önce tamamladın.</Feedback>}
    </div>
  )
}

/* ---------- Görev 2: pointer'ın tuttuğu adres ---------- */
function PickHeld({ onWin, onMiss, done }: { onWin: () => void; onMiss: () => void; done: boolean }) {
  const mem = useMemo(() => runProgram('int x = 10;\nint y = 20;\nint *p = &y;').steps.at(-1)!.memory, [])
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-200"><b>p pointer'ının içinde tutulan adres</b> hangisi? Doğru adres kutusuna tıkla. (Dikkat: pointer'ın <i>kendi</i> adresi ile <i>içindeki</i> adres farklıdır.)</p>
      <div className="max-w-md">
        <MemoryView
          memory={mem}
          onAddressClick={(c) => {
            const p = mem.find((m) => m.name === 'p')!
            if (c.address === p.value) {
              setFb({ ok: true, text: `Doğru! p'nin içinde ${fmtAddr(c.address)} var; bu y'nin adresi. Ok da bu yüzden y'yi gösteriyor.` })
              onWin()
            } else if (c.name === 'p') {
              onMiss()
              setFb({ ok: false, text: `${fmtAddr(c.address)} p'nin KENDİ adresi (p değişkeninin bellekteki yeri). Sorulan, p'nin içinde saklanan değer: yani gösterdiği değişkenin adresi.` })
            } else {
              onMiss()
              setFb({ ok: false, text: `${fmtAddr(c.address)} ${c.name} değişkeninin adresi, ama p onu göstermiyor. Okun ucuna bak: p'nin içindeki adres hangi değişkene aitti?` })
            }
          }}
        />
      </div>
      {fb && <Feedback kind={fb.ok ? 'ok' : 'bad'}>{fb.text}</Feedback>}
      {done && !fb && <Feedback kind="ok">Bu görevi daha önce tamamladın.</Feedback>}
    </div>
  )
}

/* ---------- Görev 3: tahmin ---------- */
const PREDICT_CODE = 'int x = 10;\nint y = x + 5;\nint *p = &y;\n*p = *p * 2;'

function Predict({ onWin, onMiss, done }: { onWin: () => void; onMiss: () => void; done: boolean }) {
  const run = useMemo(() => runProgram(PREDICT_CODE), [])
  const final = run.steps.at(-1)!.memory
  const answer = final.find((c) => c.name === 'y')!.value!
  const [val, setVal] = useState('')
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null)
  const [reveal, setReveal] = useState(false)
  const check = () => {
    if (val.trim() === '') return setFb({ ok: false, text: 'Önce bir sayı gir.' })
    setReveal(true)
    if (Number(val) === answer) {
      setFb({ ok: true, text: `Doğru! y = x + 5 = 15; p, y'yi gösterdiği için *p = *p * 2 → y = 30. Son değeri aşağıda adım adım görebilirsin.` })
      onWin()
    } else {
      onMiss()
      const n = Number(val)
      setFb({
        ok: false,
        text: n === 15 ? '15, *p = *p * 2 çalışmadan önceki değer. Dereference ile y değişti, bu yüzden son değer farklı.' : n === 10 ? '10, x\'in değeri. p ise x\'i değil y\'yi gösteriyor (p = &y).' : `${val} değil. Adımları aşağıdan izle: önce y hesaplanır, sonra *p ile y güncellenir.`,
      })
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-200">Kod çalıştıktan sonra <code className="rounded bg-slate-800 px-1 text-cyan">printf("%d", *p);</code> ne yazdırır? Önce tahmin et, sonra kontrol et.</p>
      <pre className="rounded-lg border border-line bg-ink p-3 font-mono text-sm leading-7">{PREDICT_CODE}</pre>
      <div className="flex items-center gap-2">
        <label htmlFor="pred" className="text-sm text-slate-300">*p =</label>
        <input id="pred" className="input w-28" inputMode="numeric" value={val} onChange={(e) => { setVal(e.target.value); setFb(null) }} onKeyDown={(e) => e.key === 'Enter' && check()} />
        <button className="btn btn-primary" onClick={check}>Kontrol Et</button>
      </div>
      {fb && <Feedback kind={fb.ok ? 'ok' : 'bad'}>{fb.text}</Feedback>}
      {reveal && (
        <ol className="space-y-1.5 text-sm text-slate-300">
          {run.steps.slice(1).map((s, i) => <li key={i}><span className="font-mono text-slate-500">Satır {s.line}:</span> {s.explanation}</li>)}
        </ol>
      )}
      {done && !fb && <Feedback kind="ok">Bu görevi daha önce tamamladın.</Feedback>}
    </div>
  )
}
