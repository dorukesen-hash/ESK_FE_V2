# ESK Packaging — E-Ticaret Altyapısı Teknik Dokümanı (ESK_API + ESK_ADMIN)

> **Amaç:** Bu doküman, sıfırdan yeni bir **müşteri yüzü (storefront) frontend** projesi inşa edip canlıya almak isteyen bir ekip/geliştirici için, mevcut backend (`ESK_API`) ve mevcut admin panelin (`ESK_ADMIN`) mimarisini, veri modellerini, endpoint'lerini, iş mantığını ve bilinen teknik borçlarını tek yerde toplar.
>
> **Kapsam dışı:** Mevcut `ESK_FE` ve `ESK-website-frontend` projeleri bilinçli olarak bu dokümana dahil edilmemiştir — hiçbir kod, mimari karar veya tasarım kalıbı oradan alınmamıştır. Yeni frontend, burada belgelenen `ESK_API` (backend) ile doğrudan entegre olacak şekilde sıfırdan tasarlanmalıdır.
>
> **Kaynak:** İki proje de `codebase-memory` bilgi grafiği + kaynak kod tam taraması ile denetlenmiştir (ESK_API: 1274 node/3016 edge, ESK_ADMIN: 725 node/2087 edge). Aşağıdaki tüm endpoint yolları, alan adları ve paket isimleri gerçek kaynaktan alınmıştır.

---

## 1. Platform Genel Bakış

ESK Packaging, endüstriyel ambalaj/paketleme ürünleri satan bir **B2B/B2C e-ticaret platformu**. Sistem üç ayrı uygulamadan oluşuyor (ikisi bu dokümanın konusu):

| Bileşen | Rol | Domain (gözlemlenen) |
|---|---|---|
| **ESK_API** | Tek merkezi backend — REST API, PostgreSQL, Stripe/UPS/Taibeta/R2 entegrasyonları | Railway (`eskapi-production.up.railway.app`) |
| **ESK_ADMIN** | Yönetim paneli (sipariş, katalog, müşteri, kargo, indirim kodu, fatura yönetimi) | `admin.eskpackaging.com` |
| ~~ESK_FE~~ | ~~Müşteri yüzü storefront~~ | *(kapsam dışı — yerine yeni frontend inşa edilecek)* |

**Kritik mimari not:** ESK_ADMIN ve ESK_API **farklı domainlerde** çalışıyor. Auth cookie'leri API domain'ine scope'lu olduğu için, admin tarafında **server-side middleware ile route koruma mümkün değil** — tamamen client-side auth kontrolü yapılıyor. Yeni storefront de muhtemelen ESK_API'den farklı bir domain'de (örn. Vercel) barınacağı için **aynı cross-origin cookie kısıtı geçerli olacak** — bu dokümanın §4'ünde bu konuya özel bir bölüm var.

---

## 2. ESK_API — Backend

**Repo:** `/Users/enesdorukesen/WebstormProjects/ESK_API` · **Paket adı:** `back_end` v1.0.0

### 2.1 Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Dil | Düz JavaScript (CommonJS), TypeScript yok |
| Framework | Express 4.21.2 (monolit, tek servis) |
| Veritabanı | PostgreSQL, **Sequelize 6.37.4** ORM (`pg` + `pg-hstore`) |
| Şema yönetimi | `db.sync()` ile otomatik senkron — **migration dosyası yok** |
| Auth | `jsonwebtoken` (JWT, cookie tabanlı) + `passport` + `passport-google-oauth20` (Google OAuth) |
| Şifreleme | `bcryptjs` (aktif kullanılan) — `bcrypt` da yüklü ama kullanılmıyor gibi görünüyor |
| Ödeme | `stripe` 18.2.1 (PaymentIntent, refund, tax, webhook) |
| Dosya depolama | Cloudflare R2 (S3-uyumlu, `aws-sdk` ile) |
| Excel | `xlsx` (SheetJS) — varyant toplu import/export |
| PDF | `puppeteer` — fatura ve paketleme fişi (packing slip) render'ı |
| E-posta | `nodemailer` (SMTP) + `handlebars` (HTML şablonlar) |
| HTTP client (dış servisler) | `axios` (UPS, Taibeta, zippopotam.us çağrıları için) |
| Test | **Yok** — hiçbir test framework'ü/test dosyası bulunmuyor |
| Validasyon kütüphanesi | **Yok** (Joi/Zod/express-validator yok) — kontroller manuel, tutarsız |

### 2.2 Proje Yapısı

```
app.js            → Express wiring: morgan → Stripe webhook (raw body) → body-parser →
                    cookie-parser → CORS → passport.initialize() → global soft-auth →
                    /api router → global error handler
index.js          → dotenv + app.listen(PORT || 8000)
routes/           → 37 dosya, kaynak başına router, hepsi /api altında mount
controller/       → 43 dosya, iş mantığı + Sequelize sorguları (servis katmanı yok)
db/models/        → 41 Sequelize model dosyası + index.js (tüm ilişkiler burada)
middleware/       → auth.js (soft), requireAuth.js, requireAdmin.js, checkLogin.js (ölü kod),
                    error.js, passport.js
utils/            → appError.js, sendEmail.js, pricing.js, palletPacking.js, r2.js,
                    getUpsToken.js, findState.js, emailTemplates/*.html
public/images/    → Fatura/e-posta için logo asset'leri
```

Dockerfile, CI workflow, Railway/Vercel config dosyası **yok** — deploy tamamen platform üzerinden (muhtemelen Railway dashboard) `npm start` → `node index.js` ile yapılıyor.

### 2.3 Veri Modelleri (Sequelize)

Tüm tablo/kolon adları `underscored: true` ile snake_case'e çevriliyor. Öne çıkan modeller:

| Model | Amaç / Kritik alanlar |
|---|---|
| **User** | `email`, `password`, `isAdmin` (STRING — sadece `"admin"` literal'i yetkili), `discountPercent` (müşteriye özel genel indirim %), `googleId`, token/refresh alanları |
| **Customer** | Fatura/adres bilgisi taşıyan, User'a bağlı ayrı bir kayıt |
| **Cart** | Tek alan: `productArray` (JSONB: `{id, quantity, isPallet}[]`) |
| **Category → Subcategory → Product → Variant** | 4 seviyeli ürün hiyerarşisi |
| **Variant** | ~90 kolonlu dev tablo: fiyat kademeleri (`one_four_units`, `five_nine_units`, `ten_plus_units`, `pallet_pricing`), gerçek kargo ölçüleri (`pack_weight/width/length/height` — DECIMAL), referans palet ölçüleri (`units_per_pallet`, `pallet_*`), onlarca teknik spesifikasyon alanı (footage, break_strength, core_diameter, vb. + birim kolonları), `featured`/`featured_position` (anasayfa curation) |
| **Order** (soft-delete) | `orderNumber` (sıralı "100001"'den başlar), `isPaid`, `stripePaymentIntentId`, `closure`, FK: userId/billingId/shipmentId/invoiceId/orderstatusId/customerId/discountCodeId. **`id` kolonunda DB seviyesinde PK/unique constraint yok** (canlıda önceden var olan bir durum — bazı ilişkiler `constraints:false` ile tanımlı) |
| **OrderItem** (soft-delete) | Satır bazlı fiyat/miktar, `variant_id` FK ile Variant'a bağlı |
| **OrderStatus** | Sabit ID'ler (hardcoded): 1 Pending, 2 In Progress, 3 Completed, 4 On Hold, 5 Cancelled, 6 Refunded |
| **OrderAuditLog** | Durum değişikliği/refund/kalem düzenleme/manuel oluşturma logu |
| **Invoice** | Türkiye e-fatura tarzı geniş alan seti var ama pratikte sadece küçük bir alt küme (documentNumber, issueDate, grandTotal, paymentType/Platform) dolduruluyor |
| **Shipment / ShipmentStatus / Carrier / CarrierPrice / Deci** | Kargo/taşıyıcı/tracking modeli |
| **Billing / ShippingProfiles** | Kullanıcının kayıtlı fatura ve adres defteri (checkout'ta seçilebilir) |
| **Transaction** | Stripe PaymentIntent kaydı (customer_id, amount, billing/shipping address JSONB) |
| **DiscountCode / DiscountCodeRedemption** | `type` (percent/fixed), `minOrderAmount`, `validFrom/Until`, `maxUses`, `maxUsesPerCustomer`, `firstOrderOnly` |
| **PricingAuditLog / VariantAuditLog** | Fiyat/indirim ve varyant değişikliklerinin denetim izi |
| **SpecialPrices** | (User, Variant) başına sabit fiyat override — tiered fiyatlandırmadan önce gelir |
| **Claim** | Müşteri destek talebi formu (account, companyName, orderNo, description) |
| **Featured** | "Sık birlikte alınanlar" için source_id/target_id join tablosu (max 3 target/source) |
| **Image + VariantImages/ProductImages/SubcategoryImages** | Cloudflare R2 URL kaydı + `position` ile sıralı çoklu görsel bağlama |
| **Description, Dimensions, PackageInfo, PalletInfo, Price, Spesification** | Büyük ölçüde **kullanılmayan/atıl** ek alan tabloları (bkz. §2.9) |

### 2.4 API Endpoint Referansı

Tüm endpoint'ler `/api` altında (istisna: `POST /api/stripe/webhook` — raw body, `/api` middleware zincirinin dışında ayrı mount edilmiş).

**Auth** (`/api/auth`)
| Method & Path | Açıklama |
|---|---|
| `POST /register` | User+Customer oluşturur (cookie set etmez, ayrıca `/login` çağrısı gerekir) |
| `GET /google`, `GET /google/callback` | Google OAuth (Passport) |
| `POST /login` | bcrypt compare, `accessToken`(1s)/`refreshToken`(7g)/`isAdmin` cookie set eder |
| `POST /logout` | Token'ları temizler, cookie'leri siler |
| `POST /refresh-token` | Refresh cookie ile yeni access+refresh çifti üretir |
| `POST /forgot-password` | Her zaman generic 200 döner (email enumeration önleme) |
| `POST /reset-password/:token` | SHA-256 token + 15dk expiry ile şifre günceller |

**Hesap** (`/api/account`, `requireAuth`): `GET /orders`, `GET /shipments`, `GET /invoices` — kullanıcının kendi geçmişi.

**Kullanıcı**: `GET /api/user/user-details` (soft auth) — `firstOrder` bayrağı dahil tam kullanıcı verisi.

**Sepet** (`/api/cart`) — misafir için cookie tabanlı, giriş yapmış kullanıcı için DB `Cart` satırı:
`GET /` (ilk authenticated çağrıda cookie sepetini DB'ye merge eder), `PUT /update`, `DELETE /delete`.

**İndirim kodu** (`/api/discount-codes`): `POST /validate` — sepet sayfası için önizleme (opsiyonel auth).

**Katalog (public)**:
- `/api/product`: `GET /`, `GET /name/`, `GET /:id` (aslında subcategory'e ait ürünler döner — isimlendirme yanıltıcı), `GET /details/:id`, `POST /`, `DELETE /:id`
- `/api/subcategory`: `GET /`, `GET /:id`, `GET /details/:id`, `GET /name/`, `POST /`, `DELETE /:id`
- `/api/category`: `GET /`, `GET /:id`, `POST /`, `DELETE /:id`
- `/api/variant`: `GET /`, `GET /:id`, **`POST /id-list`** (toplu id ile fetch — sepet/checkout için kritik), `GET /productId/:id`, `POST /`, `PUT /`, `DELETE /:id`, `GET /drop/:id`
- `/api/search`: `GET /?searchValue=` — varyant başlığında arama
- `/api/featured`: `GET /`, `GET /sources`, `GET /:id`, `POST /`, `DELETE /:id` — "sık birlikte alınanlar"

**Sipariş (customer-facing)**: `/api/orders` → `POST /` (`createOrder` — gerçek checkout endpoint'i, sunucu fiyatı yeniden hesaplar). Not: `GET /orders/orders/` (çift segment, legacy).

**Faturalar**: `/api/invoices` → `GET /pdf/:orderId`, `GET /packing-slip/:orderId` (Puppeteer ile PDF stream).

**Kargo teklifi** (`/api/services`): `POST /shipping-options` (UPS), `POST /sending-options` (Taibeta), `POST /combined-shipping-options` (ikisini birleştirip en ucuz 6'yı sıralar) — **yeni storefront'un checkout sayfasında canlı kargo fiyatı için bu üçünü kullanması gerekiyor**.

**Adres defteri** (`/api/shippingprofiles`): `GET /`, `POST /`, `PUT /:id` (auth), `DELETE /:id` (auth).

**Ödeme (Stripe)** (`/api/stripe`):
- `POST /create-payment-intent` — tutarı **her zaman sunucu tarafında** katalog fiyatlarından hesaplar (client'a güvenmez).
- `POST /calculate-tax` — ⚠️ şu an hardcoded zip/amount ile çalışıyor, yarım kalmış görünüyor (bkz. §2.9).
- `POST /api/stripe/webhook` — `payment_intent.succeeded` → `confirmOrderPayment` (Invoice oluşturma, `isPaid` flip).

**Müşteri destek talebi** (`/api/claims`): `POST /` (auth) — email bildirimi tetikler.

**Admin** (`/api/admin/*`, hepsi `requireAuth`+`requireAdmin`): Sipariş yönetimi (durum değiştirme, refund, manuel sipariş, bulk-status, export, audit-log), kargo/carrier yönetimi, katalog CRUD + Excel import/export + audit-log, müşteri yönetimi (özel fiyat, adres defteri, pricing audit log), indirim kodu CRUD, fatura listesi. *(Detaylar admin panel bölümünde §3.4'te işlevsel olarak anlatılıyor.)*

**Diğer CRUD lookup tabloları** (çoğu yeni storefront'u ilgilendirmez): `/api/carriers`, `/api/carrierprice`, `/api/deci`, `/api/description`, `/api/dimension`, `/api/package`, `/api/pallet`, `/api/price`, `/api/specification`, `/api/orderitem`, `/api/orderstatuses`, `/api/orderitemstatuses`, `/api/customer`, `/api/images`, `/api/r2` (görsel yükleme — `/api/images` ile fonksiyonel olarak çakışıyor, hangisinin kanonik olduğu belirsiz).

### 2.5 Kritik İş Mantığı

- **Fiyatlandırma önceliği** (`utils/pricing.js` → `resolveOrderPricing()`): (1) `SpecialPrices` override varsa o kullanılır → (2) yoksa miktar kademesi (`ten_plus_units`/`five_nine_units`/`one_four_units`, yüksekten düşüğe kontrol) + kullanıcının `discountPercent`'i uygulanır. **İndirim kodu ile blanket `discountPercent` asla üst üste binmez** — hangisi daha düşük fiyat veriyorsa o kullanılır. Bu fonksiyon hem `create-payment-intent`, hem `createOrder`, hem `previewDiscountCode`'da paylaşılıyor — **yeni frontend fiyat gösteriminde bu mantığı bilerek tasarlamalı** (sunucu her zaman son sözü söyler, client sadece önizleme yapar).
- **Palet/kargo paketleme algoritması** (`utils/palletPacking.js`): Sabit US paleti (48"×44", 84" max yükseklik, 2200 lb max ağırlık, 139 in³/lb DIM-weight böleni). Variant'ın `pack_*` (gerçek kutu) alanlarını kullanır, `pallet_*` referans alanlarını kullanmaz. Kargo teklifi (`/api/services/*`) ve sipariş oluşturmada (Shipment kaydı için) kullanılıyor.
- **İndirim kodu doğrulama**: `isActive`, `validFrom/Until`, `minOrderAmount`, `maxUses` (global), `maxUsesPerCustomer`, `firstOrderOnly` (kullanıcının önceki siparişi yoksa). Giriş yapmış kullanıcı için aktif bir `firstOrderOnly` kodu, kod girilmese bile otomatik denenir.
- **Sepet birleştirme (guest→user merge)**: Misafir sepeti 1 yıllık `userCart` cookie'sinde (`httpOnly:false`) tutulur. Giriş yapıldıktan sonraki ilk `GET /cart`'ta cookie sepeti DB sepetiyle merge edilir (aynı satırlar cookie miktarıyla ezilir — "last write wins", yeni satırlar eklenir).
- **Sipariş durum akışı**: Ödenmiş ve henüz iade edilmemiş bir sipariş **doğrudan Cancelled'a çekilemez** — önce refund gerekir. Her durum değişikliği/refund/kalem düzenleme `OrderAuditLog`'a yazılır.
- **Fatura oluşturma**: Sadece iki noktada tetiklenir — Stripe webhook (`confirmOrderPayment`) ve admin manuel sipariş oluşturma (`isPaid=true` ise).

### 2.6 Auth Modeli

- Cookie tabanlı JWT: `accessToken` (1s) + `refreshToken` (7g), `httpOnly:true`, `secure` (prod'da true), `sameSite: 'None'` (prod) / `'Lax'` (dev) — **cross-origin cookie senaryosu için özel olarak böyle kurulmuş**.
- Admin ayrımı: ayrı bir admin login endpoint'i yok — aynı `/api/auth/login`, `isAdmin==="admin"` ise ek `isAdmin` cookie'si set ediyor. Gerçek yetkilendirme `requireAdmin` middleware'inde (her istekte DB'den tekrar kontrol) yapılıyor.
- CORS allowlist'i şu an şu origin'leri içeriyor: `localhost:3000/3001/3002`, `esk-packaging-fe.vercel.app`, `www.eskpackaging.com`, `admin.eskpackaging.com`. **Yeni storefront'un domaini bu listeye eklenmesi gerekecek.**
- Google OAuth destekleniyor (`passport-google-oauth20`), ilk girişte User+Customer otomatik oluşturuluyor.
- Şifre sıfırlama: SHA-256 token, 15 dakika expiry.
- ⚠️ Legacy/ölü bir header-token auth şeması da kodda duruyor (`middleware/checkLogin.js`, farklı bir env secret ile) ama hiçbir route'a bağlı değil — yeni frontend bunu görmezden gelebilir.

### 2.7 Üçüncü Parti Entegrasyonlar

| Servis | Kullanım amacı |
|---|---|
| **Stripe** | PaymentIntent, refund (tam/kısmi), tax calculation (yarım kalmış), webhook |
| **UPS** | OAuth2 client-credentials, gerçek zamanlı kargo teklifi (sadece fiyat, etiket üretimi yok) |
| **Taibeta** | Asıl LTL/freight taşıyıcı fiyat teklifi kaynağı |
| **Cloudflare R2** | Tüm ürün/varyant/subcategory görselleri (S3-uyumlu API) |
| **zippopotam.us** | ZIP kodundan eyalet (state) çözümleme |
| **Google OAuth 2.0** | Sosyal giriş/kayıt |
| **SMTP (nodemailer)** | Sipariş onayı, şifre sıfırlama, claim bildirimi e-postaları (Handlebars şablon) |

### 2.8 Ortam Değişkenleri (isimler)

`DATABASE_URL`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV`, `PORT`, `R2_ACCESS_ID_KEY`/`R2_BUCKET`/`R2_ENDPOINT`/`R2_SECRET_ACCESS_KEY`, `SMPT_HOST`/`MAIL`/`PASSWORD`/`PORT` *(yazım hatası orijinal koddan geliyor)*, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TAIBETA_API_KEY`, `UPS_ACCOUNT_NUMBER`/`BASE_URL`/`CLIENT_ID`/`CLIENT_SECRET`.

### 2.9 Bilinen Teknik Borç (Backend)

- **`GET /api/product/`** — handler'da tanımsız `query` değişkeni kullanılıyor → çalışma zamanında `ReferenceError` riski.
- **`GET /api/images/subcategory/:name`** — `Image` modeli import edilmeden kullanılıyor → muhtemelen kırık.
- `/api/images/*` ve `/api/r2/*` aynı controller'ı sarıyor, örtüşen ama birebir aynı olmayan endpoint'ler — yeni frontend hangisini kullanacağına netlik getirmeli (öneri: `/api/images` kullanılsın, `/api/r2` legacy sayılsın).
- **`Order.id`** canlı DB'de PK/unique constraint'e sahip değil — bazı ilişkiler `constraints:false` ile workaround'lanmış.
- **`Stripe calculate-tax`** hardcoded zip/amount ile çalışıyor — gerçek bir vergi hesaplayıcı değil, yeni frontend'de bu endpoint'e güvenmeden önce backend'de düzeltilmesi gerekir.
- Sipariş oluştururken sunucu fiyatı client'ın gönderdiğiyle uyuşmazsa sadece `console.warn` yapılıyor, Stripe tahsilatı o noktada zaten client'ın tutarıyla yapılmış oluyor — teorik bir güven açığı.
- Doğrulama kütüphanesi yok, test yok, migration dosyası yok — şema tamamen `db/models/*.js` + `sync()`'e bağlı.

### 2.10 Deployment

Dockerfile/CI yok. `npm start` → `node index.js`, `process.env.PORT` dinliyor (Railway'in tipik auto-detect akışı). Puppeteer sandbox-disable flag'leri, önceden kısıtlı bir Linux container'da çalıştırıldığının işareti.

---

## 3. ESK_ADMIN — Yönetim Paneli

**Repo:** `/Users/enesdorukesen/WebstormProjects/ESK_ADMIN` · **Deploy:** `admin.eskpackaging.com`

> Bu bölüm, yeni storefront'u doğrudan etkilemez ama (a) aynı backend'i nasıl tükettiğini gösteren canlı bir referans olması, (b) cross-origin auth sorununu **zaten çözmüş** olması açısından değerlidir.

### 3.1 Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 14.2.23, **App Router**, React 18 |
| Styling | Tailwind CSS 4 (CSS-first `@import "tailwindcss"` sözdizimi) |
| Sunucu state / veri çekme | **TanStack Query v5** (Context/Redux/Zustand yok — tüm "global state" query cache) |
| Form | `react-hook-form` + `yup` |
| Tablo | `@tanstack/react-table` (sadece Variants Grid için) + elle yazılmış genel `DataTable` (diğer tüm listeler) |
| HTTP client | `axios` (tek instance, `lib/api.js`) |
| UI primitives | `@headlessui/react` (Modal/Dialog) |
| İkon | `lucide-react` |
| Toast | `react-toastify` |
| TypeScript | Yok — düz JS/JSX |
| Test | Yok |

### 3.2 Proje Yapısı

```
app/
  login/                  → /login (public)
  (dashboard)/            → route group, layout.js: AuthGuard + Sidebar + Topbar
    page.js                 → / (dashboard ana sayfa)
    catalog/                → hiyerarşi browser + variants grid + featured + FBT + activity-log
    orders/, shipments/, carriers/, customers/(+[id], +claims), discount-codes/,
    invoices/, media/
components/
  auth/AuthGuard.js       → client-side auth gate (bkz §3.6)
  layout/                 → Sidebar, Topbar, navConfig (IA tanımı)
  ui/                     → Button, Modal, ConfirmDialog, DataTable, FormField,
                            PageHeader, Pagination, SearchInput
  catalog/, orders/, fulfillment/, customers/, discountCodes/, media/
hooks/                    → domain başına TanStack Query wrapper'ları
lib/                      → api.js (axios+refresh interceptor), cdn.js, toast.js
```

**`middleware.js` yok** — bilinçli bir mimari karar (bkz §3.6).

### 3.3 Route/Sayfa Listesi

| Route | İşlev |
|---|---|
| `/login` | Admin girişi |
| `/` | Dashboard: sipariş durumu sayaçları + son 5 müşteri talebi |
| `/catalog` | Kategori → Alt kategori/Ürün → Varyant hiyerarşi browser'ı |
| `/catalog/variants` | Tüm katalog için spreadsheet-tarzı grid (TanStack Table, ~90 alan) |
| `/catalog/featured` | Anasayfa "öne çıkan ürün" curation'ı |
| `/catalog/frequently-bought-together` | Varyant source→target eşleştirmesi (max 3) |
| `/catalog/activity-log` | Global varyant audit feed |
| `/orders` | Sipariş listesi + detay modalı + manuel sipariş + toplu durum + export |
| `/shipments` | Kargo listesi + detay modalı |
| `/carriers` | Taşıyıcı CRUD + kullanım istatistiği |
| `/customers`, `/customers/[id]` | Müşteri listesi + detay (hesap, adres defteri, özel fiyat, fiyat geçmişi, sipariş geçmişi) |
| `/customers/claims` | Müşteri destek talebi kutusu |
| `/discount-codes` | İndirim kodu CRUD |
| `/invoices` | Salt-okunur fatura listesi (PDF linki) |
| `/media` | Global görsel kütüphanesi |

### 3.4 Fonksiyonel Alan Detayları

- **Katalog:** Tek bir hiyerarşi-bilinçli browser (flat liste yerine breadcrumb drill-down). Varyant oluşturmanın **tek yolu Excel upload** — tekil varyant create endpoint'i yok. "Mass Edit" akışı: tüm katalogu Excel olarak indir → offline düzenle → tekrar yükle (ID'li satırlar update, ID'siz satırlar Category/Subcategory/Product adından çözümlenerek create edilir).
- **Fiyatlandırma alanları grid'de `decimal:true` işaretli** çünkü Sequelize modeli bazı kolonları INTEGER gösterse de canlı DB'de NUMERIC(10,2) — **yeni frontend de bu alanları ondalıklı olarak ele almalı**.
- **Featured vs Frequently Bought Together**: ikisi farklı mekanizma — Featured `Variant.featured`/`featured_position` alanlarını kullanır (anasayfa sıralaması), FBT ayrı bir `Featured` tablosu üzerinden source/target ilişkisi kurar (isim çakışması kafa karıştırıcı, dikkat).
- **Sipariş yönetimi**: durum değişikliği, kısmi/tam Stripe refund, kalem düzenleme (Stripe'ı otomatik güncellemez — admin manuel telafi etmeli), kargo tamamlama, e-posta yeniden gönderme, PDF fatura/packing-slip linkleri.
- **Sepetle ilgili hiçbir şey yok** — ESK_ADMIN'de cart merge/batch-fetch kavramı bulunmuyor (bu iş tamamen ESK_API + storefront'un sorumluluğunda).

### 3.5 API Entegrasyon Katmanı (referans model)

`lib/api.js` — `withCredentials:true` axios instance + **kuyruklu 401→refresh-token interceptor**: bir refresh zaten devam ediyorsa yeni istekler reddedilmek yerine kuyruğa alınıp refresh bitince tekrar deneniyor (thundering-herd önleme). **Yeni storefront'un axios/fetch katmanı da bu pattern'i benimsemeli** — basit "her 401'de bir kere retry" yaklaşımı eşzamanlı isteklerde sorun çıkarabiliyor (kod içi yorum bunu ESK_FE'nin eksikliği olarak not düşmüş, yeni projede baştan doğru yapılmalı).

### 3.6 Auth Modeli — Cross-Origin Cookie Dersi (ÖNEMLİ)

ESK_ADMIN (`admin.eskpackaging.com`) ile ESK_API (`eskapi-production.up.railway.app`) **farklı domainlerde**. API'nin set ettiği auth cookie'leri API'nin domain'ine scope'lu — tarayıcı bunları API'ye yapılan `withCredentials` isteklerine ekliyor ama **admin panelinin kendi sayfa isteklerine (Next.js `middleware.js`'in görebileceği tek şey) asla eklemiyor**. Bu yüzden:

- ESK_ADMIN'de `middleware.js` **yok** — server-side route koruma mimari olarak imkansız.
- Auth tamamen client-side: `AuthGuard.js` bileşeni `GET /user/user-details` ile mevcut kullanıcıyı sorgular, admin değilse/401 ise `/login`'e yönlendirir. Kısa bir "loading" flaş'ı kaçınılmaz bir trade-off.

**Yeni storefront için çıkarım:** Eğer yeni frontend de ESK_API'den farklı bir domain'de barınacaksa (örn. Vercel), **aynı kısıt geçerli olacak** — server component'lerde/middleware'de cookie okuyarak SSR auth kontrolü yapılamaz. İki seçenek: (1) ESK_ADMIN'in yaptığı gibi tamamen client-side auth guard kullanmak, (2) storefront'u API ile aynı domain altında (subdomain + doğru cookie domain ayarı) barındırmak. Bu, yeni frontend'in mimarisini erken belirleyecek kritik bir karar.

### 3.7 State Yönetimi

Redux/Zustand/Context yok. Tüm "global" state TanStack Query cache'i (tek `QueryClient`, `refetchOnWindowFocus:false`, `retry:1`). URL query param'ları (`useSearchParams`) katalog drill-down pozisyonu için kullanılıyor. `localStorage` sadece Variants Grid'in kişisel kolon layout'ları için (cihazlar arası senkron değil, bilinçli tercih).

### 3.8 Tasarım Sistemi (referans — yeni storefront birebir kopyalamamalı ama yapısal fikir verir)

| Token | Değer |
|---|---|
| `text-blue`/`custom-blue` | `#5CA0E2` |
| `text-dark`/`custom-blue-gray` | `#182434` |
| `text-light` | `#808080` |
| `border-gray` | `#BDC2C7` |
| `button-gray` | `#ECECEC` |
| `custom-table-head` | `#CFE6FC` |
| `custom-button-green` | `#2A6AA2` |
| Font | Montserrat (Google Font) |
| Shadow | `shadow-custom`: `0px 2px 20px 0px rgba(0,0,0,0.25)` |

Bileşen kalıpları: tek genel `DataTable`, tek `Modal`/`ConfirmDialog` primitive'i, autosave+durum-ikonu pattern'i (grid hücreleri), "indir→düzenle→yükle" Excel pattern'i, yıkıcı aksiyonlarda (silme, admin yetkisi verme, refund) `ConfirmDialog` zorunluluğu.

### 3.9 Ortam Değişkenleri

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CDN_URL` — ikisi de client bundle'a gömülü, sunucu-only secret yok (tüm hassas işlemler API tarafında).

### 3.10 Bilinen Teknik Borç (Admin)

- `tablet:` Tailwind breakpoint'i 4 yerde kullanılıyor ama hiç tanımlanmamış → sessizce no-op (bazı grid'ler hiçbir breakpoint'te multi-column olmuyor).
- Sipariş durum filtresi (`STATUS_OPTIONS`) hardcoded İngilizce etiketlere ve ID 1-6'ya bağlı — backend `OrderStatus` tablosu değişirse sessizce bozulur.
- Kalem düzenleme Stripe tahsilatını otomatik güncellemiyor (admin manuel telafi etmeli) — storefront tarafında bu riski azaltacak bir "sipariş sonrası değişiklik" politikası düşünülebilir.
- Kullanılmayan "Attributes CRUD" kiti (`components/attributes/`, `hooks/attributes/`) — hiçbir yerde import edilmiyor, ölü kod.

---

## 4. Yeni Storefront Frontend İçin Rehber

Bu bölüm, yukarıdaki bulgulardan yeni bir müşteri-yüzü frontend inşa ederken doğrudan işe yarayacak çıkarımları özetler.

### 4.1 Storefront'un Kullanacağı Gerçek Endpoint Yüzeyi

| İhtiyaç | Endpoint(ler) |
|---|---|
| Ürün kataloğu / hiyerarşi | `GET /api/category`, `/api/subcategory`, `/api/product`, `/api/variant` (+ `details/:id` varyantları) |
| Arama | `GET /api/search?searchValue=` |
| Sık birlikte alınanlar | `GET /api/featured/:id` |
| Sepet (guest + auth) | `GET/PUT/DELETE /api/cart/*` |
| Varyant toplu fiyat/detay çekme | `POST /api/variant/id-list` |
| İndirim kodu önizleme | `POST /api/discount-codes/validate` |
| Adres defteri | `GET/POST/PUT/DELETE /api/shippingprofiles/*` (auth) |
| Canlı kargo teklifi | `POST /api/services/combined-shipping-options` |
| Ödeme | `POST /api/stripe/create-payment-intent`, Stripe Elements (client-side) |
| Sipariş oluşturma | `POST /api/orders` |
| Hesap / sipariş geçmişi / takip | `GET /api/account/orders`, `/shipments`, `/invoices`, `GET /api/user/user-details` |
| Auth | `/api/auth/register|login|logout|refresh-token|forgot-password|reset-password|google*` |
| Müşteri destek talebi | `POST /api/claims` |
| Fatura/packing-slip PDF | Direkt link: `GET /api/invoices/pdf/:orderId`, `/packing-slip/:orderId` |

### 4.2 Erkenden Verilmesi Gereken Mimari Kararlar

1. **Auth mimarisi**: §3.6'daki cross-origin cookie kısıtını hesaba kat — SSR'da middleware ile auth kontrolü yapılamayacağını baştan kabul et, ya client-side guard'a ya da aynı-domain (proxy/subdomain) stratejisine erken karar ver.
2. **401/refresh interceptor**: ESK_ADMIN'in kuyruklu refresh pattern'ini (§3.5) uygula — basit tek-retry yaklaşımı eşzamanlı isteklerde auth'u kırabilir.
3. **Fiyat gösterimi**: Sunucu (`resolveOrderPricing`) her zaman son sözü söyler; client tarafı tiered fiyat/indirim mantığını sadece *önizleme* için tekrar üretmeli, gerçek tutarı asla client hesaplamamalı.
4. **CORS**: Yeni storefront domaini backend'in CORS allowlist'ine eklenmesi gerekecek (backend değişikliği, önceden planla).
5. **Ondalıklı fiyat/ölçü alanları**: Variant tablosundaki bazı alanlar model tanımında INTEGER görünse de DB'de NUMERIC(10,2) — API'den gelen değerleri string/ondalık olarak ele al, integer'a yuvarlama.
6. **Görsel yükleme/URL**: `/api/images` ve `/api/r2` arasında hangisinin kanonik olduğuna backend ile netlik kazandırılmalı; CDN URL'i çift-slash sorununa karşı normalize et (ESK_ADMIN'in `lib/cdn.js`'i buna karşı zaten bir çözüm içeriyor, referans alınabilir).
7. **Bilinen backend bug'larına karşı savunma**: `GET /api/product/` (tanımsız `query` değişkeni) ve `GET /api/images/subcategory/:name` şu an kırık görünüyor — storefront bu endpoint'lere bağımlı tasarlanmadan önce backend'de düzeltilmeli ya da alternatif endpoint kullanılmalı.
8. **Vergi hesaplama**: `/api/stripe/calculate-tax` şu an placeholder/hardcoded — canlıya çıkmadan önce backend'de gerçek bir implementasyon gerekiyor.

### 4.3 Kapsam Dışı Bırakılanlar (hatırlatma)

Bu doküman ve buna dayanacak yeni frontend tasarımı, `ESK_FE` ve `ESK-website-frontend` projelerinin hiçbir kodunu, bileşen yapısını, route yapısını veya tasarım kararını temel almamıştır — yalnızca `ESK_API` (backend sözleşmesi) ve `ESK_ADMIN` (canlıda çalışan bir referans entegrasyon) incelenmiştir.
