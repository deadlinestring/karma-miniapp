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
- `Order = 2`
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

Live-test the protected Orders admin panel: open the panel, verify both existing orders, and change one test order fulfillment status only after explicit approval. Payment-provider integration is still not connected.

Updated checkpoint: the prepared Order flow foundation commit `00a863a` is ready to be published, and migration `00000000000003_prepare_order_flow` has already been applied successfully to production Supabase. Current production counts remain `Order = 0` and `Payment = 0`; no real order creation has happened.

Next concrete implementation step: build `POST /api/orders/quote` with server-side price, delivery, discount and custom drawing validation. Do not connect YooKassa or another payment provider until provider access and integration responsibility are explicitly agreed.

Quote checkpoint: `POST /api/orders/quote` is published as a read-only endpoint. Checkout uses server quote for delivery, discount, custom drawing surcharge and total, but `POST /api/orders` is still the next step. Production orders remain `0`.

Urgent quote fix checkpoint: the discount business rule was clarified after quote publication. The quote discount is being updated so `STANDARD`, `PREMIUM` and `WALL_PANEL` all count as physical products, with one `30%` discount applied to the cheapest unit when the order contains at least two physical items.

Order creation checkpoint: `POST /api/orders` is being prepared without online payment. The endpoint requires Telegram Mini App initData, recalculates server quote before writing, and creates `TelegramUser`, `Order`, `OrderItem` and `DeliveryAddress` only. `Payment` and Telegram admin notifications remain disabled until separate stages. Production `Order` and `Payment` counts must remain `0` before the live test.

Live order checkpoint: first production order without online payment was created successfully as `KRM-20260601-128352`. Current expected counts after that user action: `Order = 1`, `Payment = 0`. The next required stage is Telegram admin notifications and/or an admin orders view.

UX hotfix checkpoint: success/error/status messages in checkout and admin panels need automatic scroll into view so users can see action results inside Telegram Mini App. Future admin discount management, including global discounts and product-specific discounts, remains a separate design stage.

Telegram notification checkpoint: server-side admin notifications for new orders are prepared locally. Notifications are sent after the successful order transaction, use `NotificationLog` for deduplication, and must not roll back checkout if Telegram delivery fails. Live notification sending has not been tested yet.

Live Telegram notification checkpoint: order `KRM-20260601-805754` was created through production checkout, checkout scrolled to the result, and a Telegram admin notification was received. Current expected counts after that user action: `Order = 2`, `Payment = 0`. The next recommended step is an admin orders panel / status management before online payment planning.

Admin orders checkpoint: the protected Orders admin panel is prepared locally. It lists orders, opens order details, shows notification summary, and allows changing only fulfillment status. `paymentStatus` stays read-only. No production status update has been performed yet.

## New order flow requirements

- Server must re-check prices from `PriceListItem`; cart localStorage is only a UX snapshot.
- Delivery by Russian Post: `450 ₽` for orders with only `STANDARD` / `PREMIUM`, `550 ₽` when at least one `WALL_PANEL` exists.
- Second item discount: `30%` once, applied to the cheapest eligible `STANDARD` / `PREMIUM` / `WALL_PANEL` unit; delivery and custom drawing surcharge are excluded.
- Custom drawing styles: style 1 `+690 ₽`, style 2 `+790 ₽`, style 3 `+990 ₽`.
- Custom image orders need admin review before payment: `PENDING_REVIEW`, `APPROVED`, `REJECTED`.
- Proposed private custom upload bucket env for a later stage: `SUPABASE_CUSTOM_ORDER_BUCKET`.

## Known payment risk

ЮKassa access may be difficult because the user may not own the account. The payment provider should be agreed before payment integration starts.
## Live admin order status checkpoint

- Orders admin panel is live in production after deployment commit `96b5ed0`.
- `Order = 2`
- `Payment = 0`
- `NotificationLog = 1`
- `KRM-20260601-805754 = IN_WORK / PENDING`
- `KRM-20260601-128352 = NEW / PENDING`
- The live status update changed only fulfillment status for `KRM-20260601-805754`.
- Payment status remains read-only in the admin UI.
- No `Payment` rows were created.
- Current status update flow does not send Telegram notifications to customer or admin.
- Recommended next step: choose the next Order flow layer: payment provider planning, order status notifications, or customer order page.
## Customer order pages checkpoint

- Customer order pages are prepared locally.
- `/orders` shows the current Telegram user's own orders.
- `/orders/<publicNumber>` shows read-only order detail for the current Telegram user.
- Other users' order numbers are returned as safe not found.
- Checkout success includes an `Открыть заказ` link to the created order.
- No new orders, payments, status updates or Telegram messages are created by this stage.
- Next live test: customer sees own orders and opens order detail inside Telegram Mini App.

## Customer support bot checkpoint

- Customer order pages were live-checked in Telegram Mini App.
- Support bot was created separately and connected to CRM BlueSales.
- Public support bot username: `karmashopsupportbot`.
- Customer order detail is being updated so `Связаться` opens the support bot with order context in the `start` parameter.
- Expected example: `https://t.me/karmashopsupportbot?start=order_KRM_20260601_805754`.
- Next live test: click `Связаться` from an order detail page and verify BlueSales receives the conversation/order context.

## FAQ / How to order checkpoint

- FAQ / `Как заказать` is prepared before deeper custom design/payment work.
- Public page: `/faq`.
- Admin section: `FAQ / Как заказать`.
- FAQ texts should be stored in DB as editable `FaqSection` rows and rendered safely as plain text.
- Migration `00000000000004_add_faq_sections` was applied successfully to production Supabase.
- Current FAQ DB state after migration: `FaqSection = 0`.
- Until FAQ DB rows exist, public UI should show fallback content about product types, custom drawing styles, image requirements, delivery and support bot.
- Admin FAQ should show default sections as editable draft and create/update them through protected PATCH/upsert without seed/bootstrap.
- Support communication remains through `@karmashopsupportbot` connected to BlueSales.
- Next live test: production `/faq` fallback plus admin FAQ save/edit through Telegram Mini App.
- Live FAQ check confirmed public/admin flow, but UX/content needed refinement.
- FAQ chrome live-check passed after Vercel Ready.
- Current `FaqSection = 11`.
- FAQ hero/intro and bottom CTA are editable through reserved slugs: `faq-hero-eyebrow`, `faq-hero`, `faq-contact-cta`.
- FAQ cards now have clearer open/hover/focus feedback so sections do not visually blend together.
- No new migration was required for this refinement.
- Recommended next major stage: custom design flow.

## Custom design flow checkpoint

- First working custom design layer is prepared locally.
- Existing schema is enough: `OrderItem` already has custom drawing, private image path and review status fields.
- New customer endpoint: `POST /api/orders/custom-upload`.
- Upload requires Telegram Mini App initData and stores JPEG/PNG/WEBP images up to 8 MB in the private custom order bucket configured by `SUPABASE_CUSTOM_ORDER_BUCKET`.
- Product modal requires style + uploaded image before adding a `CUSTOM` product to cart.
- Quote/order payload now carries `customDrawingStyle`, `customDesignKey`, `customImageStoragePath` and file name snapshot.
- Order creation saves custom items as `PENDING_REVIEW` and does not create `Payment`.
- No migration was needed or applied for this stage.
- Production data must remain unchanged until a separate live custom order test.

## Live custom design checkout checkpoint

- Custom design flow was live-checked in production after commit `609271d`.
- Product `Свой дизайн` opens, style №3 can be selected, and image upload succeeds through the protected custom upload flow.
- Cart accepts the uploaded custom item; checkout shows the custom style surcharge `+990 ₽`.
- No custom order was submitted in this checkpoint.
- Current read-only baseline remains `Order = 2`, `Payment = 0`.
- Private custom upload bucket is configured and has a custom upload object; the full private path is intentionally not recorded.
- Next recommended step: create one controlled custom order and verify `PENDING_REVIEW`.

## Live custom design order checkpoint

- Controlled custom order `KRM-20260602-8E3EBA` was created in production without online payment.
- Current read-only baseline: `Order = 3`, `Payment = 0`.
- The order saved style №3, `customDrawingKopecks = 99000`, custom item surcharge `99000`, `customDesignKey`, private image storage path, and `PENDING_REVIEW`.
- Delivery address and Telegram user relation exist; an admin notification log exists for the order.
- The private storage path was confirmed but not printed or recorded.
- Next recommended step: admin review UI for custom images or payment planning.

## Admin custom image review checkpoint

- Admin custom image review UI is prepared locally for order detail.
- Signed image preview is served by protected admin endpoint with a short-lived URL; raw private storage path is not returned.
- Review action endpoint supports approving or rejecting a pending custom image.
- Reject reason is stored in `OrderItem.customImageReviewComment`.
- Review updates only custom image review fields and does not create `Payment`.
- Production data remains unchanged until a separate live review test.

## Live admin custom image review checkpoint

- Admin custom image review was live-tested in production after commit `84977b0`.
- Order `KRM-20260602-8E3EBA` custom image moved `PENDING_REVIEW -> APPROVED`.
- Private image opened through signed URL; raw private storage path was not displayed.
- Current read-only baseline: `Order = 3`, `Payment = 0`.
- Order totals, item price snapshots, fulfillment status and payment status stayed unchanged.
- Payment provider integration remains future work.

## YooKassa payment foundation checkpoint

- YooKassa payment planning/foundation is prepared locally.
- Schema is sufficient for the foundation; no migration is needed.
- `POST /api/orders/[publicNumber]/payment/prepare` validates Telegram customer ownership and payment eligibility, but does not call YooKassa and does not create `Payment`.
- Customer order page shows disabled payment guidance:
  - regular pending order: manager/payment soon message;
  - custom `PENDING_REVIEW`: wait for admin review;
  - custom `APPROVED`: payment will be connected next;
  - custom `REJECTED`: contact manager.
- Server-only env names are documented in `.env.example`; `YOOKASSA_SECRET_KEY` is not available/used in this stage.
- Production data must remain unchanged until a separately approved live payment stage.

## YooKassa redirect payment creation checkpoint

- Controlled YooKassa redirect payment creation is prepared locally.
- Existing `Payment` schema is sufficient; no migration is needed.
- `POST /api/orders/[publicNumber]/payment/prepare` now performs Telegram ownership validation, payment eligibility checks, YooKassa config validation, pending Payment reuse, provider redirect creation and local `Payment` insert after successful provider response.
- Customer order detail can show an active `Перейти к оплате` button only when the server marks the order eligible and provider env is configured.
- Real YooKassa creation remains disabled unless `YOOKASSA_PAYMENTS_ENABLED=true`; existing shop id/secret env values alone do not activate payment creation.
- Custom order `KRM-20260602-8E3EBA` is eligible because its custom image is `APPROVED`; `PENDING_REVIEW` and `REJECTED` custom orders remain blocked.
- `Order.paymentStatus` is not marked `PAID` by redirect creation; webhook/provider status confirmation remains the next required payment layer.
- YooKassa calls are covered by mocks in development checks. No live payment test, production `Payment` creation, webhook connection, migration, seed or bootstrap was performed in this stage.

## YooKassa receipt fix checkpoint

- Live payment prepare diagnostics showed YooKassa provider error `invalid_request` for missing/illegal `receipt`.
- Receipt builder is prepared locally and adds receipt to the payment payload without changing schema.
- Receipt is generated from immutable order snapshots: physical items, custom drawing surcharge, delivery and allocated discount.
- Receipt customer requires order phone or email; missing contact blocks payment before YooKassa is called.
- `.env.example` now includes `YOOKASSA_VAT_CODE="1"`; the shop VAT setting must be confirmed before the next live retry.
- `YOOKASSA_PAYMENTS_ENABLED` should remain false until the next controlled payment test. No live YooKassa retry, `Payment` creation, production data change, migration, seed or bootstrap is part of this checkpoint.

## Live YooKassa redirect checkpoint

- After receipt fix deployment, controlled production payment prepare succeeded on order `KRM-20260604-59DE22`.
- Current read-only checkpoint: `Order = 4`, `Payment = 1`.
- Order `KRM-20260604-59DE22` has exactly one YooKassa `Payment` row, amount matches order total, and confirmation URL exists.
- `Order.paymentStatus = PENDING`; webhook/status finalization is still not implemented and the order is not marked paid by redirect creation.
- Old order `KRM-20260602-8E3EBA` has a known idempotence-key artifact from the old pre-receipt payload.
- Recommended next step: implement YooKassa webhook/status finalization or idempotence key version cleanup. Keep `YOOKASSA_PAYMENTS_ENABLED=false` outside explicit controlled payment tests.

## YooKassa webhook foundation checkpoint

- YooKassa webhook foundation is prepared locally without provider API calls or cabinet registration.
- New endpoint: `POST /api/yookassa/webhook`.
- Webhook requires `YOOKASSA_WEBHOOK_SECRET`; suggested cabinet URL pattern is `/api/yookassa/webhook?token=<secret>`.
- Supported events: `payment.succeeded` and `payment.canceled`.
- `payment.succeeded` updates existing `Payment` and sets `Order.paymentStatus = PAID`.
- `payment.canceled` updates existing `Payment` to cancelled and leaves the order not paid.
- The handler validates existing provider payment id, amount and metadata order public number, never creates a `Payment`, and logs only masked provider ids.
- No live webhook test, YooKassa API call, production data change, migration, seed or bootstrap is part of this checkpoint.

## YooKassa webhook registration readiness checkpoint

- `YOOKASSA_WEBHOOK_SECRET` has been added to Vercel Production env.
- Production was redeployed after the env change.
- The webhook URL was registered manually in the YooKassa cabinet using the secret token; docs keep only the `<secret>` placeholder.
- Registered events: `payment.succeeded`, `payment.canceled`.
- Live webhook event has not been tested yet.
- Current read-only baseline remains `Order = 4`, `Payment = 1`; order `KRM-20260604-59DE22` and its YooKassa payment are still `PENDING`.
- Next safe step: controlled webhook live test by completing or canceling one test payment, then read-only verify status sync.

## Live YooKassa payment and webhook checkpoint

- Controlled live payment was completed on order `KRM-20260604-28B88F`.
- Current read-only baseline: `Order = 5`, `Payment = 2`.
- Order `KRM-20260604-28B88F` has exactly one YooKassa `Payment` row.
- Payment amount is `46000` kopecks and matches the order total.
- Webhook sync worked: `Payment.status = PAID`, `Order.paymentStatus = PAID`.
- `fulfillmentStatus` remains `NEW`; fulfillment is not changed by payment webhook.
- Manual refund was performed in the YooKassa cabinet after the successful payment.
- Local refund handling is not implemented yet, so refund did not change local `Payment`/`Order` status.
- Next safe step: design `refund.succeeded` handling and local refunded state semantics.

## UI/content audit checkpoint

- UI/content audit is in progress without production data changes.
- Current editable content models are StoreSettings and FaqSection; they cover hero/contact/delivery basics and FAQ/CTA content.
- Hardcoded business copy still found in checkout guidance, payment guidance, custom design explanations, support CTA wording and empty/help states.
- Technical/system copy remains code-owned: labels, validation errors, status enum labels and provider/auth diagnostics.
- No migration is needed for the small UI fix in this checkpoint.
- Customer order detail and admin order detail now make paid orders visually clear.
- Payment runtime, webhook runtime, checkout, custom design and admin status updates remain stable and untouched.

## ContentBlock foundation checkpoint

- ContentBlock foundation is prepared locally.
- Additive migration `00000000000005_add_content_blocks` has been applied successfully to production Supabase.
- Production data remains otherwise unchanged; current read-only baseline after migration is `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 0`.
- New protected admin section: `Блоки интерфейса`.
- Default draft blocks are available without seed/bootstrap: checkout delivery help, checkout custom review help, payment disabled/pending guidance, custom design help, support CTA and orders empty state.
- Default blocks were not manually created or edited in production; they should appear as editable drafts after deployment until admin saves/upserts them.
- Public integration is intentionally minimal and uses active blocks only, with safe fallback/default text when rows are missing or DB is unavailable.
- Content renders as plain text; runtime payment, webhook, pricing, checkout submit and status mutation logic remain untouched.
- Next live test: open admin `Блоки интерфейса`, save defaults, verify public fallback/active/inactive behavior.

## Home ContentBlock integration checkpoint

- ContentBlock live-test passed: admin `Блоки интерфейса` opened, default drafts appeared, save/upsert worked, and inactive rows hid connected public blocks.
- Current read-only baseline before this code change: `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 7`.
- Home/storefront hero copy is being connected to existing ContentBlock without a new migration.
- New default draft slugs: `home-hero-eyebrow`, `home-hero-title`, `home-hero-subtitle`, `home-hero-primary-cta`, `home-hero-secondary-cta`.
- The neon eyebrow `НОЧНИКИ ПО ТВОЕЙ ИДЕЕ` is now admin-managed and hideable through `isActive`.
- StoreSettings remains fallback for hero title/subtitle; CTA actions remain code-owned.
- Payment, webhook, checkout, pricing, order status and production data remain untouched in this stage.
- Full visual redesign remains a separate future stage.

## Live Home ContentBlock checkpoint

- Home hero ContentBlock integration was live-checked in production after commit `6190132`.
- Admin `Блоки интерфейса` works for home hero blocks.
- `home-hero-eyebrow` controls the blue hero eyebrow on the home page.
- Editing the eyebrow through ContentBlock works.
- `isActive` hides the eyebrow on the public home page.
- Hero title/subtitle and CTA labels are available through ContentBlock defaults/overrides.
- CTA actions remain unchanged: `/catalog` navigation and custom design modal behavior are code-owned.
- Current read-only baseline: `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- Production data was not changed by this docs checkpoint beyond the already performed user admin edits.
- Full visual redesign remains a separate future stage.

## ContentBlock cleanup checkpoint

- ContentBlock cleanup is prepared locally with no migration.
- Current read-only baseline before this code change: `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- New connected slugs: `catalog-intro-help`, `catalog-empty-state`, `cart-empty-state`, `orders-intro-help`, `custom-product-features-help`, `custom-upload-requirements-help`.
- Existing `orders-empty-state` is now connected on `/orders`.
- Connected UI surfaces: catalog intro/empty state, cart empty state, customer orders intro/empty state, product modal feature bullets and custom upload requirements.
- Missing rows fall back to code defaults; inactive saved rows hide the connected public block.
- System copy remains in code: form labels, validation errors, enum/status labels, endpoint errors and provider/webhook diagnostics.
- Payment, webhook, pricing, checkout submit, order creation and status mutation logic remain untouched.
- Production data remains unchanged during this development stage.
- Full visual redesign remains a separate future stage.

## Live ContentBlock cleanup checkpoint

- ContentBlock cleanup was live-checked in production after commit `f750b3b`.
- New cleanup blocks appeared in admin `Блоки интерфейса`.
- Editing works for catalog/cart/orders/custom help blocks.
- `isActive` hides connected public blocks.
- Checked slugs: `catalog-intro-help`, `catalog-empty-state`, `cart-empty-state`, `orders-intro-help`, `custom-product-features-help`, `custom-upload-requirements-help`.
- Current read-only baseline: `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- Production data was not changed by this docs checkpoint beyond already performed user admin checks.
- Payment, order and webhook runtime logic remains unchanged.
- Next recommended stage: design system / visual redesign foundation.

## Design system foundation checkpoint

- Design-system foundation is being prepared without schema changes or production data changes.
- UI audit found repeated patterns across the storefront: gradient CTA buttons, glass surfaces/cards, status pills, section headers, empty states and help/info blocks.
- New lightweight shared UI primitives are introduced for staged redesign work: button class helpers, surface panels, status badges, empty states and section headings.
- Initial integration is deliberately narrow: catalog and cart empty states use the shared empty-state pattern, and the customer orders list uses the shared status badge.
- Full visual redesign remains a future staged effort; payment, webhook, pricing, checkout submit, order creation and status mutation logic remain untouched.

## Live design system foundation smoke-check

- Design system foundation was published in commit `5d23823` and Vercel deployment reached Ready.
- Production smoke-check passed for `/catalog`, `/cart` and `/orders`.
- Shared `EmptyState` integration for catalog/cart and `StatusBadge` integration for customer orders did not break visible UX.
- Current read-only baseline remains `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- Payment, order and webhook runtime logic was not changed by this foundation.
- Next visual direction checkpoint: KARMA Neon Mask / storefront redesign foundation.

## KARMA Neon Mask visual direction checkpoint

- KARMA Neon Mask direction is being prepared as a lightweight visual foundation, not a full redesign.
- New style tokens cover deep violet background, radial violet/magenta glows, neon borders, glass mask surfaces, premium shadows, motion-reduced hover/tap classes and neon/gradient text helpers.
- `BrandMaskWatermark` now uses the real brand mask asset at `/brand/karma-mask.svg` instead of the temporary abstract placeholder.
- The mask remains decorative with `aria-hidden` and `pointer-events-none`; it is intended as a background watermark, not primary content.
- Minimal integration: home hero gets the Neon Mask background/watermark layer, and shared `EmptyState` can show a subtle mask watermark.
- ContentBlock hero copy, CTA behavior, catalog/product/checkout/payment/order/webhook runtime logic and production data remain untouched.
- Full storefront redesign remains the next staged visual work after this foundation is reviewed.

## Live real KARMA mask asset smoke-check

- Real KARMA mask asset deployment was smoke-checked in production after commit `2d4261b`.
- `public/brand/karma-mask.svg` is used by `BrandMaskWatermark`; the abstract placeholder is no longer used.
- Visual check passed on the home hero and connected empty states.
- The mask remains a decorative non-interactive watermark: `aria-hidden`, empty alt text, pointer-events disabled and not draggable.
- Current read-only baseline remains `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- Payment, order and webhook runtime logic remained untouched.
- Next staged visual step: storefront/home redesign using Neon Mask tokens and the real mask asset.

## Home hero Neon Mask redesign checkpoint

- Staged home/storefront hero redesign is prepared locally on top of the real KARMA mask asset and Neon Mask tokens.
- Hero composition now uses a darker violet/radial glow background, calmer image overlay, real mask watermark in the background, glass text surface, gradient headline and shared CTA button classes.
- Hero layering was adjusted after visual review: the background artwork is no longer blurred, dim/gradient overlays handle readability, the KARMA mask is lifted above the problematic glass blur composition, and text/CTA content remains the top interactive layer.
- Duplicate hero mask was removed: the hero now keeps one large real KARMA mask watermark shifted to the right.
- Uploaded StoreSettings logo is now passed into the shared public header on catalog, cart, checkout, orders, order detail and FAQ instead of appearing only on the home page. Existing fallback `K / KARMA` remains.
- ContentBlock contract is preserved: `home-hero-eyebrow`, `home-hero-title`, `home-hero-subtitle`, `home-hero-primary-cta`, `home-hero-secondary-cta`.
- CTA actions remain unchanged: primary CTA opens `/catalog`, secondary CTA opens the existing custom product modal.
- Checkout, cart, orders, payment, webhook, custom upload/review and production data remain untouched.
- Next staged redesign target after review: catalog/product cards.

## Live visual fixes smoke-check

- Visual fixes commit `7580fed` reached Vercel Ready and was smoke-checked in production on Telegram/mobile.
- Home hero now shows one large real KARMA mask watermark; the duplicate inner decorative mask layer is removed.
- Mask placement is visually acceptable and does not block text or CTA interaction.
- Uploaded StoreSettings logo appears consistently on home, catalog, cart, checkout, orders, order detail and FAQ.
- CTA actions remain unchanged.
- Current read-only baseline remains `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- Payment, order and webhook runtime logic remained untouched.
- Next staged redesign target: catalog/product cards.

## Catalog/product cards Neon Mask redesign checkpoint

- Staged catalog/product card redesign is prepared locally without migration or production data changes.
- Catalog intro remains ContentBlock-driven through `catalog-intro-help`; catalog empty state remains ContentBlock-driven through `catalog-empty-state`.
- Catalog header now uses a glass/neon mask surface with restrained violet/cyan glow.
- Category filters keep the same state/filter behavior and receive neon pill styling.
- Product cards now use image-first glass/neon surfaces, readable badges, price panels, glow borders and hover/tap micro-interactions.
- Product modal opening, product visibility rules, pricing, variants, cart, checkout, payment, webhook and order runtime remain untouched.
- Current read-only baseline remains `Order = 5`, `Payment = 2`, `Product = 14`, `StoreSettings = 1`, `FaqSection = 11`, `ContentBlock = 12`.
- Next staged redesign target after review: product modal or checkout/order detail.
