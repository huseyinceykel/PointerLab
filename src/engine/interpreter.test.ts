import { describe, expect, it } from 'vitest'
import { runProgram, SAMPLES } from './interpreter'

const last = (code: string) => {
  const r = runProgram(code)
  return { r, final: r.steps[r.steps.length - 1] }
}
const cell = (code: string, name: string) => last(code).final.memory.find((c) => c.name === name)!

describe('Memory engine', () => {
  it('1. pointer bir değişkene atanır; adres ve pointsTo doğru', () => {
    const x = cell('int x = 10;\nint y = 20;\nint *p = &x;', 'x')
    const p = cell('int x = 10;\nint y = 20;\nint *p = &x;', 'p')
    expect(x.address).toBe(0x100)
    expect(p.address).toBe(0x108) // pointer 8 bayt hizalı
    expect(p.value).toBe(0x100) // p'nin TUTTUĞU adres x'in adresi
    expect(p.address).not.toBe(p.value) // kendi adresi ≠ tuttuğu adres
    expect(p.pointsTo).toBe(0x100)
  })

  it('2. pointer başka değişkene yönlendirilir', () => {
    const code = 'int x = 10;\nint y = 20;\nint *p = &x;\np = &y;'
    const p = cell(code, 'p')
    expect(p.value).toBe(0x104)
    expect(p.pointsTo).toBe(0x104)
    expect(cell(code, 'x').value).toBe(10)
    expect(cell(code, 'y').value).toBe(20)
  })

  it('3. dereference ile değer değişir, pointer değişmez', () => {
    const code = SAMPLES[0].code // p = &y; *p = 50;
    expect(cell(code, 'y').value).toBe(50)
    expect(cell(code, 'x').value).toBe(10)
    expect(cell(code, 'p').value).toBe(0x104)
  })

  it('4. değişken doğrudan değiştirilir; pointer aynı kalır', () => {
    const code = 'int x = 10;\nint *p = &x;\nx = 30;'
    expect(cell(code, 'x').value).toBe(30)
    expect(cell(code, 'p').value).toBe(0x100)
    expect(last(code).final.explanation).toContain('*p artık 30')
  })

  it('5a. desteklenmeyen kod sessizce yok sayılmaz', () => {
    for (const bad of ['float f = 1;', 'for (;;) {}', 'printf("a");', 'int a[3];', 'int **pp;', '#include <stdio.h>', 'x++;']) {
      const r = runProgram(bad.endsWith(';') || bad.startsWith('#') || bad.endsWith('}') ? bad : bad + ';')
      expect(r.steps).toHaveLength(0)
      expect(r.errors.length).toBeGreaterThan(0)
    }
  })

  it('5b. geçersiz sözdizimi ve eksik noktalı virgül hata verir', () => {
    expect(runProgram('int x = 10').errors[0].message).toContain(';')
    expect(runProgram('int x = ;').errors.length).toBe(1)
    expect(runProgram('int x = 5 $;').errors[0].kind).toBe('syntax')
  })

  it('semantik hatalar: tanımsız değişken, tür uyuşmazlığı, tekrar bildirim', () => {
    expect(runProgram('y = 3;').errors[0].message).toContain('tanımlanmadan')
    expect(runProgram('int x = 1;\nint *p = x;').errors[0].message).toContain('Tür uyuşmazlığı')
    expect(runProgram('int x = 1;\nint y = &x;').errors[0].message).toContain('Tür uyuşmazlığı')
    expect(runProgram('int x = 1;\nint x = 2;').errors[0].message).toContain('zaten tanımlı')
    expect(runProgram('int x = 1;\n*x = 2;').errors[0].message).toContain('int')
  })

  it('başlatılmamış pointer dereference → güvenli UB uyarısı', () => {
    const { r, final } = last('int *p;\n*p = 10;')
    expect(r.errors).toHaveLength(0)
    expect(final.status).toBe('ub')
    expect(final.explanation).toContain('Başlatılmamış pointer')
  })

  it('NULL pointer dereference → UB uyarısı', () => {
    const { final } = last('int *p = NULL;\n*p = 1;')
    expect(final.status).toBe('ub')
    expect(final.explanation).toContain('NULL')
  })

  it('aritmetik, bileşik atama ve *p okuma', () => {
    const code = 'int x = 4;\nint *p = &x;\nint y = (x + 2) * 3 - *p / 2;\ny += 1;\n*p = *p % 3;'
    expect(cell(code, 'y').value).toBe(18 - 2 + 1)
    expect(cell(code, 'x').value).toBe(1)
  })

  it('pointer kopyalama ve 0 ile NULL atama', () => {
    const code = 'int a = 7;\nint *p = &a;\nint *q = p;\n*q = 99;'
    expect(cell(code, 'a').value).toBe(99)
    expect(cell(code, 'q').pointsTo).toBe(0x100)
    expect(cell('int *p = 0;', 'p').value).toBe(0)
  })

  it('her adım bir snapshot üretir ve önceki adımlar değişmez (geri sarma)', () => {
    const { r } = last(SAMPLES[0].code)
    expect(r.steps.length).toBe(1 + 5)
    expect(r.steps[3].memory.find((c) => c.name === 'p')!.value).toBe(0x100)
    expect(r.steps[4].memory.find((c) => c.name === 'p')!.value).toBe(0x104)
    expect(r.steps[0].memory).toHaveLength(0)
  })

  it('sıfıra bölme ve taşma UB olarak durur', () => {
    expect(last('int x = 1;\nint y = x / 0;').final.status).toBe('ub')
    expect(last('int x = 2147483647;\nint y = x + 1;').final.status).toBe('ub')
  })

  it('örnek kodların hepsi çalışır veya beklenen UB ile durur', () => {
    for (const s of SAMPLES) {
      const r = runProgram(s.code)
      expect(r.errors).toHaveLength(0)
      expect(r.steps.length).toBeGreaterThan(1)
    }
  })
})
