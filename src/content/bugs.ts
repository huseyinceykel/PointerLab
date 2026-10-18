import type { Concept } from '../store/progress'

export interface Opt {
  text: string
  why: string
}

export interface Bug {
  id: string
  title: string
  concept: Concept
  code: string
  question: string
  problems: Opt[]
  correctProblem: number
  fixQuestion: string
  fixes: Opt[]
  correctFix: number
  /** Hatanın sebebi (özet). */
  cause: string
  /** İlgili öğrenme kazanımı. */
  outcome: string
  fixedCode: string
  /** Simülatörde denenebilecek kod (motorun desteklediği biçimde). */
  simCode?: string
}

export const BUGS: Bug[] = [
  {
    id: 'uninit',
    title: 'Başlatılmamış pointer',
    concept: 'bounds',
    code: 'int *p;\n*p = 10;',
    question: 'Bu kodda hangi problem bulunuyor?',
    problems: [
      { text: 'p başlatılmadan dereference ediliyor; rastgele bir adrese yazılıyor.', why: 'Doğru. p\'nin içinde belirsiz (çöp) bir adres var.' },
      { text: '10 değeri int türüne sığmıyor.', why: '10 elbette int\'e sığar. Sorun değerde değil, yazılan ADRESTE.' },
      { text: '`*` operatörü pointer bildiriminde kullanılamaz.', why: 'Bildirimdeki `*` ("p bir pointer") ve dereference `*` farklı görevlerdir; ikisi de geçerli.' },
      { text: 'Kodda hata yok.', why: 'Var: p hiçbir değişkeni göstermiyor ama ona yazılıyor. Derleyici uyarmasa bile program çökebilir.' },
    ],
    correctProblem: 0,
    fixQuestion: 'Hangi düzeltme sorunu giderir?',
    fixes: [
      { text: 'int x;\nint *p = &x;\n*p = 10;', why: 'Doğru. p önce geçerli bir adresle (x\'in adresi) başlatıldı; artık *p = 10, x\'e yazar.' },
      { text: 'int *p = 10;\n*p = 10;', why: 'Bu, 10 sayısını ADRES olarak kullanır; rastgele bir bellek konumuna yazar. Sorun daha da büyür.' },
      { text: 'int *p;\np = 10;', why: 'p\'ye düz sayı atamak adres vermek değildir; tür uyuşmazlığı ve geçersiz adres.' },
    ],
    correctFix: 0,
    cause: 'Yerel pointer değişkenleri otomatik olarak başlatılmaz; içlerinde rastgele bir adres bulunur. Bu adrese yazmak tanımsız davranıştır (undefined behavior).',
    outcome: 'Bir pointer\'ı dereference etmeden önce geçerli bir adresle başlatmak gerekir.',
    fixedCode: 'int x;\nint *p = &x;\n*p = 10;',
    simCode: 'int *p;\n*p = 10;',
  },
  {
    id: 'null',
    title: 'NULL pointer dereference',
    concept: 'bounds',
    code: 'int *p = NULL;\nprintf("%d", *p);',
    question: 'Bu kod çalıştırılınca ne problem yaşanır?',
    problems: [
      { text: 'NULL olan pointer dereference ediliyor; program büyük olasılıkla çöker (segmentation fault).', why: 'Doğru. NULL "hiçbir yeri göstermiyor" demektir; oradan değer okunamaz.' },
      { text: 'printf\'te `%d` biçimi yanlış.', why: '`*p` bir int\'tir, `%d` doğru. Sorun biçimde değil, *p\'nin geçersiz olmasında.' },
      { text: 'p tanımlanmamış.', why: 'p tanımlı; değeri NULL. Tanımlı ama geçerli bir yeri göstermiyor.' },
      { text: 'Hata yok; ekrana 0 yazar.', why: 'NULL\'ın değeri 0 olsa da *p, "0 adresindeki değer"dir; orası erişilemez bellektir.' },
    ],
    correctProblem: 0,
    fixQuestion: 'Hangisi güvenli bir çözümdür?',
    fixes: [
      { text: 'if (p != NULL) {\n  printf("%d", *p);\n}', why: 'Doğru. Dereference etmeden önce pointer\'ın NULL olup olmadığı kontrol edilir.' },
      { text: 'int *p = 0;\nprintf("%d", *p);', why: '0 da NULL demektir; hiçbir şey değişmedi.' },
      { text: 'printf("%d", p);', why: 'Bu derlenir ama p\'nin adresini %d ile yazdırır; yanlış biçim ve yanlış amaç.' },
    ],
    correctFix: 0,
    cause: 'NULL, geçerli bir nesneyi göstermeyen özel pointer değeridir. Onu dereference etmek tanımsız davranıştır.',
    outcome: 'Pointer kullanmadan önce NULL kontrolü yapılmalı veya pointer geçerli bir değişkene bağlanmalıdır.',
    fixedCode: 'if (p != NULL) {\n  printf("%d", *p);\n}',
    simCode: 'int *p = NULL;\nint y = *p;',
  },
  {
    id: 'address',
    title: 'Yanlış adres kullanımı',
    concept: 'addressOf',
    code: 'int x = 5;\nint *p = x;',
    question: 'Bu satırda ne yanlış?',
    problems: [
      { text: 'p\'ye x\'in adresi yerine x\'in değeri (5) atanıyor.', why: 'Doğru. Pointer adres bekler; adres için `&x` yazılmalıdır.' },
      { text: 'x değişkeni önce tanımlanmalıydı.', why: 'x zaten p\'den önce tanımlanmış.' },
      { text: 'Pointer\'a hiçbir şey atanamaz.', why: 'Atanabilir: bir ADRES atanabilir (p = &x).' },
      { text: '`int *p` yerine `int p` yazılmalı.', why: 'O zaman p pointer olmaz; bu görevde pointer\'a ihtiyaç var.' },
    ],
    correctProblem: 0,
    fixQuestion: 'Doğru düzeltme hangisi?',
    fixes: [
      { text: 'int *p = &x;', why: 'Doğru. & operatörü x\'in adresini verir; p bu adresi tutar.' },
      { text: 'int *p = *x;', why: 'x bir pointer değil; `*x` geçersizdir.' },
      { text: 'int *p = (int)x;', why: 'Tür dönüştürmek hatayı gizler: 5 sayısı hâlâ adres olarak yorumlanır, x\'e bağlantı yok.' },
    ],
    correctFix: 0,
    cause: 'Pointer\'a değer değil adres verilmelidir. `x` değeri, `&x` adresi verir.',
    outcome: 'Adres alma operatörü (&) ile değer ve adres ayrımı.',
    fixedCode: 'int x = 5;\nint *p = &x;',
    simCode: 'int x = 5;\nint *p = x;',
  },
  {
    id: 'types',
    title: 'Pointer türlerinin karıştırılması',
    concept: 'types',
    code: 'double d = 3.14;\nint *p = &d;',
    question: 'Bu kodda hangi problem var?',
    problems: [
      { text: 'int* türündeki pointer, double türündeki değişkenin adresini tutuyor (tür uyuşmazlığı).', why: 'Doğru. Pointer türü, gösterdiği verinin türüyle uyumlu olmalı.' },
      { text: 'd değişkeni bellekte yer kaplamaz.', why: 'Her değişken bellekte yer kaplar (double genellikle 8 bayt).' },
      { text: '3.14 sayısı çok büyük.', why: 'Büyüklük sorun değil; sorun pointer\'ın türü.' },
      { text: '& operatörü double ile kullanılamaz.', why: '& her değişkenle kullanılabilir.' },
    ],
    correctProblem: 0,
    fixQuestion: 'Hangi düzeltme doğrudur?',
    fixes: [
      { text: 'double *p = &d;', why: 'Doğru. Pointer, gösterdiği türle eşleşiyor: double* → double.' },
      { text: 'int *p = (int *)&d;', why: 'Derlenir, ama double\'ın bitlerini int olarak yorumlarsın; anlamsız değer okursun. Hatayı gizler, çözmez.' },
      { text: 'int *p = d;', why: 'Hem tür hem adres hatası: d bir değerdir, adres değil.' },
    ],
    correctFix: 0,
    cause: 'Pointer türü, adresteki verinin kaç bayt olduğunu ve nasıl yorumlanacağını belirler. int* ile bir double okumak yanlış yorumlamadır.',
    outcome: 'Pointer türü ile gösterilen değişkenin türü uyumlu olmalıdır.',
    fixedCode: 'double d = 3.14;\ndouble *p = &d;',
  },
  {
    id: 'bounds',
    title: 'Dizi sınırı dışına erişim',
    concept: 'bounds',
    code: 'int a[3] = {1, 2, 3};\nint *p = a;\n*(p + 3) = 10;',
    question: 'Amaç dizinin SON elemanına 10 yazmak. Neden bu kod hatalı?',
    problems: [
      { text: 'p + 3, dizinin dışındaki bir adresi gösterir; geçerli elemanlar p+0, p+1, p+2\'dir.', why: 'Doğru. 3 elemanlı dizide indeksler 0..2\'dir.' },
      { text: 'p dizi ismine eşitlenemez.', why: '`int *p = a;` geçerlidir; dizi ismi ilk elemanın adresine dönüşür.' },
      { text: 'p + 3 adresi 3 bayt ilerletir, bu da hatalı.', why: 'p + 3, 3 ELEMAN (3 × 4 = 12 bayt) ilerletir; sorun, bunun dizinin dışına çıkması.' },
      { text: 'Pointer ile diziye yazılamaz.', why: 'Yazılabilir: `*(p + 2) = 10;` geçerlidir.' },
    ],
    correctProblem: 0,
    fixQuestion: 'Son elemana yazan doğru ifade hangisi?',
    fixes: [
      { text: '*(p + 2) = 10;', why: 'Doğru. p+2 → a[2], yani son eleman.' },
      { text: '*(p + 4) = 10;', why: 'Dizinin daha da ötesi: yine sınır ihlali.' },
      { text: '*p + 3 = 10;', why: 'Bu `(*p) + 3 = 10` demektir; atama sol tarafı değer değil; derleme hatası.' },
    ],
    correctFix: 0,
    cause: 'C, dizi sınırlarını denetlemez. Sınır dışına yazmak başka verileri bozabilir veya programı çökertir (undefined behavior).',
    outcome: 'Pointer aritmetiğinde geçerli bellek sınırlarını bilmek: n elemanlı dizide geçerli ofsetler 0..n-1.',
    fixedCode: 'int a[3] = {1, 2, 3};\nint *p = a;\n*(p + 2) = 10;',
  },
  {
    id: 'dangling',
    title: 'Yerel değişkenin adresini döndürmek',
    concept: 'bounds',
    code: 'int *getPtr() {\n  int x = 5;\n  return &x;\n}',
    question: 'Bu fonksiyon neden tehlikelidir?',
    problems: [
      { text: 'x yerel değişkendir; fonksiyon bitince yok olur, dönen pointer geçersiz bir yeri gösterir (dangling pointer).', why: 'Doğru. Yerel değişkenlerin ömrü fonksiyonla sınırlıdır.' },
      { text: 'Fonksiyonlar pointer döndüremez.', why: 'Döndürebilir; sorun neyi gösterdiği.' },
      { text: 'x başlatılmamış.', why: 'x = 5 ile başlatılmış.' },
      { text: '& operatörü return ile kullanılamaz.', why: 'Kullanılabilir; sorun adresin ömrü.' },
    ],
    correctProblem: 0,
    fixQuestion: 'Hangisi adresin ömrünü uzatır?',
    fixes: [
      { text: 'static int x = 5;\nreturn &x;', why: 'Doğru. static değişken program boyunca yaşar; adresi geçerli kalır.' },
      { text: 'return x;', why: 'Dönüş türü int* iken int döndürmek tür hatasıdır ve sorunu çözmez.' },
      { text: 'int x = 5;\nreturn &x + 1;', why: 'Hâlâ yok olan değişkene yakın bir adres; durumu daha kötü yapar.' },
    ],
    correctFix: 0,
    cause: 'Yerel (stack) değişkenler fonksiyondan çıkınca geçersiz olur. Onların adresini saklamak, sonradan kullanımda tanımsız davranıştır.',
    outcome: 'Değişkenin ömrü (lifetime) ile pointer geçerliliği ilişkisini kavrar.',
    fixedCode: 'int *getPtr() {\n  static int x = 5;\n  return &x;\n}',
  },
]
