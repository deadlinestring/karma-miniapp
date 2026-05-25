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
