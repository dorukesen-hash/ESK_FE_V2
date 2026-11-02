# Auth & Order UX Improvements — Design

**Date:** 2026-11-02
**Repos touched:** ESK_API (new endpoint, two small reads), ESK_FE_V2 (all UI)

## Context

A UX review of ESK_FE_V2's account/checkout flows found three gaps worth fixing now:

1. A guest (no account) checkout completes, but can never look their order up again once `localStorage`'s `esk-last-order` entry is gone (different device, cleared storage, next week). There is no public "look up my order" capability anywhere in ESK_API.
2. Registration never signs the new user in — they see "Account created, now log in" and have to type their credentials a second time.
3. A logged-in user gets no benefit from having an account at checkout: the shipping address form is always blank, even though `/account/addresses` already holds their saved addresses.

Two smaller requests ride along with these: remembering the email (and the last method — password vs. Google) used to log in, so a returning user's login screen already has useful state; and confirming today's auto-restore-session behavior (AuthBootstrap) needs no change.

## Out of scope

- Changing `orderNumber` from a sequential integer to an opaque token. That's the real long-term fix for the enumeration concern below, but it touches invoices, emails, and the admin panel's own order search — a separate, larger piece of work. This design works around it instead (see Decision 1).
- Anything in ESK_ADMIN.

## Decision 1: guest order lookup — what "search by order number" is allowed to do

`controller/orderController.js` generates `orderNumber` as a plain incrementing integer (`parseInt(lastOrder.orderNumber, 10) + 1`), not a random token. That matters here: if a new public endpoint returned full order detail (items, shipping address, phone number) for `orderNumber` alone, anyone could walk `?orderNumber=1`, `2`, `3`, … and read every order ever placed, including by registered customers. That attack surface does not exist today only because no public lookup-by-number endpoint exists at all.

**Chosen design** (confirmed with the user — email search returns full list + detail directly, no second factor):

- **Email alone** → list every order placed with that email (summary: order number, date, status, total). Clicking one opens full detail (items, shipment, billing). Safe: the backend only reveals orders it already matched *to the email you typed*, not to a number you're guessing.
- **Order number + email together** → the same full detail directly, no intermediate list. Convenience path for someone who has both handy (e.g. from their confirmation email).
- **Order number alone, no email** → **not supported**. The lookup form requires an email in both cases; order number is an optional second field that narrows the result, never a bypass for it. This is the one place this spec overrides the literal "search by order number" framing from the review, specifically to close the enumeration hole above — flagging it here rather than deciding it silently.
- Case-insensitive, **exact** email match (`LOWER(email) = LOWER(:email)`), not the admin search's `ILIKE '%...%'` substring match — a substring match would let `a` match thousands of addresses.
- Rate-limited per IP (`express-rate-limit`, a new small dependency — 20 requests / 15 minutes on this one route) so the exact-match path can't be used to brute-force-confirm which emails have placed orders.

## Decision 2: checkout address prefill — which address, and how to change it

Confirmed with the user: the most recently added saved address prefills the form automatically; a small selector above the form switches between saved addresses if there's more than one.

`ShippingProfiles` (the `/shippingprofiles` table) has no `createdAt` and no guaranteed row order today. `controller/shippingProfile.js`'s `getShippingprofiles` does a bare `findAll({ where: { userId } })` — ESK_API gets one line added (`order: [['id', 'DESC']]`) so "most recently added" is a real, server-guaranteed ordering (auto-increment `id`, highest = newest) instead of an assumption about insertion order survival.

`ShippingProfiles` has no name/email columns (only `title/firstline/secondline/phone/city/state/zip`) — first/last name and email come from the logged-in user's own profile (`authStore`'s `user.name/user.surname/user.email`, already populated by `AuthBootstrap`), combined with the selected address's fields.

## Part A — Guest order lookup

### ESK_API

**New route:** `GET /api/orders/lookup`
Query params: `email` (required), `orderNumber` (optional).

```js
// controller/orderController.js
const lookupGuestOrders = async ({ email, orderNumber }) => {
  const normalizedEmail = (email ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    const error = new Error('Email is required.');
    error.statusCode = 400;
    throw error;
  }

  const whereConditions = [
    db.where(db.fn('LOWER', db.col('Order.email')), normalizedEmail),
  ];
  if (orderNumber) whereConditions.push({ orderNumber: String(orderNumber).trim() });

  return Order.findAll({
    where: { [Op.and]: whereConditions },
    order: [['createdAt', 'DESC']],
    include: [/* same OrderItem (+ OrderItemRefund), Shipment, Billing, OrderStatus
                 includes as controller/accountController.js's getAccountOrders,
                 so OrdersListView/OrderDetailView/orderHelpers.js work unchanged */],
  });
};
```

This is deliberately a near-duplicate of `getAccountOrders`' include list (not a shared helper) — `getAccountOrders` filters by `customerId` from an authenticated session, this filters by a user-supplied `email` from an anonymous request; conflating them into one parameterized function would make the authenticated path's safety depend on a guest-facing code path staying correct forever. Two small functions, one obviously-safe each, beats one function carrying both trust levels.

**Route wiring** (`routes/orderRouter.js`):
```js
const rateLimit = require('express-rate-limit');

const guestLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many lookup attempts. Please try again later.' },
});

router.get('/lookup', guestLookupLimiter, async (req, res, next) => {
  try {
    const orders = await lookupGuestOrders(req.query);
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
});
```
Registered on `orderRouter.js` *before* the existing `router.get('/orders/', ...)` admin-facing route (no path collision — different path segment — but keeping lookup near the other order routes, not under `accountRouter.js`, since this one explicitly takes no auth).

**New test file:** `controller/orderController.lookup.test.js` (or alongside existing order controller tests, whichever this repo's test files already do — checked at implementation time) covering: email-only returns every order for that email; order number + email narrows to one; wrong email for a real order number returns empty, not someone else's order; missing email is a 400; case-insensitivity (`Foo@Bar.com` matches `foo@bar.com`).

### ESK_FE_V2

**New route:** `app/(storefront)/track-order/page.js` → `components/checkout/TrackOrderView.js` (same folder as `CheckoutView`/`OrderConfirmationView` — this is the same "an order, outside an account" concern).

**New hook:** `hooks/useOrderLookup.js`
```js
'use client';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useOrderLookup() {
  return useMutation({
    mutationFn: async ({ email, orderNumber }) => {
      const { data } = await api.get('/orders/lookup', {
        params: { email, ...(orderNumber ? { orderNumber } : {}) },
      });
      return data;
    },
  });
}
```

**TrackOrderView.js** behavior:
- A form: Email (required), Order number (optional, labeled "Order number (optional) — narrows the search if you have it").
- On submit, calls `useOrderLookup`. Three outcomes:
  - 0 results → "We couldn't find any orders for that email." (plus, if `orderNumber` was given, "...matching that order number" appended).
  - 1 result → render it inline using the same item/shipment/billing layout `OrderDetailView` already has.
  - 2+ results → a summary list (reusing `OrdersListView`'s row shape: order #, date, `StatusPill`, total) where clicking a row shows that order's full detail *in the same page* (client-side selection, not a second network round-trip — the full list of orders already came back from `/orders/lookup` with full includes, since `OrderDetailView`-equivalent data is cheap at this scale and avoids a second lookup call that would need the order number threaded through).
- `StatusPill`, `formatDate`, `formatOrderNumber`, `getItemRefundedQuantity`, `isCancelled` from `components/account/orderHelpers.js` and `StatusPill.js` are reused as-is — this view's row/detail rendering is visually identical to the authenticated one, just fed from a different data source. Reuse the row/detail JSX via a small shared presentational component (e.g. extract `OrderDetailCard` out of `OrderDetailView` so both call it) rather than duplicating the JSX — exact split decided at plan time by how `OrderDetailView` is actually shaped once read fresh.
- No reorder/download-invoice actions here (those call `/account/...`-style authenticated routes in `OrderDetailView` today — download-invoice's `${API_URL}/invoices/pdf/${order.id}` is unauthenticated already per the current code, so it *can* stay; reorder-to-cart has no auth dependency either since it only touches `cartStore` — both are safe to keep for the guest view too, revisit only if plan-time reading shows otherwise).

**Discoverability:**
- `components/checkout/OrderConfirmationView.js`'s "We couldn't find that order" fallback links to `/track-order` instead of `/search`.
- `components/layout/Footer.js`'s `companyLinks` gets a `{ href: '/track-order', label: 'Track Order' }` entry.

## Part B — Auto-login after registration

`POST /auth/register` (ESK_API) never sets session cookies — it only creates the user and returns `{ message: "User created successfully." }`. No backend change needed: `RegisterView.js` already has the just-submitted `email`/`password` in hand.

```js
// components/auth/RegisterView.js
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

// inside RegisterView()
const router = useRouter();
const loginMutation = useLogin();
const setUser = useAuthStore((state) => state.setUser);

async function onSubmit(values) {
  setServerError(null);
  try {
    await registerMutation.mutateAsync(values);
    const user = await loginMutation.mutateAsync({ email: values.email, password: values.password });
    setUser(user);
    router.push('/account');
  } catch (error) {
    setServerError(error?.response?.data?.message ?? 'Registration failed. Please try again.');
  }
}
```
Drops the `isRegistered` success screen entirely — a successful register+login lands straight on `/account`, matching how login itself behaves. If the login call fails right after a successful register (very unlikely — same credentials that just worked server-side — but e.g. a dropped connection), the existing `serverError` display covers it; the user can still reach `/login` normally since the account now exists.

## Part C — Remember email + last login method

**New store:** `stores/loginMemoryStore.js`
```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLoginMemoryStore = create(
  persist(
    (set) => ({
      lastEmail: null,
      lastMethod: null, // 'password' | 'google'
      remember: (email, method) => set({ lastEmail: email, lastMethod: method }),
    }),
    { name: 'esk-login-memory' }
  )
);
```

**Writing to it:**
- `LoginView.js` and `LoginPopover.js`: on a successful password login, `remember(values.email, 'password')`.
- `GoogleLoginButton.js` can't write to it directly (it's a plain `<a href>` to the backend's OAuth entry point — the click navigates away before any client JS could run meaningfully). Instead: write `lastMethod: 'google'` optimistically the moment the link is clicked (an `onClick` that calls `remember(undefined, 'google')` — a method-only update, keep whatever email was already remembered — before the browser follows the href; this fires even though the page is about to unload, same pattern already used for analytics-on-navigate clicks). `lastEmail` for Google sign-ins isn't knowable client-side before the redirect anyway (the backend hasn't told us the email yet) — `GoogleAuthRedirect` (on `/auth/profile`, after the round-trip completes) is where the real email becomes available via `AuthBootstrap`'s `/user/user-details` call, so that's also allowed to update `lastEmail` once `setUser` fires with a real user object.

**Reading it, in `LoginView.js` and `LoginPopover.js`:**
- `useForm({ defaultValues: { email: useLoginMemoryStore.getState().lastEmail ?? '' } })` — prefills the email field.
- A small line above the form: `{lastMethod === 'google' && <p>You signed in with Google last time.</p>}` (or the password equivalent) — plain text, not a design-system component, since this is a one-line hint, not a new UI pattern. Exact copy/placement decided at implementation time against the existing `AuthShell`/`Modal` layouts.

## Part D — Checkout address prefill for logged-in users

### ESK_API
`controller/shippingProfile.js`'s `getShippingprofiles`:
```js
const getShippingprofiles = async (userId) => {
  return await ShippingProfiles.findAll({ where: { userId }, order: [['id', 'DESC']] });
};
```
One line. No route/response-shape change.

### ESK_FE_V2

**`components/checkout/CheckoutView.js`:**
```js
const user = useAuthStore((state) => state.user);
const { data: addresses } = useAddresses({ enabled: Boolean(user) });
const [selectedAddressId, setSelectedAddressId] = useState(null);

const selectedAddress = addresses?.find((a) => a.id === selectedAddressId) ?? addresses?.[0] ?? null;
```
(`useAddresses` gets an `enabled` passthrough — it unconditionally fires today; a guest checkout has no session, so the call would just 401 and get swallowed by the query's error state, harmless, but gating it is cleaner and avoids a guaranteed-failing request on every guest checkout.)

**`components/checkout/AddressForm.js`** gains a `defaultValues` prop (react-hook-form's own mechanism — `useForm({ resolver, defaultValues })`) and, when there's more than one saved address, a selector rendered above the existing fields:
```jsx
{addresses?.length > 1 && (
  <label>
    Saved address
    <select value={selectedAddressId ?? addresses[0].id} onChange={(e) => setSelectedAddressId(Number(e.target.value))}>
      {addresses.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
    </select>
  </label>
)}
```
Selecting a different one calls react-hook-form's `reset()` with that address's fields merged with the user's own name/email — exact wiring (lifting `reset` out of `AddressForm` vs. keying the form by `selectedAddressId` to force a remount with new `defaultValues`) decided at plan time; both are standard react-hook-form patterns, the second is simpler and is the default unless the plan's author finds a reason it drops user-edited-but-unsaved values awkwardly.

Guest checkout (`user` is `null`) renders exactly as today — no addresses fetched, no selector, blank form.

## Review Focus

- A guest's `/orders/lookup?email=` with an email that has never ordered: empty list, not an error, not a 500 from the include chain choking on zero rows.
- `/orders/lookup?email=X&orderNumber=Y` where `Y` belongs to a *different* email than `X`: empty result, not `X`'s unrelated orders and not `Y`'s real order.
- Registration where the immediately-following login call 401s (e.g. backend hiccup between the two requests): user sees the existing error message, is not silently left on a broken half-registered state, and `/login` still works for them afterward.
- Checkout for a logged-in user with zero saved addresses: form renders blank (today's behavior) — the `addresses?.[0] ?? null` fallback must not crash on an empty array.
- The Google "remember last method" `onClick` firing on a middle-click / cmd-click (opens in new tab, doesn't navigate the current page) — the store write should be harmless either way, not something that needs the navigation to actually happen to be correct.
- Rate limit firing: the 21st `/orders/lookup` request from one IP in 15 minutes gets the limiter's message, not a stack trace or an unrelated 500.
