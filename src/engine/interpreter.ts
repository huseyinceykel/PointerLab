import type { CType, EngineError, ExecutionStep, MemoryCell, RunResult } from './types'

/* ------------------------------------------------------------------ */
/*  Eğitim amaçlı basitleştirilmiş C yorumlayıcısı                     */
/*  Desteklenen: int / int* bildirimi, atama, &, *, + - * / %, (),      */
/*  NULL, +=  -=  *=  /=  %=                                           */
/*  Desteklenmeyen sözdizimi sessizce yok sayılmaz → açıklayıcı hata.  */
/* ------------------------------------------------------------------ */

export const BASE_ADDRESS = 0x100
const INT_SIZE = 4
const PTR_SIZE = 8
const INT_MAX = 2147483647
const INT_MIN = -2147483648

export const fmtAddr = (n: number): string => '0x' + n.toString(16)

/* ------------------------------ Tokenizer ------------------------------ */

interface Tok {
  t: 'num' | 'id' | 'op'
  v: string
}

class EngineIssue extends Error {
  kind: EngineError['kind'] | 'ub'
  constructor(kind: EngineError['kind'] | 'ub', message: string) {
    super(message)
    this.kind = kind
  }
}

const OPS2 = ['+=', '-=', '*=', '/=', '%=', '==', '!=', '<=', '>=', '++', '--', '&&', '||', '->', '<<', '>>']
const OPS1 = '+-*/%=&(),[]{}<>!;.?:|^~'

function tokenize(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (/[0-9]/.test(c)) {
      let j = i
      while (j < src.length && /[0-9a-zA-Z_.]/.test(src[j])) j++
      const raw = src.slice(i, j)
      if (!/^[0-9]+$/.test(raw)) {
        throw new EngineIssue('unsupported', `"${raw}" sayısı desteklenmiyor. Yalnızca tam sayı (int) sabitleri kullanılabilir.`)
      }
      toks.push({ t: 'num', v: raw })
      i = j
      continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++
      toks.push({ t: 'id', v: src.slice(i, j) })
      i = j
      continue
    }
    const two = src.slice(i, i + 2)
    if (OPS2.includes(two)) {
      toks.push({ t: 'op', v: two })
      i += 2
      continue
    }
    if (OPS1.includes(c)) {
      toks.push({ t: 'op', v: c })
      i++
      continue
    }
    throw new EngineIssue('syntax', `Tanınmayan karakter: "${c}"`)
  }
  return toks
}

/* -------------------------------- AST --------------------------------- */

type Expr =
  | { k: 'num'; v: number }
  | { k: 'null' }
  | { k: 'var'; name: string }
  | { k: 'addr'; name: string }
  | { k: 'deref'; e: Expr }
  | { k: 'neg'; e: Expr }
  | { k: 'bin'; op: string; l: Expr; r: Expr }

type Stmt =
  | { kind: 'decl'; line: number; text: string; type: CType; name: string; init?: Expr }
  | { kind: 'assign'; line: number; text: string; target: Expr; op: string; rhs: Expr }

const UNSUPPORTED_WORDS: Record<string, string> = {
  char: 'char türü',
  float: 'float türü',
  double: 'double türü',
  long: 'long türü',
  short: 'short türü',
  unsigned: 'unsigned türü',
  void: 'void türü',
  struct: 'struct yapıları',
  if: 'if koşulları',
  else: 'else',
  for: 'for döngüleri',
  while: 'while döngüleri',
  do: 'do-while döngüleri',
  return: 'return ifadesi',
  malloc: 'dinamik bellek (malloc)',
  calloc: 'dinamik bellek (calloc)',
  free: 'free',
  printf: 'printf (çıktı) çağrıları',
  scanf: 'scanf (girdi) çağrıları',
  sizeof: 'sizeof',
  const: 'const niteleyicisi',
  static: 'static niteleyicisi',
}

class Parser {
  toks: Tok[]
  pos = 0
  constructor(toks: Tok[]) {
    this.toks = toks
  }
  peek(): Tok | undefined {
    return this.toks[this.pos]
  }
  next(): Tok | undefined {
    return this.toks[this.pos++]
  }
  isOp(v: string): boolean {
    const t = this.peek()
    return !!t && t.t === 'op' && t.v === v
  }
  eof(): boolean {
    return this.pos >= this.toks.length
  }

  parseExpr(): Expr {
    return this.parseAdd()
  }
  parseAdd(): Expr {
    let l = this.parseMul()
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.next()!.v
      const r = this.parseMul()
      l = { k: 'bin', op, l, r }
    }
    return l
  }
  parseMul(): Expr {
    let l = this.parseUnary()
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.next()!.v
      const r = this.parseUnary()
      l = { k: 'bin', op, l, r }
    }
    return l
  }
  parseUnary(): Expr {
    if (this.isOp('-')) {
      this.next()
      return { k: 'neg', e: this.parseUnary() }
    }
    if (this.isOp('+')) {
      this.next()
      return this.parseUnary()
    }
    if (this.isOp('*')) {
      this.next()
      return { k: 'deref', e: this.parseUnary() }
    }
    if (this.isOp('&')) {
      this.next()
      const t = this.next()
      if (!t || t.t !== 'id') {
        throw new EngineIssue('syntax', '"&" operatöründen sonra bir değişken adı gelmelidir. Örnek: &x')
      }
      return { k: 'addr', name: t.v }
    }
    return this.parsePrimary()
  }
  parsePrimary(): Expr {
    const t = this.next()
    if (!t) throw new EngineIssue('syntax', 'İfade beklenirken satır bitti.')
    if (t.t === 'num') {
      const v = Number(t.v)
      if (v > INT_MAX) throw new EngineIssue('semantic', `${t.v} sayısı int aralığının (en fazla ${INT_MAX}) dışında.`)
      return { k: 'num', v }
    }
    if (t.t === 'id') {
      if (t.v === 'NULL') return { k: 'null' }
      if (UNSUPPORTED_WORDS[t.v]) {
        throw new EngineIssue('unsupported', `${UNSUPPORTED_WORDS[t.v]} bu simülatörde desteklenmiyor.`)
      }
      if (this.isOp('(')) {
        throw new EngineIssue('unsupported', `Fonksiyon çağrıları ("${t.v}(...)") bu simülatörde desteklenmiyor.`)
      }
      if (this.isOp('[')) {
        throw new EngineIssue('unsupported', 'Dizi erişimi ("a[i]") simülatörde henüz desteklenmiyor. Diziler için Ders 6\'daki etkileşimli bölüme bak.')
      }
      if (this.isOp('++') || this.isOp('--')) {
        throw new EngineIssue('unsupported', '"++" / "--" desteklenmiyor. Bunun yerine "x = x + 1;" yazabilirsin.')
      }
      return { k: 'var', name: t.v }
    }
    if (t.v === '(') {
      const e = this.parseExpr()
      if (!this.isOp(')')) throw new EngineIssue('syntax', 'Kapanış parantezi ")" eksik.')
      this.next()
      return e
    }
    throw new EngineIssue('syntax', `Beklenmeyen sembol: "${t.v}"`)
  }
}

function parseStatement(text: string, line: number): Stmt {
  const toks = tokenize(text)
  if (toks.length === 0) throw new EngineIssue('syntax', 'Boş ifade.')
  const p = new Parser(toks)
  const first = toks[0]

  if (first.t === 'op' && (first.v === '{' || first.v === '}')) {
    throw new EngineIssue('unsupported', 'Süslü parantezler / fonksiyon blokları desteklenmiyor. Kodu doğrudan, main() olmadan yaz.')
  }

  if (first.t === 'id' && first.v === 'int') {
    p.next()
    let stars = 0
    while (p.isOp('*')) {
      p.next()
      stars++
    }
    if (stars > 1) throw new EngineIssue('unsupported', 'Çok katlı pointer (int **) bu simülatörde desteklenmiyor.')
    const nameTok = p.next()
    if (!nameTok || nameTok.t !== 'id') throw new EngineIssue('syntax', 'Tür adından sonra bir değişken adı gelmelidir.')
    if (nameTok.v === 'main') {
      throw new EngineIssue('unsupported', 'Fonksiyon tanımları (main) desteklenmiyor. Yalnızca ifadeleri yaz, örn: int x = 10;')
    }
    if (UNSUPPORTED_WORDS[nameTok.v] || nameTok.v === 'NULL') {
      throw new EngineIssue('syntax', `"${nameTok.v}" değişken adı olarak kullanılamaz.`)
    }
    if (p.isOp('[')) {
      throw new EngineIssue('unsupported', 'Dizi tanımları ("int a[3]") simülatörde henüz desteklenmiyor. Diziler için Ders 6\'daki etkileşimli bölüme bak.')
    }
    if (p.isOp('(')) {
      throw new EngineIssue('unsupported', 'Fonksiyon tanımları/prototipleri desteklenmiyor.')
    }
    if (p.isOp(',')) {
      throw new EngineIssue('unsupported', 'Tek ifadede birden fazla değişken bildirimi desteklenmiyor. Her değişkeni ayrı satırda bildir.')
    }
    const type: CType = stars === 1 ? 'int*' : 'int'
    if (p.eof()) return { kind: 'decl', line, text, type, name: nameTok.v }
    if (!p.isOp('=')) throw new EngineIssue('syntax', `"${p.peek()!.v}" beklenmiyordu. Bildirimde "= değer" biçimini kullan.`)
    p.next()
    const init = p.parseExpr()
    if (!p.eof()) throw new EngineIssue('syntax', `İfadenin sonunda beklenmeyen "${p.peek()!.v}" var.`)
    return { kind: 'decl', line, text, type, name: nameTok.v, init }
  }

  if (first.t === 'id' && UNSUPPORTED_WORDS[first.v]) {
    throw new EngineIssue('unsupported', `${UNSUPPORTED_WORDS[first.v]} bu simülatörde desteklenmiyor.`)
  }
  if (first.t === 'id' && toks[1]?.t === 'op' && toks[1].v === '(') {
    throw new EngineIssue('unsupported', `Fonksiyon çağrıları ("${first.v}(...)") bu simülatörde desteklenmiyor.`)
  }

  // Atama: sol taraf ya "ad" ya da "*ifade"
  let target: Expr
  if (first.t === 'op' && first.v === '*') {
    p.next()
    target = { k: 'deref', e: p.parseUnary() }
  } else if (first.t === 'id') {
    p.next()
    if (p.isOp('[')) {
      throw new EngineIssue('unsupported', 'Dizi elemanına atama ("a[i] = ...") simülatörde henüz desteklenmiyor.')
    }
    target = { k: 'var', name: first.v }
  } else {
    throw new EngineIssue('syntax', 'Bu ifade anlaşılamadı. Atama ("x = 5;"), pointer atama ("p = &x;") veya dereference ("*p = 5;") bekleniyordu.')
  }
  const opTok = p.next()
  if (!opTok) throw new EngineIssue('syntax', 'Atama operatörü "=" eksik. İfade tek başına bir etki yaratmaz.')
  if (opTok.t !== 'op' || !['=', '+=', '-=', '*=', '/=', '%='].includes(opTok.v)) {
    if (opTok.v === '++' || opTok.v === '--') {
      throw new EngineIssue('unsupported', '"++" / "--" desteklenmiyor. Bunun yerine "x = x + 1;" yazabilirsin.')
    }
    throw new EngineIssue('syntax', `Atama operatörü bekleniyordu ("="), "${opTok.v}" bulundu.`)
  }
  const rhs = p.parseExpr()
  if (!p.eof()) throw new EngineIssue('syntax', `İfadenin sonunda beklenmeyen "${p.peek()!.v}" var.`)
  return { kind: 'assign', line, text, target, op: opTok.v, rhs }
}

/* ------------------------- Kaynağı satırlara ayır ------------------------- */

interface RawStmt {
  text: string
  line: number
}

function splitStatements(code: string, errors: EngineError[]): RawStmt[] {
  // Yorumları temizle, satır numaralarını koru.
  let clean = code.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  clean = clean.replace(/\/\/[^\n]*/g, '')
  const out: RawStmt[] = []
  const lines = clean.split('\n')
  lines.forEach((ln, idx) => {
    const lineNo = idx + 1
    const trimmed = ln.trim()
    if (!trimmed) return
    if (trimmed.startsWith('#')) {
      errors.push({
        line: lineNo,
        kind: 'unsupported',
        message: 'Önişlemci komutları (#include, #define) desteklenmiyor. Doğrudan ifadeleri yaz, örn: int x = 10;',
      })
      return
    }
    const parts = ln.split(';')
    parts.forEach((part, i) => {
      const t = part.trim()
      if (!t) return
      if (i === parts.length - 1) {
        errors.push({ line: lineNo, kind: 'syntax', message: `Satır ";" ile bitmeli: "${t}"` })
        return
      }
      out.push({ text: t, line: lineNo })
    })
  })
  return out
}

/* ------------------------------ Yorumlayıcı ------------------------------ */

type Val = { type: 'int'; v: number } | { type: 'int*'; v: number }

class Machine {
  cells: MemoryCell[] = []
  nextAddr = BASE_ADDRESS

  find(name: string): MemoryCell | undefined {
    return this.cells.find((c) => c.name === name)
  }
  at(addr: number): MemoryCell | undefined {
    return this.cells.find((c) => c.address === addr)
  }
  require(name: string): MemoryCell {
    const c = this.find(name)
    if (!c) throw new EngineIssue('semantic', `"${name}" değişkeni tanımlanmadan kullanıldı. Önce "int ${name};" gibi bir bildirim gerekir.`)
    return c
  }

  declare(name: string, type: CType): MemoryCell {
    if (this.find(name)) throw new EngineIssue('semantic', `"${name}" değişkeni zaten tanımlı (aynı isimle ikinci bildirim yapılamaz).`)
    const size = type === 'int*' ? PTR_SIZE : INT_SIZE
    const addr = Math.ceil(this.nextAddr / size) * size
    this.nextAddr = addr + size
    const cell: MemoryCell = { name, address: addr, value: null, type }
    this.cells.push(cell)
    return cell
  }

  snapshot(): MemoryCell[] {
    return this.cells.map((c) => {
      const copy: MemoryCell = { ...c }
      delete copy.pointsTo
      if (c.type === 'int*' && c.value !== null && c.value !== 0 && this.at(c.value)) copy.pointsTo = c.value
      return copy
    })
  }

  /** Bir deref ifadesinin işaret ettiği hücreyi güvenle bul; geçersizse UB fırlat. */
  resolveDeref(e: Expr, forWrite: boolean): { cell: MemoryCell; ptrName?: string; ptrAddr: number } {
    let ptrAddr: number
    let ptrName: string | undefined
    if (e.k === 'var') {
      const pc = this.require(e.name)
      if (pc.type !== 'int*') {
        throw new EngineIssue('semantic', `"${e.name}" bir int; "*${e.name}" yazılamaz. Dereference (*) yalnızca pointer (int*) üzerinde kullanılır.`)
      }
      if (pc.value === null) {
        throw new EngineIssue(
          'ub',
          `⚠ Başlatılmamış pointer: "${e.name}" henüz bir adresle doldurulmadı, içinde belirsiz (rastgele) bir adres var. Bu adrese ${forWrite ? 'yazmak' : 'erişmek'} C'de tanımsız davranıştır (undefined behavior) ve program çökebilir. Simülasyon güvenlik için burada durduruldu.`,
        )
      }
      ptrAddr = pc.value
      ptrName = e.name
    } else {
      const v = this.eval(e)
      if (v.type !== 'int*') {
        throw new EngineIssue('semantic', 'Dereference (*) yalnızca pointer (int*) türündeki bir ifadeye uygulanabilir; burada int değer var.')
      }
      ptrAddr = v.v
    }
    const label = ptrName ? `"${ptrName}"` : 'Bu pointer'
    if (ptrAddr === 0) {
      throw new EngineIssue(
        'ub',
        `⚠ NULL pointer dereference: ${label} NULL (0) değerini taşıyor, yani hiçbir değişkeni göstermiyor. NULL'ı dereference etmek tanımsız davranıştır (genellikle "Segmentation fault"). Simülasyon burada durduruldu.`,
      )
    }
    const cell = this.at(ptrAddr)
    if (!cell) {
      throw new EngineIssue('ub', `⚠ Geçersiz adres: ${label} ${fmtAddr(ptrAddr)} adresini tutuyor ama orada tanımlı bir değişken yok. Simülasyon durduruldu.`)
    }
    return { cell, ptrName, ptrAddr }
  }

  eval(e: Expr): Val {
    switch (e.k) {
      case 'num':
        return { type: 'int', v: e.v }
      case 'null':
        return { type: 'int*', v: 0 }
      case 'var': {
        const c = this.require(e.name)
        if (c.value === null) {
          throw new EngineIssue(
            'ub',
            `⚠ Başlatılmamış değişken: "${e.name}" okunmadan önce bir değer almadı; içinde çöp (belirsiz) değer var. Bunu kullanmak tanımsız davranıştır. Simülasyon durduruldu.`,
          )
        }
        return { type: c.type, v: c.value }
      }
      case 'addr': {
        const c = this.require(e.name)
        if (c.type !== 'int') throw new EngineIssue('unsupported', 'Pointer\'ın adresini alma (&p, çok katlı pointer) bu simülatörde desteklenmiyor.')
        return { type: 'int*', v: c.address }
      }
      case 'deref': {
        const { cell } = this.resolveDeref(e.e, false)
        if (cell.value === null) {
          throw new EngineIssue('ub', `⚠ "${cell.name}" değişkeni başlatılmadığı için *p ile okunan değer belirsiz (çöp). Simülasyon durduruldu.`)
        }
        return { type: cell.type, v: cell.value }
      }
      case 'neg': {
        const v = this.eval(e.e)
        if (v.type !== 'int') throw new EngineIssue('semantic', 'Pointer üzerinde işaret değiştirme (-) yapılamaz.')
        return { type: 'int', v: -v.v }
      }
      case 'bin': {
        const l = this.eval(e.l)
        const r = this.eval(e.r)
        if (l.type !== 'int' || r.type !== 'int') {
          throw new EngineIssue(
            'unsupported',
            `Pointer aritmetiği ("${e.op}") bu genel simülatörde desteklenmiyor. Pointer + sayı ilişkisini Ders 6'daki dizi görselleştirmesinde deneyebilirsin.`,
          )
        }
        let v: number
        switch (e.op) {
          case '+':
            v = l.v + r.v
            break
          case '-':
            v = l.v - r.v
            break
          case '*':
            v = l.v * r.v
            break
          case '/':
            if (r.v === 0) throw new EngineIssue('ub', '⚠ Sıfıra bölme: C\'de tanımsız davranıştır. Simülasyon durduruldu.')
            v = Math.trunc(l.v / r.v)
            break
          default:
            if (r.v === 0) throw new EngineIssue('ub', '⚠ Sıfıra bölümden kalan (%): C\'de tanımsız davranıştır. Simülasyon durduruldu.')
            v = l.v % r.v
        }
        if (v > INT_MAX || v < INT_MIN) {
          throw new EngineIssue('ub', `⚠ Taşma: sonuç (${v}) 32 bitlik int aralığının dışında. İşaretli taşma C'de tanımsız davranıştır. Simülasyon durduruldu.`)
        }
        return { type: 'int', v }
      }
    }
  }
}

function describeTarget(m: Machine, addr: number | null): string {
  if (addr === null) return 'belirsiz bir adres'
  if (addr === 0) return 'NULL'
  const c = m.at(addr)
  return c ? `${c.name} (${fmtAddr(addr)})` : fmtAddr(addr)
}

function pointersTo(m: Machine, name: string, exceptName?: string): string[] {
  const target = m.find(name)
  if (!target) return []
  return m.cells.filter((c) => c.type === 'int*' && c.value === target.address && c.name !== exceptName).map((c) => c.name)
}

function checkAssignable(targetType: CType, v: Val, rhs: Expr, targetName: string) {
  if (targetType === 'int' && v.type === 'int*') {
    throw new EngineIssue(
      'semantic',
      `Tür uyuşmazlığı: "${targetName}" bir int, ama sağ tarafta bir adres (int*) var. Adresin gösterdiği değeri istiyorsan *pointer yazmalısın; adresi saklamak için "int *" türünde bir değişken gerekir.`,
    )
  }
  if (targetType === 'int*' && v.type === 'int') {
    if (rhs.k === 'num' && rhs.v === 0) return
    throw new EngineIssue(
      'semantic',
      `Tür uyuşmazlığı: "${targetName}" bir pointer (int*), ona düz bir int değer (${v.v}) atanamaz. Pointer'a bir adres verilmelidir: örn. "${targetName} = &x;". Adres yerine sayı atamak, rastgele bir bellek konumuna işaret etmek demektir.`,
    )
  }
}

export function runProgram(code: string): RunResult {
  const errors: EngineError[] = []
  const raws = splitStatements(code, errors)
  const stmts: Stmt[] = []
  for (const r of raws) {
    try {
      stmts.push(parseStatement(r.text, r.line))
    } catch (err) {
      if (err instanceof EngineIssue && err.kind !== 'ub') errors.push({ line: r.line, kind: err.kind, message: err.message })
      else throw err
    }
  }
  if (errors.length > 0) {
    errors.sort((a, b) => a.line - b.line)
    return { steps: [], errors }
  }
  if (stmts.length === 0) {
    return { steps: [], errors: [{ line: 1, kind: 'syntax', message: 'Çalıştırılacak bir ifade bulunamadı. Örnek: int x = 10;' }] }
  }

  const m = new Machine()
  const steps: ExecutionStep[] = [
    { line: 0, memory: [], explanation: 'Program başlamadan önce bellek boş. "Sonraki Adım" ile ilk satırı çalıştır.', changed: [], status: 'ok' },
  ]

  for (const s of stmts) {
    try {
      if (s.kind === 'decl') {
        const cell = m.declare(s.name, s.type)
        const size = s.type === 'int*' ? PTR_SIZE : INT_SIZE
        let explanation = `${s.name} için bellekte ${fmtAddr(cell.address)} adresinde ${size} baytlık yer ayrıldı (tür: ${s.type}).`
        if (s.init) {
          const v = m.eval(s.init)
          checkAssignable(s.type, v, s.init, s.name)
          cell.value = v.v
          if (s.type === 'int') {
            explanation += ` İçine ${v.v} değeri yazıldı.`
          } else if (v.v === 0) {
            explanation += ' Pointer NULL (0) ile başlatıldı: şu an hiçbir şeyi göstermiyor.'
          } else {
            explanation += ` Pointer'ın içine ${describeTarget(m, v.v)} adresi yazıldı: ${s.name}, ${m.at(v.v)?.name} değişkenini gösteriyor. (${s.name}'nin kendi adresi ${fmtAddr(cell.address)}, içindeki değer ${fmtAddr(v.v)}.)`
          }
        } else if (s.type === 'int*') {
          explanation += ' Başlangıç değeri verilmedi: pointer BAŞLATILMAMIŞ ve içinde rastgele (belirsiz) bir adres var. Bu haliyle dereference edilmemelidir!'
        } else {
          explanation += ' Başlangıç değeri verilmedi: içinde çöp (belirsiz) bir değer var.'
        }
        steps.push({ line: s.line, memory: m.snapshot(), explanation, changed: [s.name], status: 'ok' })
        continue
      }

      // atama
      const rhsVal = m.eval(s.rhs)
      if (s.target.k === 'var') {
        const cell = m.require(s.target.name)
        let val = rhsVal
        if (s.op !== '=') {
          if (cell.type !== 'int' || rhsVal.type !== 'int') {
            throw new EngineIssue('unsupported', `"${s.op}" yalnızca int değişkenlerde desteklenir (pointer aritmetiği desteklenmiyor).`)
          }
          if (cell.value === null) {
            throw new EngineIssue('ub', `⚠ "${cell.name}" başlatılmadan "${s.op}" ile okundu; değeri belirsiz. Simülasyon durduruldu.`)
          }
          const binOp = s.op[0]
          val = m.eval({ k: 'bin', op: binOp, l: { k: 'num', v: cell.value }, r: { k: 'num', v: rhsVal.v } })
        }
        checkAssignable(cell.type, val, s.rhs, cell.name)
        const old = cell.value
        cell.value = val.v
        let explanation: string
        const changed = [cell.name]
        if (cell.type === 'int*') {
          const oldT = old === null ? 'belirsiz bir adres' : describeTarget(m, old)
          explanation =
            val.v === 0
              ? `${cell.name} artık NULL: hiçbir değişkeni göstermiyor (eskiden: ${oldT}).`
              : `${cell.name} pointer'ının içindeki adres ${oldT} yerine ${describeTarget(m, val.v)} oldu. Ok artık ${m.at(val.v)?.name} değişkenini gösteriyor. Değişkenlerin kendi değerleri değişmedi; yalnızca pointer'ın içeriği değişti.`
        } else {
          explanation = `${cell.name} değişkeninin değeri ${old === null ? 'belirsizdi' : old}${old === null ? '' : ''} → ${val.v} oldu.`
          const watchers = pointersTo(m, cell.name)
          if (watchers.length) {
            explanation += ` ${watchers.join(', ')} bu değişkeni gösterdiği için *${watchers[0]} artık ${val.v} değerini okur — adres aynı kaldı, içerik değişti.`
          }
        }
        steps.push({ line: s.line, memory: m.snapshot(), explanation, changed, status: 'ok' })
        continue
      }

      // *ifade = değer
      const { cell, ptrName, ptrAddr } = m.resolveDeref((s.target as Extract<Expr, { k: 'deref' }>).e, true)
      let val = rhsVal
      if (s.op !== '=') {
        if (cell.value === null) {
          throw new EngineIssue('ub', `⚠ "${cell.name}" başlatılmadan "${s.op}" ile okundu; değeri belirsiz. Simülasyon durduruldu.`)
        }
        if (cell.type !== 'int' || rhsVal.type !== 'int') throw new EngineIssue('unsupported', `"${s.op}" yalnızca int değerlerde desteklenir.`)
        val = m.eval({ k: 'bin', op: s.op[0], l: { k: 'num', v: cell.value }, r: { k: 'num', v: rhsVal.v } })
      }
      checkAssignable(cell.type, val, s.rhs, `*${ptrName ?? 'pointer'}`)
      const old = cell.value
      cell.value = val.v
      const who = ptrName ? `${ptrName}` : 'Pointer'
      const explanation = `*${ptrName ?? '(ifade)'} = ${val.v}: ${who}, ${fmtAddr(ptrAddr)} adresini tutuyor; bu adreste ${cell.name} değişkeni var. Dereference ile ${cell.name} değeri ${old === null ? 'belirsizdi' : old} → ${val.v} yapıldı. ${who}'nin kendisi değişmedi: hâlâ ${fmtAddr(ptrAddr)} adresini tutuyor.`
      steps.push({ line: s.line, memory: m.snapshot(), explanation, changed: [cell.name], status: 'ok' })
    } catch (err) {
      if (!(err instanceof EngineIssue)) throw err
      if (err.kind === 'ub') {
        // Güvenli durdurma: son durumu koru, uyarıyı göster.
        steps.push({ line: s.line, memory: m.snapshot(), explanation: err.message, changed: [], status: 'ub' })
        return { steps, errors: [] }
      }
      // Derleme zamanı hatası: gerçek C'de program hiç çalışmazdı.
      return { steps: [], errors: [{ line: s.line, kind: err.kind, message: err.message }] }
    }
  }

  return { steps, errors: [] }
}

/** Ders/oyun bileşenleri için örnek kodlar. */
export const SAMPLES: { title: string; code: string }[] = [
  {
    title: 'Varsayılan: pointer yönlendirme',
    code: 'int x = 10;\nint y = 20;\nint *p = &x;\n\np = &y;\n*p = 50;',
  },
  {
    title: 'Dereference ile değer değiştirme',
    code: 'int x = 10;\nint *p = &x;\n*p = 25;\nx = 30;\n*p = *p + 5;',
  },
  {
    title: 'İki pointer, tek değişken',
    code: 'int a = 7;\nint *p = &a;\nint *q = p;\n*q = 99;',
  },
  {
    title: '⚠ Başlatılmamış pointer (UB)',
    code: 'int x = 5;\nint *p;\n*p = 10;',
  },
  {
    title: '⚠ NULL pointer dereference (UB)',
    code: 'int x = 5;\nint *p = NULL;\n*p = 10;',
  },
]
