import type { Concept } from '../store/progress'

export interface Question {
  id: string
  concept: Concept
  text: string
  options: string[]
  correct: number
  explanation: string
}

/* Ön test ve son test aynı 6 kazanımı aynı dağılımla ölçer; sorular birebir aynı değildir. */
export const PRE_TEST: Question[] = [
  { id: 'pre1', concept: 'address', text: 'Bir değişkenin bellek adresi nedir?', options: ['Değişkenin içinde saklanan değer', 'Değişkenin RAM\'deki konumunu belirten sayı', 'Değişkenin adı', 'Değişkenin türü'], correct: 1, explanation: 'Bellek adresi, değişkenin RAM\'de nerede durduğunu gösteren sayıdır. Değer, ad ve tür farklı özelliklerdir.' },
  { id: 'pre2', concept: 'address', text: '`int x = 7;` için hangisi doğrudur?', options: ['x\'in adresi 7\'dir.', 'x\'in değeri ile adresi her zaman aynıdır.', 'x\'in hem bir değeri (7) hem de bir adresi vardır; ikisi farklıdır.', 'Yalnızca pointer değişkenlerinin adresi vardır.'], correct: 2, explanation: 'Her değişkenin bir değeri ve bir adresi vardır. 7 değerdir; adres, değişkenin bellekteki yeridir.' },
  { id: 'pre3', concept: 'define', text: '`int *p;` bildirimi ne anlama gelir?', options: ['p, bir int değer saklar.', 'p, bir int\'in adresini saklayabilen pointer\'dır.', 'p, int türünde bir dizidir.', 'p, int türünün bir başka adıdır.'], correct: 1, explanation: '`int *p;` p\'nin bir int\'i gösteren pointer olduğunu söyler: içinde adres saklanır.' },
  { id: 'pre4', concept: 'define', text: '`int x = 5;` verilmiş. x\'in adresini tutan pointer\'ı doğru tanımlayan satır hangisidir?', options: ['int *p = x;', 'int p = &x;', 'int *p = &x;', 'int &p = x;'], correct: 2, explanation: 'Pointer türü `int *`, ona verilecek değer ise `&x` (x\'in adresi) olmalıdır.' },
  { id: 'pre5', concept: 'addressOf', text: '`&y` ifadesi ne üretir?', options: ['y\'nin değerini', 'y\'nin bellekteki adresini', 'y\'nin türünü', 'y\'nin karesini'], correct: 1, explanation: '`&` adres alma (address-of) operatörüdür; y\'nin adresini verir.' },
  { id: 'pre6', concept: 'deref', text: '`int a = 4; int *p = &a;` iken `*p` ifadesinin değeri nedir?', options: ['a\'nın adresi', 'p\'nin kendi adresi', '4', 'Derleme hatası'], correct: 2, explanation: '`*p` (dereference) p\'nin gösterdiği yerdeki değeri verir: a\'nın değeri 4.' },
  { id: 'pre7', concept: 'deref', text: 'Bir ifadede `*p` yazmak p için ne yapar?', options: ['p\'nin gösterdiği adresteki değere erişir.', 'p\'nin adresini verir.', 'p ile bir sayıyı çarpar.', 'p\'yi sıfırlar.'], correct: 0, explanation: 'İfadelerde `*p` dereference işlemidir: pointer\'ın tuttuğu adrese gidip oradaki değere erişir.' },
  { id: 'pre8', concept: 'redirect', text: '`int a=1, b=2; int *p=&a; p=&b;` işlemlerinden sonra hangisi doğrudur?', options: ['p artık b\'yi gösterir; a hâlâ 1\'dir.', 'a, 2 olur.', 'p hâlâ a\'yı gösterir.', 'b, 1 olur.'], correct: 0, explanation: '`p = &b` yalnızca p\'nin içindeki adresi değiştirir; a ve b\'nin değerleri aynı kalır.' },
  { id: 'pre9', concept: 'modify', text: '`int x = 1; int *p = &x; *p = 9;` sonrasında x kaçtır?', options: ['1', '9', 'p\'nin adresi', 'Belirsiz'], correct: 1, explanation: '`*p = 9` p\'nin gösterdiği değişkene (x) 9 yazar.' },
  { id: 'pre10', concept: 'modify', text: '`int x = 3; int *p = &x; *p = *p + 2;` sonrasında x kaçtır?', options: ['3', '2', 'Derleme hatası', '5'], correct: 3, explanation: '`*p` önce 3 olarak okunur, 2 eklenir ve sonuç (5) yine p\'nin gösterdiği yere, yani x\'e yazılır.' },
]

export const POST_TEST: Question[] = [
  { id: 'post1', concept: 'address', text: 'İki farklı değişken (`int a; int b;`) bellekte nasıl bulunur?', options: ['Aynı adreste', 'Farklı adreslerde', 'Adresleri yoktur', 'Yalnızca ilk değişkenin adresi vardır'], correct: 1, explanation: 'Her değişken RAM\'de kendine ait ayrı bir yer kaplar; bu yüzden adresleri farklıdır.' },
  { id: 'post2', concept: 'address', text: '`int a = 10;` ifadesindeki 10 neyi temsil eder?', options: ['a\'nın bellek adresini', 'a\'nın değerini', 'a\'nın boyutunu', 'a\'nın pointer olduğunu'], correct: 1, explanation: '10, a değişkeninin içinde saklanan değerdir; adres ayrı bir bilgidir.' },
  { id: 'post3', concept: 'define', text: '`int *q;` ifadesinde q\'nun türü nedir?', options: ['int', 'float', 'int\'e pointer (int*)', 'void'], correct: 2, explanation: 'q, int türünde bir değişkeni gösteren pointer\'dır: türü `int *`.' },
  { id: 'post4', concept: 'define', text: 'Bir pointer değişkeninin içinde ne saklanır?', options: ['Başka bir değişkenin adresi', 'Yalnızca tam sayılar', 'Değişkenin adı', 'Derleyici bilgisi'], correct: 0, explanation: 'Pointer\'ın değeri bir bellek adresidir; bu adres genellikle başka bir değişkene aittir.' },
  { id: 'post5', concept: 'addressOf', text: '`int n = 8;` için n\'nin adresini veren ifade hangisidir?', options: ['*n', 'n', '&n', 'n&'], correct: 2, explanation: 'Adres alma operatörü değişkenin önüne yazılır: `&n`.' },
  { id: 'post6', concept: 'deref', text: '`int k = 12; int *r = &k;` sonrasında `printf("%d", *r);` ne yazdırır?', options: ['12', 'k\'nin adresini', 'r\'nin adresini', 'Hiçbir şey'], correct: 0, explanation: '`*r` r\'nin gösterdiği yerdeki değerdir: k\'nin değeri olan 12.' },
  { id: 'post7', concept: 'deref', text: '`*p` ifadesi hangi durumda tanımsız davranışa yol açar?', options: ['p bir int\'i gösterirken', 'p başlatılmamış veya NULL iken', 'p bir değişkenin adresini tutarken', 'p bir kez kullanıldığında'], correct: 1, explanation: 'Geçerli bir yeri göstermeyen (başlatılmamış/NULL) pointer\'ı dereference etmek tanımsız davranıştır.' },
  { id: 'post8', concept: 'redirect', text: '`int u=5, v=6; int *p=&u; p=&v; *p=0;` sonrasında hangisi doğrudur?', options: ['u = 0, v = 6', 'u = 5, v = 0', 'u = 0, v = 0', 'u = 5, v = 6'], correct: 1, explanation: 'p önce v\'ye yönlendirildi; sonra `*p = 0` v\'yi değiştirdi. u hiç değişmedi.' },
  { id: 'post9', concept: 'modify', text: '`int m = 2; int *p = &m; *p = *p * 3;` sonrasında m kaçtır?', options: ['2', '3', '6', '5'], correct: 2, explanation: '`*p` = 2 okunur, 3 ile çarpılır (6) ve p\'nin gösterdiği yere, yani m\'ye yazılır.' },
  { id: 'post10', concept: 'modify', text: '`int z = 0; int *p = &z; ____ = 7;` boşluğa ne yazılırsa z, 7 olur?', options: ['p', '&p', '&z', '*p'], correct: 3, explanation: '`*p = 7;` p\'nin gösterdiği değişkene (z) 7 yazar. `p = 7` ise pointer\'ın kendisini değiştirmeye çalışır.' },
]
