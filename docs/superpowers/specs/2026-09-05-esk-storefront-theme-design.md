# ESK Storefront — Tema / Görsel Kimlik Tasarım Dokümanı

> **Durum:** Onaylandı (2026-09-05)
> **Kapsam:** Bu doküman, ESK Packaging storefront'unun renk sistemi, tipografi, dark/light mode mekanizması, marka varlıkları ve genel görsel dil kararlarını tanımlar. Component bazlı implementasyon planı bu dokümanın kapsamı dışındadır — ayrı bir sonraki adımda ele alınacaktır (bkz. §8).
> **Önceki adım:** `docs/superpowers/specs/2026-09-05-esk-storefront-design.md` (teknoloji yığını ve klasör yapısı) ve onun implementasyon planı (`docs/superpowers/plans/2026-09-05-esk-storefront-scaffold.md`) tamamlandı. Bu doküman o scaffold'un üzerine inşa edilecek tema katmanını tanımlar.

---

## 1. Marka Varlıkları

Kaynak: `/Users/enesdorukesen/WebstormProjects/ESK_FE_V2/assets/` (kullanıcı tarafından sağlandı).

| Dosya | Açıklama | Kullanım |
|---|---|---|
| `ESK_icon.png` | Tam logo: kırmızı "e" işareti + lacivert zeminde beyaz serif "PACKAGING" + koyu lacivert serif "ESK" | Header (storefront + auth sayfaları) |
| `ESK_icon_mini.png` | Sadece kırmızı "e" işareti | Favicon, mobil daraltılmış header, yükleniyor durumu |
| `EKS_icon_dark.png` | Logo varyantı | Koyu zeminler üzerinde logo gerektiğinde referans alınacak (dark mode header'da gerekirse) |
| `DHL.png`, `FedEx.png`, `UPS.png`, `USPS.png` | Kargo firma logoları | Checkout'ta kargo seçenekleri listesinde |
| `google_icon.png` | Google logosu | "Google ile giriş yap" butonu (login/register) |
| `instagram.png` | Instagram ikonu | Footer sosyal medya linki |
| `login-image.jpg` | Gerçek depo/palet fotoğrafı | Login/register sayfası yan görseli, anasayfa hero alanı |
| `about-us.jpeg`, `faq.jpeg`, `privacy-policy.jpeg`, `return-refund-policy.jpeg`, `shipping-policy.jpeg`, `terms-and-conditions.jpeg` | Bilgi sayfası hero görselleri | İlgili statik sayfaların üst banner alanı |

**Teknik borç notu:** Kaynak görsellerin çoğu büyük boyutlu (bazıları 6MB+ JPEG). Implementasyon planında bu dosyalar `next/image` ile (veya build-time optimize edilip) `public/` altına taşınmalı; orijinal boyutlarıyla doğrudan kullanılmamalı.

**Logo kullanım kuralı:** Logo her zaman sabit bir görsel (PNG/SVG) olarak render edilir — serif "ESK PACKAGING" yazısı canlı metin olarak koddan yeniden üretilmez. Marka işareti (kırmızı "e") arayüzün geri kalanında **kullanılmaz** — sadece logo içinde görünür (bkz. §3, kırmızı kullanım kararı).

---

## 2. Renk Sistemi — Kaynak Paleti

Kullanıcının sağladığı 10 hex kod (ESK_ADMIN'in mevcut token sistemiyle büyük ölçüde örtüşüyor — iki üründe marka tutarlılığı sağlanıyor):

| Hex | Admin'deki karşılığı (referans) |
|---|---|
| `#2A6AA2` | `custom-button-green` (aslında mavi) |
| `#5CA0E2` | `text-blue` / `custom-blue` |
| `#182434` | `text-dark` / `custom-blue-gray` |
| `#808080` | `text-light` |
| `#BDC2C7` | `border-gray` |
| `#ECECEC` | `button-gray` |
| `#CFE6FC` | `custom-table-head` |
| `#E7F2FD` | *(yeni — admin'de yoktu)* |
| `#FFFFFF` | *(temel beyaz)* |

**Karar:** Logodaki kırmızı vurgu rengi arayüzde **kullanılmayacak** — sadece marka işaretinde kalacak. Arayüz tamamen bu mavi/gri palet üzerine kurulacak.

---

## 3. Renk Sistemi — Semantik Token Eşlemesi (Light + Dark)

Dark mode kapsama alındığı için (kullanıcı kararı: toggle butonlu light+dark), kaynak paletin bir kısmı doğrudan kullanılıyor, bir kısmı için (aşağıda *türetilmiş* olarak işaretli) yeni bir marka rengi icat etmeden, verilen tonların koyu/açık varyantları hesaplanmıştır.

| Token | Light mode | Dark mode | Not |
|---|---|---|---|
| `--color-background` | `#FFFFFF` | `#182434` | ikisi de kaynak palette'ten |
| `--color-surface` | `#FFFFFF` | `#1E2C3F` *(türetilmiş)* | dark'ta background'dan bir tık açık — kart/panel zemini |
| `--color-surface-elevated` | `#FFFFFF` (+ gölge) | `#24344A` *(türetilmiş)* | modal/dropdown gibi en üstte yüzen yüzeyler |
| `--color-text-primary` | `#182434` | `#FFFFFF` | kaynak palette'ten |
| `--color-text-muted` | `#808080` | `#9BA3AC` *(türetilmiş)* | ikincil metin, açıklama, placeholder |
| `--color-border` | `#BDC2C7` | `#33475E` *(türetilmiş)* | kart/input/divider kenarlıkları |
| `--color-primary` | `#2A6AA2` | `#5CA0E2` | dark modda kontrast için daha açık mavi tercih edildi |
| `--color-primary-hover` | `#1F5480` *(türetilmiş)* | `#2A6AA2` | dark modda mevcut light-primary rengi hover için yeniden kullanılıyor |
| `--color-accent-tint` | `#E7F2FD` | `#1C3350` *(türetilmiş)* | hover/selected arka planı |
| `--color-accent-tint-strong` | `#CFE6FC` | `#24466B` *(türetilmiş)* | badge, tablo başlığı arka planı |
| `--color-button-secondary-bg` | `#ECECEC` | `#2A3B4F` *(türetilmiş)* | ikincil buton zemini |

**Toplam yeni türetilmiş ton sayısı: 7** — hepsi kaynak palet ailesinden (lacivert/mavi/gri tonları), yeni bir marka rengi eklenmedi.

---

## 4. Dark Mode Mekanizması

- Tailwind v4 **class-tabanlı** dark mode: `<html>` elementine `dark` class'ı eklenip çıkarılarak çalışır (`@custom-variant dark (&:where(.dark, .dark *));` CSS'te tanımlanacak).
- Bir **toggle butonu** ile kullanıcı tercihini değiştirebilecek.
- Tercih `localStorage`'da saklanır (sayfa yenilemede kaybolmaz).
- İlk ziyarette, kullanıcı henüz bir tercih kaydetmemişse, sistem tercihi (`prefers-color-scheme: dark`) baz alınır.
- Bu mekanizmanın component/store implementasyonu (`useThemeStore` veya benzeri + toggle UI component'i) **bu dokümanın kapsamı dışında** — bir sonraki component implementasyon planında ele alınacak. Bu doküman sadece token sistemini ve CSS-seviyesi stratejiyi tanımlar.

---

## 5. Tipografi

- **UI fontu:** [Inter](https://fonts.google.com/specimen/Inter) (Google Font, `next/font/google` ile yüklenecek).
  - Gerekçe: yoğun ürün/varyant bilgisi içeren tablolarda (admin'in ~90 kolonluk Variant grid'ine benzer ihtiyaçlar storefront'ta da doğabilir — spesifikasyon tabloları, fiyat kademeleri) küçük punto boyutlarında yüksek okunabilirlik sağlıyor; hem light hem dark modda iyi kontrast.
- **Logo tipografisi** (serif "ESK PACKAGING"): koddan yeniden üretilmez, sadece görsel asset olarak kullanılır (bkz. §1).
- Fallback stack: `Inter, system-ui, -apple-system, sans-serif`.

---

## 6. Görsel Dil / Fotoğraf Kullanımı

- Stok illüstrasyon yerine **gerçek depo/palet fotoğrafları** tercih edilir (`login-image.jpg` örneğinde olduğu gibi) — "gerçek, güven veren endüstriyel görünüm" hedefleniyor.
- Fotoğraf üzerine metin bindirileceği yerlerde (hero alanları), okunabilirlik için `--color-text-primary`'nin dark mode karşılığı (`#182434`, ~%40-60 opaklıkta) overlay olarak kullanılabilir.
- Kargo firma logoları (`DHL.png` vb.) checkout akışında, olduğu gibi (renk değişikliği yapılmadan) kullanılır — üçüncü taraf marka kimlikleri korunur.

---

## 7. Spacing / Radius / Gölge

- ESK_ADMIN'in `shadow-custom: 0px 2px 20px 0px rgba(0,0,0,0.25)` gölgesinden yapısal fikir alınır (birebir kopyalanmaz — önceki tasarım dokümanının §3.8 notuna uygun) — storefront için biraz daha yumuşak, modern bir gölge tercih edilir (örn. `0px 4px 24px 0px rgba(0,0,0,0.08)` light modda, dark modda daha düşük opaklıkla).
- Köşe yarıçapı: genel olarak `rounded-lg`/`rounded-xl` (Tailwind v4 varsayılan ölçekleri) — sade, modern bir B2B/B2C katalog hissi.
- Kesin spacing/radius/shadow token değerleri, bu spec onaylandıktan sonra `tailwind.config.js`/`app/globals.css`'e `@theme` bloğu olarak işlenirken netleştirilecek (implementasyon planı aşamasında).

---

## 8. Kapsam Dışı

- Dark/light toggle'ın gerçek component implementasyonu (store, buton, ikon geçişi).
- Header/footer/navigasyon gibi layout component'lerinin gerçek tasarımı.
- Ürün kartı, sepet, checkout gibi domain component'lerinin görsel tasarımı.
- Görsel varlıkların (özellikle büyük JPEG'ler) optimize edilmiş/nihai halleri ve `public/` altına yerleştirilmesi.

Bunların hepsi **component bazlı implementasyon planı** aşamasında ele alınacak — bu doküman sadece o aşamanın üzerine inşa edeceği token/tema temelini tanımlar.

## 9. Sonraki Adımlar

1. Bu spec'e göre `tailwind.config.js`/`app/globals.css`'e renk tokenlarının (`@theme` bloğu ile), Inter fontunun ve dark-mode CSS stratejisinin işlenmesi için bir implementasyon planı yazılacak.
2. Ardından component bazlı implementasyon planı (header, footer, ürün kartı, sepet vb.) ayrı bir brainstorming/plan döngüsünde ele alınacak.
