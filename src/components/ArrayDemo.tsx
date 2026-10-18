import { useState } from 'react'
import { motion } from 'framer-motion'
import { Feedback } from './ui'

const BASE = 0x200
const VALUES = [10, 20, 30]
const hex = (n: number) => '0x' + n.toString(16)

/** Ders 6: dizi + pointer aritmetiği. k = p'nin kaçıncı elemanı gösterdiği (p + k). */
export function ArrayVisual({ k, onK }: { k: number; onK?: (k: number) => void }) {
  const inRange = k >= 0 && k < VALUES.length
  return (
    <div>
      <div className="grid grid-cols-3 gap-2" role="list" aria-label="numbers dizisi">
        {VALUES.map((val, i) => (
          <motion.div
            key={i}
            role="listitem"
            animate={{ scale: k === i ? 1.04 : 1 }}
            className={`rounded-xl border-2 p-3 text-center ${k === i ? 'border-ptr bg-ptr/15' : 'border-cyan/40 bg-cyan/5'}`}
          >
            <div className="text-[11px] text-slate-400">numbers[{i}]</div>
            <div className="text-xl font-bold">{val}</div>
            <div className="font-mono text-xs text-slate-300">{hex(BASE + i * 4)}</div>
          </motion.div>
        ))}
      </div>
      <div className="relative mt-1 grid grid-cols-3 gap-2 h-10" aria-hidden="true">
        {inRange && (
          <motion.div
            className="absolute top-0 w-1/3 text-center text-ptr"
            animate={{ left: `${(k * 100) / 3}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <div className="text-lg leading-none">▲</div>
            <div className="font-mono text-xs">p{k ? ` + ${k}` : ''}</div>
          </motion.div>
        )}
      </div>
      <div className="mt-1 rounded-lg border border-line bg-ink/70 p-3 font-mono text-sm">
        <div>p + {k} = <span className="text-ptr">{hex(BASE + k * 4)}</span> <span className="text-slate-500">(= {hex(BASE)} + {k} × sizeof(int) = {k} × 4)</span></div>
        <div>
          *(p + {k}) ={' '}
          {inRange ? <span className="font-bold text-white">{VALUES[k]}</span> : <span className="text-warn">⚠ dizinin dışı — tanımsız davranış, değer gösterilmez</span>}
        </div>
      </div>
      {onK && (
        <div className="mt-3 flex gap-2">
          <button className="btn" onClick={() => onK(Math.max(k - 1, 0))} disabled={k <= 0}>p − 1</button>
          <button className="btn" onClick={() => onK(Math.min(k + 1, 3))} disabled={k >= 3}>p + 1</button>
          <button className="btn" onClick={() => onK(0)}>p = numbers</button>
        </div>
      )}
    </div>
  )
}

export function ArrayActivity({ onSuccess, onMistake }: { onSuccess: () => void; onMistake: () => void }) {
  const [k, setK] = useState(0)
  const [ans, setAns] = useState('')
  const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null)

  const check = () => {
    const n = Number(ans)
    if (ans.trim() !== '' && n === 30) {
      setFb({ ok: true, text: '*(p + 2) → p adresini 2 eleman (8 bayt) ilerletir: 0x208, numbers[2] = 30. Harika!' })
      onSuccess()
    } else {
      onMistake()
      setFb({
        ok: false,
        text:
          n === 20
            ? '20, *(p + 1) değeridir. p + 2 iki eleman ilerler: p + 2 = 0x208 → numbers[2].'
            : n === 10
              ? '10, *p değeridir (ilk eleman). p + 2 için oku iki kez ilerlet ve değere bak.'
              : 'p + 2 adresine git ve o adresteki değeri oku. Yukarıdaki oku "p + 1" düğmesiyle ilerleterek dene.',
      })
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-200">
        Oku <code className="rounded bg-slate-800 px-1 text-cyan">p + 1</code> düğmesiyle ilerlet ve <b>*(p + 2)</b> ifadesinin değerini bul. Sonra sayıyı yaz.
      </p>
      <ArrayVisual k={k} onK={setK} />
      <div className="flex items-center gap-2">
        <label htmlFor="arr-ans" className="text-sm text-slate-300">*(p + 2) =</label>
        <input id="arr-ans" className="input w-24" inputMode="numeric" value={ans} onChange={(e) => { setAns(e.target.value); setFb(null) }} onKeyDown={(e) => e.key === 'Enter' && check()} />
        <button className="btn btn-primary" onClick={check}>Kontrol Et</button>
      </div>
      {fb && <Feedback kind={fb.ok ? 'ok' : 'bad'}>{fb.text}</Feedback>}
    </div>
  )
}
