# Этапы работ

## 1. Подготовка проекта — выполнено

- Проверить окружение.
- Инициализировать Git-репозиторий.
- Создать базовые документы проекта.
- Зафиксировать начальные правила, продуктовые требования и решения.

## 2. Frontend-каталог и дизайн первой версии — выполнено

- Подготовить базовую структуру интерфейса.
- Реализовать темную тему и неоновый визуальный стиль.
- Создать каталог с категориями и подкатегориями.
- Добавить тестовые товары.

## 3. Карточка товара и frontend-корзина — выполнено

- Реализовать страницу или экран товара.
- Добавить выбор размера и типа изделия.
- Реализовать добавление в корзину.
- Реализовать изменение количества и удаление позиций.
- Сохранять корзину в localStorage через Zustand persist.

## 4. Demo-экран оформления заказа — выполнено

- Создать форму оформления заказа.
- Добавить ввод контактов и адреса доставки.
- Показать состав заказа и итоговую сумму.
- Добавить demo-уведомление вместо реального перехода к оплате.
- Серверная обработка заказа пока не реализуется.

## 4.1. Визуальное улучшение frontend-MVP — выполнено

- Добавить hero с областью под фото ночника.
- Подготовить карточки товаров под реальные изображения.
- Сделать компактную сетку каталога.
- Добавить галерею товара.
- Обновить пустые состояния корзины и заказов.
- Подготовить структуру товара под будущую админку.

## 5. База данных — в работе

- Спроектировать Prisma schema — в работе.
- Провести финальный архитектурный аудит схемы перед миграцией — выполнено.
- Initial migration SQL подготовлен для проверки.
- Подключение реальной базы и миграции — не выполнено.
- Первая миграция — не применена.
- Реальные credentials — не подключены.
- Seed — подготовлен, но не выполнен.
- Перевод каталога на БД — не выполнен.
- Подключить PostgreSQL.
- Настроить Prisma.
- Подготовить тестовые данные.

## 6. Админка — не начато

- Реализовать вход администратора.
- Добавить управление товарами, категориями и заказами.
- Подготовить статусы заказов.

## 7. Telegram Mini App интеграция — не начато

- Подключить Telegram Mini Apps SDK.
- Обработать Telegram initData.
- Адаптировать интерфейс под Telegram WebView.

## 8. Уведомления администраторам — не начато

- Настроить отправку уведомлений в Telegram.
- Добавить уведомления о новых заказах.
- Добавить уведомления об изменениях статуса при необходимости.

## 9. Тестовая оплата — не начато

- Выбрать платежного провайдера: ЮKassa или Т-Банк.
- Подключить только тестовый режим.
- Реализовать webhook оплаты.
- Проверить полный сценарий заказа.

## 10. Деплой — не начато

- Выбрать площадку для размещения.
- Настроить переменные окружения.
- Проверить production-сборку.
- Подключить домен и HTTPS.

## Текущее состояние базы и seed

- Первая migration применена к Supabase.
- RLS на таблицах public и partial unique index единственной обложки подтверждены.
- Безопасный seed исправлен: подготовлен как неразрушающий и идемпотентный, но еще не запускался.
- Перевод frontend-каталога на чтение из базы еще не выполнен.
## Актуальный статус Supabase bootstrap

- Первая Supabase migration — выполнено.
- Все 12 таблиц приложения созданы.
- RLS на всех 12 таблицах — включен и подтвержден.
- Partial unique index `ProductImage_one_cover_per_product` для единственной обложки товара — создан и подтвержден.
- Безопасный идемпотентный seed — исправлен.
- Первый seed тестового каталога — выполнен успешно один раз.
- В базе создан тестовый каталог: `StoreSettings = 1`, `Category = 4`, `Subcategory = 8`, `Product = 10`, `ProductImage = 30`, `ProductVariant = 90`.
- Покупательские данные seed не создавал: `TelegramUser = 0`, `Order = 0`, `DeliveryAddress = 0`, `OrderItem = 0`, `Payment = 0`, `NotificationLog = 0`.
- Frontend пока продолжает работать на mock-данных.

## Следующие задачи

- Перевести пользовательский каталог на реальные данные из базы через server-side repository.
- Перевести hero/store settings на данные из базы.
- Сохранить fallback/mock-режим только для разработки при отсутствии базы.
- Подготовить админку для управления каталогом и изображениями.
- Подключить Telegram Mini App интеграцию.
- Реализовать оформление реальных заказов.
- Подключить тестовые, а затем реальные платежи.
## Подключение frontend-каталога к базе

- Пользовательский каталог и главная страница переведены на чтение данных из server-side repository — выполнено после локальной проверки.
- Корзина остается frontend/localStorage через Zustand persist.
- Checkout остается demo-экраном и реальные `Order` пока не создает.
- Реальные заказы еще не создаются.
- Админка, Telegram Mini App интеграция и оплата еще не подключены.

## Telegram Mini App и защищенный доступ администратора

- Telegram Mini App bridge подключен через официальный скрипт Telegram Web App — выполнено.
- После загрузки интерфейса приложение вызывает `Telegram.WebApp.ready()` и `Telegram.WebApp.expand()`, если API доступен.
- Server-side validation `Telegram.WebApp.initData` подготовлена — выполнено.
- Проверка admin-доступа через `ADMIN_TELEGRAM_IDS` подготовлена — выполнено.
- API `POST /api/admin/auth/check` создан как foundation для будущих защищенных admin-операций.
- Страница `/admin` создана как защищенная заглушка без CRUD.
- Реальное тестирование внутри Telegram требует публичный HTTPS URL и настройку Mini App в BotFather.
- Админский CRUD еще не начат.
- Загрузка изображений в Storage еще не подключена.
- Telegram Bot API для уведомлений еще не подключен.
- Оплата еще не подключена.

## Deployment readiness

- Private GitHub repository опубликован — выполнено.
- Vercel deployment readiness audit — в работе.
- Production build должен генерировать Prisma Client без запуска migration и seed.
- `/` и `/catalog` должны оставаться dynamic routes, чтобы будущие изменения товаров и настроек отображались без redeploy.
- Первый deployment в Vercel еще не выполнен.
- BotFather Mini App URL еще не настроен.

## Production deployment и Telegram admin verification

- GitHub publication — выполнено.
- Vercel production deployment — выполнено.
- Production URL: `https://karma-miniapp.vercel.app`.
- Telegram Menu Button test setup — выполнено.
- Live Telegram admin-auth verification через `@karma_nightlight_store_bot` — выполнено.
- Production `/admin` подтвердил статус администратора через server-side validation Telegram initData.
- Следующий этап: защищенная админка для настроек магазина и изображений.
- CRUD админки, загрузка изображений, реальные заказы и оплата еще не реализованы.

## Защищенная админка StoreSettings и публичных изображений

- Защищенное управление текстовыми настройками главной страницы — в работе.
- Загрузка логотипа и hero-изображения в public bucket `catalog-images` — в работе.
- Protected StoreSettings/admin uploads готовы после security hardening.
- Все admin endpoints повторно проверяют Telegram initData server-side.
- Live тест загрузки через Telegram будет выполнен после Vercel deployment текущего этапа.
- Commit/push и добавление env в Vercel еще не выполнены.
- Для Vercel текущего этапа нужно добавить `SUPABASE_URL`, `SUPABASE_SECRET_KEY` и `SUPABASE_CATALOG_BUCKET`.
- Управление товарами, категориями, ценами и товарными фотографиями еще не реализовано.
- Реальные заказы, уведомления и оплата еще не подключены.

## Live-проверка StoreSettings admin

- Protected StoreSettings admin UI — выполнено.
- Production live PATCH текстов главной страницы — проверено успешно.
- Production live hero upload — проверено успешно.
- Загруженное hero-изображение сохранено в `catalog-images` и отображается на storefront без redeploy.
- Загрузка logo реализована, но отдельная live-проверка еще не выполнена.
- Следующий этап: защищенное управление изображениями товаров.
- CRUD товаров, категорий и цен пока не реализован.

## Защищенное управление фотографиями товаров

- Защищенное управление фотографиями товаров — в работе.
- Админка получила список товаров, загрузку новой обложки, загрузку фото в галерею, назначение существующего изображения главной обложкой и удаление неосновных изображений.
- Live upload новой обложки товара через Telegram еще не выполнялся.
- Редактирование названий, описаний, категорий, вариантов и цен еще не реализовано.

## Прайс-листы и безопасность seed после live-фото

- Live-upload обложки и дополнительного фото товара через Telegram admin UI — выполнен успешно.
- Аудит безопасного повторного seed после появления реальных изображений — выполнен.
- Seed исправлен: повторный запуск не возвращает mock-cover поверх реальной admin-cover и не трогает `products/` изображения.
- Подготовка общей модели прайс-листа — в работе.
- Prisma schema и SQL migration для `PriceList` / `PriceListItem` подготовлены, но migration еще не применена.
- Bootstrap основного прайса подготовлен, но еще не запускался.
- Storefront пока продолжает работать на legacy `ProductVariant`.
- Массовый импорт данных товаров и CRUD товаров еще не начаты.

## Переключение storefront на общий прайс

- Migration `00000000000001_add_price_lists` применена успешно.
- Bootstrap основного прайса `main` выполнен успешно: создан `PriceList main`, создано 10 `PriceListItem`, текущие активные товары привязаны к `priceListId = "main"`.
- Storefront переключен на `PriceListItem` как источник доступных размеров, типов изделий и цен.
- Legacy `ProductVariant` временно остается в базе, но больше не является источником рабочих цен пользовательского интерфейса.
- Корзина остается localStorage/Zustand, но хранит snapshot `priceListItemId`, выбранного типа, размера, цены и `note`.
- Для панели 55 см отображается и сохраняется note: `Двойная подсветка сверху и снизу`.
- Редактирование прайс-листа из админки еще не реализовано.
- Excel/CSV import товаров еще не реализован.

## Production-проверка общего прайса

- Production deployment с переключением storefront на `PriceListItem` проверен успешно.
- Реальные цены, доступные размеры и note для `Настенная панель / 55 см` отображаются в live storefront.
- Корзина и checkout demo на production корректно работают с новыми вариантами и суммами.
- Telegram-админка после переключения прайса продолжает работать; hero-изображение и ранее загруженные фото товаров сохранены.
- Следующий этап: новая структура разделов админки и управление основным прайсом.
- CRUD категорий/товаров и Excel/CSV import пока не реализованы.

## Структурированная Telegram-админка и прайс-листы

- Новая структура admin-разделов подготовлена: Главная страница, Прайс-листы, Товары, Категории, Импорт товаров.
- Раздел управления основным прайсом `Основной прайс KARMA` подготовлен после локальной проверки.
- Защищенный API прайса позволяет менять только цену и note существующих `PriceListItem`.
- Live PATCH цены через Telegram выполнен в production и прошел успешно.
- CRUD категорий и товаров еще не реализован.
- Excel/CSV import метаданных товаров еще не реализован.

## Production-проверка управления основным прайсом

- Структурированная admin-навигация — выполнена и проверена в production через Telegram Mini App.
- Защищенное управление основным прайсом — выполнено.
- Production live PATCH прайса через Telegram Mini App — успешно проверен.
- Значения реальной матрицы после live-теста сохранены.
- Раздел `Прайс-листы` загрузил `Основной прайс KARMA` и все 10 пунктов матрицы.
- Storefront после сохранения продолжил отображать актуальные цены и note без redeploy.
- Следующий этап: CRUD категорий и подкатегорий.
- После категорий: CRUD товарных карточек и Excel/CSV import метаданных товаров.

## Защищенное управление категориями

- Раздел `Категории` в структурированной Telegram-админке подготовлен после локальной проверки.
- Добавлены защищенные операции создания, переименования и включения/выключения категорий и подкатегорий.
- Slug создается сервером при создании записи и не меняется при переименовании.
- Физическое удаление категорий и подкатегорий на первом этапе не реализовано; используется `isActive`.
- Live создание/скрытие категории через Telegram еще не выполнялось.
- Следующий этап после live-проверки категорий: CRUD карточек товара.
- Excel/CSV import метаданных товаров будет после CRUD каталога.

## Production-проверка управления категориями

- Защищенное управление категориями и подкатегориями — выполнено.
- Production live creation подкатегорий через Telegram Mini App — проверено успешно.
- Новые пустые подкатегории появились в admin UI и остались скрыты от публичного storefront.
- Фильтрация пустых подкатегорий в публичном storefront — проверена успешно.
- Следующий этап: CRUD карточек товара.
- После CRUD карточек товара: Excel/CSV import метаданных товаров.

## CRUD карточек товара

- Protected CRUD карточек товара — выполнен.
- Production live-сценарий создания скрытого товара, загрузки обложки и последующей публикации — проверен успешно.
- Товар `Монки Д. Луффи` опубликован в подкатегории `One Piece`.
- Storefront корректно отображает новый товар с общим реальным прайсом `PriceList main`.
- Новый товар создается скрытым, с `isFeatured = false` и автоматически назначенным `PriceList main`.
- Редактирование карточки позволяет менять название, описание, подкатегорию, тип товара, показ в магазине и featured-статус.
- Публикация товара требует главную обложку, активную категорию и подкатегорию, а также активный основной прайс.
- Существующий flow фотографий товара сохранен внутри экрана редактирования карточки.
- Следующий большой этап: Excel/CSV import метаданных товаров.
- Управление изображениями для импортированных и выбранных товаров остается ручным через существующую админку.

## CSV import metadata preview

- Live CRUD товара успешно проверен на `Монки Д. Луффи`.
- Подготовка CSV import metadata preview — готова после локальной проверки.
- Migration `00000000000002_add_product_external_id` для `Product.externalId` применена успешно в production.
- Текущие ручные товары, включая `Монки Д. Луффи`, сохранили `externalId = NULL`.
- `Product.externalId` подготовлен как nullable stable identifier для будущего повторяемого импорта.
- Preview-only CSV import подготовлен к production deployment.
- CSV-шаблон для Excel использует UTF-8 BOM и разделитель `;`.
- Preview CSV выполняет validation и показывает будущие действия `CREATE` / `UPDATE` / `ERROR`, но не изменяет каталог.
- Preview-only CSV import опубликован в production.
- Live скачивание CSV-шаблона через Telegram Mini App проверено успешно.
- Live preview CSV с результатом `CREATE = 2`, `UPDATE = 0`, `ERROR = 1` проверен успешно.
- Подтверждено, что preview не изменяет каталог.
- Apply-import для новых скрытых товаров подготовлен после локальной проверки.
- Live применение импорта через Telegram еще не выполнялось.
- Update существующих imported-товаров пока не реализован.
- Фото импортируемых товаров будут добавляться вручную через существующую админку.

## Live create-only CSV import application

- Live create-only CSV import выполнен успешно через защищённый Telegram Mini App flow.
- Импорт создал два скрытых товара: `Ророноа Зоро` и `Донкихот Росиант` (`externalId = anime_onepiece_rosinante_001`; текущее отображаемое имя в production записано именно так).
- Импортированные товары получили `PriceList main`, `isActive = false`, `isFeatured = false`, не имеют фотографий и не отображаются покупателю в публичном каталоге.
- Повторный импорт того же CSV теперь должен определяться как `UPDATE` и блокироваться текущей create-only policy, потому что update импортированных товаров ещё не реализован.
- Следующий этап: загрузка обложек и публикация выбранных импортированных товаров либо переход к оформлению заказа.
- После каталога основной приоритет: order flow, адрес доставки, Telegram-уведомления, статусы заказа и тестовая оплата.

## Order flow foundation

- Order flow design — подготовлен на уровне schema, migration SQL и server-side pricing foundation.
- Подготовлена доставка Почтой России: `450 ₽` для заказов только со `STANDARD` / `PREMIUM`, `550 ₽` при наличии хотя бы одной `WALL_PANEL`.
- Подготовлены custom drawing styles: стиль 1 `+690 ₽`, стиль 2 `+790 ₽`, стиль 3 `+990 ₽`.
- Подготовлена скидка `30%` на второе изделие: применяется один раз к самому дешёвому eligible `STANDARD` / `PREMIUM` / `WALL_PANEL`, delivery и custom drawing surcharge в скидке не участвуют.
- Custom image order заложен как сценарий с admin review: `PENDING_REVIEW`, `APPROVED`, `REJECTED`; до проверки администратором такой заказ не должен уходить в оплату.
- Real order creation ещё не реализован: подготовлены schema/migration и расчёт, но API создания заказа не добавлен.
- Payment provider пока не выбран; реальная оплата через ЮKassa / Т-Банк не подключается до отдельного согласования провайдера и доступа.
- Migration `00000000000003_prepare_order_flow` подготовлена, но не применена.

## Order flow migration application

- Order flow foundation подготовлен и зафиксирован в локальном commit `00a863a`.
- Migration `00000000000003_prepare_order_flow` применена успешно в production Supabase.
- Production database поддерживает order snapshots, delivery fields, скидки, custom drawing surcharge и custom image review statuses.
- Server-side pricing module готов для следующего шага quote/order flow.
- Real order creation ещё не реализован: `Order = 0`, `Payment = 0`.
- Следующий шаг: `POST /api/orders/quote` с повторной server-side проверкой цен, доставки, скидки и custom drawing surcharge.
- Payment provider пока не выбран; ЮKassa или Т-Банк не подключаются до отдельного согласования доступа.

## Order quote endpoint

- `POST /api/orders/quote` подготовлен как read-only расчёт корзины без создания `Order` и `Payment`.
- Quote endpoint заново читает активный товар, активную категорию/подкатегорию, активный `PriceList main` и выбранный `PriceListItem`.
- Checkout использует server quote для отображения товаров, доставки Почтой России, скидки, custom drawing surcharge и итоговой суммы.
- Discount rule уточнён после проверки quote: `WALL_PANEL` участвует как физическое изделие, скидка `30%` применяется один раз к самому дешёвому unit в заказе.
- Создание заказа ещё не реализовано: кнопка checkout остаётся отключённой до следующего этапа.
- Оплата ещё не подключена.

## Order creation without online payment

- Order creation без онлайн-оплаты подготовлен локально через `POST /api/orders`.
- Endpoint требует валидный Telegram Mini App `initData`, но не требует admin-доступ.
- Перед записью сервер заново пересчитывает quote и сохраняет snapshot товаров, скидки, доставки, отрисовки и итогов.
- Создаются только `TelegramUser`, `Order`, `OrderItem` и `DeliveryAddress`; `Payment` не создаётся.
- Checkout form собирает контакт, адрес доставки и согласие на обработку данных, затем показывает публичный номер заказа.
- Live создание заказа ещё не выполнялось; `Order = 0`, `Payment = 0` до отдельного production live-теста.
- Payment provider не выбран; Telegram admin notifications остаются следующим этапом после live-теста заказа.

## Live order creation and status message UX

- Первый live-заказ без онлайн-оплаты создан успешно: `KRM-20260601-128352`.
- После live-теста подтверждено: `Order = 1`, `Payment = 0`.
- Онлайн-оплата не подключалась, `Payment` не создавался.
- Замечен UX-баг: success/error сообщения в checkout и админке могли появляться выше текущей позиции экрана.
- Подготовлен UX-hotfix: важные success/error/status блоки автоматически прокручиваются в видимую область.
- Следующий обязательный этап: Telegram admin notifications и/или админка заказов.
- Future feature: управление скидками в админке, включая глобальную скидку и скидки на конкретные товары, требует отдельного проектирования правил.

## Telegram admin notifications for orders

- Telegram admin notifications для новых заказов подготовлены локально.
- Уведомление отправляется администраторам после успешной transaction создания заказа.
- Ошибка отправки уведомления не откатывает и не ломает checkout.
- `NotificationLog` используется для дедупликации успешных уведомлений по заказу и администратору.
- Live Telegram admin notification test выполнен успешно.
- Новый live-заказ `KRM-20260601-805754` создан через checkout, админское уведомление пришло.
- `Payment` по-прежнему не создаётся.
- Следующий этап: админка заказов / управление статусами заказа либо payment-provider planning.
- Payment provider пока не выбран; онлайн-оплата не подключена.

## Admin orders and fulfillment statuses

- Раздел `Заказы` в защищённой Telegram-админке подготовлен после локальной проверки.
- Админка заказов показывает список, карточку заказа, состав, суммы, контакт, доставку и notification summary.
- Подготовлено изменение только fulfillment status заказа; `paymentStatus` остаётся read-only.
- Live status update через Telegram ещё не выполнялся.
- Удаление заказов и создание `Payment` не реализуются.
- Payment provider planning остаётся отдельным будущим этапом.
## Live admin order status verification

- Orders admin panel live-проверен в production после deployment commit `96b5ed0`.
- Раздел `Заказы` открылся в Telegram Mini App и показал оба существующих заказа.
- Заказ `KRM-20260601-805754` открыт в админке; fulfillment status успешно изменён `NEW -> IN_WORK`.
- `paymentStatus` остался read-only и сохранился как `PENDING`; `Payment` не создавался.
- Заказ `KRM-20260601-128352` остался в прежнем состоянии `NEW / PENDING`.
- Status update текущей версии не отправляет Telegram notification клиенту или администратору.
- Следующий этап требует выбора направления: payment provider planning, order status notifications или customer order page.
## Customer order pages

- Customer order pages prepared locally: `/orders` and `/orders/[publicNumber]`.
- Customer API endpoints are read-only and scoped by Telegram initData.
- `GET /api/orders` returns only orders of the current Telegram user.
- `GET /api/orders/[publicNumber]` returns safe not found for missing or чужой order number.
- Checkout success now includes `Открыть заказ` link to the created order page.
- Live customer order page test выполнен: пользователь открыл `Мои заказы` и детальную страницу заказа в Telegram Mini App.
- Кнопка `Связаться` подготовлена как clickable link в отдельный support bot `@karmashopsupportbot`, связанный с CRM BlueSales.
- Ссылка передаёт публичный номер заказа через безопасный `start` parameter; live click test support bot ещё не выполнялся.
- Payment provider remains future work; `Payment` is not created by this stage.

## FAQ / Как заказать

- Подготовлен публичный раздел `/faq` для покупателей: процесс заказа, виды изделий, своя картинка, стили отрисовки, требования к изображению, доставка и связь с менеджером.
- Additive migration `00000000000004_add_faq_sections` применена успешно в production Supabase.
- После migration `FaqSection = 0`: FAQ-секции ещё не создавались и не редактировались.
- Тексты FAQ будут храниться в базе и редактироваться через защищённый раздел админки `FAQ / Как заказать`.
- До заполнения базы публичная страница показывает безопасный default fallback content.
- После применения migration админка сможет показать default sections как редактируемый draft и создать их в базе через обычное сохранение, без seed/bootstrap.
- FAQ нужен перед дальнейшими этапами custom design и payment flow, чтобы покупатель понимал правила до заказа.
- Support bot `@karmashopsupportbot`, подключённый к BlueSales, остаётся каналом связи по вопросам.
- Следующий live-test: открыть production `/faq`, затем в Telegram-админке открыть `FAQ / Как заказать` и сохранить default sections через protected PATCH/upsert.
- Live-проверка FAQ выявила UX/content доработки: верхний intro и нижний CTA должны редактироваться из FAQ-админки.
- Для верхнего intro и нижнего CTA подготовлены reserved FAQ slugs без новой migration: `faq-hero-eyebrow`, `faq-hero`, `faq-contact-cta`.
- FAQ-карточки получили более явный hover/focus/open feedback, чтобы раскрытые разделы визуально не сливались.
- FAQ chrome live-проверен в production после Vercel Ready.
- Верхний FAQ-блок hero/intro и нижний CTA `Остались вопросы?` редактируются из Telegram-админки и корректно отображаются публично.
- FAQ-карточки дают понятный hover/open/active feedback.
- Следующий рекомендуемый крупный этап: custom design flow.

## Custom design flow checkpoint

- Первый рабочий слой custom design flow подготовлен локально: товар `CUSTOM` требует выбор стиля отрисовки и загрузку изображения перед добавлением в корзину.
- Добавлен customer upload endpoint `POST /api/orders/custom-upload` с обычной Telegram Mini App auth через `X-Telegram-Init-Data`.
- Изображения своего дизайна загружаются сервером в private Supabase Storage bucket из `SUPABASE_CUSTOM_ORDER_BUCKET`; публичный URL не возвращается клиенту.
- Quote учитывает доплату за стиль: стиль 1 `+690 ₽`, стиль 2 `+790 ₽`, стиль 3 `+990 ₽`; доплата берется один раз на уникальный `customDesignKey`.
- Order creation сохраняет snapshot custom style, surcharge, `customDesignKey`, private `customImageStoragePath` и review status `PENDING_REVIEW`.
- Checkout сообщает, что свой дизайн сначала проверяется администратором; онлайн-оплата по-прежнему не подключена.
- Admin review UI для custom image пока не реализован и остается следующим отдельным этапом после live-проверки upload/order flow.

## Live custom design checkout verification

- Production live-check after deployment commit `609271d` confirmed the first custom design layer up to checkout.
- Product `Свой дизайн` opened publicly; style №3 was selected and the image uploaded successfully through the protected custom upload flow.
- The custom item was added to cart, and checkout showed the style №3 surcharge: `+990 ₽`.
- No order was created in this checkpoint: `Order = 2`, `Payment = 0`.
- Private custom upload bucket is configured and accessible; the uploaded object was confirmed without recording the full private storage path.
- Next step: create one test custom order to verify saved custom snapshot and `PENDING_REVIEW`.

## Live custom design order verification

- Controlled production custom order was created successfully without online payment: `KRM-20260602-8E3EBA`.
- The order saved custom style №3, custom surcharge `99000`, `customDesignKey`, private custom image storage path, and `customImageReviewStatus = PENDING_REVIEW`.
- Private storage path was confirmed read-only but not recorded in docs because it contains Telegram-scoped path data.
- Current read-only baseline after the user action: `Order = 3`, `Payment = 0`.
- Admin notification log exists for the custom order; no manual Telegram messages were sent during this checkpoint.
- Next step: admin review UI for custom images or payment planning.

## Admin custom image review

- Admin custom image review UI is prepared locally in the protected order detail screen.
- Admin can request a short-lived signed URL for the private custom image through an admin-only endpoint; the raw storage path is not returned to the client UI.
- Review actions support `APPROVED` and `REJECTED` from `PENDING_REVIEW`; reject requires a reason.
- Review update changes only `OrderItem.customImageReviewStatus` and `OrderItem.customImageReviewComment`.
- Order totals, item price snapshots, fulfillment status, payment status and `Payment` rows are not changed by review.
- Live review action has not been performed yet; next live test should approve or reject the existing custom order image.

## Live admin custom image review verification

- Production live-test after commit `84977b0` confirmed the admin custom image review UI.
- In order `KRM-20260602-8E3EBA`, the `Изображение на проверку` block rendered correctly.
- Admin opened the private uploaded image through a short-lived signed URL; the raw private storage path was not shown in UI.
- Review action `PENDING_REVIEW -> APPROVED` completed successfully.
- Read-only checkpoint after the user action: `Order = 3`, `Payment = 0`; totals, item price snapshots, fulfillment status and payment status stayed unchanged.
- Payment integration remains future work.

## YooKassa payment planning foundation

- YooKassa payment foundation is prepared locally without live provider calls.
- New customer prepare endpoint validates Telegram ownership and payment eligibility, then returns a safe disabled-provider response.
- No `Payment` row is created by the foundation endpoint.
- Regular pending orders are eligible for future payment immediately.
- Custom orders are eligible only after all custom images are `APPROVED`; `PENDING_REVIEW` and `REJECTED` custom items block payment.
- `.env.example` documents `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_RETURN_URL`, and `YOOKASSA_WEBHOOK_SECRET` without values.
- Live YooKassa payment creation, webhook handling and idempotency execution remain future work.

## YooKassa redirect payment creation

- Controlled YooKassa payment creation is prepared locally for eligible customer orders.
- `POST /api/orders/[publicNumber]/payment/prepare` now creates a YooKassa redirect payment only after Telegram customer ownership and payment eligibility checks pass.
- A `Payment` row is created only after a successful mocked/provider response and stores provider id, amount, status, idempotency key and confirmation URL.
- Existing pending YooKassa `Payment` with confirmation URL is reused for the order to avoid duplicate redirects.
- Customer order detail can show the active `Перейти к оплате` button when provider env is configured and the order is eligible.
- Real payment creation is additionally gated by `YOOKASSA_PAYMENTS_ENABLED=true`; shop id/secret/return URL alone do not enable the button or provider call.
- Webhook handling remains future work; successful payment finalization must not rely on redirect alone.
- Development checks use mocked YooKassa calls only. No live payment test, production `Payment` creation or webhook connection is performed in this stage.

## YooKassa receipt requirement

- Live diagnostics showed that the current YooKassa shop requires `receipt`; provider returned `invalid_request` for missing/illegal receipt.
- Receipt builder is prepared locally and adds receipt data to the YooKassa payment payload before any provider call.
- Receipt items are built from immutable `OrderItem` snapshots: physical goods as `commodity`, custom drawing surcharge as `service`, and delivery as `service`.
- Discounts are allocated into commodity item amounts; no negative receipt lines are used, and receipt item totals must equal `Order.totalKopecks`.
- `.env.example` documents `YOOKASSA_VAT_CODE="1"`; default `1` is used only when env is absent and must be confirmed for the shop before the next live retry.
- Next step: keep `YOOKASSA_PAYMENTS_ENABLED=false`, deploy the receipt fix after review, then run one controlled payment retry with the flag explicitly enabled.

## Live YooKassa redirect payment verification

- Production live-test confirmed YooKassa redirect payment creation on order `KRM-20260604-59DE22`.
- YooKassa accepted the receipt payload, returned a confirmation URL, and the payment page opened for the customer.
- Local `Payment` row was created for the order; no duplicate payment rows were found for this order.
- `Order.paymentStatus` remains `PENDING` because webhook/provider status finalization is not implemented yet.
- Previous `KRM-20260602-8E3EBA` idempotence-key issue is a known test-order artifact from the old payload without receipt.
- Next safe step: YooKassa webhook implementation or a small idempotence key version cleanup before further payment retries.

## YooKassa webhook foundation

- Webhook foundation is prepared locally; webhook is not registered in the YooKassa cabinet yet.
- Endpoint planned for YooKassa cabinet: `https://karma-miniapp.vercel.app/api/yookassa/webhook?token=<secret>`.
- Webhook requires `YOOKASSA_WEBHOOK_SECRET`; missing or wrong secret blocks processing before database updates.
- Supported events: `payment.succeeded` and `payment.canceled`.
- `payment.succeeded` updates local `Payment.status` and `Order.paymentStatus = PAID`.
- `payment.canceled` updates local `Payment.status` but does not mark the order paid.
- Unknown events, missing payments and validation mismatches are ignored safely for retry semantics and logged without secrets/full payload.
- No live webhook test, provider API call, migration, seed or bootstrap is part of this stage.

## YooKassa webhook registration readiness

- `YOOKASSA_WEBHOOK_SECRET` has been added to Vercel Production env and the app was redeployed after the env change.
- YooKassa webhook URL has been registered manually in the provider cabinet without exposing the token in docs.
- Subscribed events: `payment.succeeded` and `payment.canceled`.
- Live webhook event has not been tested yet.
- Current payment remains pending until a real webhook event is delivered and processed.
- Next safe step: controlled webhook live test by completing or canceling one test payment, then read-only verification of status sync.

## Live YooKassa payment and webhook verification

- Controlled production payment test passed on order `KRM-20260604-28B88F`.
- Payment amount was `460 ₽`; YooKassa merchant cabinet showed the payment.
- YooKassa `payment.succeeded` webhook synchronized local statuses: `Payment.status = PAID`, `Order.paymentStatus = PAID`.
- The order has one YooKassa `Payment` row; no duplicate local payments were found.
- Manual refund was performed in the YooKassa cabinet after the payment test.
- Local status did not change after refund, which is expected for the current scope: refund webhook/status handling is not implemented yet.
- Next safe task: design `refund.succeeded` handling and local refunded/cancelled payment state semantics.

## UI/content audit foundation

- UI/content audit started after stable checkout, admin, custom design and YooKassa webhook flow.
- Existing admin-managed content: StoreSettings covers main hero/contact/delivery basics; FaqSection covers `/faq`, FAQ chrome and bottom CTA with active/default draft behavior.
- Hardcoded business/content copy found outside current admin editing: checkout help text, custom design explanation, payment guidance text, support CTA wording, order empty states and some delivery explanations.
- System copy stays in code: validation errors, form labels, enum status labels, technical diagnostics, protected admin endpoint messages and webhook/payment safety errors.
- No migration is added in this pass. A future editable content layer such as `ContentBlock` is recommended for hideable banners/help blocks that do not fit StoreSettings or FAQ.
- Small UI fix prepared: paid orders now show clear paid-state messaging in customer order detail and admin order detail; pending payment label is neutral `Ожидает оплаты`.
- Payment, checkout, custom design and admin order flows remain otherwise untouched.

## ContentBlock foundation

- ContentBlock foundation is prepared locally for admin-managed hideable interface text blocks.
- Additive migration `00000000000005_add_content_blocks` is prepared but not applied.
- Default draft blocks: `checkout-delivery-help`, `checkout-custom-review-help`, `payment-disabled-guidance`, `payment-pending-guidance`, `custom-design-help`, `support-cta`, `orders-empty-state`.
- Admin section `Блоки интерфейса` can load default drafts and save them by protected upsert after migration.
- Public UI integration is intentionally small: checkout delivery/custom review guidance, customer payment-disabled guidance, support CTA and custom design explanation.
- System copy remains in code: labels, validation/safety errors, enum labels, protected endpoint messages and diagnostics.
- Full redesign and broader content modeling remain separate future stages.
- ContentBlock migration `00000000000005_add_content_blocks` was applied successfully to production Supabase.
- Current production state after migration: `ContentBlock = 0`; default blocks were not created manually.
- Next live test: open admin `Блоки интерфейса`, verify default editable drafts, save/upsert, then check public fallback/active/inactive behavior.

## Home ContentBlock integration

- ContentBlock live-test passed in production: admin section `Блоки интерфейса` opens, default drafts appear, save/upsert works, and `isActive` hides connected public blocks.
- Home/storefront hero copy integration is prepared without a new migration.
- New home default draft blocks: `home-hero-eyebrow`, `home-hero-title`, `home-hero-subtitle`, `home-hero-primary-cta`, `home-hero-secondary-cta`.
- The blue hero eyebrow `НОЧНИКИ ПО ТВОЕЙ ИДЕЕ` is now managed through ContentBlock and can be hidden with `isActive`.
- Hero title/subtitle keep StoreSettings as fallback, while active ContentBlock rows can override them.
- Hero CTA text is ContentBlock-managed; existing actions stay unchanged.
- Full visual redesign remains a separate future stage.

## Live Home ContentBlock verification

- Home hero ContentBlock integration was live-checked in production after commit `6190132`.
- Admin `Блоки интерфейса` works for the home hero blocks.
- `home-hero-eyebrow` controls the blue hero eyebrow on the storefront home page.
- Editing the eyebrow through ContentBlock works.
- `isActive` hides the eyebrow block on the public home page.
- Hero title/subtitle and CTA labels are available through ContentBlock defaults/overrides.
- CTA actions did not change: catalog still opens `/catalog`, and custom design still opens the existing product modal.
- Full visual redesign remains a separate future stage.

## ContentBlock cleanup

- ContentBlock cleanup is prepared without a new migration.
- Newly connected default draft blocks: `catalog-intro-help`, `catalog-empty-state`, `cart-empty-state`, `orders-intro-help`, `custom-product-features-help`, `custom-upload-requirements-help`.
- Existing `orders-empty-state` is now connected to the customer orders empty state.
- Connected UI surfaces: catalog intro/empty state, cart empty state, customer orders intro/empty state, product modal feature bullets and custom upload requirements.
- Missing rows use code defaults; inactive saved rows hide the connected public block.
- System copy remains code-owned: form labels, validation errors, technical endpoint messages, enum/status labels and core action buttons.
- Payment, webhook, pricing, checkout submit and order status logic remain untouched.
- Full visual redesign remains a separate future stage.

## Live ContentBlock cleanup verification

- ContentBlock cleanup was live-checked in production after commit `f750b3b`.
- New cleanup blocks appeared in admin `Блоки интерфейса`.
- Editing works for catalog/cart/orders/custom help blocks.
- `isActive` hides connected public blocks.
- Checked admin-managed slugs: `catalog-intro-help`, `catalog-empty-state`, `cart-empty-state`, `orders-intro-help`, `custom-product-features-help`, `custom-upload-requirements-help`.
- Payment, order and webhook runtime logic did not change.
- Next recommended stage: design system / visual redesign foundation.

## Design system foundation

- UI audit started for the stable storefront/admin surface.
- Repeated patterns to unify: buttons, glass cards/surfaces, status badges, section headers, empty states and help/info blocks.
- Lightweight shared primitives are prepared without new UI libraries: button helpers, `Surface`, `StatusBadge`, `EmptyState` and `SectionHeading`.
- Minimal integration scope: catalog empty state, cart empty state and customer order payment badge.
- Redesign order should stay staged: storefront surfaces first, then checkout/order detail, then admin panels.
- Payment, webhook, order creation, pricing and status mutation runtime stay untouched in this step.

## Live design system foundation smoke-check

- Design system foundation commit `5d23823` deployed successfully.
- Production `/catalog`, `/cart` and `/orders` were visually smoke-checked after Vercel Ready.
- `EmptyState` and `StatusBadge` minimal integrations did not break the checked UX.
- Runtime payment/order/webhook logic remained untouched.
- Next stage: KARMA Neon Mask visual direction / storefront redesign foundation.

## KARMA Neon Mask visual direction foundation

- Start KARMA Neon Mask visual direction without full redesign.
- Add reusable visual tokens for violet night background, radial glow, neon border, glass surfaces, premium shadow, motion-safe hover/tap and neon text.
- Replace the temporary abstract mask placeholder with the real brand asset `/brand/karma-mask.svg`.
- Keep `BrandMaskWatermark` as a decorative watermark/background accent, not primary content.
- Minimal integration scope: home hero background/watermark and shared empty-state watermark.
- Keep ContentBlock logic, CTA actions, payment/order/webhook runtime and production data unchanged.
- Next stage after review: storefront redesign foundation in small slices.

## Live real KARMA mask asset smoke-check

- Production smoke-check after Vercel Ready confirmed the real KARMA mask asset.
- `BrandMaskWatermark` uses `public/brand/karma-mask.svg`; abstract placeholder is removed.
- Home hero and empty states were visually checked.
- Watermark remains decorative and non-interactive.
- Payment/order/webhook runtime logic did not change.
- Next stage: storefront/home redesign using Neon Mask tokens and the real mask asset.

## Home hero Neon Mask redesign

- Prepare staged visual redesign of the storefront hero without changing business logic.
- Apply deep violet/radial glow background, real mask watermark, glass text surface, gradient headline and shared CTA button styles.
- Adjust hero layering so the background artwork stays sharp, dim/glow overlays keep text readable, the real mask watermark sits above the problematic glass blur composition, and the text/CTA layer remains on top and clickable.
- Remove the duplicate inner hero mask accent; keep one large KARMA watermark shifted to the right.
- Use uploaded StoreSettings logo consistently in the shared public header across catalog, cart, checkout, orders, order detail and FAQ, with the existing `K / KARMA` fallback.
- Preserve all home hero ContentBlock slugs and StoreSettings title/subtitle fallback.
- Preserve CTA behavior: catalog link and custom design modal.
- Do not touch checkout, orders, payment, webhook, cart logic or production data.
- Next staged redesign: catalog/product cards.

## Live visual fixes verification

- Live smoke-check passed after visual fixes commit `7580fed` reached Vercel Ready.
- Home hero now shows one large KARMA mask watermark; the duplicate inner mask layer is gone.
- Mask placement is visually acceptable on Telegram/mobile, with text and CTA remaining readable and clickable.
- Uploaded StoreSettings logo is consistent on home, catalog, cart, checkout, orders, order detail and FAQ.
- CTA actions stayed intact: catalog opens `/catalog`, and custom design still opens the existing modal.
- Payment, order and webhook runtime remained untouched.
- Next staged redesign: catalog/product cards.

## Catalog/product cards Neon Mask redesign

- Prepare staged visual redesign for the catalog and product cards without schema changes.
- Catalog intro keeps `catalog-intro-help` ContentBlock behavior and now sits on a glass/neon mask surface with subtle violet/cyan glow.
- Category filters keep the same filtering logic and receive neon pill styling with hover/tap feedback.
- Product cards become image-first glass/neon surfaces with readable subcategory/custom badges, price surfaces, glow borders and subtle image hover scale.
- Catalog empty state remains managed through `catalog-empty-state` and shared `EmptyState`.
- Product modal open behavior, product visibility, category filtering, pricing, cart, checkout, payment, webhook and order runtime stay unchanged.
- Next staged redesign after review: product modal or checkout/order detail.

## Live catalog/product cards smoke-check

- Catalog/product cards redesign commit `6a45197` reached Vercel Ready and was visually smoke-checked in production on Telegram/mobile.
- `/catalog` now shows the glass/neon catalog header, neon category pills and image-first glass/neon product cards.
- Product names, prices, images, badges, price panels, glow borders and hover/tap feedback are readable and usable.
- Search, category filtering and product modal opening were visually checked and remained intact.
- Custom product remains visible/openable where expected.
- Cart, checkout, payment, webhook, order and custom runtime logic remained untouched.
- Next staged redesign: product modal.

## Product modal Neon Mask redesign

- Prepare staged visual redesign for the product modal without schema changes or production writes.
- Modal shell now uses a darker glass/neon surface with restrained violet/cyan glow and mobile-friendly scroll.
- Product preview area gets a neon frame while preserving gallery image selection.
- Product title, category/subcategory badges, feature rows, variant selectors, size selectors and custom style options receive clearer selected states and tap-friendly neon card styling.
- Custom design help/upload requirements remain ContentBlock-driven through `custom-design-help`, `custom-product-features-help` and `custom-upload-requirements-help`.
- Add-to-cart footer gets a clearer price panel and stronger primary CTA styling.
- Variant selection, price calculation, custom upload endpoint/validation, customDesignKey, custom surcharge, add-to-cart payload, cart, checkout, payment, webhook and order runtime remain unchanged.
- Next staged redesign after review: cart/checkout or order detail.

## Catalog chips and image lightbox bugfix

- Fix catalog category chips clipping/hover border regression without changing filter/search logic.
- Category chip row now has safe horizontal padding so the last chip is not clipped.
- Chip borders remain stable across normal, hover, active and focus-visible states.
- Add lightweight shared `ImageLightbox` for opening images large without new UI libraries.
- Product modal images can be opened large by customers.
- Admin product gallery images can be opened large.
- Admin custom review images open through the existing signed URL only; raw private storage paths remain hidden.
- Payment, order, webhook, storage policy and production data remain untouched.

## Live product modal and image lightbox smoke-check

- Combined commit `b2222d8` reached Vercel Ready and was smoke-checked in production on Telegram/mobile and admin.
- Product modal redesign opens correctly.
- Category chips no longer clip at the right edge; hover/focus/border states are visually acceptable.
- User can open product main/gallery images in `ImageLightbox`, and the lightbox closes correctly.
- Regular product selection and add-to-cart still work.
- Custom design style selection, upload, surcharge and add-to-cart still work.
- Admin product gallery images open in `ImageLightbox`.
- Admin custom review image opens only through the protected signed URL flow; raw private storage path is not exposed.
- Checkout, payment, order and webhook runtime remained untouched.
- Next staged redesign: cart + checkout.

## Reference-inspired dark neon gaming UI direction pass

- Prepare a visual-only dark neon gaming direction pass inspired by the reference without copying its composition or assets.
- Deepen the global background/tokens, TopBar, BottomNav and shared UI primitives with restrained violet/cyan glow and digital-glass surfaces.
- Slightly align home, product card and product visual presentation while preserving ContentBlock, catalog and product-modal behavior.
- Preserve the uploaded StoreSettings logo, cart action, navigation routes, mobile safe area and accessibility states.
- Keep product, custom, cart, checkout, payment, webhook and order runtime untouched.
- Next staged redesign: cart + checkout; do not start it in this pass.

## Dark neon visual polish bugfix

- Remove the problematic skull/mask-and-sword decorative layer from the home Hero while keeping the shared mask asset available elsewhere.
- Separate the Hero image into a stable aspect-ratio media zone and place copy/CTA in an independent dark glass panel for reliable mobile resizing.
- Soften product card hover to a short, subtle translate/brightness response without scale or harsh cyan/white border transitions.
- Remove shine/scan-line overlays from product photos and use contained image fit in cards and modal previews/thumbnails.
- Preserve ContentBlock, CTA, product modal, lightbox, cart and all business/runtime contracts.

## Unified product cards, clean cart empty state and FAQ polish

- Unify each product into one outer dark/violet card surface; remove the image frame, duplicate image caption and framed badge/price islands.
- Keep contained product photography on a dark integrated media zone with calm 150ms hover and no scanline, shine, scale or cyan/white ring.
- Disable the shared decorative mask only for the empty cart state while preserving its managed copy and catalog CTA.
- Align FAQ hero, custom-info panel, accordion cards and contact CTA with restrained KARMA dark neon surfaces.
- Preserve FAQ sections/slugs, cart store/CTA, product modal/lightbox and all product/custom/checkout/payment/order runtime.
- Next staged redesign remains cart + checkout; do not start it in this bugfix.

## Customer orders dark neon visual alignment

- Align `/orders` with cohesive dark/violet glass cards, integrated fulfillment/payment badges and a compact neon detail CTA.
- Keep long public order numbers readable with compact mono text and safe wrapping; reserve bottom padding above BottomNav.
- Align `/orders/[publicNumber]` header, payment, status, item, total, delivery and support surfaces without changing data or handlers.
- Use a watermark-free shared EmptyState for no orders while preserving its managed catalog CTA.
- Preserve customer Telegram scoping, status/payment labels, payment prepare behavior and support deep-link contracts.
- Next staged redesign remains cart + checkout.
