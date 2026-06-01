"use client";

import { FormEvent, type ReactNode, useEffect, useState } from "react";
import { Eye, EyeOff, FolderPlus, Pencil, Plus } from "lucide-react";
import { useScrollIntoViewOnChange } from "@/components/use-scroll-into-view-on-change";

type AdminSubcategory = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  isActive: boolean;
  activeProductCount: number;
  totalProductCount: number;
};

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  activeProductCount: number;
  totalProductCount: number;
  subcategories: AdminSubcategory[];
};

type CategoryTree = {
  categories: AdminCategory[];
};

type EditingState =
  | { type: "category-create" }
  | { type: "category-rename"; category: AdminCategory }
  | { type: "subcategory-create"; category: AdminCategory }
  | { type: "subcategory-rename"; category: AdminCategory; subcategory: AdminSubcategory }
  | null;

export function AdminCategoriesPanel({ initData }: { initData: string }) {
  const [categoryTree, setCategoryTree] = useState<CategoryTree>({ categories: [] });
  const [editing, setEditing] = useState<EditingState>(null);
  const [name, setName] = useState("");
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
          setCategoryTree(tree);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Не удалось загрузить категории.");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [initData]);

  function openEditor(nextEditing: EditingState) {
    setEditing(nextEditing);
    setMessage(null);
    setError(null);

    if (nextEditing?.type === "category-rename") {
      setName(nextEditing.category.name);
      return;
    }

    if (nextEditing?.type === "subcategory-rename") {
      setName(nextEditing.subcategory.name);
      return;
    }

    setName("");
  }

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      let tree: CategoryTree;

      if (editing.type === "category-create") {
        tree = await requestCategoryTree("/api/admin/categories", initData, {
          method: "POST",
          body: { name }
        });
        setMessage("Категория создана. Slug сгенерирован сервером.");
      } else if (editing.type === "category-rename") {
        tree = await requestCategoryTree(`/api/admin/categories/${editing.category.id}`, initData, {
          method: "PATCH",
          body: { name }
        });
        setMessage("Категория переименована. Служебный адрес не изменился.");
      } else if (editing.type === "subcategory-create") {
        tree = await requestCategoryTree(`/api/admin/categories/${editing.category.id}/subcategories`, initData, {
          method: "POST",
          body: { name }
        });
        setMessage(
          editing.category.isActive
            ? "Подкатегория создана. Slug сгенерирован сервером."
            : "Подкатегория создана, но появится в магазине только после показа родительской категории."
        );
      } else {
        tree = await requestCategoryTree(
          `/api/admin/categories/${editing.category.id}/subcategories/${editing.subcategory.id}`,
          initData,
          {
            method: "PATCH",
            body: { name }
          }
        );
        setMessage("Подкатегория переименована. Служебный адрес не изменился.");
      }

      setCategoryTree(tree);
      setEditing(null);
      setName("");
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.message ? requestError.message : "Не удалось сохранить изменение.");
    } finally {
      setIsBusy(false);
    }
  }

  async function toggleCategory(category: AdminCategory) {
    await toggleVisibility({
      url: `/api/admin/categories/${category.id}`,
      isActive: category.isActive,
      activeProductCount: category.activeProductCount,
      hiddenText: `В этой категории есть товары: ${category.activeProductCount} шт. После скрытия они перестанут отображаться в магазине. Продолжить?`,
      successText: category.isActive ? "Категория скрыта." : "Категория снова активна."
    });
  }

  async function toggleSubcategory(category: AdminCategory, subcategory: AdminSubcategory) {
    await toggleVisibility({
      url: `/api/admin/categories/${category.id}/subcategories/${subcategory.id}`,
      isActive: subcategory.isActive,
      activeProductCount: subcategory.activeProductCount,
      hiddenText: `В этой подкатегории есть товары: ${subcategory.activeProductCount} шт. После скрытия они перестанут отображаться в магазине. Продолжить?`,
      successText: subcategory.isActive ? "Подкатегория скрыта." : "Подкатегория снова активна."
    });
  }

  async function toggleVisibility({
    url,
    isActive,
    activeProductCount,
    hiddenText,
    successText
  }: {
    url: string;
    isActive: boolean;
    activeProductCount: number;
    hiddenText: string;
    successText: string;
  }) {
    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const tree = await requestCategoryTree(url, initData, {
        method: "PATCH",
        body: { isActive: !isActive }
      });
      setCategoryTree(tree);
      setMessage(successText);
    } catch (requestError) {
      if (
        requestError instanceof LinkedProductsConfirmationError &&
        window.confirm(hiddenText.replace(String(activeProductCount), String(requestError.activeProductCount)))
      ) {
        try {
          const tree = await requestCategoryTree(url, initData, {
            method: "PATCH",
            body: { isActive: !isActive, confirmHideLinkedProducts: true }
          });
          setCategoryTree(tree);
          setMessage(successText);
        } catch {
          setError("Не удалось изменить видимость.");
        }
      } else {
        setError(requestError instanceof Error && requestError.message ? requestError.message : "Не удалось изменить видимость.");
      }
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-white/64">Загружаем категории...</p>;
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/7 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-cyan">catalog structure</p>
        <h2 className="mt-2 text-xl font-black text-white">Категории и подкатегории</h2>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Здесь задается структура каталога для товаров и будущего импорта.
        </p>
      </div>

      <div ref={statusRef}>
        {message ? <p className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 p-3 text-sm text-neon-cyan">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl border border-neon-pink/20 bg-neon-pink/10 p-3 text-sm text-neon-pink">{error}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => openEditor({ type: "category-create" })}
        className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-night"
      >
        <Plus size={17} />
        Добавить категорию
      </button>

      {editing ? (
        <form onSubmit={submitName} className="mt-5 rounded-3xl border border-neon-cyan/20 bg-neon-cyan/10 p-4">
          <h3 className="text-base font-black text-white">{editorTitle(editing)}</h3>
          {"category" in editing && !editing.category.isActive && editing.type === "subcategory-create" ? (
            <p className="mt-2 text-sm text-white/58">Родительская категория скрыта: новая подкатегория не появится в магазине до включения категории.</p>
          ) : null}
          {editing.type === "category-rename" || editing.type === "subcategory-rename" ? (
            <p className="mt-2 text-sm text-white/58">Служебный адрес сохраняется после переименования.</p>
          ) : null}
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-4 h-11 w-full rounded-2xl border border-white/10 bg-night/70 px-3 text-sm font-bold text-white outline-none focus:border-neon-cyan/60"
            placeholder="Название"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={isBusy} className="h-10 rounded-2xl bg-white px-4 text-sm font-black text-night disabled:opacity-60">
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="h-10 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-5 grid gap-4">
        {categoryTree.categories.map((category) => (
          <div key={category.id} className="rounded-3xl border border-white/10 bg-night/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-white">{category.name}</h3>
                  <StatusBadge isActive={category.isActive} />
                </div>
                <p className="mt-1 text-xs text-white/42">/{category.slug}</p>
                <p className="mt-2 text-sm text-white/58">
                  Товары: {category.activeProductCount} активных / {category.totalProductCount} всего
                </p>
              </div>
              <ActionButtons
                isActive={category.isActive}
                isBusy={isBusy}
                onRename={() => openEditor({ type: "category-rename", category })}
                onToggle={() => toggleCategory(category)}
                onAddSubcategory={() => openEditor({ type: "subcategory-create", category })}
              />
            </div>

            <div className="mt-4 grid gap-2">
              {category.subcategories.map((subcategory) => (
                <div key={subcategory.id} className="rounded-2xl border border-white/10 bg-white/7 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-black text-white">{subcategory.name}</h4>
                        <StatusBadge isActive={subcategory.isActive} />
                      </div>
                      <p className="mt-1 text-xs text-white/42">/{subcategory.slug}</p>
                      <p className="mt-2 text-sm text-white/58">
                        Товары: {subcategory.activeProductCount} активных / {subcategory.totalProductCount} всего
                      </p>
                    </div>
                    <SubcategoryActions
                      isActive={subcategory.isActive}
                      isBusy={isBusy}
                      onRename={() => openEditor({ type: "subcategory-rename", category, subcategory })}
                      onToggle={() => toggleSubcategory(category, subcategory)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isActive ? "bg-neon-cyan text-night" : "bg-white/10 text-white/54"}`}>
      {isActive ? "Активна" : "Скрыта"}
    </span>
  );
}

function ActionButtons({
  isActive,
  isBusy,
  onRename,
  onToggle,
  onAddSubcategory
}: {
  isActive: boolean;
  isBusy: boolean;
  onRename: () => void;
  onToggle: () => void;
  onAddSubcategory: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <IconButton label="Переименовать" disabled={isBusy} onClick={onRename} icon={<Pencil size={15} />} />
      <IconButton label={isActive ? "Скрыть" : "Показать"} disabled={isBusy} onClick={onToggle} icon={isActive ? <EyeOff size={15} /> : <Eye size={15} />} />
      <IconButton label="Добавить подкатегорию" disabled={isBusy} onClick={onAddSubcategory} icon={<FolderPlus size={15} />} />
    </div>
  );
}

function SubcategoryActions({
  isActive,
  isBusy,
  onRename,
  onToggle
}: {
  isActive: boolean;
  isBusy: boolean;
  onRename: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <IconButton label="Переименовать" disabled={isBusy} onClick={onRename} icon={<Pencil size={15} />} />
      <IconButton label={isActive ? "Скрыть" : "Показать"} disabled={isBusy} onClick={onToggle} icon={isActive ? <EyeOff size={15} /> : <Eye size={15} />} />
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  icon
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3 text-xs font-black text-white disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}

function editorTitle(editing: Exclude<EditingState, null>) {
  if (editing.type === "category-create") {
    return "Новая категория";
  }

  if (editing.type === "category-rename") {
    return "Переименовать категорию";
  }

  if (editing.type === "subcategory-create") {
    return "Новая подкатегория";
  }

  return "Переименовать подкатегорию";
}

async function loadCategoryTree(initData: string) {
  return requestCategoryTree("/api/admin/categories", initData, { method: "GET" });
}

async function requestCategoryTree(
  url: string,
  initData: string,
  options: { method: "GET" } | { method: "POST" | "PATCH"; body: unknown }
) {
  const response = await fetch(url, {
    method: options.method,
    headers: {
      ...(options.method === "GET" ? {} : { "Content-Type": "application/json" }),
      "X-Telegram-Init-Data": initData
    },
    body: options.method === "GET" ? undefined : JSON.stringify(options.body)
  });
  const data = (await response.json().catch(() => ({}))) as {
    categoryTree?: CategoryTree;
    message?: string;
    activeProductCount?: number;
  };

  if (response.status === 409 && typeof data.activeProductCount === "number") {
    throw new LinkedProductsConfirmationError(data.activeProductCount);
  }

  if (!response.ok || !data.categoryTree) {
    throw new Error(data.message ?? "Не удалось сохранить изменение.");
  }

  return data.categoryTree;
}

class LinkedProductsConfirmationError extends Error {
  constructor(readonly activeProductCount: number) {
    super("linked_products_confirmation_required");
  }
}
