export type CType = 'int' | 'int*'

export interface MemoryCell {
  name: string
  address: number
  /** int için sayı, int* için tuttuğu adres (0 = NULL). null = başlatılmamış (belirsiz). */
  value: number | null
  type: CType
  /** Bu pointer'ın şu anda gösterdiği değişkenin adresi (varsa). */
  pointsTo?: number
}

export interface ExecutionStep {
  /** 1 tabanlı kaynak satırı; 0 = program başlamadan önceki boş durum. */
  line: number
  memory: MemoryCell[]
  explanation: string
  /** Bu adımda değişen hücrelerin adları. */
  changed: string[]
  /** 'ub' = tanımsız davranış (undefined behavior): simülasyon güvenli şekilde durdurulur. */
  status: 'ok' | 'ub'
}

export interface EngineError {
  line: number
  kind: 'syntax' | 'unsupported' | 'semantic'
  message: string
}

export interface RunResult {
  steps: ExecutionStep[]
  errors: EngineError[]
}
