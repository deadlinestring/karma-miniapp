"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageUp, Plus, Save, Search, Star, Trash2 } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type ProductType = "REGULAR" | "CUSTOM";
type ProductStatus = "all" | "active" | "hidden" | "featured";

type AdminProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  sortOrder: number;
};

type AdminTaxonomy = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  productType: ProductType;
  isActive: boolean;
  isFeatured: boolean;
  category: AdminTaxonomy;
  subcategory: AdminTaxonomy;
  priceList: { id: string; name: string; isActive: boolean; activeItemCount: number } | null;
  coverImage: AdminProductImage | null;
  galleryImageCount: number;
};

type AdminProduct = AdminProductListItem & {
  subcategoryId: string;
  images: AdminProductImage[];
  readiness: {
    hasCover: boolean;
    categoryActive: boolean;
    subcategoryActive: boolean;
    priceListActive: boolean;
    priceListHasItems: boolean;
    canPublish: boolean;
  };
};

type CategoryTree = {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    subcategories: Array<{ id: string; categoryId: string; name: string; slug: string; isActive: boolean }>;
  }>;
};

type ProductListResponse = {
  products: AdminProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type ViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; productId: string };

export function AdminProductsPanel({ initData }: { initData: string }) {
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [categories, setCategories] = useState<CategoryTree["categories"]>([]);
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [status, setStatus] = useState<ProductStatus>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useScrollIntoViewOnChange(message ?? error);

  useEffect(() => {
    let isMounted = true;

    loadCategoryTree(initData)
      .then((tree) => {
        if (isMounted) {
          setCategories(tree.categories);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить категории.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    loadProducts(initData, { search, categoryId, subcategoryId, status, page })
      .then((data) => {
        if (isMounted) {
          setProducts(data.products);
          setTotalPages(data.totalPages);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить товары.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData, search, categoryId, subcategoryId, status, page]);

  useEffect(() => {
    if (view.mode !== "edit") {
      setProduct(null);
      return;
    }

    let isMounted = true;
    setIsBusy(true);
    loadProduct(initData, view.productId)
      .then((data) => {
        if (isMounted) {
          setProduct(data);
          setIsBusy(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить товар.");
          setIsBusy(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData, view]);

  const filteredSubcategories = useMemo(() => {
    if (!categoryId) {
      return categories.flatMap((category) => category.subcategories);
    }

    return categories.find((category) => category.id === categoryId)?.subcategories ?? [];
  }, [categories, categoryId]);

  function refreshList() {
    setPage((current) => current);
    loadProducts(initData, { search, categoryId, subcategoryId, status, page })
      .then((data) => {
        setProducts(data.products);
        setTotalPages(data.totalPages);
      })
      .catch(() => undefined);
  }

  function openList() {
    setView({ mode: "list" });
    setProduct(null);
    refreshList();
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">catalog products</p>
        <h2 className="mt-2 text-xl font-black text-white">Товары</h2>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Создавайте скрытые карточки, редактируйте описание, выбирайте подкатегорию и публикуйте товар после загрузки обложки.
        </p>
      </div>

      <div ref={statusRef}>
        {message ? <p className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      {view.mode === "list" ? (
        <ProductListView
          products={products}
          categories={categories}
          filteredSubcategories={filteredSubcategories}
          search={search}
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          status={status}
          page={page}
          totalPages={totalPages}
          isLoading={isLoading}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onCategoryChange={(value) => {
            setCategoryId(value);
            setSubcategoryId("");
            setPage(1);
          }}
          onSubcategoryChange={(value) => {
            setSubcategoryId(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onCreate={() => {
            setMessage(null);
            setError(null);
            setView({ mode: "create" });
          }}
          onEdit={(productId) => {
            setMessage(null);
            setError(null);
            setView({ mode: "edit", productId });
          }}
          onPageChange={setPage}
        />
      ) : null}

      {view.mode === "create" ? (
        <ProductCreateView
          categories={categories}
          onBack={openList}
          onCreate={async (payload) => {
            setIsBusy(true);
            setMessage(null);
            setError(null);
            try {
              const created = await createProduct(initData, payload);
              setMessage("Товар создан скрытым. Загрузите обложку и затем включите показ в магазине.");
              setView({ mode: "edit", productId: created.id });
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "Не удалось создать товар.");
            } finally {
              setIsBusy(false);
            }
          }}
          isBusy={isBusy}
        />
      ) : null}

      {view.mode === "edit" && product ? (
        <ProductEditView
          initData={initData}
          product={product}
          categories={categories}
          isBusy={isBusy}
          onBack={openList}
          onProductChange={(nextProduct) => {
            setProduct(nextProduct);
            setMessage("Товар обновлен.");
          }}
          onError={setError}
          onBusyChange={setIsBusy}
        />
      ) : null}
    </section>
  );
}

function ProductListView({
  products,
  categories,
  filteredSubcategories,
  search,
  categoryId,
  subcategoryId,
  status,
  page,
  totalPages,
  isLoading,
  onSearchChange,
  onCategoryChange,
  onSubcategoryChange,
  onStatusChange,
  onCreate,
  onEdit,
  onPageChange
}: {
  products: AdminProductListItem[];
  categories: CategoryTree["categories"];
  filteredSubcategories: CategoryTree["categories"][number]["subcategories"];
  search: string;
  categoryId: string;
  subcategoryId: string;
  status: ProductStatus;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onStatusChange: (value: ProductStatus) => void;
  onCreate: () => void;
  onEdit: (productId: string) => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-5">
      <button type="button" onClick={onCreate} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night">
        <Plus size={17} />
        Добавить товар
      </button>

      <div className="mt-5 grid gap-3 rounded-3xl border border-white/10 bg-night/60 p-4">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/7 px-3">
          <Search size={16} className="text-white/42" />
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск по названию" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32" />
        </label>
        <select value={categoryId} onChange={(event) => onCategoryChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={subcategoryId} onChange={(event) => onSubcategoryChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
          <option value="">Все подкатегории</option>
          {filteredSubcategories.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as ProductStatus)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
          <option value="all">Все</option>
          <option value="active">Показываются</option>
          <option value="hidden">Скрыты</option>
          <option value="featured">Популярные</option>
        </select>
      </div>

      {isLoading ? <p className="mt-5 text-sm text-white/56">Загружаем товары...</p> : null}

      <div className="mt-5 grid gap-3">
        {products.map((product) => (
          <button key={product.id} type="button" onClick={() => onEdit(product.id)} className="grid grid-cols-[84px_1fr] gap-3 rounded-3xl border border-white/10 bg-night/60 p-3 text-left transition hover:border-neon-cyan/30">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/7">
              {product.coverImage ? <img src={product.coverImage.url} alt={product.name} className="h-24 w-full object-cover" /> : <div className="flex h-24 items-center justify-center text-xs text-white/32">нет фото</div>}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-white/45">
                {product.category.name} / {product.subcategory.name}
              </p>
              <h3 className="mt-1 line-clamp-2 text-base font-black text-white">{product.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge>{product.isActive ? "Показывается" : "Скрыт"}</StatusBadge>
                {product.isFeatured ? <StatusBadge>Популярный</StatusBadge> : null}
              </div>
              <span className="mt-3 inline-flex rounded-2xl border border-neon-cyan/25 px-3 py-1 text-xs font-bold text-neon-cyan">
                Редактировать
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-10 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white disabled:opacity-40">
          Назад
        </button>
        <span className="text-sm text-white/56">
          {page} / {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-10 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white disabled:opacity-40">
          Далее
        </button>
      </div>
    </div>
  );
}

function ProductCreateView({
  categories,
  isBusy,
  onBack,
  onCreate
}: {
  categories: CategoryTree["categories"];
  isBusy: boolean;
  onBack: () => void;
  onCreate: (payload: { name: string; description: string; subcategoryId: string; productType: ProductType }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const subcategories = categories.find((category) => category.id === categoryId)?.subcategories ?? [];
  const [subcategoryId, setSubcategoryId] = useState(subcategories[0]?.id ?? "");
  const [productType, setProductType] = useState<ProductType>("REGULAR");

  useEffect(() => {
    const selectedCategory = categories.find((category) => category.id === categoryId) ?? categories[0];

    if (selectedCategory && selectedCategory.id !== categoryId) {
      setCategoryId(selectedCategory.id);
      return;
    }

    const hasSelectedSubcategory = selectedCategory?.subcategories.some((subcategory) => subcategory.id === subcategoryId);

    if (!hasSelectedSubcategory) {
      setSubcategoryId(selectedCategory?.subcategories[0]?.id ?? "");
    }
  }, [categories, categoryId, subcategoryId]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate({ name, description, subcategoryId, productType });
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
        <ArrowLeft size={16} />
        К списку товаров
      </button>
      <h3 className="mt-4 text-xl font-black text-white">Новый товар</h3>
      <p className="mt-2 text-sm leading-6 text-white/58">
        Новый товар создается скрытым. После добавления загрузите обложку и включите показ в магазине.
      </p>
      <ProductFields
        name={name}
        description={description}
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        productType={productType}
        categories={categories}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onCategoryChange={setCategoryId}
        onSubcategoryChange={setSubcategoryId}
        onProductTypeChange={setProductType}
      />
      <button type="submit" disabled={isBusy || !subcategoryId} className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-50">
        <Plus size={17} />
        Создать товар
      </button>
    </form>
  );
}

function ProductEditView({
  initData,
  product,
  categories,
  isBusy,
  onBack,
  onProductChange,
  onError,
  onBusyChange
}: {
  initData: string;
  product: AdminProduct;
  categories: CategoryTree["categories"];
  isBusy: boolean;
  onBack: () => void;
  onProductChange: (product: AdminProduct) => void;
  onError: (error: string | null) => void;
  onBusyChange: (isBusy: boolean) => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [categoryId, setCategoryId] = useState(product.category.id);
  const [subcategoryId, setSubcategoryId] = useState(product.subcategoryId);
  const [productType, setProductType] = useState<ProductType>(product.productType);
  const [isActive, setIsActive] = useState(product.isActive);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);

  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setCategoryId(product.category.id);
    setSubcategoryId(product.subcategoryId);
    setProductType(product.productType);
    setIsActive(product.isActive);
    setIsFeatured(product.isFeatured);
  }, [product]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBusyChange(true);
    onError(null);
    try {
      const updated = await updateProduct(initData, product.id, {
        name,
        description,
        subcategoryId,
        productType,
        isActive,
        isFeatured
      });
      onProductChange(updated);
    } catch (requestError) {
      onError(requestError instanceof Error ? requestError.message : "Не удалось сохранить товар.");
    } finally {
      onBusyChange(false);
    }
  }

  async function uploadImage(kind: "cover" | "gallery") {
    const file = kind === "cover" ? coverFile : galleryFile;

    if (!file) {
      onError("Выберите изображение JPG, PNG или WEBP.");
      return;
    }

    onBusyChange(true);
    onError(null);
    try {
      const updated = await uploadProductImage(initData, product.id, kind, file);
      onProductChange(updated);
      if (kind === "cover") {
        setCoverFile(null);
      } else {
        setGalleryFile(null);
      }
    } catch {
      onError("Не удалось загрузить изображение.");
    } finally {
      onBusyChange(false);
    }
  }

  async function setCover(imageId: string) {
    onBusyChange(true);
    onError(null);
    try {
      onProductChange(await setProductCover(initData, product.id, imageId));
    } catch {
      onError("Не удалось назначить главную фотографию.");
    } finally {
      onBusyChange(false);
    }
  }

  async function deleteImage(image: AdminProductImage) {
    if (image.isCover || !window.confirm("Удалить это фото из карточки товара?")) {
      return;
    }

    onBusyChange(true);
    onError(null);
    try {
      onProductChange(await deleteProductImage(initData, product.id, image.id));
    } catch {
      onError("Не удалось удалить фото.");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="mt-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
        <ArrowLeft size={16} />
        К списку товаров
      </button>
      <form onSubmit={save} className="mt-5 rounded-3xl border border-white/10 bg-night/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-black text-white">{product.name}</h3>
          <StatusBadge>{product.isActive ? "Показывается" : "Скрыт"}</StatusBadge>
          {product.isFeatured ? <StatusBadge>Популярный</StatusBadge> : null}
        </div>
        <p className="mt-2 text-xs text-white/42">/{product.slug}</p>
        <p className="mt-1 text-xs text-white/48">Служебный адрес сохраняется после переименования.</p>
        <p className="mt-3 text-sm text-white/58">
          Прайс: {product.priceList?.name ?? "не назначен"} {product.priceList?.isActive ? "" : "(неактивен)"}
        </p>
        <ProductReadiness product={product} />
        <ProductFields
          name={name}
          description={description}
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          productType={productType}
          categories={categories}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onCategoryChange={(value) => {
            setCategoryId(value);
            setSubcategoryId(categories.find((category) => category.id === value)?.subcategories[0]?.id ?? "");
          }}
          onSubcategoryChange={setSubcategoryId}
          onProductTypeChange={setProductType}
        />
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/7 p-3">
          <label className="flex items-center justify-between gap-3 text-sm font-bold text-white">
            Показывать в магазине
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm font-bold text-white">
            Показывать в популярных
            <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
          </label>
        </div>
        <button type="submit" disabled={isBusy} className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-50">
          <Save size={17} />
          Сохранить
        </button>
      </form>

      <ProductImagesEditor
        product={product}
        coverFile={coverFile}
        galleryFile={galleryFile}
        isBusy={isBusy}
        onCoverFileChange={setCoverFile}
        onGalleryFileChange={setGalleryFile}
        onUploadCover={() => uploadImage("cover")}
        onUploadGallery={() => uploadImage("gallery")}
        onSetCover={setCover}
        onDeleteImage={deleteImage}
      />
    </div>
  );
}

function ProductFields({
  name,
  description,
  categoryId,
  subcategoryId,
  productType,
  categories,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onProductTypeChange
}: {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  productType: ProductType;
  categories: CategoryTree["categories"];
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onProductTypeChange: (value: ProductType) => void;
}) {
  const subcategories = categories.find((category) => category.id === categoryId)?.subcategories ?? [];

  return (
    <div className="mt-4 grid gap-3">
      <input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="Название товара" className="h-11 rounded-2xl border border-white/10 bg-night/70 px-3 text-sm text-white outline-none focus:border-neon-cyan/60" />
      <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Описание" rows={5} className="resize-none rounded-2xl border border-white/10 bg-night/70 px-3 py-3 text-sm text-white outline-none focus:border-neon-cyan/60" />
      <select value={categoryId} onChange={(event) => onCategoryChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select value={subcategoryId} onChange={(event) => onSubcategoryChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
        {subcategories.map((subcategory) => (
          <option key={subcategory.id} value={subcategory.id}>
            {subcategory.name}
          </option>
        ))}
      </select>
      <select value={productType} onChange={(event) => onProductTypeChange(event.target.value as ProductType)} className="h-11 rounded-2xl border border-white/10 bg-night px-3 text-sm text-white">
        <option value="REGULAR">Обычный товар</option>
        <option value="CUSTOM">Свой дизайн</option>
      </select>
    </div>
  );
}

function ProductReadiness({ product }: { product: AdminProduct }) {
  const checks = [
    { ok: product.readiness.hasCover, text: "главная фотография" },
    { ok: product.readiness.categoryActive, text: "категория активна" },
    { ok: product.readiness.subcategoryActive, text: "подкатегория активна" },
    { ok: product.readiness.priceListActive && product.readiness.priceListHasItems, text: "активный основной прайс" }
  ];

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/7 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-neon-cyan">готовность к публикации</p>
      <div className="mt-2 grid gap-1">
        {checks.map((check) => (
          <p key={check.text} className={`text-sm ${check.ok ? "text-white/70" : "text-neon-pink"}`}>
            {check.ok ? "✓" : "•"} {check.text}
          </p>
        ))}
      </div>
    </div>
  );
}

function ProductImagesEditor({
  product,
  coverFile,
  galleryFile,
  isBusy,
  onCoverFileChange,
  onGalleryFileChange,
  onUploadCover,
  onUploadGallery,
  onSetCover,
  onDeleteImage
}: {
  product: AdminProduct;
  coverFile: File | null;
  galleryFile: File | null;
  isBusy: boolean;
  onCoverFileChange: (file: File | null) => void;
  onGalleryFileChange: (file: File | null) => void;
  onUploadCover: () => void;
  onUploadGallery: () => void;
  onSetCover: (imageId: string) => void;
  onDeleteImage: (image: AdminProductImage) => void;
}) {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  return (
    <>
    <div className="mt-5 rounded-3xl border border-white/10 bg-white/7 p-4">
      <h3 className="text-lg font-black text-white">Фотографии товара</h3>
      <p className="mt-1 text-sm text-white/58">JPG, PNG или WEBP, до 4 МБ. Главную обложку нельзя удалить, пока не выбрана другая.</p>
      <UploadBox title="Новая обложка" buttonText="Загрузить новую обложку" file={coverFile} disabled={isBusy} onFileChange={onCoverFileChange} onUpload={onUploadCover} />
      <UploadBox title="Фото в галерею" buttonText="Добавить фото в галерею" file={galleryFile} disabled={isBusy} onFileChange={onGalleryFileChange} onUpload={onUploadGallery} />
      <div className="mt-5 grid gap-3">
        {product.images.map((image) => (
          <div key={image.id} className="rounded-3xl border border-white/10 bg-night/60 p-3">
            <button
              type="button"
              onClick={() => setLightboxImage({ src: image.url, alt: image.altText ?? product.name })}
              className="relative block w-full overflow-hidden rounded-2xl border border-white/10 bg-night transition hover:border-neon-cyan/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan"
              aria-label="Открыть фотографию товара крупно"
            >
              <img src={image.url} alt={image.altText ?? product.name} className="h-48 w-full object-cover" />
              {image.isCover ? <span className="absolute left-3 top-3 rounded-full bg-neon-cyan px-3 py-1 text-xs font-black text-night">Главная</span> : null}
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              {image.isCover ? (
                <span className="rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-xs text-white/52">Сначала выберите другую главную фотографию</span>
              ) : (
                <>
                  <button type="button" disabled={isBusy} onClick={() => onSetCover(image.id)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 text-xs font-black text-neon-cyan disabled:opacity-50">
                    <Star size={15} />
                    Сделать главной
                  </button>
                  <button type="button" disabled={isBusy} onClick={() => onDeleteImage(image)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-neon-pink/30 bg-neon-pink/10 px-4 text-xs font-black text-neon-pink disabled:opacity-50">
                    <Trash2 size={15} />
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    <ImageLightbox src={lightboxImage?.src ?? null} alt={lightboxImage?.alt ?? ""} onClose={() => setLightboxImage(null)} />
    </>
  );
}

function UploadBox({
  title,
  buttonText,
  file,
  disabled,
  onFileChange,
  onUpload
}: {
  title: string;
  buttonText: string;
  file: File | null;
  disabled: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <div className="mt-4 rounded-3xl border border-white/10 bg-white/7 p-4">
      <h4 className="text-base font-black text-white">{title}</h4>
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="mt-4 block w-full text-sm text-white/70 file:mr-4 file:h-10 file:rounded-2xl file:border-0 file:bg-white file:px-4 file:text-sm file:font-black file:text-night" />
      <button type="button" onClick={onUpload} disabled={disabled || !file} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-50">
        <ImageUp size={16} />
        {buttonText}
      </button>
    </div>
  );
}

function StatusBadge({ children }: { children: string }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black text-white/70">{children}</span>;
}

async function loadProducts(initData: string, filters: { search: string; categoryId: string; subcategoryId: string; status: ProductStatus; page: number }) {
  const params = new URLSearchParams({ page: String(filters.page), pageSize: "20", status: filters.status });

  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.subcategoryId) params.set("subcategoryId", filters.subcategoryId);

  const response = await fetch(`/api/admin/products?${params.toString()}`, {
    headers: { "X-Telegram-Init-Data": initData }
  });

  if (!response.ok) throw new Error("products_load_failed");

  return (await response.json()) as ProductListResponse;
}

async function loadProduct(initData: string, productId: string) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    headers: { "X-Telegram-Init-Data": initData }
  });

  if (!response.ok) throw new Error("product_load_failed");

  const data = (await response.json()) as { product: AdminProduct };
  return data.product;
}

async function createProduct(initData: string, payload: unknown) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData },
    body: JSON.stringify(payload)
  });
  const data = (await response.json().catch(() => ({}))) as { product?: AdminProduct; message?: string };

  if (!response.ok || !data.product) throw new Error(data.message ?? "Не удалось создать товар.");

  return data.product;
}

async function updateProduct(initData: string, productId: string, payload: unknown) {
  const response = await fetch(`/api/admin/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Telegram-Init-Data": initData },
    body: JSON.stringify(payload)
  });
  const data = (await response.json().catch(() => ({}))) as { product?: AdminProduct; message?: string };

  if (!response.ok || !data.product) throw new Error(data.message ?? "Не удалось сохранить товар.");

  return data.product;
}

async function uploadProductImage(initData: string, productId: string, kind: "cover" | "gallery", file: File) {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("file", file);

  const response = await fetch(`/api/admin/products/${productId}/images`, {
    method: "POST",
    headers: { "X-Telegram-Init-Data": initData },
    body: formData
  });
  const data = (await response.json().catch(() => ({}))) as { product?: AdminProduct };

  if (!response.ok || !data.product) throw new Error("image_upload_failed");

  return data.product;
}

async function setProductCover(initData: string, productId: string, imageId: string) {
  const response = await fetch(`/api/admin/products/${productId}/images/${imageId}/cover`, {
    method: "PATCH",
    headers: { "X-Telegram-Init-Data": initData }
  });
  const data = (await response.json().catch(() => ({}))) as { product?: AdminProduct };

  if (!response.ok || !data.product) throw new Error("set_cover_failed");

  return data.product;
}

async function deleteProductImage(initData: string, productId: string, imageId: string) {
  const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    headers: { "X-Telegram-Init-Data": initData }
  });
  const data = (await response.json().catch(() => ({}))) as { product?: AdminProduct };

  if (!response.ok || !data.product) throw new Error("delete_image_failed");

  return data.product;
}

async function loadCategoryTree(initData: string) {
  const response = await fetch("/api/admin/categories", {
    headers: { "X-Telegram-Init-Data": initData }
  });
  const data = (await response.json().catch(() => ({}))) as { categoryTree?: CategoryTree };

  if (!response.ok || !data.categoryTree) throw new Error("categories_load_failed");

  return data.categoryTree;
}
