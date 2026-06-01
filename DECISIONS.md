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
