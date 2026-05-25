"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageUp, Star, Trash2 } from "lucide-react";

type AdminProductImage = {
  id: string;
  url: string;
  altText: string | null;
  isCover: boolean;
  sortOrder: number;
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  coverImage: AdminProductImage | null;
  images: AdminProductImage[];
};

export function AdminProductImagesPanel({ initData }: { initData: string }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    let isMounted = true;

    fetch("/api/admin/products", {
      headers: { "X-Telegram-Init-Data": initData }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("products_load_failed");
        }

        return response.json() as Promise<{ products: AdminProduct[] }>;
      })
      .then((data) => {
        if (isMounted) {
          setProducts(data.products);
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
  }, [initData]);

  function updateProduct(product: AdminProduct) {
    setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
  }

  async function uploadImage(kind: "cover" | "gallery") {
    if (!selectedProduct) {
      return;
    }

    const file = kind === "cover" ? coverFile : galleryFile;

    if (!file) {
      setError("Выберите изображение JPG, PNG или WEBP.");
      return;
    }

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("kind", kind);
      formData.set("file", file);

      const response = await fetch(`/api/admin/products/${selectedProduct.id}/images`, {
        method: "POST",
        headers: { "X-Telegram-Init-Data": initData },
        body: formData
      });

      if (!response.ok) {
        throw new Error("image_upload_failed");
      }

      const data = (await response.json()) as { product: AdminProduct };
      updateProduct(data.product);
      setMessage(kind === "cover" ? "Новая обложка загружена." : "Фото добавлено в галерею.");

      if (kind === "cover") {
        setCoverFile(null);
      } else {
        setGalleryFile(null);
      }
    } catch {
      setError("Не удалось загрузить изображение.");
    } finally {
      setIsBusy(false);
    }
  }

  async function setCover(imageId: string) {
    if (!selectedProduct) {
      return;
    }

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}/images/${imageId}/cover`, {
        method: "PATCH",
        headers: { "X-Telegram-Init-Data": initData }
      });

      if (!response.ok) {
        throw new Error("set_cover_failed");
      }

      const data = (await response.json()) as { product: AdminProduct };
      updateProduct(data.product);
      setMessage("Главная фотография обновлена.");
    } catch {
      setError("Не удалось назначить главную фотографию.");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteImage(image: AdminProductImage) {
    if (!selectedProduct || image.isCover) {
      return;
    }

    if (!window.confirm("Удалить это фото из карточки товара?")) {
      return;
    }

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/products/${selectedProduct.id}/images/${image.id}`, {
        method: "DELETE",
        headers: { "X-Telegram-Init-Data": initData }
      });

      if (!response.ok) {
        throw new Error("delete_image_failed");
      }

      const data = (await response.json()) as { product: AdminProduct; storageCleanupWarning?: boolean };
      updateProduct(data.product);
      setMessage(
        data.storageCleanupWarning
          ? "Фото удалено из каталога. Storage cleanup требует отдельной проверки."
          : "Фото удалено из карточки товара."
      );
    } catch {
      setError("Не удалось удалить фото.");
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-white/64">Загружаем товары...</p>;
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">catalog media</p>
        <h2 className="mt-2 text-xl font-black text-white">Фотографии товаров</h2>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Заменяйте mock-обложки, добавляйте галерею и назначайте главную фотографию. JPG, PNG или WEBP, до 4 МБ.
        </p>
      </div>

      {message ? <p className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
      {error ? <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}

      {selectedProduct ? (
        <ProductImageManager
          product={selectedProduct}
          coverFile={coverFile}
          galleryFile={galleryFile}
          isBusy={isBusy}
          onBack={() => {
            setSelectedProductId(null);
            setCoverFile(null);
            setGalleryFile(null);
          }}
          onCoverFileChange={setCoverFile}
          onGalleryFileChange={setGalleryFile}
          onUploadCover={() => uploadImage("cover")}
          onUploadGallery={() => uploadImage("gallery")}
          onSetCover={setCover}
          onDeleteImage={deleteImage}
        />
      ) : (
        <div className="mt-5 grid gap-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelectedProductId(product.id)}
              className="grid grid-cols-[76px_1fr] gap-3 rounded-3xl border border-white/10 bg-night/60 p-3 text-left transition hover:border-neon-cyan/30"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-night">
                {product.coverImage ? (
                  <img src={product.coverImage.url} alt={product.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="h-24 w-full bg-white/7" />
                )}
              </div>
              <div className="min-w-0 py-1">
                <p className="text-[11px] text-white/45">
                  {product.category} / {product.subcategory}
                </p>
                <h3 className="mt-1 line-clamp-2 text-base font-black text-white">{product.name}</h3>
                <p className="mt-2 text-xs text-white/52">Фото: {product.images.length}</p>
                <span className="mt-3 inline-flex rounded-2xl border border-neon-cyan/25 px-3 py-1 text-xs font-bold text-neon-cyan">
                  Управлять фото
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductImageManager({
  product,
  coverFile,
  galleryFile,
  isBusy,
  onBack,
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
  onBack: () => void;
  onCoverFileChange: (file: File | null) => void;
  onGalleryFileChange: (file: File | null) => void;
  onUploadCover: () => void;
  onUploadGallery: () => void;
  onSetCover: (imageId: string) => void;
  onDeleteImage: (image: AdminProductImage) => void;
}) {
  return (
    <div className="mt-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
        <ArrowLeft size={16} />
        К списку товаров
      </button>

      <div className="mt-4">
        <p className="text-xs text-white/45">
          {product.category} / {product.subcategory}
        </p>
        <h3 className="mt-1 text-2xl font-black text-white">{product.name}</h3>
      </div>

      <UploadBox
        title="Новая обложка"
        buttonText="Загрузить новую обложку"
        file={coverFile}
        disabled={isBusy}
        onFileChange={onCoverFileChange}
        onUpload={onUploadCover}
      />

      <UploadBox
        title="Фото в галерею"
        buttonText="Добавить фото в галерею"
        file={galleryFile}
        disabled={isBusy}
        onFileChange={onGalleryFileChange}
        onUpload={onUploadGallery}
      />

      <div className="mt-5 grid gap-3">
        {product.images.map((image) => (
          <div key={image.id} className="rounded-3xl border border-white/10 bg-night/60 p-3">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-night">
              <img src={image.url} alt={image.altText ?? product.name} className="h-48 w-full object-cover" />
              {image.isCover ? (
                <span className="absolute left-3 top-3 rounded-full bg-neon-cyan px-3 py-1 text-xs font-black text-night">
                  Главная
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {image.isCover ? (
                <span className="rounded-2xl border border-white/10 bg-white/7 px-3 py-2 text-xs text-white/52">
                  Сначала выберите другую главную фотографию
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSetCover(image.id)}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 px-4 text-xs font-black text-neon-cyan disabled:opacity-50"
                  >
                    <Star size={15} />
                    Сделать главной
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteImage(image)}
                    disabled={isBusy}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-neon-pink/30 bg-neon-pink/10 px-4 text-xs font-black text-neon-pink disabled:opacity-50"
                  >
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
    <div className="mt-5 rounded-3xl border border-white/10 bg-white/7 p-4">
      <h4 className="text-base font-black text-white">{title}</h4>
      <p className="mt-1 text-xs text-white/48">JPG, PNG или WEBP, до 4 МБ.</p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="mt-4 block w-full text-sm text-white/70 file:mr-4 file:h-10 file:rounded-2xl file:border-0 file:bg-white file:px-4 file:text-sm file:font-black file:text-night"
      />
      <button
        type="button"
        onClick={onUpload}
        disabled={disabled || !file}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-50"
      >
        <ImageUp size={16} />
        {buttonText}
      </button>
    </div>
  );
}
