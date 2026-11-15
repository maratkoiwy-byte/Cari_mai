import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import type { Language, Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductModalProps {
  product: Product | null;
  lang: Language;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductModal({ product, lang, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const title = lang === 'ru' && product.nameRu ? product.nameRu : product.name;
  const description =
    lang === 'ru' && product.descriptionRu ? product.descriptionRu : product.description;
  const ingredients =
    lang === 'ru' && product.ingredientsRu ? product.ingredientsRu : product.ingredients;
  const usage = lang === 'ru' && product.usageRu ? product.usageRu : product.usage;

  const categoryLabel =
    product.category === 'butter'
      ? lang === 'kk'
        ? 'Таза сары май'
        : 'Натуральное сары май'
      : product.category === 'set'
        ? lang === 'kk'
          ? 'Кешенді жиынтық'
          : 'Комплексный набор'
        : lang === 'kk'
          ? 'Global Trend Нано бальзам'
          : 'Нано-бальзам Global Trend';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl overflow-hidden shadow-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 text-[#18181B] border border-[#E4E1DA] rounded-lg hover:bg-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          <div className="bg-[#F3F1EC] aspect-[4/3] md:aspect-auto">
            <ProductImage
              src={product.imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-[#6B6B63]">
                <span>{categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{product.unit}</span>
                <span aria-hidden="true">·</span>
                <span className={product.inStock ? 'text-[#1B4332] font-medium' : 'text-red-700 font-medium'}>
                  {product.inStock
                    ? lang === 'kk'
                      ? 'Қоймада бар'
                      : 'В наличии'
                    : lang === 'kk'
                      ? 'Таусылды'
                      : 'Нет в наличии'}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#18181B] leading-tight">
                {title}
              </h2>

              <p className="font-mono text-2xl font-medium text-[#18181B] tabular-nums">
                {product.price.toLocaleString('ru-RU')} ₸
              </p>

              <p className="text-sm text-[#3F3F3A] leading-relaxed">{description}</p>

              {ingredients && (
                <div className="pt-3 border-t border-[#E4E1DA]">
                  <p className="text-xs font-semibold text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Құрамы' : 'Состав'}
                  </p>
                  <p className="text-xs text-[#52524C] leading-relaxed">{ingredients}</p>
                </div>
              )}

              {usage && (
                <div className="pt-3 border-t border-[#E4E1DA]">
                  <p className="text-xs font-semibold text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Қолдану және сақтау тәсілі' : 'Способ применения и хранения'}
                  </p>
                  <p className="text-xs text-[#52524C] leading-relaxed">{usage}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E4E1DA] flex flex-wrap items-center gap-3">
              <div className="flex items-center border border-[#D6D2C9] bg-white rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#18181B] hover:bg-[#F3F1EC] transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-[#18181B] hover:bg-[#F3F1EC] transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={!product.inStock}
                onClick={() => {
                  onAddToCart(product, quantity);
                  setQuantity(1);
                  onClose();
                }}
                className="flex-1 min-w-[180px] h-10 px-5 inline-flex items-center justify-center gap-2 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {product.inStock
                    ? lang === 'kk'
                      ? 'Себетке қосу'
                      : 'Добавить в корзину'
                    : lang === 'kk'
                      ? 'Қоймада жоқ'
                      : 'Нет в наличии'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
