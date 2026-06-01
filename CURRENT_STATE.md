# CURRENT STATE

Last updated: 2026-06-02

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
- `Order = 1`
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

Deploy and live-test Telegram admin notifications for new orders. The first live order without online payment has already been created successfully, and payment provider integration is still not connected.

Updated checkpoint: the prepared Order flow foundation commit `00a863a` is ready to be published, and migration `00000000000003_prepare_order_flow` has already been applied successfully to production Supabase. Current production counts remain `Order = 0` and `Payment = 0`; no real order creation has happened.

Next concrete implementation step: build `POST /api/orders/quote` with server-side price, delivery, discount and custom drawing validation. Do not connect YooKassa or another payment provider until provider access and integration responsibility are explicitly agreed.

Quote checkpoint: `POST /api/orders/quote` is published as a read-only endpoint. Checkout uses server quote for delivery, discount, custom drawing surcharge and total, but `POST /api/orders` is still the next step. Production orders remain `0`.

Urgent quote fix checkpoint: the discount business rule was clarified after quote publication. The quote discount is being updated so `STANDARD`, `PREMIUM` and `WALL_PANEL` all count as physical products, with one `30%` discount applied to the cheapest unit when the order contains at least two physical items.

Order creation checkpoint: `POST /api/orders` is being prepared without online payment. The endpoint requires Telegram Mini App initData, recalculates server quote before writing, and creates `TelegramUser`, `Order`, `OrderItem` and `DeliveryAddress` only. `Payment` and Telegram admin notifications remain disabled until separate stages. Production `Order` and `Payment` counts must remain `0` before the live test.

Live order checkpoint: first production order without online payment was created successfully as `KRM-20260601-128352`. Current expected counts after that user action: `Order = 1`, `Payment = 0`. The next required stage is Telegram admin notifications and/or an admin orders view.

UX hotfix checkpoint: success/error/status messages in checkout and admin panels need automatic scroll into view so users can see action results inside Telegram Mini App. Future admin discount management, including global discounts and product-specific discounts, remains a separate design stage.

Telegram notification checkpoint: server-side admin notifications for new orders are prepared locally. Notifications are sent after the successful order transaction, use `NotificationLog` for deduplication, and must not roll back checkout if Telegram delivery fails. Live notification sending has not been tested yet.

## New order flow requirements

- Server must re-check prices from `PriceListItem`; cart localStorage is only a UX snapshot.
- Delivery by Russian Post: `450 ₽` for orders with only `STANDARD` / `PREMIUM`, `550 ₽` when at least one `WALL_PANEL` exists.
- Second item discount: `30%` once, applied to the cheapest eligible `STANDARD` / `PREMIUM` / `WALL_PANEL` unit; delivery and custom drawing surcharge are excluded.
- Custom drawing styles: style 1 `+690 ₽`, style 2 `+790 ₽`, style 3 `+990 ₽`.
- Custom image orders need admin review before payment: `PENDING_REVIEW`, `APPROVED`, `REJECTED`.
- Proposed private custom upload bucket env for a later stage: `SUPABASE_CUSTOM_ORDER_BUCKET`.

## Known payment risk

ЮKassa access may be difficult because the user may not own the account. The payment provider should be agreed before payment integration starts.
