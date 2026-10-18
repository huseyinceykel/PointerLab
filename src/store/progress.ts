import { create } from 'zustand'

export type Concept = 'address' | 'define' | 'addressOf' | 'deref' | 'redirect' | 'modify' | 'bounds' | 'types' | 'arrays'

export const CONCEPT_LABELS: Record<Concept, string> = {
  address: 'Bellek adresi',
  define: 'Pointer tanımlama',
  addressOf: 'Adres alma (&)',
  deref: 'Dereference (*)',
  redirect: 'Pointer yönlendirme',
  modify: 'Pointer ile değer değiştirme',
  bounds: 'Bellek sınırları / başlatma',
  types: 'Tür uyumu',
  arrays: 'Pointer ve diziler',
}

export interface AnswerRecord {
  qid: string
  concept: Concept
  chosen: number
  correct: boolean
}

export interface TestResult {
  kind: 'pre' | 'post'
  takenAt: string
  correct: number
  total: number
  percent: number
  byConcept: Partial<Record<Concept, { correct: number; total: number }>>
  answers: AnswerRecord[]
  durationSec: number
}

export interface ProgressState {
  participantCode: string
  lessons: Record<number, boolean>
  lessonActivities: Record<number, boolean>
  lessonQuizzes: Record<number, boolean>
  puzzles: Record<string, boolean>
  bugs: Record<string, boolean>
  points: number
  lastTopic: string | null
  mistakes: Partial<Record<Concept, number>>
  playgroundRuns: number
  pre: TestResult | null
  post: TestResult | null
  testAttempts: { pre: number; post: number }
  createdAt: string
  /** Kalıcı olmayan: Bug Hunter → Playground aktarımı */
  pendingCode: string | null
}

interface Actions {
  setParticipant: (code: string) => void
  setLastTopic: (t: string) => void
  markActivity: (lessonId: number) => void
  markQuiz: (lessonId: number) => void
  completeLesson: (lessonId: number) => void
  completePuzzle: (id: string) => void
  completeBug: (id: string) => void
  addMistake: (c: Concept) => void
  addRun: () => void
  saveTest: (r: TestResult) => void
  setPendingCode: (c: string | null) => void
  reset: () => void
}

const KEY = 'pointerlab:v1'

const fresh = (): ProgressState => ({
  participantCode: '',
  lessons: {},
  lessonActivities: {},
  lessonQuizzes: {},
  puzzles: {},
  bugs: {},
  points: 0,
  lastTopic: null,
  mistakes: {},
  playgroundRuns: 0,
  pre: null,
  post: null,
  testAttempts: { pre: 0, post: 0 },
  createdAt: new Date().toISOString(),
  pendingCode: null,
})

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw), pendingCode: null }
  } catch {
    /* localStorage kullanılamıyor / bozuk veri: temiz başla */
  }
  return fresh()
}

function persist(s: ProgressState) {
  try {
    const { pendingCode: _omit, ...rest } = s
    void _omit
    localStorage.setItem(KEY, JSON.stringify(rest))
  } catch {
    /* kota dolu veya erişim yok */
  }
}

export const useProgress = create<ProgressState & Actions>((set, get) => {
  const update = (fn: (s: ProgressState) => Partial<ProgressState>) => {
    const next = { ...get(), ...fn(get()) }
    set(next)
    persist(next)
  }
  return {
    ...load(),
    setParticipant: (code) => update(() => ({ participantCode: code.slice(0, 40) })),
    setLastTopic: (t) => update(() => ({ lastTopic: t })),
    markActivity: (id) => update((s) => ({ lessonActivities: { ...s.lessonActivities, [id]: true } })),
    markQuiz: (id) => update((s) => ({ lessonQuizzes: { ...s.lessonQuizzes, [id]: true } })),
    completeLesson: (id) =>
      update((s) => (s.lessons[id] ? {} : { lessons: { ...s.lessons, [id]: true }, points: s.points + 20 })),
    completePuzzle: (id) =>
      update((s) => (s.puzzles[id] ? {} : { puzzles: { ...s.puzzles, [id]: true }, points: s.points + 10 })),
    completeBug: (id) => update((s) => (s.bugs[id] ? {} : { bugs: { ...s.bugs, [id]: true }, points: s.points + 15 })),
    addMistake: (c) => update((s) => ({ mistakes: { ...s.mistakes, [c]: (s.mistakes[c] ?? 0) + 1 } })),
    addRun: () => update((s) => ({ playgroundRuns: s.playgroundRuns + 1, points: s.playgroundRuns === 0 ? s.points + 5 : s.points })),
    saveTest: (r) =>
      update((s) => ({
        [r.kind]: r,
        testAttempts: { ...s.testAttempts, [r.kind]: s.testAttempts[r.kind] + 1 },
        points: s[r.kind] ? s.points : s.points + 25,
      })),
    setPendingCode: (c) => set({ pendingCode: c }),
    reset: () => {
      const f = fresh()
      set(f)
      try {
        localStorage.removeItem(KEY)
      } catch {
        /* yoksay */
      }
    },
  }
})

export const TOTALS = { lessons: 6, puzzles: 5, bugs: 6, tests: 2 }

export function overallPercent(s: ProgressState): number {
  const done =
    Object.values(s.lessons).filter(Boolean).length +
    Object.values(s.puzzles).filter(Boolean).length +
    Object.values(s.bugs).filter(Boolean).length +
    (s.pre ? 1 : 0) +
    (s.post ? 1 : 0)
  const total = TOTALS.lessons + TOTALS.puzzles + TOTALS.bugs + TOTALS.tests
  return Math.round((done / total) * 100)
}

/* ---------------- Dışa aktarma ---------------- */

export function exportPayload(s: ProgressState) {
  return {
    app: 'PointerLab',
    exportedAt: new Date().toISOString(),
    note: 'Bu dosya yalnızca bu tarayıcıdaki gerçek kullanım verisini içerir. Kişisel bilgi toplanmaz; katılımcı kodu isteğe bağlıdır.',
    participantCode: s.participantCode || null,
    startedAt: s.createdAt,
    points: s.points,
    completedLessons: Object.keys(s.lessons).filter((k) => s.lessons[+k]).map(Number),
    completedPuzzles: Object.keys(s.puzzles).filter((k) => s.puzzles[k]),
    completedBugs: Object.keys(s.bugs).filter((k) => s.bugs[k]),
    playgroundRuns: s.playgroundRuns,
    mistakesByConcept: s.mistakes,
    testAttempts: s.testAttempts,
    preTest: s.pre,
    postTest: s.post,
  }
}

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export function exportCsv(s: ProgressState): string {
  const rows: string[][] = [['participant', 'test', 'takenAt', 'questionId', 'concept', 'chosenOption', 'correct']]
  for (const t of [s.pre, s.post]) {
    if (!t) continue
    for (const a of t.answers) {
      rows.push([s.participantCode, t.kind, t.takenAt, a.qid, a.concept, String(a.chosen + 1), a.correct ? '1' : '0'])
    }
  }
  const summary: string[][] = [
    [],
    ['participant', 'test', 'correct', 'total', 'percent', 'durationSec'],
    ...[s.pre, s.post]
      .filter((t): t is TestResult => !!t)
      .map((t) => [s.participantCode, t.kind, String(t.correct), String(t.total), String(t.percent), String(t.durationSec)]),
  ]
  return [...rows, ...summary].map((r) => r.map(csvCell).join(',')).join('\n')
}

export function download(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
