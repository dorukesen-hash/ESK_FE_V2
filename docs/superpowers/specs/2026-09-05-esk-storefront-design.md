# ESK Storefront — Frontend Mimari Tasarım Dokümanı

> **Durum:** Onaylandı (2026-09-05)
> **Kaynak:** `ECOMMERCE_PLATFORM_SPEC.md` (ESK_API + ESK_ADMIN teknik dokümanı)
> **Kapsam:** Bu doküman, ESK_API backend'ine doğrudan entegre olacak, mevcut ESK_FE/ESK-website-frontend projelerinden tamamen bağımsız yeni bir storefront frontend'inin teknoloji seçimlerini ve dosya yapısını tanımlar. Tema/görsel kimlik ve component bazlı implementasyon planı bu dokümanın kapsamı dışındadır — ayrı adımlarda ele alınacaktır.

---

## 1. Bağlam ve Kısıtlar

- **Backend:** `ESK_API` (Express + PostgreSQL/Sequelize), farklı bir domain'de host ediliyor (Railway).
- **Kritik kısıt — cross-origin cookie:** Auth cookie'leri (`accessToken`, `refreshToken`, `httpOnly`, `sameSite:'None'` prod'da) API domain'ine scope'lu. Storefront API'den farklı bir domain'de (Vercel) barınacağı için **server-side middleware ile route koruması mümkün değil**. ESK_ADMIN bu kısıtı client-side `AuthGuard` pattern'i ile çözmüş durumda; storefront aynı pattern'i izleyecek.
- **Fiyatlandırma otoritesi:** Sunucu (`resolveOrderPricing()`) her zaman son sözü söyler. Client tarafı sadece *önizleme* amaçlı tiered fiyat/indirim mantığını tekrar üretir, gerçek tutarı asla kendisi hesaplamaz.
- **Bilinen backend teknik borcu (storefront'u etkileyen):**
  - `GET /api/product/` — tanımsız `query` değişkeni, çalışma zamanı hatası riski.
  - `GET /api/images/subcategory/:name` — muhtemelen kırık.
  - `/api/images` vs `/api/r2` — örtüşen endpoint'ler; storefront `/api/images`'i kanonik kabul edecek.
  - `POST /api/stripe/calculate-tax` — placeholder/hardcoded, canlıya çıkmadan önce backend'de düzeltilmesi gerekiyor.
  - Variant tablosunda bazı alanlar model tanımında INTEGER görünse de DB'de NUMERIC(10,2) — API'den gelen değerler yuvarlanmadan, ondalıklı olarak işlenecek.

## 2. Teknoloji Yığını

| Katman | Seçim | Not |
|---|---|---|
| Framework | Next.js (App Router) | Katalog sayfaları public + SEO kritik; account sayfaları client-guard ile korunur |
| Dil | JavaScript (JSX) | TypeScript yok — ekosistemle (API+Admin) tutarlı |
| Styling | Tailwind CSS v4 | Marka renk/tipografi tokenları tema aşamasında eklenecek |
| UI primitifleri | Radix UI (unstyled) + kendi component kütüphanemiz | Modal, Dropdown, Tabs, Toast, Accordion, Carousel, Tooltip için erişilebilir temel |
| Sunucu state | TanStack Query v5 | ESK_ADMIN'de kanıtlanmış pattern; katalog/sepet/sipariş verisi cache+refetch |
| İstemci state | Zustand (`persist` middleware) | Sepetin misafir hali (login öncesi) optimistic + localStorage'da tutulur; login sonrası server sepeti authoritative kabul edilir |
| Form | `react-hook-form` + `yup` | Admin ile aynı, ekip aşinalığı |
| HTTP client | `axios` — tek instance + kuyruklu 401→refresh interceptor | ESK_ADMIN `lib/api.js` pattern'i birebir uygulanacak (thundering-herd önleme) |
| Ödeme | `@stripe/react-stripe-js` + `@stripe/stripe-js` | Stripe Elements, `client_secret` backend'den (`create-payment-intent`) |
| Görsel | `next/image`, R2 CDN remote pattern | `lib/cdn.js` (çift-slash normalize) mantığı referans alınacak |
| İkon | `lucide-react` | Admin ile tutarlı |
| Test | Vitest + React Testing Library (unit/component), Playwright (e2e: browse → cart → checkout) | Backend/admin'de hiç test yok; en azından gelir-kritik akışlar korunacak |
| Deploy | Vercel | CORS allowlist'inde zaten örnek Vercel domain'i var |

**Dil kararı:** Tüm proje (route isimleri, kod, UI metinleri) **İngilizce**.

## 3. Auth Akışı (Client-side Guard)

- `lib/api.js`: axios instance, `withCredentials:true`, kuyruklu refresh interceptor.
- `stores/authStore.js` (Zustand): `GET /api/user/user-details` ile mount'ta kullanıcı state'i çekilir.
- `(account)` route group'undaki her sayfa `AuthGuard` wrapper'ından geçer — 401 ise `/login`'e redirect. Kısa loading flaşı kabul edilen bir trade-off (ESK_ADMIN'de de aynı davranış var).
- Guest sepeti: backend'in `userCart` cookie mekanizması yerine, Zustand+persist ile local sepet tutulur. Login sonrası ilk `GET /api/cart` çağrısında backend zaten guest→user merge işlemini yapıyor; frontend bu noktada local sepeti temizleyip server sepetini authoritative kabul eder.

## 4. Storefront'un Kullanacağı Endpoint Yüzeyi

(`ECOMMERCE_PLATFORM_SPEC.md` §4.1'den özet — kaynak referans için oraya bakılabilir)

- Katalog: `GET /api/category`, `/api/subcategory`, `/api/product`, `/api/variant` (+ `details/:id`)
- Arama: `GET /api/search?searchValue=`
- Sık birlikte alınanlar: `GET /api/featured/:id`
- Sepet: `GET/PUT/DELETE /api/cart/*`
- Varyant toplu fetch: `POST /api/variant/id-list`
- İndirim kodu önizleme: `POST /api/discount-codes/validate`
- Adres defteri: `GET/POST/PUT/DELETE /api/shippingprofiles/*` (auth)
- Canlı kargo teklifi: `POST /api/services/combined-shipping-options`
- Ödeme: `POST /api/stripe/create-payment-intent`
- Sipariş oluşturma: `POST /api/orders`
- Hesap: `GET /api/account/orders|shipments|invoices`, `GET /api/user/user-details`
- Auth: `/api/auth/register|login|logout|refresh-token|forgot-password|reset-password|google*`
- Destek talebi: `POST /api/claims`
- Fatura/packing-slip PDF: `GET /api/invoices/pdf/:orderId`, `/packing-slip/:orderId`

## 5. Klasör Yapısı

```
esk-storefront/
  app/
    (storefront)/                       → public route group
      page.js                             → home (featured products)
      category/[categorySlug]/
        page.js                            → subcategory listing
        [subcategorySlug]/page.js          → product listing (grid + filters)
      product/[productSlug]/[variantId]/
        page.js                            → variant detail (price tiers, specs, FBT)
      search/page.js                       → search results
      cart/page.js                         → cart
      checkout/page.js                     → checkout (address, shipping quote, Stripe Elements)
      order-confirmation/[orderNumber]/page.js
      support/page.js                      → claim form
      layout.js                            → Header/Footer/Nav
    (auth)/
      login/page.js
      register/page.js
      forgot-password/page.js
      reset-password/[token]/page.js
    (account)/                           → AuthGuard protected route group
      account/
        page.js                            → overview
        orders/page.js
        orders/[orderNumber]/page.js
        addresses/page.js
        invoices/page.js
      layout.js                            → AuthGuard + account nav
    layout.js                            → root layout (fonts, providers)
    api/                                 → yalnızca gerekirse (örn. sitemap.xml route handler)

  components/
    ui/                 → Button, Modal, Toast, Accordion, Tooltip, Carousel (Radix tabanlı primitifler)
    catalog/             → ProductCard, CategoryBreadcrumb, VariantPriceTiers, SpecTable, FBTCarousel
    cart/                 → CartLineItem, CartSummary, CartDrawer
    checkout/             → AddressForm, ShippingOptionSelector, StripePaymentForm, DiscountCodeInput
    account/              → OrderHistoryTable, OrderDetailCard, AddressBookCard
    layout/               → Header, Footer, MobileNav, SearchBar

  hooks/                 → domain başına TanStack Query wrapper (useCategories, useProducts, useVariant,
                           useCart, useShippingOptions, useCreateOrder, useDiscountCodeValidate, ...)
  stores/                → Zustand store'lar (cartStore, authStore, uiStore)
  lib/
    api.js                → axios instance + refresh interceptor
    cdn.js                 → R2 URL normalize
    pricing.js             → client-side fiyat *önizleme* mantığı (server otoriter, bu sadece preview)
    shipping.js             → combined-shipping-options response mapping
    validators/             → yup şemaları
  styles/                → globals.css, tailwind tema/token dosyası (marka renkleri sonraki adımda doldurulacak)
  public/
  tests/
    unit/
    e2e/                   → Playwright: browse, add-to-cart, checkout, order history
  .env.example              → NEXT_PUBLIC_API_URL, NEXT_PUBLIC_CDN_URL, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## 6. Kapsam Dışı (bu doküman ve bu build adımı için)

- Tema/görsel kimlik (renk paleti, tipografi, marka tokenları) — ayrı bir adımda kullanıcı tarafından sağlanacak.
- Component bazlı detaylı implementasyon planı — ayrı bir sonraki adımda planlanacak.
- SSR/middleware auth, server-side session.
- Monorepo yapısı.
- ESK_FE / ESK-website-frontend projelerinden herhangi bir kod, component, route veya tasarım kararı.

## 7. Açık/Sonraki Adımlar

1. Bu dokümana göre proje iskeletini kur (Next.js init, bağımlılıklar, klasör/dosya iskeleti, boş route dosyaları, temel provider'lar).
2. Tema/görsel kimlik belirlenecek (kullanıcı marka varlıklarını sağlayacak).
3. Component bazında implementasyon planı çıkarılacak.
