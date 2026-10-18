import type { MemoryCell } from '../engine/types'
import type { Concept } from '../store/progress'

export interface QuizOption {
  text: string
  /** Bu seçenek seçilirse gösterilecek neden açıklaması. */
  why: string
}

export interface Lesson {
  id: number
  title: string
  concept: Concept
  summary: string
  objectives: string[]
  theory: string[]
  displayCode: string
  /** Animasyon için motor tarafından çalıştırılan kod (null: özel görselleştirme). */
  simCode: string | null
  /** Animasyon sonunda gösterilecek ek not (motor çıktısından üretilir). */
  simNote?: (mem: MemoryCell[]) => string
  quiz: { question: string; options: QuizOption[]; correct: number }
}

const get = (mem: MemoryCell[], n: string) => mem.find((c) => c.name === n)

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'Değişkenler ve Bellek',
    concept: 'address',
    summary: 'RAM, değişken ve bellek adresi kavramları.',
    objectives: ['RAM\'in numaralı hücrelerden oluştuğunu açıklar.', 'Bir değişkenin bellekte yer kapladığını ve bir adresi olduğunu söyler.'],
    theory: [
      '**RAM (Bellek)**, programın çalışırken verileri tuttuğu geçici alandır. Onu, her biri bir numaraya sahip çok sayıda küçük kutudan oluşan uzun bir raf gibi düşünebilirsin. Bu numaraya **bellek adresi (memory address)** denir.',
      '**Değişken (variable)**, bellekte ayrılmış adlandırılmış bir yerdir. `int x = 10;` yazdığında derleyici RAM\'de 4 baytlık bir yer ayırır, bu yere `x` adını verir ve içine 10 yazar.',
      'Yani her değişkenin üç özelliği vardır: **adı** (x), **türü** (int) ve **adresi** (bellekteki yeri). Şimdiye kadar sadece ilk ikisini kullandın; pointer, üçüncüsüyle ilgilenir.',
    ],
    displayCode: 'int x = 10;',
    simCode: 'int x = 10;\nint y = 20;',
    quiz: {
      question: '`int x = 10;` satırı çalıştığında bellekte ne olur?',
      correct: 0,
      options: [
        { text: 'x için RAM\'de bir yer (adres) ayrılır ve 10 değeri oraya yazılır.', why: 'Doğru. Değişken = adı olan, adresi olan bir bellek yeri; içinde de değeri vardır.' },
        { text: '10 sayısı yalnızca ekranda gösterilir, bellekte tutulmaz.', why: 'Değerler ekranda değil, RAM\'de tutulur. Ekrana yazmak ayrı bir işlemdir (printf).' },
        { text: 'Yalnızca "x" ismi saklanır, adres oluşmaz.', why: 'İsim programcı içindir. Bilgisayar belleğe adreslerle erişir; her değişkenin bir adresi vardır.' },
        { text: 'x, 10 numaralı adresi gösteren bir pointer olur.', why: 'x sıradan bir int\'tir; içinde 10 DEĞERİ vardır. 10 adresini tutan bir değişken olsaydı tür int* olurdu.' },
      ],
    },
  },
  {
    id: 2,
    title: 'Bellek Adresleri ve & Operatörü',
    concept: 'addressOf',
    summary: 'Adres alma (address-of) operatörü ile bir değişkenin adresini öğren.',
    objectives: ['&x ifadesinin x\'in adresini verdiğini bilir.', 'Değer ile adresi birbirinden ayırır.'],
    theory: [
      '**Adres alma operatörü (address-of, `&`)** bir değişkenin değerini değil, **bellekteki adresini** verir. `&x` = "x nerede duruyor?"',
      '`printf("%p", (void *)&x);` komutu x\'in adresini yazdırır. Aynı değişkenin değeri `x`, adresi ise `&x` ile elde edilir.',
      '**Önemli:** PointerLab\'de gördüğün adresler (0x100, 0x104, …) gerçek bilgisayar belleğindeki adresler değil, öğrenmeyi kolaylaştırmak için üretilmiş **sanal adreslerdir**. Gerçek programda adresler çok daha büyük ve her çalıştırmada farklı olabilir.',
    ],
    displayCode: 'int x = 10;\nprintf("%p", (void *)&x);',
    simCode: 'int x = 10;\nint y = 20;\nint z = 30;',
    simNote: (mem) => `Simülasyonda printf("%p", (void *)&x) şunu yazdırırdı: ${get(mem, 'x') ? '0x' + get(mem, 'x')!.address.toString(16) : ''} (sanal adres). Değerlerin 10, 20, 30 olduğuna dikkat et: adresler değer değildir.`,
    quiz: {
      question: '`int x = 10;` iken `&x` ifadesi neyi verir?',
      correct: 1,
      options: [
        { text: 'x\'in değerini (10).', why: 'Değer zaten `x` yazınca elde edilir. `&` işlemi değeri değil, yeri verir.' },
        { text: 'x\'in bellekteki adresini.', why: 'Doğru. `&` "address-of" operatörüdür: değişkenin bellekte nerede durduğunu söyler.' },
        { text: 'x\'in türünü (int).', why: 'Tür derleme sırasında bilinir ama & ile elde edilmez.' },
        { text: 'x\'ten sonra tanımlanan değişkenin adresini.', why: '& yalnızca yanındaki değişkenin kendi adresini verir.' },
      ],
    },
  },
  {
    id: 3,
    title: 'Pointer Tanımlama',
    concept: 'define',
    summary: 'Adres tutan özel değişken: pointer.',
    objectives: ['int *p; bildiriminin anlamını açıklar.', 'p\'nin kendi adresi ile içindeki adresi ayırt eder.'],
    theory: [
      '**İşaretçi (pointer)**, değeri bir **bellek adresi** olan değişkendir. `int *p = &x;` ifadesi "p, bir int\'in adresini tutar; şimdilik x\'in adresini" demektir.',
      'Pointer da bir değişkendir; yani **kendi adresi** de vardır. Bu yüzden iki farklı adres vardır: **p\'nin kendi adresi** (0x108) ve **p\'nin içindeki adres** (0x100 = x\'in adresi). Animasyondaki ok, ikincisini izler.',
      'Tipik hata: `int *p = x;` yazmak. Burada x bir değerdir (10), adres değil; doğrusu `&x`.',
    ],
    displayCode: 'int x = 10;\nint *p = &x;',
    simCode: 'int x = 10;\nint *p = &x;',
    quiz: {
      question: '`int *p = &x;` satırından sonra p\'nin içinde ne saklanır?',
      correct: 2,
      options: [
        { text: 'x\'in değeri (10).', why: 'Değer x\'in içindedir. p ise o değeri değil, x\'in YERİNİ (adresini) tutar.' },
        { text: 'p\'nin kendi adresi.', why: 'p\'nin kendi adresi bellekteki yeridir; içeriği değildir. Kartta "Kendi adresi" ile "İçindeki değer" ayrı satırlardır.' },
        { text: 'x\'in adresi.', why: 'Doğru. Pointer, gösterdiği değişkenin adresini taşır; ok bu adrese gider.' },
        { text: 'x ismi (karakter dizisi olarak).', why: 'İsimler çalışma anında bellekte tutulmaz; pointer sayısal bir adres taşır.' },
      ],
    },
  },
  {
    id: 4,
    title: 'Dereference Operatörü',
    concept: 'deref',
    summary: 'Pointer üzerinden gösterdiği değere erişim.',
    objectives: ['*p ifadesinin p\'nin gösterdiği değişkene eriştiğini bilir.', 'Pointer üzerinden değer değiştirir.'],
    theory: [
      '**Dereference (işaretçinin gösterdiği değere erişim, `*`)**, pointer\'ın içindeki adrese gidip oradaki değişkene ulaşmanı sağlar. `*p`, "p\'nin gösterdiği yerdeki değer" demektir.',
      '`*p = 25;` komutu p\'nin kendisini değiştirmez; p hâlâ aynı adresi tutar. Değişen, o adreste duran **x değişkenidir**. Bu yüzden x doğrudan hiç dokunulmadan 25 olur.',
      'Dikkat: `int *p;` bildirimindeki `*` "p bir pointer" der; `*p = 25;` ifadesindeki `*` ise "dereference et" anlamına gelir. Aynı işaret, farklı görev.',
    ],
    displayCode: 'int x = 10;\nint *p = &x;\n*p = 25;',
    simCode: 'int x = 10;\nint *p = &x;\n*p = 25;',
    quiz: {
      question: '`int x = 10; int *p = &x; *p = 25;` işlemlerinden sonra x kaçtır?',
      correct: 3,
      options: [
        { text: '10 — p ayrı bir değişken, x etkilenmez.', why: 'p, x\'in adresini tutuyor. *p ile o adrese yazınca x\'in kendisi değişir.' },
        { text: 'p\'nin adresi.', why: '*p bir adres değil, adresteki değerdir; ayrıca x bir int olduğundan adres tutamaz.' },
        { text: 'Derleme hatası olur.', why: 'Kod geçerlidir: *p, int türünde bir ifadedir ve ona int atanabilir.' },
        { text: '25.', why: 'Doğru. *p = 25 → p\'nin gösterdiği yer (x) 25 olur. p hâlâ x\'in adresini tutar.' },
      ],
    },
  },
  {
    id: 5,
    title: 'Pointer Yönlendirme',
    concept: 'redirect',
    summary: 'Pointer\'ı başka bir değişkene çevirmek.',
    objectives: ['p = &b ifadesinin p\'nin içeriğini değiştirdiğini ayırt eder.', '*p = … ile p = … arasındaki farkı açıklar.'],
    theory: [
      'Pointer\'a yeni bir adres atarsan **gösterdiği şey değişir**: `p = &b;` p\'yi b\'ye yönlendirir. Ok, a\'dan ayrılıp b\'ye geçer.',
      '`p = &b;` ile `*p = 5;` arasındaki fark çok önemlidir: ilki **pointer\'ın içeriğini** (adresi) değiştirir, ikincisi **gösterilen değişkenin değerini** değiştirir.',
      'Yönlendirme sırasında a ve b\'nin değerleri **kopyalanmaz**, değişmez. Yalnızca p\'nin içindeki adres güncellenir.',
    ],
    displayCode: 'int a = 10;\nint b = 20;\nint *p = &a;\np = &b;',
    simCode: 'int a = 10;\nint b = 20;\nint *p = &a;\np = &b;',
    quiz: {
      question: '`int a=10, b=20; int *p=&a; p=&b;` sonrasında `a` ve `*p` kaçtır?',
      correct: 1,
      options: [
        { text: 'a = 20, *p = 20', why: '`p = &b` a\'nın değerine dokunmaz. Değer kopyalamak için `a = b;` yazılırdı.' },
        { text: 'a = 10, *p = 20', why: 'Doğru. a aynı kaldı; p artık b\'yi gösterdiği için *p, b\'nin değeri olan 20\'dir.' },
        { text: 'a = 10, *p = 10', why: 'p artık a\'yı değil b\'yi gösteriyor, bu yüzden *p = 20.' },
        { text: 'a = 20, *p = 10', why: 'Değerler birbirine karışıyor: a hiç değişmez (10); *p ise yeni hedefin (b) değeridir.' },
      ],
    },
  },
  {
    id: 6,
    title: 'Pointer ve Diziler',
    concept: 'arrays',
    summary: 'Dizi elemanları yan yana durur; p + 1 bir sonraki elemanı gösterir.',
    objectives: ['Dizi isminin ilk elemanın adresine dönüştüğünü bilir.', 'p + 1 ifadesinin sizeof(int) kadar ilerlediğini açıklar.'],
    theory: [
      'Bir dizinin elemanları bellekte **yan yana** durur. `int numbers[3]` için elemanlar 4\'er bayt aralıkla dizilir (örn. 0x200, 0x204, 0x208).',
      'Dizi ismi, çoğu ifadede **ilk elemanın adresi**ne dönüşür. Bu yüzden `int *p = numbers;` yazabilirsin: p ilk elemanı gösterir.',
      '**Pointer aritmetiği:** `p + 1` adresi 1 bayt değil, **bir eleman (sizeof(int) = 4 bayt)** ileri taşır ve sonraki elemanı gösterir. `*(p + 1)` ikinci elemandır (`numbers[1]`).',
      'Dizi sınırlarının dışına çıkmak (`p + 3` ve `*(p + 3)`) tanımsız davranıştır.',
    ],
    displayCode: 'int numbers[3] = {10, 20, 30};\nint *p = numbers;\n// *(p + 1) → 20',
    simCode: null,
    quiz: {
      question: '`int numbers[3] = {10,20,30}; int *p = numbers;` iken `*(p + 1)` kaçtır?',
      correct: 2,
      options: [
        { text: '10', why: '*p ilk elemandır (10). `p + 1` bir eleman ileri gittiği için ikinci elemana ulaşılır.' },
        { text: '30', why: '30 üçüncü elemandır → `*(p + 2)`. `p + 1` yalnızca bir eleman ilerler.' },
        { text: '20', why: 'Doğru. `p + 1` adresi 4 bayt (bir int) ileri taşır → numbers[1] = 20.' },
        { text: '11', why: 'p + 1, adresin değerine 1 eklemez; adresi bir ELEMAN ilerletir. Sonuç hâlâ dizideki bir değerdir.' },
      ],
    },
  },
]

/* ---------------- Ders etkinlikleri (ChipActivity tanımları) ---------------- */

export interface ChipDef {
  instruction: string
  base: string
  chips: string[]
  goal: (ctx: { memory: MemoryCell[]; chosen: string[] }) => { ok: boolean; message: string }
}

const v = (m: MemoryCell[], n: string) => m.find((c) => c.name === n)

export const LESSON_CHIPS: Record<number, ChipDef> = {
  1: {
    instruction: 'Bellekte x = 10 ve y = 20 olacak şekilde iki değişken oluştur. Hangi ifadelerin birlikte çalışacağına dikkat et!',
    base: '',
    chips: ['int x = 10;', 'int x = 20;', 'int y = 20;', 'int y = 10;'],
    goal: ({ memory }) => {
      const x = v(memory, 'x')
      const y = v(memory, 'y')
      if (x?.value === 10 && y?.value === 20) {
        return { ok: true, message: `Harika! x ${'0x' + x.address.toString(16)} adresine, y ${'0x' + y.address.toString(16)} adresine yerleşti. Her değişken kendi bellek yerine sahip; adresleri farklı.` }
      }
      return { ok: false, message: `Henüz hedefte değil: x = ${x?.value ?? 'yok'}, y = ${y?.value ?? 'yok'}. Hedef x = 10 ve y = 20. Değişken değerinin bildirimde (= işaretinden sonra) verildiğine dikkat et.` }
    },
  },
  3: {
    instruction: 'p pointer\'ını y değişkenine bağla. Bazı ifadeler C\'de hata verir — bellek panelinde neden olduğunu oku.',
    base: 'int x = 10;\nint y = 20;\nint *p;',
    chips: ['p = &x;', 'p = &y;', 'p = x;', 'p = 20;'],
    goal: ({ memory }) => {
      const p = v(memory, 'p')
      const y = v(memory, 'y')!
      const x = v(memory, 'x')!
      if (p?.value === y.address) return { ok: true, message: `Harika! p artık y değişkeninin adresini (0x${y.address.toString(16)}) tutuyor ve ok y\'yi gösteriyor.` }
      if (p?.value === x.address) return { ok: false, message: 'p şu an x\'i gösteriyor; hedef y. Pointer\'a hangi değişkenin adresini vermen gerektiğini tekrar düşün: `&` operatörü hangi ismin yanında olmalı?' }
      return { ok: false, message: 'p henüz y\'nin adresini taşımıyor. İpucu: adres vermek için `&değişken` yazılır.' }
    },
  },
  4: {
    instruction: 'x\'i pointer üzerinden 25 yap (yani x\'e doğrudan atama yapma). Birkaç ifade bilerek yanlıştır.',
    base: 'int x = 10;\nint *p = &x;',
    chips: ['*p = 25;', 'x = 25;', 'p = 25;', '*x = 25;'],
    goal: ({ memory, chosen }) => {
      const x = v(memory, 'x')
      if (x?.value === 25 && chosen.includes('*p = 25;')) return { ok: true, message: 'Harika! *p = 25 ile p\'nin gösterdiği yer (x) değişti. p hâlâ x\'in adresini tutuyor; yalnızca x\'in değeri 25 oldu.' }
      if (x?.value === 25) return { ok: false, message: 'x 25 oldu ama pointer kullanmadın. Bu etkinlikte amaç `*p = 25;` ile dereference etmek: x\'e p üzerinden eriş.' }
      return { ok: false, message: `x şu an ${x?.value}. Hedef 25. Dereference için pointer isminin önüne * koymalısın.` }
    },
  },
  5: {
    instruction: 'p\'yi b\'ye yönlendir, sonra *p ile b\'yi 99 yap. a değişmemeli (10 kalmalı).',
    base: 'int a = 10;\nint b = 20;\nint *p = &a;',
    chips: ['p = &b;', '*p = 99;', 'a = 99;', 'p = &a;'],
    goal: ({ memory }) => {
      const a = v(memory, 'a')!
      const b = v(memory, 'b')!
      const p = v(memory, 'p')!
      if (p.value === b.address && b.value === 99 && a.value === 10) return { ok: true, message: 'Harika! Önce p = &b ile ok b\'ye geçti, sonra *p = 99 ile b değişti. a\'ya hiç dokunulmadı.' }
      if (a.value === 99) return { ok: false, message: 'a değişti ama istenen b\'nin değişmesiydi. *p = 99 yazmadan önce p\'nin kimi gösterdiğine bak.' }
      if (p.value !== b.address) return { ok: false, message: 'p hâlâ b\'yi göstermiyor. Önce pointer\'ı yönlendir (`p = &b;`), sonra değeri değiştir.' }
      return { ok: false, message: `b = ${b.value}, hedef 99. Yönlendirdikten sonra *p ile değer ata.` }
    },
  },
}
