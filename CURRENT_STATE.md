# CURRENT STATE

Last updated: 2026-06-01

## Production

- Production URL: `https://karma-miniapp.vercel.app`
- Telegram bot: `@karma_nightlight_store_bot`
- Current `origin/main`: `f7c7602`

## Live features

- Storefront reads active catalog data server-side from Supabase via Prisma.
- Telegram admin auth works in production.
- Admin sections are live: `Главная страница`, `Прайс-листы`, `Товары`, `Категории`, `Импорт товаров`.
- StoreSettings, hero/logo upload, product images, price list management, categories, product CRUD and CSV import are protected by server-side admin endpoints.
- Storefront uses `PriceList main` / `PriceListItem` as the source of working prices.

## Production catalog state

- `Category = 4`
- `Subcategory = 13`
- `Product = 13`
- Active products: `11`
- Hidden products: `2`
- `ProductImage = 33`
- `PriceList main` is active with 10 active items.
- `Order = 0`
- `Payment = 0`
- `StoreSettings main` exists.

## Imported hidden products

- `Ророноа Зоро`
  - `externalId = anime_onepiece_zoro_001`
  - subcategory: `One Piece`
  - `priceListId = main`
  - `isActive = false`
  - `isFeatured = false`
  - images: `0`
  - cover: `0`
  - not shown in public storefront
- `Донкихот Росинант`
  - `externalId = anime_onepiece_rosinante_001`
  - subcategory: `One Piece`
  - `priceListId = main`
  - `isActive = false`
  - `isFeatured = false`
  - images: `0`
  - cover: `0`
  - not shown in public storefront

## Public storefront check

- `/` opens.
- `/catalog` opens.
- `Монки Д. Луффи` is active, has one cover image, uses `PriceList main`, and is shown publicly.
- `Ророноа Зоро` and `Донкихот Росинант` are hidden and are not shown publicly.

## Do not repeat without read-only verification

- Do not run CSV import/apply again without first checking current `externalId` state.
- Do not run migrations, seed or bootstrap unless the exact stage explicitly requires it.
- Do not create, edit, publish or upload product images as part of a documentation checkpoint.
- Do not patch price list or StoreSettings during read-only recovery/checkpoint work.

## Recommended next step

Build server-side quote/order creation, delivery address, Telegram notifications, order statuses and test payment. The Order flow migration has already been applied.

Updated checkpoint: the prepared Order flow foundation commit `00a863a` is ready to be published, and migration `00000000000003_prepare_order_flow` has already been applied successfully to production Supabase. Current production counts remain `Order = 0` and `Payment = 0`; no real order creation has happened.

Next concrete implementation step: build `POST /api/orders/quote` with server-side price, delivery, discount and custom drawing validation. Do not connect YooKassa or another payment provider until provider access and integration responsibility are explicitly agreed.

## New order flow requirements

- Server must re-check prices from `PriceListItem`; cart localStorage is only a UX snapshot.
- Delivery by Russian Post: `450 ₽` for orders with only `STANDARD` / `PREMIUM`, `550 ₽` when at least one `WALL_PANEL` exists.
- Second nightlight discount: `30%` once, applied to the cheapest eligible `STANDARD` / `PREMIUM` unit; `WALL_PANEL`, delivery and custom drawing surcharge are excluded.
- Custom drawing styles: style 1 `+690 ₽`, style 2 `+790 ₽`, style 3 `+990 ₽`.
- Custom image orders need admin review before payment: `PENDING_REVIEW`, `APPROVED`, `REJECTED`.
- Proposed private custom upload bucket env for a later stage: `SUPABASE_CUSTOM_ORDER_BUCKET`.

## Known payment risk

ЮKassa access may be difficult because the user may not own the account. The payment provider should be agreed before payment integration starts.
