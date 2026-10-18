# PointerLab — Etkileşimli Pointer Öğrenme Platformu

C dilindeki **pointer (işaretçi)** kavramını görsel ve etkileşimli yöntemlerle öğreten, tamamen istemci tarafında çalışan web uygulaması. (Eğitsel Yazılım Tasarımı dersi projesi.)

## Kurulum ve çalıştırma

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # bellek motoru testleri (vitest)
npm run build    # tip kontrolü + üretim derlemesi
```

## Modüller ve öğrenme kazanımları

| Modül | İçerik | Kazanım |
|---|---|---|
| Dashboard | İlerleme özeti, yol haritası, modül kartları | Yönelim, motivasyon (ARCS: Attention) |
| Learn | 6 ders: anlatım + canlı animasyon + etkinlik + mini quiz | Bellek/adres, `&`, pointer tanımlama, `*`, yönlendirme, diziler |
| Memory Playground | Monaco editörde C kodu, adım adım (ileri/geri) bellek görselleştirmesi | Kod ↔ bellek ilişkisi |
| Pointer Puzzle | 5 görev (bağlama, adres seçme, tahmin, değiştirme, hedef durum) | Kolaydan zora (ARCS: Confidence) |
| Bug Hunter | 6 hata senaryosu: hata → neden → düzeltme → kazanım | Hata ayıklama |
| Ön/Son Test | 10+10 soru, 6 kazanım, konu bazlı sonuç, karşılaştırma, JSON/CSV | Ölçme-değerlendirme (ADDIE: Evaluation) |
| Learning Progress | Dersler, görevler, puan, en çok hata yapılan kavramlar, sıfırlama | Üstbilişsel farkındalık |

Hata geri bildirimi yalnızca doğru/yanlış değil, **nedenini** de açıklar.

## Teknik mimari

- `src/engine/` — Bağımsız TypeScript yorumlayıcı (UI'dan ayrı): tokenizer → ayrıştırıcı → makine. Her ifade sonrası `ExecutionStep` snapshot'ı üretir; geri adım bu snapshot'lardan okunur.
  - Desteklenen: `int` / `int *` bildirimi, atama, `&`, `*`, `+ - * / %`, parantez, `NULL`, `+= -= *= /= %=`.
  - Desteklenmeyen sözdizimi **sessizce yok sayılmaz**: açıklayıcı hata verilir (satır numarasıyla).
  - Başlatılmamış/NULL pointer erişimi, sıfıra bölme, int taşması: tanımsız davranış olarak **güvenli uyarıyla durdurulur**, kesin bir sonuç uydurulmaz.
  - Adresler sanal (0x100'den başlar; int 4, pointer 8 bayt hizalı).
- `src/content/` — ders, hata senaryosu ve test verileri (motordan bağımsız).
- `src/store/progress.ts` — Zustand + localStorage (`pointerlab:v1`); JSON/CSV dışa aktarma.
- `src/components/` — `MemoryView` (SVG + Framer Motion oklar), `CodeEditor` (Monaco, yerel paket — internetsiz çalışır), `ChipActivity`, `Quiz`.
- Tasarım: Tailwind CSS v4, koyu tema, Lucide ikonları. UI bileşenleri shadcn/ui paketi kullanılmadan, aynı yaklaşımla (utility sınıfları) elle yazıldı. Bellek görselleştirmesi React Flow yerine özel SVG.

## Bilinen sınırlar (dürüst durum)

- Yorumlayıcı gerçek bir C derleyicisi değildir: döngü, fonksiyon, `printf`, dizi, `malloc`, çok katlı pointer yoktur. Diziler yalnızca Ders 6'daki özel görselleştirmede işlenir.
- İlk karşılaşılan hata raporlanır; çalışma zamanı hatasından sonraki satırlardaki derleme hataları görülmez.
- Backend yok: veriler tarayıcıya özgüdür, cihazlar arası senkronize olmaz.
- **Hiçbir öğrenci verisi, test sonucu veya kullanılabilirlik bulgusu uydurulmamıştır.** Testler çözülmeden sonuç/puan gösterilmez. Gerçek kullanımdan elde edilen veriler Assessment ve Progress sayfalarından dışa aktarılır (katılımcı kodu isteğe bağlıdır, kişisel bilgi toplanmaz).
- Otomatik testler yalnızca motoru kapsar; arayüz elle denenmiştir (mobil görünüm dahil tüm sayfalar ayrıntılı denetlenmedi).
