# Решения проекта

## Зафиксированные решения

- Финальный стек еще должен быть предложен и согласован.
- Оплату подключаем только после готовности каталога, корзины, заказов и базы данных.
- Сначала делаем MVP на тестовых товарах.
- Реальные платежи и Telegram-интеграция пока не подключены.

## Предварительное направление стека

Предварительно ориентируемся на Next.js, React, TypeScript, Tailwind CSS, PostgreSQL и Prisma, потому что приложению понадобятся серверные API для заказов, проверки Telegram initData, webhook оплаты, админки и отправки Telegram-уведомлений.

## Стек frontend-MVP

Для первой рабочей версии frontend-MVP выбран стек:

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Zustand persist для корзины.
- Framer Motion.
- lucide-react.

## Следующий backend-этап

Следующий backend-этап планируется на PostgreSQL, Prisma и server API Next.js.

PostgreSQL, Prisma и Supabase выбраны как база и storage-основа проекта.

Предварительное решение: использовать Supabase как hosted PostgreSQL и Storage для изображений товаров.

Денежные значения в базе хранятся целыми числами в копейках, чтобы избежать ошибок округления при будущей оплате.

Runtime приложения использует Supabase Transaction pooler на порту `6543` с параметром `?pgbouncer=true`, потому что Transaction mode не поддерживает prepared statements.

Prisma migrations и другие CLI-операции используют Supabase Session pooler на порту `5432` через `DIRECT_DATABASE_URL`.

При Prisma 7 + `@prisma/adapter-pg` размер runtime-пула задается через `pg Pool max: 1`, а не через URL-параметр `connection_limit`.

На следующем этапе нужно подготовить серверную обработку заказов, модели данных, хранение товаров и заказов, а также основу для будущей проверки Telegram initData, Telegram-уведомлений и webhook оплаты.

Следующий этап проекта — проектирование базы данных и подключение CRUD для каталога и админки.

Админские CRUD-операции нельзя публиковать до появления проверки прав администратора.

## Архитектура каталога

- Выбран вариант A для связи товара с категориями: `Product` хранит только `subcategoryId`.
- Категория товара определяется через `Product -> Subcategory -> Category`.
- Такой вариант проще и надежнее для будущей админки, потому что исключает ситуацию, где товар связан с одной категорией, а его подкатегория принадлежит другой категории.
- Для фильтрации по категории каталог будет использовать связь через подкатегории.

## StoreSettings singleton

- Настройки магазина являются singleton-записью с фиксированным `id = "main"`.
- Seed должен создавать или обновлять только эту запись.
- Будущая админка должна обновлять `StoreSettings.main`, а не создавать дополнительные наборы настроек.

## Ограничение обложки товара

- У одного товара может быть только одно изображение с `isCover = true`.
- Prisma schema не выражает PostgreSQL partial unique index напрямую.
- Для будущей миграции подготовлен SQL `prisma/sql/product-image-single-cover-index.sql`.
- Перед применением первой миграции этот SQL нужно добавить в миграцию, чтобы база гарантировала единственную обложку на уровне PostgreSQL.
- Первая Prisma migration должна вручную включать custom SQL partial unique index из этого файла до применения миграции к Supabase.

## Первая migration

- Initial migration SQL генерируется через `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`, а не через `prisma migrate dev`.
- Причина: перед изменением реального Supabase нужен безопасный проверяемый SQL-файл.
- Migration включает ручной PostgreSQL partial unique index для единственной обложки товара.
- Migration включает Row Level Security для таблиц в `public` без публичных policies.
- На этапе подготовки migration не применяется к базе, seed не запускается.

## Изображения товаров

- На текущем frontend-MVP изображения товаров являются локальными mock-ассетами.
- Фотографии пока mock, а реальные изображения будут загружаться через админку позже.
- Интерфейс проектируется так, чтобы позже заменить mock-ассеты настоящими фотографиями и галереями, загружаемыми через админку.
- В структуре товара уже используются поля `coverImage`, `galleryImages`, `isFeatured`, `category` и `subcategory`.
- Публичные каталожные изображения позже будут лежать в public bucket `catalog-images`.
- Клиентские изображения для кастомных заказов позже должны храниться отдельно в приватном bucket.
- Будущий приватный bucket для клиентских загрузок называется `custom-order-uploads`.
- Загрузка и удаление публичных изображений из админки должны выполняться только через защищенный серверный код администратора.
- `SUPABASE_SECRET_KEY` нельзя передавать во frontend.

## Текущее состояние Supabase и seed

- Initial migration успешно применена к Supabase.
- Seed еще не выполнен.
- Seed не имеет права удалять изображения, товары, варианты, категории, настройки или другие данные.
- Mock-изображения seed создаются и обновляются только через детерминированные `seed-image-*` ID.
- Реальные изображения, загруженные будущей админкой, seed не затрагивает.
- Seed использует только `DIRECT_DATABASE_URL`; fallback на runtime `DATABASE_URL` запрещен.
## Supabase bootstrap и доступ к данным

- Каталог и настройки магазина уже существуют в Supabase.
- Initial migration успешно применена, RLS включен на всех 12 таблицах, partial unique index единственной обложки создан.
- Тестовый каталог наполнен безопасным seed: `StoreSettings = 1`, `Category = 4`, `Subcategory = 8`, `Product = 10`, `ProductImage = 30`, `ProductVariant = 90`.
- Публичный пользовательский интерфейс должен читать каталог только через server-side Prisma/repository, а не напрямую через Supabase browser client.
- Таблицы в public schema остаются с включенным RLS и без публичных policies.
- Пользовательские данные заказов, адресов и платежей не должны читаться напрямую из frontend.
- Mock-изображения остаются временными до этапа админки и Supabase Storage.
- Frontend пока еще не переведен с mock-данных на базу.
## Storefront repository

- Storefront читает каталог только server-side через Prisma repository.
- Supabase browser client не используется для чтения database-таблиц.
- Silent fallback на mock-товары запрещен: при ошибке базы пользователь видит аккуратное состояние ошибки.
- Цены UI берутся из `ProductVariant`, а не из hardcoded frontend-значений.
- Корзина хранит snapshot выбранного database-варианта в localStorage до этапа реальных заказов.

## Telegram Mini App admin foundation

- Новый бот для Mini App: `@karma_nightlight_store_bot`.
- Официальный Telegram Web App bridge подключается через `https://telegram.org/js/telegram-web-app.js?62`.
- Доверенный доступ администратора определяется только server-side validation строки `Telegram.WebApp.initData`.
- `initDataUnsafe` не используется для авторизации и может применяться только для косметического поведения интерфейса.
- `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_IDS` и время жизни initData хранятся только в server-side environment.
- Telegram user id сравнивается как строка, чтобы не зависеть от 32-bit numeric assumptions.
- Admin API в будущем обязаны выполнять server-side проверку Telegram initData на каждой защищенной операции.
- Небезопасный browser/dev bypass запрещен: обычный браузер не получает фальшивый доступ администратора.
- Создание товаров, редактирование цен, загрузка изображений, удаление товаров и изменение настроек магазина нельзя публиковать без этой admin-проверки.

## Vercel deployment readiness

- Первый production deployment планируется на Vercel через private GitHub repository.
- Database-backed storefront должен показывать свежие изменения каталога и настроек без повторного deployment, поэтому `/` и `/catalog` остаются dynamic server-rendered routes.
- Production deployment не должен запускать migration или seed.
- `npm run build` выполняет только `prisma generate` и `next build`.
- Prisma migrations продолжают требовать `DIRECT_DATABASE_URL`; Vercel build/runtime может работать без `DIRECT_DATABASE_URL`, используя runtime `DATABASE_URL`.
- Обязательные production environment variables будут заданы вручную в Vercel dashboard.

## Live Telegram admin verification

- Production URL проекта: `https://karma-miniapp.vercel.app`.
- Telegram auth успешно проверена на реальном запуске через `@karma_nightlight_store_bot`.
- Текущая Telegram Menu Button временно ведет на `/admin` для разработки панели управления.
- Перед публичным запуском магазина Menu Button нужно будет перевести на `/`, а доступ администратора встроить в интерфейс безопасным способом.
- Storage uploads должны выполняться только через защищенные server-side admin endpoints после той же Telegram auth validation.
- CRUD, загрузки изображений, реальные заказы и оплата на этом этапе не подключены.

## Admin StoreSettings и Storage uploads

- Supabase Storage admin client использует только server-side переменные `SUPABASE_URL`, `SUPABASE_SECRET_KEY` и `SUPABASE_CATALOG_BUCKET`.
- Secret key никогда не попадает во frontend и не используется в client components.
- Каждое admin API действие повторно валидирует `Telegram.WebApp.initData` на сервере.
- Uploads проходят только через защищенные server-side admin endpoints.
- Размер одного изображения ограничен 4 MB из-за лимита request body Vercel Functions и multipart overhead.
- Проверяется не только заявленный MIME, но и фактическая сигнатура файла.
- Допустимые изображения для первой админки: JPG, PNG и WEBP до 4 MB.
- SVG, HTML и подмененные файлы запрещены для публичных загрузок.
- Новые файлы загружаются в `catalog-images` по UUID path: `store/logo/<uuid>` или `store/hero/<uuid>`.
- При ошибке Prisma после успешного upload новый файл удаляется из Storage как rollback.
- Старые изображения автоматически не удаляются на первом этапе, чтобы не потерять рабочий ассет.
- Более крупные загрузки в будущем потребуют отдельной архитектуры direct upload/signed upload и серверной валидации.
- Next.js image remote pattern разрешает только HTTPS-изображения из public path bucket `catalog-images` текущего Supabase проекта.

## Live StoreSettings admin verification

- Production-проверка подтвердила цепочку `Telegram admin auth -> protected API -> Prisma/Storage -> dynamic storefront`.
- Изменения StoreSettings отображаются на storefront без redeploy.
- Hero upload в public bucket `catalog-images` успешно проверен через production Mini App.
- Старые загруженные изображения пока автоматически не удаляются, поэтому стратегию замены и очистки ассетов нужно продумать до массовой работы с товарными фото.

## Admin product images

- Product images загружаются только через защищенные server-side admin endpoints после Telegram initData validation.
- Storage paths для новых фото товаров формируются сервером: `products/<productId>/<uuid>.<ext>`.
- Новая cover-картинка загружается без автоматического удаления старой; старая обложка становится обычным изображением товара.
- Назначение cover выполняется через Prisma transaction и дополнительно защищено PostgreSQL partial unique index одной обложки.
- Текущую cover-картинку удалять запрещено: сначала администратор должен выбрать другую главную фотографию.
- Mock-изображения можно удалить из записей `ProductImage` после замены, но их не нужно удалять из Supabase Storage.
- Все uploads используют существующую server-side file-validation по сигнатуре файла и лимит 4 MB.

## Price lists and catalog import direction

- Telegram-export фотографий сейчас не нужен: для ограниченного отобранного каталога фотографии можно добавлять вручную через уже реализованную админку.
- Для массового создания карточек позже рассматривается Excel/CSV import только метаданных товаров без фотографий.
- Реальные цены относятся к физическому варианту изделия и общему прайс-листу, а не дублируются вручную в каждом дизайне.
- Основной прайс называется `Основной прайс KARMA` и должен иметь стабильные `id = "main"` и `slug = "main"`.
- `ProductVariant` временно сохраняется как legacy/transitional model до безопасного переключения storefront на `PriceListItem`.
- Повторный seed не должен затрагивать реальные админские product images и не должен возвращать mock-cover поверх загруженной admin-cover.
- Новый товар в будущем по умолчанию должен получать `priceListId = "main"`.
- Для будущего Excel/CSV import понадобится стабильное поле вроде `externalId` или `sku`, но его добавление откладывается до этапа CRUD/import.

## Storefront price source

- Реальная матрица цен хранится в `PriceList main` и строках `PriceListItem`.
- Storefront и cart используют `PriceListItem` как единственный источник доступных вариантов, размеров и цены.
- Silent fallback на legacy `ProductVariant` запрещен: если у товара нет активного прайса или активных пунктов прайса, товар показывается как временно недоступный для заказа.
- Cart snapshot сохраняет `priceListItemId`, `itemType`, `sizeCm`, `unitPriceKopecks` и `note`.
- Для `WALL_PANEL / 55 см` пользователю показывается note `Двойная подсветка сверху и снизу`; это же значение сохраняется в cart snapshot.
- Legacy `ProductVariant` будет удален или архивирован только отдельным этапом после production-проверки storefront на `PriceListItem`.

## Production shared price list verification

- `PriceList main` является источником реальных цен магазина.
- `PriceListItem` является единственным источником рабочих вариантов для storefront и cart.
- Legacy `ProductVariant` временно остается в базе только как transitional/legacy data.
- Production-проверка подтвердила отображение note для панели 55 см и корректную работу корзины/checkout с новым прайсом.
- Следующая архитектура админки должна быть разделена на: Главная страница, Прайс-листы, Категории, Товары, Импорт товаров.
- Фотографии выбранного каталога загружаются вручную через уже реализованный интерфейс.
- Будущий Excel/CSV import нужен для метаданных товаров, а не для фотографий.

## Admin sections and price editing

- Админка разделяется на `Главная страница / Прайс-листы / Товары / Категории / Импорт товаров`.
- Редактирование прайса на первом этапе позволяет менять только цену и note существующих `PriceListItem`.
- Типы изделий, размеры, порядок, активность и состав матрицы через админку пока не редактируются.
- Изменение основного прайса распространяется на все товары, связанные с `PriceList main`.
- При настоящем создании заказа сервер обязан повторно проверить актуальную цену `PriceListItem`, не доверяя snapshot из localStorage.
- Клиентская цена из корзины может использоваться только как UX snapshot, но не как единственный источник суммы оплаты.

## Live price list management verification

- Защищенный PATCH `PriceList main` успешно проверен на production через Telegram Mini App.
- Изменение основного прайса применяется ко всем товарам, связанным с `main`.
- Live-тест был выполнен без намеренного изменения значений цен и note, но операция обновления базы действительно происходила.
- Storefront после PATCH сразу продолжил отображать актуальные цены без redeploy.
- Перед созданием реального заказа сервер обязан повторно проверять текущие цены, а не доверять cart snapshot.
- Следующим рабочим разделом админки становится управление категориями и подкатегориями.

## Category management architecture

- Категории и подкатегории управляются только через защищенные admin endpoints после server-side Telegram admin validation.
- Физическое удаление на первом этапе запрещено: для скрытия используется `isActive = false`.
- Slug создается сервером при создании категории или подкатегории и остается стабильным после переименования.
- Отключение категории или подкатегории с активными товарами требует явного подтверждения администратора.
- Публичная витрина не должна показывать скрытые категории, скрытые подкатегории и пустые категории без активных товаров.
- Будущий Excel/CSV import будет сопоставлять категории и подкатегории по стабильным slug/id, чтобы переименование отображаемого имени не ломало импорт.

## Live category management verification

- Категории и подкатегории управляются через защищенную Telegram-админку.
- Production live-тест подтвердил создание новых пустых подкатегорий через protected category API.
- Пустая подкатегория остается видна администратору, но не появляется в публичном каталоге до добавления активного товара.
- Live-тест намеренно изменил production-данные добавлением пустых подкатегорий; товары, прайс, изображения, StoreSettings, заказы и оплаты не менялись.
- Физическое удаление категорий и подкатегорий по-прежнему запрещено, используется `isActive`.
- Следующий рабочий блок — создание и редактирование карточек товаров с выбором подкатегории и основного прайса.

## Product card CRUD architecture

- Новый товар создается скрытым: `isActive = false`, `isFeatured = false`, `priceListId = "main"`.
- Публикация товара разрешена только если есть ровно одна главная обложка, активная категория, активная подкатегория и активный прайс с пунктами.
- Featured-статус доступен только активным товарам; при скрытии товара сервер автоматически снимает `isFeatured`.
- Физическое удаление товара на первом этапе не реализуется: товар можно скрыть из магазина.
- Slug товара генерируется server-side при создании и не меняется после переименования.
- Фотографии карточки редактируются через уже существующий protected image flow.
- Обязательное поле `productType` использует существующий enum `REGULAR | CUSTOM`; по умолчанию новая обычная карточка получает `REGULAR`.
- Будущий Excel/CSV import должен создавать товары тем же безопасным hidden-by-default способом, автоматически назначать `PriceList main`, а фотографии добавляются отдельно через админку.

## Live product card CRUD verification

- Production live-тест подтвердил безопасный lifecycle товара: создание скрытым -> добавление cover -> публикация -> появление в storefront.
- Созданный товар `Монки Д. Луффи` относится к подкатегории `One Piece`.
- Новый товар автоматически использует `PriceList main`.
- Скрытый товар не выводится покупателю до публикации.
- Подкатегория без товаров скрывается из storefront, а после публикации товара становится видимой.
- Live-тест намеренно изменил production-данные созданием и публикацией товара и загрузкой cover.
- Фотографии отобранных товаров продолжаем добавлять вручную.
- Следующим этапом будет проектирование Excel/CSV import только метаданных товаров.
- Импортированные товары должны создаваться скрытыми и получать основной прайс автоматически.

## Product metadata CSV import preview

- Для первого импорта используется CSV, который можно открыть и заполнить в Excel; `.xlsx` можно добавить позже отдельным этапом.
- Импорт охватывает только метаданные товаров: без изображений, цен, размеров, featured-статуса и публикации.
- Новый стабильный идентификатор импортируемого товара — nullable поле `Product.externalId`.
- `Product.externalId` добавлен в production как nullable unique field.
- Ручные товары, включая `Монки Д. Луффи`, остаются с `externalId = null`; существующие ручные товары не обновляются по совпадению названия или slug.
- Только импортируемые товары в будущем будут иметь стабильный `externalId`.
- CSV preview не изменяет базу и не содержит execute/apply-flow.
- CSV preview можно выкатывать в production, поскольку база уже соответствует Prisma schema.
- Реальные imported products в будущем создаются скрытыми, с `PriceList main`, без фото и без featured-статуса.
- Фотографии импортированных товаров добавляются отдельно через защищенную админку.
- Если slug нового CSV-товара конфликтует с ручной карточкой без `externalId`, preview возвращает ошибку и требует ручного решения.
- Фактическая запись товаров из CSV остается отдельным будущим этапом.
- Production live-preview подтвердил безопасную проверку CSV без записи в базу: две строки определены как `CREATE`, конфликт с ручной карточкой `Монки Д. Луффи` определен как `ERROR`.
- Существующая ручная карточка `Монки Д. Луффи` не была автоматически связана с новым `external_id`.
- Будущий apply-import не должен доверять результату preview с клиента: сервер обязан заново распарсить и валидировать загружаемый CSV.
- Для первого этапа применения импорта предпочтительно разрешить создание новых скрытых товаров, а обновление существующих imported-товаров рассматривать отдельно после проверки create-flow.

## Product metadata CSV import apply

- Первая версия apply-import создает только новые товары со статусом `CREATE`.
- Если при повторной серверной проверке в CSV есть хотя бы одна строка `ERROR` или `UPDATE`, весь import блокируется.
- Apply повторно валидирует исходный CSV на сервере и не доверяет клиентскому preview.
- Импорт атомарный: товары создаются внутри Prisma transaction, без `skipDuplicates`, update, upsert или delete.
- Созданные товары получают `externalId`, `PriceList main`, `isActive = false`, `isFeatured = false`.
- Изображения и публикация выполняются вручную после импорта через существующий раздел `Товары`.
- Обновление существующих imported-товаров проектируется отдельным этапом после проверки create-flow.

## Live create-only CSV import application

- Create-only import создаёт товары скрытыми и не публикует их покупателям автоматически.
- Импортированные товары получают стабильный `externalId`, `PriceList main`, `isActive = false` и `isFeatured = false`.
- Фотографии импортированных товаров добавляются вручную через существующий protected image flow.
- Публичная витрина не показывает импортированные товары до загрузки cover и ручной публикации.
- Live-import намеренно изменил production-данные: созданы скрытые товары `Ророноа Зоро` и `Донкихот Росиант` (`externalId = anime_onepiece_rosinante_001`; текущее имя в базе зафиксировано фактически).
- Повторный импорт того же CSV должен теперь давать `UPDATE` или блокироваться текущей политикой, потому что update imported-товаров ещё не реализован.
- Следующий большой технический блок после каталога: создание реального order flow с повторной server-side проверкой цен, адресом доставки, Telegram-уведомлениями, статусами заказа и тестовой оплатой.

## Order flow pricing and custom design

- Клиентский cart snapshot используется только как UX snapshot; перед quote/order сервер обязан заново проверить `PriceListItem`, активность товара, категории, подкатегории и актуальную цену.
- Доставка Почтой России хранится snapshot-ом в заказе: `450 ₽`, если в заказе только ночники `STANDARD` / `PREMIUM`; `550 ₽`, если есть хотя бы одна `WALL_PANEL`.
- Скидка на второе изделие составляет `30%` и применяется один раз к самому дешёвому physical unit среди `STANDARD` / `PREMIUM` / `WALL_PANEL`; quantity считается как отдельные единицы товара.
- Доставка и доплата за custom drawing не участвуют в скидке и не влияют на выбор discounted unit.
- Custom drawing требует выбора стиля: `CUSTOM_DRAWING_STYLE_1` `+690 ₽`, `CUSTOM_DRAWING_STYLE_2` `+790 ₽`, `CUSTOM_DRAWING_STYLE_3` `+990 ₽`.
- Если один custom design используется для нескольких экземпляров, базовое решение foundation — считать доплату за отрисовку один раз на unique custom design key; item-level fallback допускается только если ключ дизайна ещё не введён в UI.
- Custom image order требует admin review. До `APPROVED` заказ не должен автоматически уходить в оплату; при `REJECTED` администратор указывает причину.
- Для custom uploads нужен отдельный private bucket, предлагаемый env: `SUPABASE_CUSTOM_ORDER_BUCKET`, без live-настройки на этом этапе.
- ЮKassa требует отдельного согласования доступа до интеграции; платёжный провайдер не подключается в этом этапе.

## Order flow migration application

- Migration `00000000000003_prepare_order_flow` применена в production Supabase после additive SQL review.
- Production DB теперь поддерживает order snapshots, delivery method/address snapshot, discount fields, custom drawing surcharge и custom image review fields.
- Order flow начинается с server-side quote: клиентский cart snapshot не является источником суммы заказа.
- Реальный payment provider не подключается до отдельного согласования доступа и провайдера.
- Custom image order должен пройти admin review до оплаты; `PENDING_REVIEW` не должен уходить в payment flow.

## Order quote endpoint

- Quote endpoint является обязательным read-only слоем перед созданием заказа.
- Server price is the source of truth: checkout total берётся из server quote, а не из localStorage snapshot.
- Hidden products, inactive categories/subcategories и чужие `PriceListItem` не могут быть рассчитаны в quote.
- `POST /api/orders/quote` не создаёт `Order`, `Payment` и не выполняет write-операции в Supabase.
- Следующий write-flow должен начинаться отдельным endpoint `POST /api/orders`, который повторно выполнит те же проверки.

## Order creation without payment

- `POST /api/orders` создаёт заказ только внутри Telegram Mini App: server-side validation `Telegram.WebApp.initData` обязательна, admin-доступ не требуется.
- Order creation не доверяет клиентским суммам: перед записью внутри create-flow заново выполняется server quote.
- На первом этапе создаются `TelegramUser`, `Order`, `OrderItem` и `DeliveryAddress`; `Payment`, payment redirect и provider integration не создаются.
- Public order number имеет формат `KRM-YYYYMMDD-XXXXXX` и не раскрывает internal database id.
- Checkout не очищает cart автоматически после успешного создания заказа, чтобы пользователь мог сохранить выбранные позиции до отдельного UX-решения.
- Submit button блокируется во время отправки; полноценный server-side idempotency key нужен перед подключением онлайн-оплаты.
- Custom drawing item получает item-level `PENDING_REVIEW`; Telegram admin notifications будут отдельным этапом.
- Первый production live-заказ без онлайн-оплаты создан успешно: `KRM-20260601-128352`; после проверки `Payment = 0`.
- Важные success/error/status сообщения должны автоматически прокручиваться в видимую область, потому что в Telegram Mini App пользователь может оставаться ниже блока результата.
- Управление скидками через админку не добавляется в order flow автоматически: глобальные скидки и скидки на конкретные товары требуют отдельного проектирования правил, приоритетов и snapshot-поведения.

## Telegram admin order notifications

- Уведомление администраторам о новом заказе отправляется только после успешного завершения transaction создания заказа.
- Отправка уведомления не выполняется внутри order transaction, чтобы сбой Telegram Bot API не откатывал уже созданный заказ.
- Failure policy: если Telegram notification не отправилась, checkout всё равно возвращает покупателю успешный заказ; попытка фиксируется в `NotificationLog`.
- `NotificationLog` достаточно для первого этапа: успешная отправка дедуплицируется по ключу `order:new:<publicNumber>:admin:<telegramId>`.
- Failed attempts логируются отдельным ключом и не блокируют будущую повторную успешную отправку.
- `TELEGRAM_BOT_TOKEN` и `ADMIN_TELEGRAM_IDS` используются только server-side; client components не получают Prisma Client, bot token или raw initData.
- Сообщение администратору содержит публичный номер заказа, snapshot товаров, сумму, скидку, доставку, контакт и адрес, но не раскрывает internal database id, raw initData, secrets или приватные file URLs.
- Production live-test подтвердил получение Telegram admin notification для заказа `KRM-20260601-805754`.
- `NotificationLog` dedup работает для пары order/admin: successful log создан, дублей successful notification для этого заказа не обнаружено.
- Персональные данные покупателя не фиксируются полностью в документации; допустимо только подтверждать наличие recipient/contact/address/comment.
- Оплата пока не подключена, `Payment` не создаётся.

## Admin order management

- Администратор может просматривать список заказов и детальную карточку заказа через защищённые Telegram admin endpoints.
- В карточке заказа показываются snapshot товаров, суммы, доставка, контактные данные, комментарий, статусы и notification summary.
- На первом этапе администратор может менять только `Order.fulfillmentStatus`; `paymentStatus` остаётся read-only до выбора и подключения платёжного провайдера.
- Допустимые переходы fulfillment status ограничены минимальной state machine: `NEW -> IN_WORK/CANCELLED`, `IN_WORK -> MANUFACTURED/SHIPPED/CANCELLED`, `MANUFACTURED -> SHIPPED/CANCELLED`, `SHIPPED -> COMPLETED`.
- `COMPLETED` и `CANCELLED` считаются финальными до отдельного этапа возврата/исправления статусов.
- Удаление заказов не реализуется: заказы являются историей покупательского действия и нужны для аудита.
- Изменение статуса заказа на этом этапе не отправляет покупателю или администратору дополнительные Telegram notifications.
## Live admin order status management

- Fulfillment status управляется через защищённую Telegram-админку и server-side admin endpoints.
- Production live-test подтвердил переход заказа `KRM-20260601-805754` из `NEW` в `IN_WORK`.
- `paymentStatus` не меняется вручную на этом этапе и остался `PENDING`.
- Status update текущей версии не отправляет Telegram notification клиенту или администратору.
- Totals, item snapshots, delivery address, customer snapshot и payment rows не меняются при смене fulfillment status.
- Заказ `KRM-20260601-128352` остался `NEW / PENDING`, что подтверждает точечное изменение только выбранного заказа.
## Customer order pages

- Customer orders are scoped by validated Telegram initData and the `Order -> TelegramUser` relation.
- Customer order endpoints are read-only: they must not create orders, create payments, update statuses or send Telegram messages.
- A user sees only their own orders; another user's public number is hidden behind the same safe not found response as a missing order.
- Customer order detail can show the customer's own contact, delivery address, comment, totals and item snapshots, but never raw initData, internal ids or secrets.
- Checkout success links to `/orders/<publicNumber>` so the customer can reopen the saved order.
- Payment status remains informational until a provider is selected and connected.

## Customer support via Telegram bot

- Поддержка по заказу ведётся через отдельный Telegram support bot `@karmashopsupportbot`, подключённый к CRM BlueSales.
- Mini App не реализует собственный чат и не отправляет сообщения через Bot API при клике `Связаться`.
- Customer order detail формирует публичную deep link вида `https://t.me/karmashopsupportbot?start=order_<publicNumber>`, где дефисы номера заказа заменяются на `_`.
- В `start` передаётся только публичный номер заказа; raw initData, admin IDs, bot token и server credentials не попадают в client UI.
- Username support bot считается публичной настройкой. Для hotfix он хранится как client-side constant; перенос в StoreSettings/admin settings можно сделать отдельным этапом без изменения текущего правила поддержки.

## FAQ / How to order content

- FAQ нужен до углубления custom design и payment flow: покупатель должен понимать виды изделий, доставку, стили отрисовки, требования к изображению и как связаться по заказу.
- Для FAQ подготовлена отдельная additive модель `FaqSection`, чтобы тексты редактировались из Telegram-админки без redeploy.
- `FaqSection.content` хранится как plain text / markdown-lite. Public UI и admin preview рендерят строки как React text nodes; `dangerouslySetInnerHTML` не используется.
- Public `/faq` показывает только active sections, отсортированные по `sortOrder`; если FAQ-таблица пустая или migration ещё не применена, используется безопасный fallback content.
- Admin endpoint `PATCH /api/admin/faq` защищён Telegram admin auth и позволяет менять только `title`, `content`, `sortOrder`, `isActive` для известных FAQ slug.
- Если после migration `FaqSection` пустая, admin GET возвращает default sections как редактируемый draft, а PATCH создаёт/обновляет их через upsert по slug. Production seed/bootstrap для FAQ не требуется на первом шаге.
- Migration `00000000000004_add_faq_sections` применена к production Supabase. После применения `FaqSection = 0`, поэтому public fallback остаётся ожидаемым состоянием до первого admin save.
- Следующая проверка должна подтвердить production `/faq` fallback и инициализацию default sections через защищённую Telegram-админку без seed/bootstrap.
- Верхний FAQ intro и нижний contact CTA используют reserved `FaqSection.slug`: `faq-hero-eyebrow`, `faq-hero`, `faq-contact-cta`. Они редактируются через тот же admin FAQ flow и не показываются как обычные FAQ-карточки.
- Для live UX после проверки `/faq` добавлен явный open/hover/focus feedback FAQ-карточек без новых UI-библиотек и без migration.
- Production live-проверка FAQ chrome подтвердила: hero/intro и CTA редактируются через Telegram-админку, публичный `/faq` отображает изменения, а FAQ-карточки имеют понятный hover/open/active feedback.
- Следующий крупный блок после FAQ checkpoint — custom design flow.

## Custom design flow first layer

- Custom design flow использует существующий `Product.productType = CUSTOM`; отдельная migration для первого слоя не нужна.
- Покупатель обязан выбрать `CustomDrawingStyle` и загрузить изображение до добавления custom-товара в корзину.
- Customer upload выполняется через `POST /api/orders/custom-upload` с обычной Telegram Mini App auth; raw initData хранится только в памяти клиента и передается только в header.
- Custom images хранятся в private Supabase Storage bucket из `SUPABASE_CUSTOM_ORDER_BUCKET`; клиент получает только `customDesignKey`, private `storagePath`, имя файла, MIME и размер, без public URL.
- Server quote принимает custom metadata только для `CUSTOM` товара, требует `customImageStoragePath` из `custom-orders/` и считает surcharge один раз на уникальный design key.
- Order creation повторно пересчитывает quote и дополнительно проверяет, что `customImageStoragePath` принадлежит текущему Telegram user path `custom-orders/<telegramId>/`.
- Custom order item сохраняет `customDrawingStyle`, surcharge snapshot, `customDesignKey`, `customImageStoragePath` и `customImageReviewStatus = PENDING_REVIEW`.
- Payment provider не подключается: custom design сначала проходит review и ручной контакт менеджера; admin review UI проектируется отдельным этапом.

## Live custom design checkout verification

- Production live-check confirmed the custom upload and checkout part of custom design flow before order creation.
- The `Свой дизайн` product is the public CUSTOM entrypoint; the buyer can select a drawing style and upload an image before adding the item to cart.
- Style №3 surcharge is shown in checkout as `+990 ₽`.
- The upload object stays private; documentation must not store full private storage paths because they include Telegram-scoped path data.
- No `Order` or `Payment` was created during this live-check.
- The next validation step is one controlled custom order to confirm order item snapshot and `customImageReviewStatus = PENDING_REVIEW`.

## Live custom design order verification

- Production live-test confirmed the full custom order path through order creation for `KRM-20260602-8E3EBA`.
- Custom order items save the chosen drawing style, surcharge snapshot, `customDesignKey`, private image storage path, and review status `PENDING_REVIEW`.
- Private storage paths must remain server/internal data and should not be printed in reports or docs.
- Payment remains disconnected for custom orders: `Payment = 0`.
- The next product decision is whether to build admin review UI for custom images first or move into payment-provider planning.

## Admin custom image review

- Private custom images are shown to admins only through short-lived Supabase signed URLs created by a protected Telegram admin endpoint.
- The client receives a signed URL and TTL, but never receives or renders the raw private storage path.
- The first review state machine is intentionally one-way: `PENDING_REVIEW -> APPROVED` or `PENDING_REVIEW -> REJECTED`.
- `APPROVED` and `REJECTED` are final on this layer; rollback/re-review can be designed later if needed.
- Rejection reason is stored in existing `OrderItem.customImageReviewComment`; no migration is needed.
- Review actions must not change order totals, item price snapshots, fulfillment status, payment status, or create `Payment`.
- Telegram notifications for custom review results remain a separate future stage.

## Live admin custom image review verification

- Production live-test confirmed that admin-only signed URL preview works for private custom images without exposing the raw storage path.
- Order `KRM-20260602-8E3EBA` moved from `PENDING_REVIEW` to `APPROVED` through the protected admin review UI.
- The approve action changed only custom image review fields on the order item.
- Payment remains disconnected; no `Payment` rows are created by image review.
- Future work can choose between custom review notifications, payment planning, or rollback/re-review tooling.

## YooKassa payment foundation

- First YooKassa layer is planning/foundation only: no live HTTP calls to YooKassa and no production `Payment` creation.
- Customer payment preparation must be scoped by Telegram user ownership of the order.
- A regular pending order may proceed to future payment immediately.
- A custom order may proceed only when every custom image review status is `APPROVED`.
- `PENDING_REVIEW` blocks payment until admin review; `REJECTED` blocks payment and tells the customer to contact the manager.
- Cancelled, completed, already paid, and non-positive-total orders are not payment eligible.
- Provider env names are server-only: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_RETURN_URL`, `YOOKASSA_WEBHOOK_SECRET`.
- Before live payment, implement real idempotent provider creation and webhook status mapping deliberately.

## YooKassa redirect payment creation

- The first live-capable payment action is `POST /api/orders/[publicNumber]/payment/prepare`, scoped to the current Telegram user and their own order.
- The server creates a YooKassa redirect payment only for eligible orders: regular `PENDING` orders or custom orders where every custom image is `APPROVED`.
- `PENDING_REVIEW`, `REJECTED`, cancelled/completed, already paid and invalid-total orders are blocked before provider creation.
- `Idempotence-Key` is deterministic per public order number for this first payment attempt, and an existing pending YooKassa `Payment` with confirmation URL is reused.
- `Payment` is inserted only after YooKassa returns a successful redirect response. Provider errors must not create local payment rows.
- `Order.paymentStatus` is not marked `PAID` by the redirect preparation step. Final payment status requires a future webhook or explicit provider status fetch.
- YooKassa secrets remain server-only; Authorization headers and secret keys must never be logged or returned to the client.
- Real YooKassa creation is disabled by default and requires `YOOKASSA_PAYMENTS_ENABLED=true`; adding shop id or secret key alone must not activate payment buttons or provider calls.

## YooKassa receipt payload

- The active YooKassa shop requires fiscal receipt data; payment creation without `receipt` is rejected by the provider.
- Receipt data is built server-side from stored order snapshots immediately before the YooKassa request.
- Receipt customer data uses a safe phone/email from the order contact; if neither is available, payment preparation must stop before the provider call.
- Physical order items are receipt `commodity` lines. Custom drawing surcharge and delivery are receipt `service` lines.
- Discounts are folded into commodity item amounts rather than represented as negative receipt rows, and receipt total must equal `Order.totalKopecks`.
- VAT code is configured server-side through `YOOKASSA_VAT_CODE`; env absence currently falls back to `1`, which must be confirmed against the shop fiscal settings before live retry.
- Provider diagnostics must not log receipt customer phone/email, authorization headers, secrets or personal data.

## Live YooKassa redirect verification

- Controlled production test on order `KRM-20260604-59DE22` confirmed that receipt-bearing YooKassa payment creation returns a confirmation URL.
- A local `Payment` row is created only after YooKassa returns the redirect response; the order itself remains `paymentStatus = PENDING`.
- Redirect success does not mean paid. Final `PAID` status must come from a future webhook or explicit provider status check.
- Full confirmation URLs, provider payment IDs, idempotency keys and personal data must not be recorded in docs or UI logs.
- The old `KRM-20260602-8E3EBA` failure is treated as a test-order artifact caused by the deterministic idempotence key being tied to the pre-receipt payload.
- After the test window, `YOOKASSA_PAYMENTS_ENABLED` should be switched back to false until the next controlled payment stage.

## YooKassa webhook foundation

- YooKassa webhook endpoint is prepared but not registered in the provider cabinet during this stage.
- Webhook URL uses a shared secret token: `/api/yookassa/webhook?token=<secret>`; the secret is read from `YOOKASSA_WEBHOOK_SECRET` and must never be logged.
- The endpoint does not require Telegram initData because YooKassa calls it server-to-server.
- Supported provider events are `payment.succeeded` and `payment.canceled`.
- `payment.succeeded` is the first source of truth for marking an order paid: it updates `Payment.status = PAID` and `Order.paymentStatus = PAID`.
- `payment.canceled` updates the existing `Payment.status = CANCELLED` and leaves the order not paid.
- Webhook handling is idempotent at the current schema level: repeated events update the same existing payment/order statuses and never create new `Payment` rows.
- Unknown events, unknown provider payments, amount mismatch and metadata order mismatch are ignored safely with masked provider IDs for retry semantics.

## YooKassa webhook registration readiness

- `YOOKASSA_WEBHOOK_SECRET` is now configured in Vercel Production and was activated through a redeploy.
- The YooKassa cabinet has the webhook URL registered with the secret token, but the token itself must not be written to docs, logs or UI.
- The registered event set is limited to `payment.succeeded` and `payment.canceled`.
- Registration readiness does not prove status sync yet; a controlled live webhook event is still required.
- Outside controlled payment tests, `YOOKASSA_PAYMENTS_ENABLED` should remain false.

## Live YooKassa payment webhook verification

- Controlled live payment on order `KRM-20260604-28B88F` confirmed that YooKassa redirect payment plus `payment.succeeded` webhook updates local status.
- Successful payment sets both the existing `Payment.status` and `Order.paymentStatus` to `PAID`.
- Fulfillment status is not changed by payment webhook and stays a separate admin/order workflow.
- The webhook sync must not create duplicate local payments.
- Manual refund in the YooKassa cabinet is not reflected locally yet because refund handling is outside the current webhook foundation.
- Future refund support needs explicit semantics for local payment/order states before adding `refund.succeeded`.

## UI/content audit foundation

- StoreSettings and FaqSection are enough for the current editable hero/contact/delivery/FAQ surface, but not enough for all hideable explanatory blocks across checkout, orders, payment guidance and custom design flow.
- Business/content copy should be admin-managed when it is promotional, explanatory, support-related, delivery/payment guidance or hideable.
- Technical/system copy remains code-owned: validation messages, form labels, enum labels, diagnostics, auth errors and provider safety errors.
- Do not add a broad redesign or new content schema until the exact editable blocks are grouped and approved.
- A future additive `ContentBlock`-style model is the likely fit for reusable hideable banners/help blocks with `slug`, text fields, CTA fields, `isActive` and `sortOrder`.
- Immediate safe UX fix: paid orders must be visually obvious to customers and admins without changing payment/fulfillment logic.

## ContentBlock foundation decision

- A separate `ContentBlock` model is needed because StoreSettings is store-level and FaqSection is FAQ-specific.
- ContentBlock is additive and allowlist-driven for the first layer: admins edit predefined slugs instead of creating arbitrary CMS entries.
- Public UI reads only active blocks; inactive saved blocks hide the corresponding help/promo/guidance block.
- Admin GET returns default draft blocks when the table is empty, so no seed/bootstrap is required.
- Admin PATCH upserts by slug and validates title/body/CTA/sortOrder/isActive server-side.
- Content is rendered as plain text/markdown-lite lines; `dangerouslySetInnerHTML` is not used.
- Initial connected blocks are limited to checkout guidance, customer order payment guidance, support CTA and custom design help.
- Payment runtime, webhook handling, pricing, checkout submit logic and order status mutations are not changed by this foundation.
- Production migration application was completed before deployment: the `ContentBlock` table and indexes now exist, while `ContentBlock = 0`.
- Default draft blocks remain code-defined until an admin saves them through the protected admin UI; no seed/bootstrap/manual row creation is required.

## Home copy ContentBlock decision

- The ContentBlock admin flow was live-tested: default drafts can be saved/upserted and inactive rows hide connected public blocks.
- Home/storefront marketing copy can use ContentBlock without another migration.
- Home hero ContentBlock slugs are allowlisted: `home-hero-eyebrow`, `home-hero-title`, `home-hero-subtitle`, `home-hero-primary-cta`, `home-hero-secondary-cta`.
- `home-hero-eyebrow` owns the blue `НОЧНИКИ ПО ТВОЕЙ ИДЕЕ` label and can hide it through `isActive`.
- StoreSettings remains the fallback/source for hero title and subtitle when home ContentBlock title/subtitle rows are blank.
- Home CTA labels become editable through ContentBlock, but their actions stay code-owned so navigation and custom design modal behavior do not drift.
- This is a content-control extension, not a visual redesign.

## Live Home ContentBlock verification decision

- Production live-check confirmed that home hero ContentBlocks work after commit `6190132`.
- The blue home hero eyebrow is controlled by `home-hero-eyebrow`.
- `isActive` is the supported way to hide the eyebrow without code changes.
- Home hero title/subtitle and CTA labels remain allowlisted ContentBlock defaults/overrides, with StoreSettings fallback for title/subtitle.
- CTA behavior stays code-owned to avoid accidental navigation/modal changes from content edits.
- A broader visual redesign remains a future stage and should not be mixed with content-block management.

## ContentBlock cleanup decision

- Remaining business/help copy can be connected to the existing allowlisted ContentBlock model; no schema change is needed.
- Added cleanup slugs only for connected placements: `catalog-intro-help`, `catalog-empty-state`, `cart-empty-state`, `orders-intro-help`, `custom-product-features-help`, `custom-upload-requirements-help`.
- Existing `orders-empty-state` remains the canonical customer orders empty-state slug and is now used by the `/orders` page.
- Inactive ContentBlock rows hide optional public help/empty-state blocks; missing rows fall back to code-defined defaults.
- CTA href/labels can be content-managed where the action is simple navigation, but upload, cart, checkout, payment and modal behavior stay code-owned.
- System copy remains code-owned: form labels, validation/safety errors, enum labels, protected endpoint messages, diagnostics and provider/webhook safety copy.
- This cleanup must not change pricing, payment prepare, webhook, order creation or status mutation behavior.

## Live ContentBlock cleanup verification decision

- Production live-check confirmed that the cleanup ContentBlock slugs appear in admin and can be edited.
- `isActive` is confirmed as the public hide mechanism for catalog/cart/orders/custom help blocks.
- The checked cleanup slugs remain allowlisted and are not arbitrary CMS entries.
- Payment, order and webhook behavior stays outside ContentBlock management.
- The next larger UI step should be design system / visual redesign foundation, not more runtime behavior changes.

## Design system foundation decision

- The visual redesign should start from small shared primitives rather than a full-screen rewrite.
- Existing `ActionButton` remains valid for animated action buttons; new shared helpers provide reusable static button classes and link/button accessibility defaults.
- Shared primitives should cover repeated low-risk patterns first: surfaces, empty states, status badges and section headings.
- Initial rollout is limited to catalog/cart empty states and customer order payment badges so checkout, payment, webhook, pricing and order mutation logic remain unchanged.
- A broader redesign should proceed screen by screen after this foundation is verified.

## Live design system foundation smoke-check decision

- Production smoke-check confirmed that the first shared primitives can be used without disrupting existing storefront flows.
- `/catalog`, `/cart` and `/orders` are the verified baseline screens for `EmptyState` and `StatusBadge`.
- The next visual iteration should establish KARMA Neon Mask direction on storefront surfaces before touching checkout/order/admin complexity.
- Payment, order and webhook behavior must remain outside visual redesign work unless a dedicated runtime task explicitly requires it.

## KARMA Neon Mask visual direction decision

- KARMA Neon Mask should be introduced through reusable tokens and decorative layers before any broad page redesign.
- The mask is a brand watermark/background accent and must stay decorative: `aria-hidden`, non-interactive and visually restrained.
- The watermark must use the real KARMA mask asset from `/brand/karma-mask.svg`; abstract code-drawn placeholders are not acceptable for brand direction checks.
- No external URL or inline base64 image data should be used for the mask.
- Neon/violet/magenta glow should support a premium anime/gaming feel without casino-like color overload.
- Payment, order, webhook, checkout and ContentBlock behavior remain outside this visual direction task.

## Live real KARMA mask asset smoke-check decision

- Production smoke-check confirmed the real mask asset is the correct foundation for future Neon Mask visuals.
- The abstract placeholder must not return; future mask refinements should update the asset or its restrained presentation classes.
- Home hero and empty states are the verified first placements.
- The next redesign stage should use the real mask asset as a watermark/accent, not as primary content or repeated decoration.

## Home hero Neon Mask redesign decision

- The home hero can receive a stronger visual redesign first because it is mostly presentation and already uses stable ContentBlock/StoreSettings inputs.
- The redesign must preserve the allowlisted ContentBlock contract and existing CTA behavior; content editors control labels/text, while actions remain code-owned.
- The real KARMA mask stays behind content as a watermark; text readability has priority over brand decoration.
- Hero layering should keep the artwork sharp without image blur/filter. Readability comes from dim/gradient overlays and the glass text card.
- Home hero should render one large real KARMA mask watermark, shifted to the right; duplicate inner mask accents are avoided so the brand mark does not visually repeat.
- Public pages should use the shared `TopBar` with StoreSettings passed from their server page so uploaded logos are consistent outside the home page. The fallback remains `K / KARMA`.
- Shared UI primitives and Neon Mask tokens should be used before inventing one-off hero button/surface styles.
- Catalog/product cards are the next logical stage; checkout, orders and payment surfaces should wait until storefront visuals are verified.

## Live visual fixes verification decision

- Production smoke-check confirmed the single-mask hero composition after commit `7580fed`.
- The real KARMA mask should remain a single large right-shifted watermark in the hero; duplicate inner mask accents should not return.
- Uploaded StoreSettings logo is confirmed as the shared public header source across home, catalog, cart, checkout, orders, order detail and FAQ.
- CTA actions and payment/order runtime remain outside this visual fix.
- The next visual work should move to catalog/product cards rather than revisiting payment/order behavior.

## Catalog/product cards Neon Mask decision

- Catalog redesign should be visual-only at this stage: keep storefront data fetching, filtering, product visibility, product modal open behavior, variant pricing and cart behavior unchanged.
- Existing ContentBlock slugs remain the contract for catalog copy: `catalog-intro-help` and `catalog-empty-state`.
- Catalog surfaces and product cards can use shared Neon Mask tokens before creating new abstractions.
- Product cards should emphasize the image first, then compact badges and price information; custom product badges are presentation only and must not affect availability or pricing.
- Checkout, orders, payment, webhook and custom upload/review runtime remain outside this visual stage.

## Live catalog/product cards smoke-check decision

- Production smoke-check confirmed the catalog/product card redesign after commit `6a45197`.
- The glass/neon catalog header, neon category pills and image-first product cards are acceptable on Telegram/mobile.
- Search, category filtering, product modal opening and custom product visibility remain the verified behavior contract.
- Pricing, variants, cart, checkout, payment, webhook and order runtime remain outside visual card work.
- The next visual stage should move to the product modal rather than widening scope into checkout/orders.
