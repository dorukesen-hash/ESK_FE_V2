# Auth & Order UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guest order lookup by email/order number, auto-login after registration, remembered login email/method, and checkout address prefill for logged-in users.

**Architecture:** A new public ESK_API endpoint (`GET /orders/lookup`) backs a new ESK_FE_V2 page (`/track-order`) that reuses the existing authenticated order-detail rendering via an extracted `OrderDetailCard` component. Three smaller, independent frontend-only changes (auto-login, remembered-login-state, checkout prefill) round out the rest; the checkout prefill also needs one `order: [['id', 'DESC']]` added to an existing ESK_API query.

**Tech Stack:** ESK_API: Express, Sequelize, `node --test`. ESK_FE_V2: Next.js App Router, React Query, Zustand (`persist` middleware), react-hook-form + yup, Vitest + React Testing Library + `@testing-library/user-event`.

**Spec:** `docs/superpowers/specs/2026-11-02-auth-and-order-ux-improvements.md`

## Global Constraints

- ESK_API repo root: `/Users/enesdorukesen/WebstormProjects/ESK_API`. Tests: `npm test` (`node --test`, no mocking framework — pure functions get unit tests, DB-touching functions get manually curl-verified, matching this repo's existing convention of zero DB-integration test files for controller DB queries).
- ESK_FE_V2 repo root: `/Users/enesdorukesen/WebstormProjects/ESK_FE_V2`. Tests: `npx vitest run`. Full suite must stay green after every task.
- Both repos: work happens directly on `main` (continuing this session's established practice — no new branch/worktree unless a task says otherwise), commit per task, nothing pushed without separate explicit instruction.
- New ESK_API dependency: `express-rate-limit` (Task 1 only).
- Order number lookup alone (no email) is **not** supported anywhere, by design — `orderNumber` is a sequential integer (`controller/orderController.js`'s `createOrder`), so a lookup keyed on it alone would let anyone enumerate every order ever placed. Email is always required; order number only narrows.
- Guest email match is **exact** (case-insensitive), never a substring/`ILIKE '%...%'` pattern.
- No new UI component library or design tokens — every new screen reuses existing Tailwind classes, `StatusPill`, `orderHelpers.js`, and the existing `AuthShell`/`Modal` patterns.

## Review Focus

- `/orders/lookup?email=` for an email with zero orders: empty array, not a 500 (an empty `Order.findAll` result must still pass cleanly through `attachRefundTotals`'s `Promise.all` over an empty array).
- `/orders/lookup?email=X&orderNumber=Y` where `Y` belongs to a different email than `X`: empty array — the two conditions must be ANDed, not ORed.
- Registration whose immediate follow-up login call fails (e.g. a dropped connection between the two requests): the existing `serverError` UI must still show something, not a blank screen or an uncaught rejection.
- Checkout for a logged-in user with zero saved addresses: `addresses?.[0]` is `undefined`, and every field in `defaultValues` must fall back to `''`, not crash on `undefined.phone`.
- The remembered-login-method hint rendering before `useLoginMemoryStore`'s persisted value has hydrated from `localStorage` on first client paint — it must default to rendering nothing (not throw, not show a hint that's wrong for a split second in a way a test would catch).
- The 21st `/orders/lookup` request from one IP inside 15 minutes gets the rate limiter's own JSON message, not an unrelated 500 or a hung request.

---

## Task 1: ESK_API — guest order lookup endpoint

**Files:**
- Modify: `controller/orderController.js`
- Modify: `routes/orderRouter.js`
- Modify: `package.json` (add `express-rate-limit`)
- Create: `controller/orderController.test.js`

**Interfaces:**
- Produces: `normalizeGuestLookupEmail(email: string): string` (throws a plain `Error` with `statusCode: 400, isOperational: true, status: 'fail'` on empty/missing input — same shape `controller/catalogNodeTree.js`'s `validateDisplayFields` already uses, so `middleware/error.js` renders it as a 400 in both dev and production).
- Produces: `lookupGuestOrders({ email, orderNumber }): Promise<Order[]>` — each returned order carries the exact same shape `getAccountOrders` (in `controller/accountController.js`) already produces (`orderitems` with nested `order_item_refunds`, `shipment` with `carrier`/`shipmentstatus`, `orderstatus`, `billing`, plus live `amountRefunded`/`amountRemaining` from `attachRefundTotals`), so `OrdersListView`/`OrderDetailCard` (Task 3) can render it unmodified.
- Consumes: `Order`, `OrderItem`, `OrderItemRefund`, `Shipment`, `Carrier`, `ShipmentStatus`, `OrderStatus`, `Billing` (already imported in `controller/accountController.js` — `orderController.js` needs its own import for the ones it doesn't already have; check `controller/orderController.js`'s existing top-of-file destructure from `require('../db/models')` before adding, since several are likely already there), `attachRefundTotals` (defined later in the same file, already exported).

- [ ] **Step 1: Add the dependency**

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_API
npm install express-rate-limit
```

- [ ] **Step 2: Write the failing test for `normalizeGuestLookupEmail`**

Create `controller/orderController.test.js`:

```js
const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeGuestLookupEmail } = require('./orderController')

test('normalizeGuestLookupEmail: trims and lowercases', () => {
  assert.equal(normalizeGuestLookupEmail('  Jane@Example.COM  '), 'jane@example.com')
})

test('normalizeGuestLookupEmail: throws a 400-shaped error on an empty string', () => {
  assert.throws(() => normalizeGuestLookupEmail(''), (error) => {
    assert.equal(error.statusCode, 400)
    assert.equal(error.isOperational, true)
    assert.equal(error.status, 'fail')
    return true
  })
})

test('normalizeGuestLookupEmail: throws the same way on undefined', () => {
  assert.throws(() => normalizeGuestLookupEmail(undefined), (error) => {
    assert.equal(error.statusCode, 400)
    return true
  })
})

test('normalizeGuestLookupEmail: whitespace-only input throws too', () => {
  assert.throws(() => normalizeGuestLookupEmail('   '), (error) => {
    assert.equal(error.statusCode, 400)
    return true
  })
})
```

- [ ] **Step 2b: Run it, confirm it fails because the function doesn't exist yet**

```bash
node --test controller/orderController.test.js
```

Expected: `TypeError: normalizeGuestLookupEmail is not a function` (or similar — the module doesn't export it yet).

- [ ] **Step 3: Add `normalizeGuestLookupEmail` and `lookupGuestOrders` to `controller/orderController.js`**

Read the current top-of-file import line first (`const { Order, OrderItem, Customer, Shipment, OrderStatus, User, Cart, Invoice, Transaction, Variant, VariantImages, Image, Carrier, DiscountCode, DiscountCodeRedemption, OrderItemRefund, InvoiceLineItems } = models`) and the `const { Op } = require('sequelize')` line — extend the `sequelize` import to also pull `fn`, `col`, and `where` (aliased, since `where` collides with extremely common local variable names elsewhere in this file):

```js
const { Op, fn, col, where: whereFn } = require('sequelize')
```

`Shipment`'s nested include in `getAccountOrders` also pulls in `ShipmentStatus` — confirm it's already destructured from `models` above (`getAccountOrders` in `controller/accountController.js` imports it separately: `const { Order, OrderItem, OrderItemRefund, Customer, Shipment, OrderStatus, Billing, Carrier, ShipmentStatus, Invoice } = require('../db/models')`). Add `ShipmentStatus` and `Billing` to `orderController.js`'s own top import if either is missing from its existing destructure — `Billing` is already imported separately via `const Billing = require('../db/models/billing')`, so only confirm `ShipmentStatus`.

Add, right after `descendantNodeIds`-equivalent helpers or near the top of the file (exact placement: just before `const createOrder = async (data) => {`, so it reads as "order lookups" grouped together):

```js
// Thrown as a plain Error (not AppError) with the same statusCode/
// isOperational/status shape AppError produces - controller/catalogNodeTree.js's
// validateDisplayFields does the same thing, for the same reason: this file
// has no AppError import today, and adding one for a single error site isn't
// worth it.
function normalizeGuestLookupEmail(email) {
  const normalized = (email ?? '').trim().toLowerCase()
  if (!normalized) {
    const error = new Error('Email is required.')
    error.statusCode = 400
    error.isOperational = true
    error.status = 'fail'
    throw error
  }
  return normalized
}

// Guest order lookup: filters directly on Order.email (never on customerId/
// a session), so it never requires auth. Deliberately NOT a thin wrapper
// around getAccountOrders (accountController.js) despite the near-identical
// include list - that function's safety depends entirely on customerId
// coming from an authenticated session; conflating it with a path that takes
// its filter straight from an anonymous query string would make the
// authenticated path's safety depend on this one staying correct forever.
// orderNumber alone (no email) is never sufficient - see Global Constraints.
const lookupGuestOrders = async ({ email, orderNumber }) => {
  const normalizedEmail = normalizeGuestLookupEmail(email)

  const whereConditions = [whereFn(fn('LOWER', col('email')), normalizedEmail)]
  if (orderNumber) whereConditions.push({ orderNumber: String(orderNumber).trim() })

  const orders = await Order.findAll({
    where: { [Op.and]: whereConditions },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: OrderItem,
        attributes: [
          'id', 'title', 'code', 'variant', 'variant_id', 'category',
          'price', 'quantity', 'note', 'imgurl',
        ],
        include: [
          {
            model: OrderItemRefund,
            attributes: ['id', 'quantity', 'amount', 'stripeRefundId', 'createdAt'],
          },
        ],
      },
      {
        model: Shipment,
        attributes: [
          'id', 'name', 'firstline', 'secondline', 'city', 'state', 'zip',
          'tracking', 'extra_informations',
        ],
        include: [
          { model: Carrier, attributes: ['id', 'name'] },
          { model: ShipmentStatus, attributes: ['id', 'name'] },
        ],
      },
      { model: OrderStatus, attributes: ['id', 'name'] },
      {
        model: Billing,
        attributes: ['id', 'name', 'firstline', 'secondline', 'city', 'state', 'zip', 'phone'],
      },
    ],
  })

  return Promise.all(orders.map((order) => attachRefundTotals(order)))
}
```

Add both to `module.exports` at the bottom of the file:

```js
module.exports = {
    getOrders,
    createOrder,
    createManualOrder,
    confirmOrderPayment,
    getSingleOrder,
    updateOrder,
    updateOrderItems,
    updateOrderStatus,
    bulkUpdateOrderStatus,
    completeOrder,
    refundOrder,
    refundOrderItem,
    resendOrderConfirmation,
    exportOrdersExcel,
    attachRefundTotals,
    normalizeGuestLookupEmail,
    lookupGuestOrders,
}
```

- [ ] **Step 4: Run the test, confirm it passes**

```bash
node --test controller/orderController.test.js
```

Expected: all 4 pass.

- [ ] **Step 5: Wire the route in `routes/orderRouter.js`**

```js
const router = (module.exports = require('express').Router())
const rateLimit = require('express-rate-limit')
const { getOrders, createOrder, lookupGuestOrders } = require('../controller/orderController')
const AppError = require('../utils/appError')

const guestLookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many lookup attempts. Please try again later.' },
})

// Guest order lookup - no auth. Registered before the /orders/ admin route
// below only to keep every /orders/* route grouped by how it's reached
// (public, then admin-header-driven, then the plain POST) rather than any
// functional requirement - the paths don't collide.
// GET /api/orders/lookup?email=...&orderNumber=...
router.get('/lookup', guestLookupLimiter, async (req, res, next) => {
    try {
        const data = await lookupGuestOrders(req.query)
        res.status(200).send(data)
    } catch (error) {
        next(error)
    }
})

// Description
// GET /api/orders/orders/
router.get('/orders/', async (req, res, next) => {
    try {
        const { query } = req.headers
        if (!query) throw new AppError('Parametre Bulunamadi', 500)
        const data = await getOrders(query)
        res.status(200).send(data)
    } catch (error) {
        next(error)
    }
})


// Save order
// POST /api/orders
router.post('/', async (req, res, next) => {
    try {
        const { user, body } = req
        const data = await createOrder({userInfo:user, order:body})
        res.status(200).send(data)
    } catch (error) {
        next(error)
    }
})
```

- [ ] **Step 6: Manually verify against the real local API (this repo has no DB-integration test harness — the existing convention, confirmed by the zero DB-touching test files for any controller, is manual `curl` verification against a running instance, same as this session's earlier `searchController.js` fix)**

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_API
(lsof -ti:8000 | xargs -r kill -9) 2>&1; sleep 1
nohup npm run start > /tmp/esk_api_dev.log 2>&1 & disown
sleep 3
# An email with no orders - expect []
curl -s "http://localhost:8000/api/orders/lookup?email=definitely-not-a-real-customer@example.com"
# An email known to have orders in the real DB (find one via an existing
# order lookup path, e.g. the admin search, before running this) - expect
# a non-empty array shaped like OrdersListView/OrderDetailView already consume
curl -s "http://localhost:8000/api/orders/lookup?email=<a real customer email>" | python3 -m json.tool
# Missing email - expect a 400
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8000/api/orders/lookup"
# orderNumber for a DIFFERENT email than the one that placed it - expect []
curl -s "http://localhost:8000/api/orders/lookup?email=definitely-not-a-real-customer@example.com&orderNumber=<a real order number>"
```

Confirm: empty-email-match returns `[]` with HTTP 200 (not an error); a real match returns the full nested shape; missing `email` returns 400; a real order number paired with the wrong email returns `[]`, not that order.

- [ ] **Step 7: Full ESK_API suite, then commit**

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_API
npm test
git add controller/orderController.js controller/orderController.test.js routes/orderRouter.js package.json package-lock.json
git commit -m "Add guest order lookup: GET /orders/lookup, email required, order number optional"
```

---

## Task 2: ESK_FE_V2 — `useOrderLookup` hook

**Files:**
- Create: `hooks/useOrderLookup.js`
- Create: `hooks/useOrderLookup.test.jsx`

**Interfaces:**
- Produces: `useOrderLookup(): { mutateAsync({ email, orderNumber? }): Promise<Order[]>, isPending, ... }` (a plain `useMutation`, matching `hooks/useLogin.js`'s shape) — consumed by `TrackOrderView` in Task 4.
- Consumes: `api` from `@/lib/api`.

- [ ] **Step 1: Write the failing test**

```jsx
// hooks/useOrderLookup.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useOrderLookup } from './useOrderLookup';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useOrderLookup', () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it('looks up by email alone', async () => {
    api.get.mockResolvedValue({ data: [{ id: 1, orderNumber: '1001' }] });
    const { result } = renderHook(() => useOrderLookup(), { wrapper });

    const orders = await result.current.mutateAsync({ email: 'jane@example.com' });

    expect(api.get).toHaveBeenCalledWith('/orders/lookup', {
      params: { email: 'jane@example.com' },
    });
    expect(orders).toEqual([{ id: 1, orderNumber: '1001' }]);
  });

  it('includes orderNumber in the params only when given', async () => {
    api.get.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useOrderLookup(), { wrapper });

    await result.current.mutateAsync({ email: 'jane@example.com', orderNumber: '1001' });

    expect(api.get).toHaveBeenCalledWith('/orders/lookup', {
      params: { email: 'jane@example.com', orderNumber: '1001' },
    });
  });
});
```

- [ ] **Step 2: Run it, confirm it fails (module doesn't exist)**

```bash
npx vitest run hooks/useOrderLookup.test.jsx
```

- [ ] **Step 3: Implement**

```js
// hooks/useOrderLookup.js
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

- [ ] **Step 4: Run it, confirm it passes**

```bash
npx vitest run hooks/useOrderLookup.test.jsx
```

- [ ] **Step 5: Commit**

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_FE_V2
git add hooks/useOrderLookup.js hooks/useOrderLookup.test.jsx
git commit -m "Add useOrderLookup hook for the guest order-lookup endpoint"
```

---

## Task 3: ESK_FE_V2 — extract `OrderDetailCard` out of `OrderDetailView`

**Files:**
- Create: `components/account/OrderDetailCard.js`
- Create: `components/account/OrderDetailCard.test.jsx`
- Modify: `components/account/OrderDetailView.js`
- Modify: `components/account/OrderDetailView.test.jsx`

**Interfaces:**
- Produces: `OrderDetailCard({ order }): JSX` — renders everything `OrderDetailView` renders for a found order (header, status pill, reorder button, placed/tracking/items/total summary, refund notice, items table, shipping/billing addresses, invoice/packing-slip downloads, cancelled notice) except the "Back to order history" link, which stays account-specific. Consumed by `OrderDetailView` (this task) and `TrackOrderView` (Task 4) — the second consumer is *why* this extraction happens now rather than later.
- Consumes: `useCartStore`, `useUIStore` (both already used by the current `OrderDetailView`), `StatusPill`, `formatDate`, `formatOrderNumber`, `isCancelled`, `getItemRefundedQuantity` from `./orderHelpers` and `./StatusPill`.

- [ ] **Step 1: Read `components/account/OrderDetailView.js` fresh in full** (it's reproduced in this session's own transcript above from an earlier read, but re-read the live file before editing — this plan was written against that snapshot and the file must not have drifted).

- [ ] **Step 2: Create `OrderDetailCard.js` with the extracted body**

```jsx
// components/account/OrderDetailCard.js
'use client';

import {
  Download,
  MapPin,
  Truck,
  RotateCcw,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { StatusPill } from './StatusPill';
import {
  formatDate,
  formatOrderNumber,
  isCancelled,
  getItemRefundedQuantity,
} from './orderHelpers';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function OrderDetailCard({ order }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCartDrawer = useUIStore((state) => state.openCartDrawer);

  const items = order.orderitems ?? [];
  const shipment = order.shipment;
  const billing = order.billing;
  const cancelled = isCancelled(order);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0),
    0
  );
  const amountRefunded = Number(order.amountRefunded ?? 0);

  function addItemToCart(item) {
    if (!item.variant_id) return;
    addItem(item.variant_id, item.quantity || 1, false);
    openCartDrawer();
  }

  function reorderAll() {
    const reorderable = items.filter((item) => item.variant_id);
    reorderable.forEach((item) => addItem(item.variant_id, item.quantity || 1, false));
    if (reorderable.length > 0) openCartDrawer();
  }

  const hasReorderableItems = items.some((item) => item.variant_id);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">My Account</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Order {formatOrderNumber(order)}
            </h1>
            <StatusPill status={order.orderstatus?.name} />
          </div>
        </div>

        {hasReorderableItems && (
          <button
            type="button"
            onClick={reorderAll}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Reorder all items
          </button>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-6 border-y border-border py-6 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-text-muted">Placed</dt>
          <dd className="mt-1 font-medium text-text-primary">{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-text-muted">
            <Truck aria-hidden="true" className="h-3.5 w-3.5" />
            Tracking
          </dt>
          <dd className="mt-1 font-medium text-text-primary">
            {shipment?.carrier?.name && (
              <span className="text-text-muted">{shipment.carrier.name} · </span>
            )}
            {shipment?.tracking ?? order.trackingNumber ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Items</dt>
          <dd className="mt-1 font-medium text-text-primary">{items.length || '—'}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Total</dt>
          <dd className="mt-1 font-medium text-text-primary">
            {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
          </dd>
        </div>
      </dl>

      {amountRefunded > 0 && (
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700">
          <RotateCcw aria-hidden="true" className="h-4 w-4 shrink-0" />
          {order.amountRemaining > 0
            ? `$${amountRefunded.toFixed(2)} refunded, $${Number(order.amountRemaining).toFixed(2)} remaining.`
            : `$${amountRefunded.toFixed(2)} refunded in full.`}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            Items
          </h2>
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 font-medium">Price</th>
                  <th className="py-2 font-medium">Line total</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const refundedQuantity = getItemRefundedQuantity(item);
                  return (
                    <tr key={item.id} className="border-b border-border">
                      <td className="py-3 text-text-primary">
                        {item.title}
                        {item.code && (
                          <span className="block text-xs text-text-muted">SKU: {item.code}</span>
                        )}
                        {refundedQuantity > 0 && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-purple-700">
                            <RotateCcw aria-hidden="true" className="h-3 w-3" />
                            {refundedQuantity} of {item.quantity} refunded
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-text-muted">{item.quantity}</td>
                      <td className="py-3 text-text-muted">
                        {item.price != null ? `$${Number(item.price).toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 text-text-muted">
                        $
                        {(Number(item.price ?? 0) * Number(item.quantity ?? 0)).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        {item.variant_id && (
                          <button
                            type="button"
                            onClick={() => addItemToCart(item)}
                            className="group inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                          >
                            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                            Add to cart
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-right text-sm text-text-muted">
            Items subtotal: <span className="font-semibold text-text-primary">${subtotal.toFixed(2)}</span>
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {shipment && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              Shipping address
            </h2>
            <address className="mt-2 not-italic text-sm text-text-primary">
              {shipment.name && <p>{shipment.name}</p>}
              {shipment.firstline && <p>{shipment.firstline}</p>}
              {shipment.secondline && <p>{shipment.secondline}</p>}
              <p>
                {[shipment.city, shipment.state, shipment.zip].filter(Boolean).join(', ')}
              </p>
            </address>
          </div>
        )}

        {billing && (
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
              <MapPin aria-hidden="true" className="h-4 w-4 text-accent" />
              Billing address
            </h2>
            <address className="mt-2 not-italic text-sm text-text-primary">
              {billing.name && <p>{billing.name}</p>}
              {billing.firstline && <p>{billing.firstline}</p>}
              {billing.secondline && <p>{billing.secondline}</p>}
              <p>
                {[billing.city, billing.state, billing.zip].filter(Boolean).join(', ')}
              </p>
            </address>
          </div>
        )}
      </div>

      {API_URL && !cancelled && (
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={`${API_URL}/invoices/pdf/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download invoice
          </a>
          <a
            href={`${API_URL}/invoices/packing-slip/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download packing slip
          </a>
        </div>
      )}

      {cancelled && (
        <p className="mt-8 text-sm text-text-muted">
          Invoice and packing slip are not available for cancelled orders.
        </p>
      )}
    </>
  );
}
```

- [ ] **Step 3: Move the rendering tests from `OrderDetailView.test.jsx` to `OrderDetailCard.test.jsx`**

```jsx
// components/account/OrderDetailCard.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { OrderDetailCard } from './OrderDetailCard';

const order = {
  id: 42,
  orderNumber: 'ESK-1001',
  createdAt: '2026-01-15T00:00:00.000Z',
  price: '162.50',
  trackingNumber: 'TRACK123',
  orderstatus: { id: 3, name: 'Completed' },
  orderitems: [
    { id: 1, title: 'Cord Strapping', code: 'CC40/2', quantity: 2, price: '50.00', variant_id: 327 },
    { id: 2, title: 'Corner Board', code: 'CB-4x4', quantity: 1, price: '50.00', variant_id: 405 },
  ],
  shipment: {
    name: 'Jane Doe',
    firstline: '123 Main St',
    secondline: null,
    city: 'Garland',
    state: 'TX',
    zip: '75042',
    tracking: 'TRACK123',
    carrier: { id: 1, name: 'UPS' },
  },
  billing: {
    name: 'Jane Doe',
    firstline: '123 Main St',
    secondline: null,
    city: 'Garland',
    state: 'TX',
    zip: '75042',
  },
};

describe('OrderDetailCard', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
    useUIStore.setState({ isCartDrawerOpen: false });
  });

  it('renders order items, addresses, status, carrier, and total', () => {
    render(<OrderDetailCard order={order} />);

    expect(screen.getByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cord Strapping')).toBeInTheDocument();
    expect(screen.getByText('Corner Board')).toBeInTheDocument();
    expect(screen.getByText('SKU: CC40/2')).toBeInTheDocument();
    expect(screen.getByText('SKU: CB-4x4')).toBeInTheDocument();
    expect(screen.getByText('UPS ·')).toBeInTheDocument();
    expect(screen.getAllByText('TRACK123').length).toBeGreaterThan(0);
    expect(screen.getByText('$162.50')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getAllByText(/Garland, TX, 75042/).length).toBeGreaterThan(0);
  });

  it('shows a refund notice when the order has a refund', () => {
    render(<OrderDetailCard order={{ ...order, amountRefunded: 50, amountRemaining: 112.5 }} />);
    expect(screen.getByText('$50.00 refunded, $112.50 remaining.')).toBeInTheDocument();
  });

  it('shows a full-refund notice when nothing remains', () => {
    render(<OrderDetailCard order={{ ...order, amountRefunded: 162.5, amountRemaining: 0 }} />);
    expect(screen.getByText('$162.50 refunded in full.')).toBeInTheDocument();
  });

  it('hides invoice/packing-slip downloads for a cancelled order', () => {
    render(<OrderDetailCard order={{ ...order, orderstatus: { id: 5, name: 'Cancelled' } }} />);
    expect(screen.queryByRole('link', { name: /Download invoice/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Download packing slip/ })).not.toBeInTheDocument();
    expect(
      screen.getByText('Invoice and packing slip are not available for cancelled orders.')
    ).toBeInTheDocument();
  });

  it('adds a single item back to the cart and opens the cart drawer', async () => {
    render(<OrderDetailCard order={order} />);
    await userEvent.click(screen.getAllByRole('button', { name: /Add to cart/ })[0]);
    expect(useCartStore.getState().items).toEqual([{ variantId: 327, quantity: 2, isPallet: false }]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('reorders every item in the order at once', async () => {
    render(<OrderDetailCard order={order} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reorder all items' }));
    expect(useCartStore.getState().items).toEqual([
      { variantId: 327, quantity: 2, isPallet: false },
      { variantId: 405, quantity: 1, isPallet: false },
    ]);
    expect(useUIStore.getState().isCartDrawerOpen).toBe(true);
  });

  it('shows a per-item refund note when a line item has one', () => {
    const orderWithItemRefund = {
      ...order,
      orderitems: [
        { ...order.orderitems[0], order_item_refunds: [{ id: 1, quantity: 1, amount: '25.00' }] },
        order.orderitems[1],
      ],
    };
    render(<OrderDetailCard order={orderWithItemRefund} />);
    expect(screen.getByText('1 of 2 refunded')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run it, confirm it passes**

```bash
npx vitest run components/account/OrderDetailCard.test.jsx
```

- [ ] **Step 5: Rewire `OrderDetailView.js` to use `OrderDetailCard`**

```jsx
// components/account/OrderDetailView.js
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { OrderDetailCard } from './OrderDetailCard';

export function OrderDetailView({ orderNumber }) {
  const { data: orders, isLoading, isError } = useAccountOrders();

  if (isLoading) {
    return <p className="text-sm text-text-muted">Loading order…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        We couldn&apos;t load this order. Please try again later.
      </p>
    );
  }

  const order = orders?.find(
    (candidate) =>
      candidate.orderNumber === orderNumber || candidate.uniqueId === orderNumber
  );

  if (!order) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
          Order not found
        </h1>
        <p className="mt-2 text-text-muted">
          We couldn&apos;t find an order matching {orderNumber}.
        </p>
        <Link
          href="/account/orders"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to order history
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Back to order history
      </Link>

      <OrderDetailCard order={order} />
    </div>
  );
}
```

- [ ] **Step 6: Trim `OrderDetailView.test.jsx` down to the data-wiring tests it still owns**

```jsx
// components/account/OrderDetailView.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAccountOrders } from '@/hooks/useAccountOrders';
import { OrderDetailView } from './OrderDetailView';

vi.mock('@/hooks/useAccountOrders', () => ({
  useAccountOrders: vi.fn(),
}));

const order = {
  id: 42,
  orderNumber: 'ESK-1001',
  createdAt: '2026-01-15T00:00:00.000Z',
  price: '162.50',
  orderstatus: { id: 3, name: 'Completed' },
  orderitems: [],
};

describe('OrderDetailView', () => {
  it('shows a loading state', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);
    expect(screen.getByText('Loading order…')).toBeInTheDocument();
  });

  it('shows an order-not-found state when no order matches', () => {
    useAccountOrders.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-9999" />);
    expect(screen.getByRole('heading', { name: 'Order not found' })).toBeInTheDocument();
  });

  it('shows an error state', () => {
    useAccountOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<OrderDetailView orderNumber="ESK-1001" />);
    expect(
      screen.getByText("We couldn't load this order. Please try again later.")
    ).toBeInTheDocument();
  });

  it('finds the matching order and renders its detail via OrderDetailCard', () => {
    useAccountOrders.mockReturnValue({ data: [order], isLoading: false, isError: false });
    render(<OrderDetailView orderNumber="ESK-1001" />);
    expect(screen.getByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to order history/ })).toHaveAttribute(
      'href',
      '/account/orders'
    );
  });
});
```

(This drops the `vi.mock('@/hooks/useCartStore'...)`-adjacent setup the old file had — `OrderDetailView` itself no longer touches the cart at all, that's entirely `OrderDetailCard`'s concern now.)

- [ ] **Step 7: Run both files, confirm green**

```bash
npx vitest run components/account/OrderDetailCard.test.jsx components/account/OrderDetailView.test.jsx
```

- [ ] **Step 8: Full suite, then commit**

```bash
npx vitest run
git add components/account/OrderDetailCard.js components/account/OrderDetailCard.test.jsx components/account/OrderDetailView.js components/account/OrderDetailView.test.jsx
git commit -m "Extract OrderDetailCard from OrderDetailView (needed by the guest order-lookup page next)"
```

---

## Task 4: ESK_FE_V2 — `TrackOrderView` + `/track-order` route

**Files:**
- Create: `components/checkout/TrackOrderView.js`
- Create: `components/checkout/TrackOrderView.test.jsx`
- Create: `app/(storefront)/track-order/page.js`

**Interfaces:**
- Consumes: `useOrderLookup` (Task 2), `OrderDetailCard` (Task 3), `StatusPill`/`formatDate`/`formatOrderNumber` from `components/account/orderHelpers.js`/`StatusPill.js`.

- [ ] **Step 1: Write the failing test**

```jsx
// components/checkout/TrackOrderView.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOrderLookup } from '@/hooks/useOrderLookup';
import { TrackOrderView } from './TrackOrderView';

vi.mock('@/hooks/useOrderLookup', () => ({ useOrderLookup: vi.fn() }));

describe('TrackOrderView', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    mutateAsync.mockReset();
    useOrderLookup.mockReturnValue({ mutateAsync, isPending: false });
  });

  it('requires an email before submitting', async () => {
    render(<TrackOrderView />);
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits email alone', async () => {
    mutateAsync.mockResolvedValue([]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(mutateAsync).toHaveBeenCalledWith({ email: 'jane@example.com', orderNumber: '' });
  });

  it('shows a not-found message for zero results', async () => {
    mutateAsync.mockResolvedValue([]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(
      await screen.findByText("We couldn't find any orders for that email.")
    ).toBeInTheDocument();
  });

  it('renders a single result as full order detail directly', async () => {
    mutateAsync.mockResolvedValue([
      { id: 1, orderNumber: 'ESK-1001', createdAt: '2026-01-15T00:00:00.000Z', price: '68.00', orderstatus: { name: 'Completed' }, orderitems: [] },
    ]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));
    expect(await screen.findByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
  });

  it('renders multiple results as a list, then shows detail on click', async () => {
    mutateAsync.mockResolvedValue([
      { id: 1, orderNumber: 'ESK-1001', createdAt: '2026-01-15T00:00:00.000Z', price: '68.00', orderstatus: { name: 'Completed' }, orderitems: [] },
      { id: 2, orderNumber: 'ESK-1002', createdAt: '2026-01-20T00:00:00.000Z', price: '140.00', orderstatus: { name: 'Pending' }, orderitems: [] },
    ]);
    render(<TrackOrderView />);
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Find my order(s)' }));

    expect(await screen.findByText('#ESK-1001')).toBeInTheDocument();
    expect(screen.getByText('#ESK-1002')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Order #/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'View' })[0]);
    expect(await screen.findByRole('heading', { name: 'Order #ESK-1001' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails (module doesn't exist)**

```bash
npx vitest run components/checkout/TrackOrderView.test.jsx
```

- [ ] **Step 3: Implement**

```jsx
// components/checkout/TrackOrderView.js
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Search } from 'lucide-react';
import { useOrderLookup } from '@/hooks/useOrderLookup';
import { OrderDetailCard } from '@/components/account/OrderDetailCard';
import { StatusPill } from '@/components/account/StatusPill';
import { formatDate, formatOrderNumber } from '@/components/account/orderHelpers';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  orderNumber: yup.string().optional(),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

function ResultsList({ orders, onSelect }) {
  return (
    <ul className="mt-6 divide-y divide-border">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center justify-between gap-4 py-4 text-sm">
          <div>
            <p className="font-medium text-text-primary">{formatOrderNumber(order)}</p>
            <p className="text-text-muted">{formatDate(order.createdAt)}</p>
          </div>
          <StatusPill status={order.orderstatus?.name} />
          <span className="text-text-primary">
            {order.price != null ? `$${Number(order.price).toFixed(2)}` : '—'}
          </span>
          <button
            type="button"
            onClick={() => onSelect(order)}
            className="font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            View
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TrackOrderView() {
  const lookupMutation = useOrderLookup();
  const [results, setResults] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchedOrderNumber, setSearchedOrderNumber] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setSelectedOrder(null);
    setSearchedOrderNumber(values.orderNumber ?? '');
    const orders = await lookupMutation.mutateAsync({
      email: values.email,
      orderNumber: values.orderNumber ?? '',
    });
    setResults(orders);
    if (orders.length === 1) setSelectedOrder(orders[0]);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Order Status</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
        Track your order
      </h1>
      <p className="mt-2 text-text-muted">
        Enter the email you used at checkout. If you have your order number too, add it to
        jump straight to that order.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input id="email" type="email" {...register('email')} className={fieldClass} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="orderNumber" className="text-sm font-medium text-text-primary">
            Order number (optional)
          </label>
          <input id="orderNumber" {...register('orderNumber')} className={fieldClass} />
        </div>

        <button
          type="submit"
          disabled={lookupMutation.isPending}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          {lookupMutation.isPending ? 'Searching…' : 'Find my order(s)'}
        </button>
      </form>

      {results && results.length === 0 && (
        <p className="mt-8 text-text-muted">
          We couldn&apos;t find any orders for that email
          {searchedOrderNumber ? ' matching that order number' : ''}.
        </p>
      )}

      {results && results.length > 1 && !selectedOrder && (
        <ResultsList orders={results} onSelect={setSelectedOrder} />
      )}

      {selectedOrder && (
        <div className="mt-8">
          {results && results.length > 1 && (
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              ← Back to results
            </button>
          )}
          <OrderDetailCard order={selectedOrder} />
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Run it, confirm it passes**

```bash
npx vitest run components/checkout/TrackOrderView.test.jsx
```

- [ ] **Step 5: Create the route**

```jsx
// app/(storefront)/track-order/page.js
import { TrackOrderView } from '@/components/checkout/TrackOrderView';

export default function TrackOrderPage() {
  return <TrackOrderView />;
}
```

- [ ] **Step 6: Manual check in the browser**

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_FE_V2
(lsof -ti:3000 | xargs -r kill -9) 2>&1; sleep 1
nohup npm run dev > /tmp/esk_fe_v2_dev.log 2>&1 & disown
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/track-order
```

Visit `/track-order`, submit an email with real orders against the (by now updated) API, confirm the list/detail behavior matches the test's expectations visually.

- [ ] **Step 7: Full suite, then commit**

```bash
npx vitest run
git add components/checkout/TrackOrderView.js components/checkout/TrackOrderView.test.jsx "app/(storefront)/track-order/page.js"
git commit -m "Add guest order tracking page at /track-order"
```

---

## Task 5: ESK_FE_V2 — discoverability (Footer link, confirmation-page fallback)

**Files:**
- Modify: `components/layout/Footer.js`
- Modify: `components/layout/Footer.test.jsx`
- Modify: `components/checkout/OrderConfirmationView.js`
- Create: `components/checkout/OrderConfirmationView.test.jsx` (check first whether one already exists — if it does, extend it instead of creating a new one; this plan was written without having read that specific file, since Tasks 1-4 didn't need it)

**Interfaces:** none new — pure UI wiring.

- [ ] **Step 1: Add the Footer link + test**

In `components/layout/Footer.js`, `companyLinks`:
```js
const companyLinks = [
  { href: '/about-us', label: 'About Us' },
  { href: '/track-order', label: 'Track Order' },
  { href: '/product-guidance', label: 'Product Guidance' },
  { href: '/quote', label: 'Request a Quote' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Support' },
];
```

In `components/layout/Footer.test.jsx`, add to the existing `'renders the company links'` test:
```js
expect(screen.getByRole('link', { name: 'Track Order' })).toHaveAttribute(
  'href',
  '/track-order'
);
```

- [ ] **Step 2: Point `OrderConfirmationView`'s not-found fallback at `/track-order`**

Read `components/checkout/OrderConfirmationView.js` fresh (reproduced in this session's transcript, but confirm against the live file) and check whether `components/checkout/OrderConfirmationView.test.jsx` already exists. In the not-found branch, change:
```jsx
<Link href="/search" className="mt-4 inline-block text-primary hover:text-primary-hover">
  Continue shopping
</Link>
```
to:
```jsx
<Link href="/track-order" className="mt-4 inline-block text-primary hover:text-primary-hover">
  Look up your order
</Link>
```
inside the `if (!order || ...)` branch specifically — the found-order branch's own "Continue shopping" link at the bottom stays pointed at `/search` unchanged (that one is post-purchase browsing, not order lookup).

If a test file exists, update its not-found-state assertion to match; if none exists, add one:
```jsx
// components/checkout/OrderConfirmationView.test.jsx (only if no such file exists yet)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useLastOrderStore } from '@/stores/lastOrderStore';
import { OrderConfirmationView } from './OrderConfirmationView';

describe('OrderConfirmationView', () => {
  it('links to order lookup when no matching order is in local state', () => {
    useLastOrderStore.setState({ order: null });
    render(<OrderConfirmationView orderNumber="ESK-1001" />);
    expect(screen.getByRole('link', { name: 'Look up your order' })).toHaveAttribute(
      'href',
      '/track-order'
    );
  });
});
```

- [ ] **Step 3: Run both files, confirm green**

```bash
npx vitest run components/layout/Footer.test.jsx components/checkout/OrderConfirmationView.test.jsx
```

- [ ] **Step 4: Full suite, then commit**

```bash
npx vitest run
git add components/layout/Footer.js components/layout/Footer.test.jsx components/checkout/OrderConfirmationView.js components/checkout/OrderConfirmationView.test.jsx
git commit -m "Link to /track-order from the footer and the order-confirmation not-found state"
```

---

## Task 6: ESK_FE_V2 — auto-login after registration

**Files:**
- Modify: `components/auth/RegisterView.js`
- Modify: `components/auth/RegisterView.test.jsx`

**Interfaces:**
- Consumes: `useLogin` (`@/hooks/useLogin`), `useAuthStore` (`@/stores/authStore`), `useRouter` (`next/navigation`) — same three `LoginView.js` already uses for the identical post-login sequence.

- [ ] **Step 1: Update the test first — the old "no auto-login" test is being replaced, not kept**

```jsx
// components/auth/RegisterView.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRegister } from '@/hooks/useRegister';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { RegisterView } from './RegisterView';

vi.mock('@/hooks/useRegister', () => ({ useRegister: vi.fn() }));
vi.mock('@/hooks/useLogin', () => ({ useLogin: vi.fn() }));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('RegisterView', () => {
  beforeEach(() => {
    push.mockClear();
    useAuthStore.setState({ user: null, isLoading: false });
  });

  it('shows validation errors for empty fields', async () => {
    useRegister.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<RegisterView />);
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('registers, logs in with the same credentials, stores the user, and redirects to the account page', async () => {
    const registerMutateAsync = vi.fn().mockResolvedValue({ message: 'User created successfully.' });
    const loginMutateAsync = vi.fn().mockResolvedValue({ id: 1, email: 'jane@example.com' });
    useRegister.mockReturnValue({ mutateAsync: registerMutateAsync, isPending: false });
    useLogin.mockReturnValue({ mutateAsync: loginMutateAsync, isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(registerMutateAsync).toHaveBeenCalledWith({
      name: 'Jane',
      surname: 'Doe',
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(loginMutateAsync).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret123',
    });
    expect(useAuthStore.getState().user).toEqual({ id: 1, email: 'jane@example.com' });
    expect(push).toHaveBeenCalledWith('/account');
  });

  it('shows the server error message when registration itself fails', async () => {
    const registerMutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });
    useRegister.mockReturnValue({ mutateAsync: registerMutateAsync, isPending: false });
    useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
  });

  it('shows an error if registration succeeds but the follow-up login fails', async () => {
    const registerMutateAsync = vi.fn().mockResolvedValue({ message: 'User created successfully.' });
    const loginMutateAsync = vi.fn().mockRejectedValue({
      response: { data: { message: 'Invalid password' } },
    });
    useRegister.mockReturnValue({ mutateAsync: registerMutateAsync, isPending: false });
    useLogin.mockReturnValue({ mutateAsync: loginMutateAsync, isPending: false });
    render(<RegisterView />);

    await userEvent.type(screen.getByLabelText('First name'), 'Jane');
    await userEvent.type(screen.getByLabelText('Last name'), 'Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails against the current implementation**

```bash
npx vitest run components/auth/RegisterView.test.jsx
```

- [ ] **Step 3: Implement — drop the `isRegistered` success screen, chain login, redirect**

```jsx
// components/auth/RegisterView.js
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/useRegister';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { AuthShell } from './AuthShell';
import { AuthDivider } from './AuthDivider';
import { GoogleLoginButton } from './GoogleLoginButton';

const schema = yup.object({
  name: yup.string().required('First name is required'),
  surname: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Use at least 8 characters'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function RegisterView() {
  const router = useRouter();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  async function onSubmit(values) {
    setServerError(null);
    try {
      await registerMutation.mutateAsync(values);
      // The registration endpoint only creates the account - it doesn't set
      // a session (ESK_API's POST /auth/register returns a bare message,
      // no cookies). Logging in immediately with the credentials the user
      // just typed, rather than sending them to /login to retype them,
      // matches how every other account-creation flow in this app treats
      // "created" as "signed in."
      const user = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      setUser(user);
      router.push('/account');
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'Registration failed. Please try again.'
      );
    }
  }

  return (
    <AuthShell
      image="/hero-product-range.webp"
      alt="ESK Packaging product range: branded tape, corrugated boxes, strapping coils, stretch film and dispenser carts"
      kicker="Full Product Range"
      heading="Everything your warehouse needs, in one order"
      subtitle="Boxes, tape, film and equipment, stocked and ready to ship."
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
        Create an account
      </h1>

      <div className="mt-8">
        <GoogleLoginButton />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="text-sm font-medium text-text-primary">
            First name
          </label>
          <input id="name" {...register('name')} className={fieldClass} />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="surname" className="text-sm font-medium text-text-primary">
            Last name
          </label>
          <input id="surname" {...register('surname')} className={fieldClass} />
          {errors.surname && (
            <p className="mt-1 text-xs text-red-600">{errors.surname.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input id="email" type="email" {...register('email')} className={fieldClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className={fieldClass}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={registerMutation.isPending || loginMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {registerMutation.isPending || loginMutation.isPending
            ? 'Creating account…'
            : 'Create Account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary-hover">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
```

- [ ] **Step 4: Run it, confirm it passes**

```bash
npx vitest run components/auth/RegisterView.test.jsx
```

- [ ] **Step 5: Full suite, then commit**

```bash
npx vitest run
git add components/auth/RegisterView.js components/auth/RegisterView.test.jsx
git commit -m "Auto-login right after registration instead of sending the user back to /login"
```

---

## Task 7: ESK_FE_V2 — `loginMemoryStore`

**Files:**
- Create: `stores/loginMemoryStore.js`
- Create: `stores/loginMemoryStore.test.js`

**Interfaces:**
- Produces: `useLoginMemoryStore` — Zustand store, `persist`-backed (localStorage key `esk-login-memory`), state `{ lastEmail: string|null, lastMethod: 'password'|'google'|null }`, action `remember(email, method)`. `email` may be `undefined` (method-only update — see Task 8's Google button wiring) — `remember` must not overwrite an existing `lastEmail` with `undefined`.
- Consumed by: Task 8 (`LoginView`, `LoginPopover`, `GoogleLoginButton`).

Match `stores/authStore.test.js`'s existing style for this repo's plain zustand-store tests (read it first for the exact pattern — reset state in `beforeEach`, assert via `useXStore.getState()`).

- [ ] **Step 1: Write the failing test**

```js
// stores/loginMemoryStore.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { useLoginMemoryStore } from './loginMemoryStore';

describe('loginMemoryStore', () => {
  beforeEach(() => {
    useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null });
  });

  it('starts with nothing remembered', () => {
    expect(useLoginMemoryStore.getState()).toMatchObject({ lastEmail: null, lastMethod: null });
  });

  it('remembers an email and method together', () => {
    useLoginMemoryStore.getState().remember('jane@example.com', 'password');
    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'jane@example.com',
      lastMethod: 'password',
    });
  });

  it('a method-only update (Google) keeps the previously remembered email', () => {
    useLoginMemoryStore.getState().remember('jane@example.com', 'password');
    useLoginMemoryStore.getState().remember(undefined, 'google');
    expect(useLoginMemoryStore.getState()).toMatchObject({
      lastEmail: 'jane@example.com',
      lastMethod: 'google',
    });
  });
});
```

- [ ] **Step 2: Run it, confirm it fails (module doesn't exist)**

```bash
npx vitest run stores/loginMemoryStore.test.js
```

- [ ] **Step 3: Implement**

```js
// stores/loginMemoryStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Lets the login screens prefill the email field and hint which method
// (password vs. Google) worked last time, without needing a server round
// trip - this is purely a per-browser convenience, never used for anything
// security-relevant.
export const useLoginMemoryStore = create(
  persist(
    (set) => ({
      lastEmail: null,
      lastMethod: null,
      remember: (email, method) =>
        set((state) => ({
          lastEmail: email ?? state.lastEmail,
          lastMethod: method,
        })),
    }),
    { name: 'esk-login-memory' }
  )
);
```

- [ ] **Step 4: Run it, confirm it passes**

```bash
npx vitest run stores/loginMemoryStore.test.js
```

- [ ] **Step 5: Commit**

```bash
git add stores/loginMemoryStore.js stores/loginMemoryStore.test.js
git commit -m "Add loginMemoryStore: remembers last login email + method"
```

---

## Task 8: ESK_FE_V2 — wire remembered email/method into Login UI

**Files:**
- Modify: `components/auth/LoginView.js`
- Modify: `components/auth/LoginView.test.jsx`
- Modify: `components/layout/LoginPopover.js`
- Modify: `components/layout/LoginPopover.test.jsx`
- Modify: `components/auth/GoogleLoginButton.js`
- Modify: `components/auth/GoogleLoginButton.test.jsx`

**Interfaces:**
- Consumes: `useLoginMemoryStore` (Task 7).

- [ ] **Step 1: `GoogleLoginButton.js` — remember the method on click**

```jsx
// components/auth/GoogleLoginButton.js
'use client';

import { useLoginMemoryStore } from '@/stores/loginMemoryStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function GoogleIcon() {
  /* unchanged */
}

export function GoogleLoginButton() {
  const remember = useLoginMemoryStore((state) => state.remember);

  if (!API_URL) return null;

  return (
    <a
      href={`${API_URL}/auth/google`}
      onClick={() => remember(undefined, 'google')}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border text-sm font-semibold text-text-primary transition-colors hover:border-primary"
    >
      <GoogleIcon />
      Continue with Google
    </a>
  );
}
```

(The component gains `'use client'` — it previously had none since it rendered a plain `<a>`; it now reads a Zustand hook, which requires it.)

Add to `components/auth/GoogleLoginButton.test.jsx`:
```jsx
import { fireEvent, screen } from '@testing-library/react';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
// ...inside the existing describe block, a new test:
it('remembers google as the last method on click, keeping any remembered email', async () => {
  useLoginMemoryStore.setState({ lastEmail: 'jane@example.com', lastMethod: null });
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com');
  const { GoogleLoginButton } = await import('./GoogleLoginButton');
  render(<GoogleLoginButton />);

  // fireEvent.click (not userEvent.click) deliberately - a real click on an
  // <a href> makes jsdom attempt navigation, which it doesn't implement and
  // logs as an error (cosmetic, already seen elsewhere in this suite's
  // output) for no benefit here; fireEvent still dispatches the click event
  // React's onClick handler listens for, without jsdom trying to follow the
  // link.
  fireEvent.click(screen.getByRole('link', { name: /Continue with Google/ }));

  expect(useLoginMemoryStore.getState()).toMatchObject({
    lastEmail: 'jane@example.com',
    lastMethod: 'google',
  });
});
```

- [ ] **Step 2: `LoginView.js` — prefill email, show the method hint, remember on success**

```jsx
// components/auth/LoginView.js
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useLogin';
import { useAuthStore } from '@/stores/authStore';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
import { AuthShell } from './AuthShell';
import { AuthDivider } from './AuthDivider';
import { GoogleLoginButton } from './GoogleLoginButton';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

export function LoginView() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState(null);
  const lastEmail = useLoginMemoryStore((state) => state.lastEmail);
  const lastMethod = useLoginMemoryStore((state) => state.lastMethod);
  const remember = useLoginMemoryStore((state) => state.remember);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { email: lastEmail ?? '' } });

  async function onSubmit(values) {
    setServerError(null);
    try {
      const user = await loginMutation.mutateAsync(values);
      remember(values.email, 'password');
      setUser(user);
      router.push('/account');
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'Login failed. Please try again.'
      );
    }
  }

  return (
    <AuthShell
      image="/hero-strapping.jpg"
      alt="Composite and woven strapping rolls with strapping tensioner tools"
      kicker="Welcome Back"
      heading="Pick up right where you left off"
      subtitle="Track orders, reorder in a click, and manage your saved addresses."
    >
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Account</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary">
        Log in
      </h1>
      {lastMethod === 'google' && (
        <p className="mt-2 text-sm text-text-muted">You signed in with Google last time.</p>
      )}

      <div className="mt-8">
        <GoogleLoginButton />
        <AuthDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input id="email" type="email" {...register('email')} className={fieldClass} />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className={fieldClass}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        <Link href="/forgot-password" className="text-primary hover:text-primary-hover">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:text-primary-hover">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
```

Add to `components/auth/LoginView.test.jsx` (which already resets `useAuthStore` in `beforeEach` — add the same for `useLoginMemoryStore`):
```jsx
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
// ...in beforeEach, alongside the existing useAuthStore.setState:
useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null });

// new tests:
it('prefills the email field with the remembered email', () => {
  useLoginMemoryStore.setState({ lastEmail: 'remembered@example.com', lastMethod: 'password' });
  useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  render(<LoginView />);
  expect(screen.getByLabelText('Email')).toHaveValue('remembered@example.com');
});

it('shows a hint when the last login used Google', () => {
  useLoginMemoryStore.setState({ lastEmail: null, lastMethod: 'google' });
  useLogin.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
  render(<LoginView />);
  expect(screen.getByText('You signed in with Google last time.')).toBeInTheDocument();
});

it('remembers the email and password method on successful login', async () => {
  const mutateAsync = vi.fn().mockResolvedValue({ id: 1, email: 'jane@example.com' });
  useLogin.mockReturnValue({ mutateAsync, isPending: false });
  render(<LoginView />);
  await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect(useLoginMemoryStore.getState()).toMatchObject({
    lastEmail: 'jane@example.com',
    lastMethod: 'password',
  });
});
```

- [ ] **Step 3: `LoginPopover.js` — same prefill/hint/remember, inside the modal**

```jsx
// components/layout/LoginPopover.js
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
import { useLogin } from '@/hooks/useLogin';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export function LoginPopover() {
  const isOpen = useUIStore((state) => state.isLoginModalOpen);
  const closeLoginModal = useUIStore((state) => state.closeLoginModal);
  const setUser = useAuthStore((state) => state.setUser);
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState(null);
  const lastEmail = useLoginMemoryStore((state) => state.lastEmail);
  const lastMethod = useLoginMemoryStore((state) => state.lastMethod);
  const remember = useLoginMemoryStore((state) => state.remember);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues: { email: lastEmail ?? '' } });

  async function onSubmit(values) {
    setServerError(null);
    try {
      const user = await loginMutation.mutateAsync(values);
      remember(values.email, 'password');
      setUser(user);
      reset();
      closeLoginModal();
    } catch (error) {
      setServerError(
        error?.response?.data?.message ?? 'Login failed. Please try again.'
      );
    }
  }

  function handleOpenChange(open) {
    if (!open) {
      reset();
      setServerError(null);
      closeLoginModal();
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={handleOpenChange} title="Log in">
      {lastMethod === 'google' && (
        <p className="mb-4 text-sm text-text-muted">You signed in with Google last time.</p>
      )}
      <GoogleLoginButton />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            {...register('email')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="text-sm font-medium text-text-primary">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            {...register('password')}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          onClick={() => handleOpenChange(false)}
          className="text-primary transition-colors hover:text-primary-hover"
        >
          Register
        </Link>
      </p>
    </Modal>
  );
}
```

Add the equivalent three tests to `components/layout/LoginPopover.test.jsx`, mirroring `LoginView.test.jsx`'s new ones (adapted to this file's existing `beforeEach`, which already sets `useUIStore`/`useAuthStore` state — add `useLoginMemoryStore.setState({ lastEmail: null, lastMethod: null })` alongside those):
```jsx
import { useLoginMemoryStore } from '@/stores/loginMemoryStore';
// ...
it('prefills the email field with the remembered email', () => {
  useLoginMemoryStore.setState({ lastEmail: 'remembered@example.com', lastMethod: 'password' });
  useUIStore.setState({ isLoginModalOpen: true });
  render(<LoginPopover />);
  expect(screen.getByLabelText('Email')).toHaveValue('remembered@example.com');
});

it('shows a hint when the last login used Google', () => {
  useLoginMemoryStore.setState({ lastEmail: null, lastMethod: 'google' });
  useUIStore.setState({ isLoginModalOpen: true });
  render(<LoginPopover />);
  expect(screen.getByText('You signed in with Google last time.')).toBeInTheDocument();
});

it('remembers the email and password method on successful login', async () => {
  mutateAsync.mockResolvedValue({ id: '1', email: 'test@example.com' });
  useUIStore.setState({ isLoginModalOpen: true });
  render(<LoginPopover />);
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
  expect(useLoginMemoryStore.getState()).toMatchObject({
    lastEmail: 'test@example.com',
    lastMethod: 'password',
  });
});
```

- [ ] **Step 4: Run all three files, confirm green**

```bash
npx vitest run components/auth/LoginView.test.jsx components/layout/LoginPopover.test.jsx components/auth/GoogleLoginButton.test.jsx
```

- [ ] **Step 5: Full suite, then commit**

```bash
npx vitest run
git add components/auth/LoginView.js components/auth/LoginView.test.jsx components/layout/LoginPopover.js components/layout/LoginPopover.test.jsx components/auth/GoogleLoginButton.js components/auth/GoogleLoginButton.test.jsx
git commit -m "Remember last login email/method, prefill and hint on both login surfaces"
```

---

## Task 9: ESK_API — deterministic address ordering

**Files:**
- Modify: `controller/shippingProfile.js`

**Interfaces:**
- `getShippingprofiles(userId)` now returns rows ordered newest-first (`id DESC`) — depended on by Task 12's "most recently added address" default.

- [ ] **Step 1: Edit**

```js
// controller/shippingProfile.js
const getShippingprofiles = async (userId) => {
  return await ShippingProfiles.findAll({ where: { userId }, order: [['id', 'DESC']] });
};
```

- [ ] **Step 2: Manual verification (this controller has no existing test file; `ShippingProfiles` has no automated coverage anywhere in this repo today — same manual-curl convention as Task 1)**

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_API
(lsof -ti:8000 | xargs -r kill -9) 2>&1; sleep 1
nohup npm run start > /tmp/esk_api_dev.log 2>&1 & disown
sleep 3
# Using a real logged-in session's cookies (grab them from a browser dev
# tools request to this endpoint, or test through the frontend directly in
# Task 12's manual check instead) - confirm the array's first element has
# the highest id.
curl -s -H "Cookie: accessToken=<a real token>" "http://localhost:8000/api/shippingprofiles" | python3 -m json.tool
```

- [ ] **Step 3: Full ESK_API suite (unaffected, but confirms nothing else broke), then commit**

```bash
npm test
git add controller/shippingProfile.js
git commit -m "Order shipping profiles newest-first (needed for checkout's address prefill)"
```

---

## Task 10: ESK_FE_V2 — `useAddresses` gets an `enabled` option

**Files:**
- Modify: `hooks/useAddresses.js`
- Modify: `hooks/useAddresses.test.jsx`

**Interfaces:**
- `useAddresses(options?: { enabled?: boolean })` — `enabled` defaults to `true` (unchanged behavior for every existing caller, `AddressesView.js`, which calls `useAddresses()` with no arguments).

- [ ] **Step 1: Write the failing test**

Add to `hooks/useAddresses.test.jsx`:
```jsx
it('does not fetch when disabled', () => {
  const { result } = renderHook(() => useAddresses({ enabled: false }), { wrapper });
  expect(api.get).not.toHaveBeenCalled();
  expect(result.current.isPending).toBe(true);
});
```

- [ ] **Step 2: Run it, confirm it fails**

```bash
npx vitest run hooks/useAddresses.test.jsx
```

Expected: fails because `api.get` was called anyway (the hook ignores its argument today).

- [ ] **Step 3: Implement**

```js
// hooks/useAddresses.js
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const ADDRESSES_QUERY_KEY = ['addresses'];

export function useAddresses({ enabled = true } = {}) {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get('/shippingprofiles');
      return data;
    },
    enabled,
  });
}
```

- [ ] **Step 4: Run it, confirm it passes (both the new test and the existing one)**

```bash
npx vitest run hooks/useAddresses.test.jsx
```

- [ ] **Step 5: Full suite, then commit**

```bash
npx vitest run
git add hooks/useAddresses.js hooks/useAddresses.test.jsx
git commit -m "useAddresses: add an enabled option, for checkout to skip fetching when the shopper isn't logged in"
```

---

## Task 11: ESK_FE_V2 — `AddressForm` supports `defaultValues` and a saved-address selector

**Files:**
- Modify: `components/checkout/AddressForm.js`
- Modify: `components/checkout/AddressForm.test.jsx`

**Interfaces:**
- `AddressForm({ onSubmit, isSubmitting, defaultValues?, addresses? })` — `defaultValues` (object matching the form's own field names) seeds the form and re-seeds it via `reset()` whenever it changes by reference (Task 12 is responsible for keeping that reference stable via `useMemo`, so this doesn't fight in-progress user edits — see that task's note). `addresses` (array of `{ id, title, firstline, secondline, phone, city, state, zip }`, may be omitted/empty) renders a selector above the fields when there's more than one; selecting a different one re-seeds the address-specific fields while keeping `defaultValues`' name/email untouched.

- [ ] **Step 1: Write the failing tests**

Add to `components/checkout/AddressForm.test.jsx`:
```jsx
it('prefills fields from defaultValues', () => {
  render(
    <AddressForm
      onSubmit={vi.fn()}
      isSubmitting={false}
      defaultValues={{
        firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '5551234567',
        addressLine: '123 Main St', city: 'Dallas', state: 'TX', postalCode: '75201',
      }}
    />
  );
  expect(screen.getByLabelText('First name')).toHaveValue('Jane');
  expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
  expect(screen.getByLabelText('Address')).toHaveValue('123 Main St');
});

it('does not render a selector for zero or one saved address', () => {
  const { rerender } = render(<AddressForm onSubmit={vi.fn()} isSubmitting={false} addresses={[]} />);
  expect(screen.queryByLabelText('Saved address')).not.toBeInTheDocument();
  rerender(
    <AddressForm
      onSubmit={vi.fn()}
      isSubmitting={false}
      addresses={[{ id: 1, title: 'Warehouse', firstline: '1 Dock Rd', city: 'Dallas', state: 'TX', zip: '75201', phone: '5551234567' }]}
    />
  );
  expect(screen.queryByLabelText('Saved address')).not.toBeInTheDocument();
});

it('switching the saved-address selector refills the address fields, keeping name/email', async () => {
  render(
    <AddressForm
      onSubmit={vi.fn()}
      isSubmitting={false}
      defaultValues={{ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '', addressLine: '', city: '', state: '', postalCode: '' }}
      addresses={[
        { id: 1, title: 'Warehouse', firstline: '1 Dock Rd', secondline: null, city: 'Dallas', state: 'TX', zip: '75201', phone: '5551234567' },
        { id: 2, title: 'Office', firstline: '2 Office Pkwy', secondline: null, city: 'Garland', state: 'TX', zip: '75042', phone: '5559876543' },
      ]}
    />
  );

  await userEvent.selectOptions(screen.getByLabelText('Saved address'), '2');

  expect(screen.getByLabelText('Address')).toHaveValue('2 Office Pkwy');
  expect(screen.getByLabelText('City')).toHaveValue('Garland');
  expect(screen.getByLabelText('First name')).toHaveValue('Jane');
});
```

- [ ] **Step 2: Run it, confirm it fails**

```bash
npx vitest run components/checkout/AddressForm.test.jsx
```

- [ ] **Step 3: Implement**

```jsx
// components/checkout/AddressForm.js
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  addressLine: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup
    .string()
    .required('State is required')
    .length(2, 'Use the 2-letter state code'),
  postalCode: yup.string().required('ZIP code is required'),
});

const fieldClass =
  'mt-1 w-full rounded-md border border-border px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary';

function Field({ id, label, register, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input id={id} {...register} className={fieldClass} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
    </div>
  );
}

export function AddressForm({ onSubmit, isSubmitting, defaultValues, addresses = [] }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema), defaultValues });

  // defaultValues arrives undefined on first render for a logged-in shopper
  // (saved addresses load asynchronously) and populated moments later -
  // react-hook-form only reads defaultValues at mount, so re-seeding here
  // is what makes the later value actually reach the form. The caller
  // (CheckoutView) is responsible for keeping this reference stable
  // (useMemo) when nothing meaningful changed, or every unrelated
  // re-render would wipe whatever the shopper had already typed.
  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  function handleSelectAddress(addressId) {
    const selected = addresses.find((address) => address.id === addressId);
    if (!selected) return;
    reset({
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      phone: selected.phone ?? '',
      addressLine: selected.firstline ?? '',
      city: selected.city ?? '',
      state: selected.state ?? '',
      postalCode: selected.zip ?? '',
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {addresses.length > 1 && (
        <div>
          <label htmlFor="savedAddress" className="text-sm font-medium text-text-primary">
            Saved address
          </label>
          <select
            id="savedAddress"
            defaultValue={addresses[0].id}
            onChange={(event) => handleSelectAddress(Number(event.target.value))}
            className={fieldClass}
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field id="firstName" label="First name" register={register('firstName')} error={errors.firstName} />
        <Field id="lastName" label="Last name" register={register('lastName')} error={errors.lastName} />
      </div>
      <Field id="email" label="Email" type="email" register={register('email')} error={errors.email} />
      <Field id="phone" label="Phone" register={register('phone')} error={errors.phone} />
      <Field
        id="addressLine"
        label="Address"
        register={register('addressLine')}
        error={errors.addressLine}
      />
      <div className="grid grid-cols-3 gap-4">
        <Field id="city" label="City" register={register('city')} error={errors.city} />
        <Field
          id="state"
          label="State"
          placeholder="TX"
          register={register('state')}
          error={errors.state}
        />
        <Field
          id="postalCode"
          label="ZIP"
          register={register('postalCode')}
          error={errors.postalCode}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isSubmitting ? 'Getting shipping rates…' : 'Get Shipping Rates'}
      </button>
    </form>
  );
}
```

(Label text changed from "Saved address" rendered via a `<p>`/`<span>` to an actual `<label htmlFor="savedAddress">` tied to the `<select id="savedAddress">` — `screen.getByLabelText('Saved address')` in the tests above depends on that association; a bare text label without `htmlFor` wouldn't be queryable that way.)

- [ ] **Step 4: Run it, confirm every test (old and new) passes**

```bash
npx vitest run components/checkout/AddressForm.test.jsx
```

- [ ] **Step 5: Full suite, then commit**

```bash
npx vitest run
git add components/checkout/AddressForm.js components/checkout/AddressForm.test.jsx
git commit -m "AddressForm: accept defaultValues and a saved-address selector"
```

---

## Task 12: ESK_FE_V2 — wire checkout prefill end-to-end

**Files:**
- Modify: `components/checkout/CheckoutView.js`
- Modify: `components/checkout/CheckoutView.test.jsx`

**Interfaces:**
- Consumes: `useAuthStore` (`@/stores/authStore`), `useAddresses` (Task 10), passes `defaultValues`/`addresses` into `AddressForm` (Task 11).

- [ ] **Step 1: Write the failing tests**

Add to `components/checkout/CheckoutView.test.jsx` (new imports: `useAuthStore` from `@/stores/authStore`, `useAddresses` mocked the same way the other hooks in this file already are):
```jsx
import { useAuthStore } from '@/stores/authStore';
import { useAddresses } from '@/hooks/useAddresses';

vi.mock('@/hooks/useAddresses', () => ({ useAddresses: vi.fn() }));

// ...in beforeEach, alongside the existing mock setups:
useAuthStore.setState({ user: null, isLoading: false });
useAddresses.mockReturnValue({ data: undefined });

// new tests, inside the describe block:
it('leaves the form blank for a guest (not logged in)', () => {
  useCartStore.getState().addItem(327, 1, false);
  render(<CheckoutView />);
  expect(screen.getByLabelText('First name')).toHaveValue('');
  expect(useAddresses).toHaveBeenCalledWith({ enabled: false });
});

it("prefills name/email from the logged-in user and the most recently saved address", () => {
  useCartStore.getState().addItem(327, 1, false);
  useAuthStore.setState({
    user: { id: 1, name: 'Jane', surname: 'Doe', email: 'jane@example.com' },
    isLoading: false,
  });
  useAddresses.mockReturnValue({
    data: [
      { id: 2, title: 'Office', firstline: '2 Office Pkwy', city: 'Garland', state: 'TX', zip: '75042', phone: '5559876543' },
      { id: 1, title: 'Warehouse', firstline: '1 Dock Rd', city: 'Dallas', state: 'TX', zip: '75201', phone: '5551234567' },
    ],
  });
  render(<CheckoutView />);

  expect(screen.getByLabelText('First name')).toHaveValue('Jane');
  expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
  // addresses[0] is the most recently added (useAddresses/getShippingprofiles
  // now returns newest-first - Task 9) - its fields prefill, not any other entry's.
  expect(screen.getByLabelText('Address')).toHaveValue('2 Office Pkwy');
  expect(useAddresses).toHaveBeenCalledWith({ enabled: true });
});

it('does not crash prefilling for a logged-in user with zero saved addresses', () => {
  useCartStore.getState().addItem(327, 1, false);
  useAuthStore.setState({ user: { id: 1, name: 'Jane', surname: 'Doe', email: 'jane@example.com' }, isLoading: false });
  useAddresses.mockReturnValue({ data: [] });
  render(<CheckoutView />);
  expect(screen.getByLabelText('First name')).toHaveValue('Jane');
  expect(screen.getByLabelText('Address')).toHaveValue('');
});
```

- [ ] **Step 2: Run it, confirm it fails**

```bash
npx vitest run components/checkout/CheckoutView.test.jsx
```

- [ ] **Step 3: Implement**

In `components/checkout/CheckoutView.js`, add imports and wiring:
```jsx
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAddresses } from '@/hooks/useAddresses';
import { useLastOrderStore } from '@/stores/lastOrderStore';
import { useVariantsByIds } from '@/hooks/useVariantsByIds';
import { useShippingOptions } from '@/hooks/useShippingOptions';
import { useCreatePaymentIntent } from '@/hooks/useCreatePaymentIntent';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { ShoppingBag } from 'lucide-react';
import { AddressForm } from './AddressForm';
import { PaymentSection } from './PaymentSection';
import { CheckoutStep } from './CheckoutStep';

/* OrderSummary unchanged */

export function CheckoutView() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const setLastOrder = useLastOrderStore((state) => state.setLastOrder);
  const user = useAuthStore((state) => state.user);

  const { data: lines } = useVariantsByIds(cartItems.map((item) => item.variantId));
  const { data: addresses } = useAddresses({ enabled: Boolean(user) });
  const shippingMutation = useShippingOptions();
  const paymentIntentMutation = useCreatePaymentIntent();
  const orderMutation = useCreateOrder();

  const [address, setAddress] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [orderError, setOrderError] = useState(null);

  // Stable by reference unless user/addresses actually change - AddressForm
  // re-seeds the form whenever this object's reference changes (Task 11),
  // so an unmemoized object literal here would wipe the shopper's
  // in-progress edits on every unrelated CheckoutView re-render (selecting
  // a shipping option, say).
  const defaultValues = useMemo(() => {
    if (!user) return undefined;
    const latest = addresses?.[0];
    return {
      firstName: user.name ?? '',
      lastName: user.surname ?? '',
      email: user.email ?? '',
      phone: latest?.phone ?? '',
      addressLine: latest?.firstline ?? '',
      city: latest?.city ?? '',
      state: latest?.state ?? '',
      postalCode: latest?.zip ?? '',
    };
  }, [user, addresses]);

  if (cartItems.length === 0) {
    /* unchanged */
  }

  /* cartLines, handleAddressSubmit, handleSelectShipping, handlePaymentConfirmed unchanged */

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* heading unchanged */}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-8">
          <CheckoutStep number="1" title="Shipping Address">
            <AddressForm
              onSubmit={handleAddressSubmit}
              isSubmitting={shippingMutation.isPending}
              defaultValues={defaultValues}
              addresses={addresses ?? []}
            />
          </CheckoutStep>

          {/* steps 2/3 unchanged */}
        </div>

        <div>
          <OrderSummary lines={cartLines} shippingPrice={selectedOption?.priceTotal ?? null} />
        </div>
      </div>
    </main>
  );
}
```

Everything marked `/* unchanged */` is copied as-is from the current file — this step only adds the four new imports, the `user`/`addresses`/`defaultValues` declarations, and the two new props on `<AddressForm />`; no other line in the file changes.

- [ ] **Step 4: Run it, confirm every test (old and new) passes**

```bash
npx vitest run components/checkout/CheckoutView.test.jsx
```

- [ ] **Step 5: Manual check in the browser** (needs a real logged-in session with at least one saved address — use the account created/logged into during Task 6/8's manual checks, or `/account/addresses` to add one first)

```bash
cd /Users/enesdorukesen/WebstormProjects/ESK_FE_V2
(lsof -ti:3000 | xargs -r kill -9) 2>&1; sleep 1
nohup npm run dev > /tmp/esk_fe_v2_dev.log 2>&1 & disown
sleep 3
```
Log in, add an item to the cart, visit `/checkout` — confirm the form arrives pre-filled, and that a second saved address (add one via `/account/addresses` first if only one exists) produces a visible selector that correctly swaps the address fields on change without touching name/email.

- [ ] **Step 6: Full suite, production build, then commit**

```bash
npx vitest run
npm run build
git add components/checkout/CheckoutView.js components/checkout/CheckoutView.test.jsx
git commit -m "Checkout: prefill shipping address from the logged-in user's saved addresses"
```

---

## Final step (after all 12 tasks)

Run the full ESK_API (`npm test`) and ESK_FE_V2 (`npx vitest run` + `npm run build`) suites one more time each, back to back, to catch any cross-task interaction the per-task runs missed. Report to the user; do not push either repo without a separate explicit instruction (matching this session's standing practice).
