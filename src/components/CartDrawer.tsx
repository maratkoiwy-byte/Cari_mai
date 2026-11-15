import { CheckCircle2, Minus, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { CartItem, Language, Order, StoreSettings } from '../types';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  lang: Language;
  settings: StoreSettings;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function CartDrawer({
  open,
  items,
  lang,
  settings,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'local_delivery' | 'pickup'>('local_delivery');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'kaspi_transfer'>('kaspi_transfer');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isFreeDelivery = subtotal >= settings.freeDeliveryThreshold;

  const t =
    lang === 'kk'
      ? {
          title: 'Себет және тапсырыс',
          empty: 'Себетіңіз бос. Дүкеннен сары май немесе нано бальзам таңдаңыз.',
          subtotal: 'Жиынтық сома',
          freeDeliveryNote: `Тегін жеткізу (${settings.freeDeliveryThreshold.toLocaleString('ru-RU')} ₸-ден жоғары)`,
          paidDeliveryNote: 'Жақын жерге жеткізу құны оператормен нақтыланады',
          nameLabel: 'Аты-жөніңіз',
          namePlaceholder: 'Мысалы: Айгүл Серікқызы',
          phoneLabel: 'Телефон нөмірі (WhatsApp)',
          phonePlaceholder: '+7 700 000 00 00',
          deliveryMethod: 'Алу тәсілі',
          localDelivery: 'Жақын жерге жеткізу',
          pickup: 'Өзім алып кетемін',
          addressLabel: 'Жеткізу мекенжайы',
          addressPlaceholder: 'Көше, үй, пәтер немесе елді мекен',
          paymentLabel: 'Төлем тәсілі',
          kaspi: 'Kaspi аударым',
          cash: 'Қолма-қол (жеткізгенде)',
          commentLabel: 'Қосымша түсініктеме (міндетті емес)',
          submit: 'Тапсырыс беру',
          submitting: 'Жіберілуде...',
          orderSuccess: 'Тапсырыс сәтті қабылданды',
          orderNumber: 'Тапсырыс нөмірі',
          orderSummaryNote: 'Біз жақын арада хабарласып, жеткізу уақытын нақтылаймыз.',
          newOrder: 'Дүкенге оралу',
          errRequired: 'Аты-жөніңізді, телефон нөміріңізді және мекенжайды толтырыңыз.',
        }
      : {
          title: 'Корзина и оформление',
          empty: 'Корзина пуста. Выберите чистое сары май или нано-бальзамы из каталога.',
          subtotal: 'Итого',
          freeDeliveryNote: `Бесплатная доставка (при заказе от ${settings.freeDeliveryThreshold.toLocaleString('ru-RU')} ₸)`,
          paidDeliveryNote: 'Стоимость доставки по ближайшим районам уточняется при звонке',
          nameLabel: 'Ваше имя',
          namePlaceholder: 'Например: Айгуль',
          phoneLabel: 'Телефон (WhatsApp)',
          phonePlaceholder: '+7 700 000 00 00',
          deliveryMethod: 'Способ получения',
          localDelivery: 'Доставка поблизости',
          pickup: 'Самовывоз',
          addressLabel: 'Адрес доставки',
          addressPlaceholder: 'Улица, дом, квартира или населённый пункт',
          paymentLabel: 'Способ оплаты',
          kaspi: 'Перевод Kaspi',
          cash: 'Наличными при получении',
          commentLabel: 'Комментарий к заказу (необязательно)',
          submit: 'Оформить заказ',
          submitting: 'Отправка...',
          orderSuccess: 'Заказ успешно принят',
          orderNumber: 'Номер заказа',
          orderSummaryNote: 'Мы скоро свяжемся с вами для подтверждения времени доставки.',
          newOrder: 'Вернуться в магазин',
          errRequired: 'Укажите имя, номер телефона и адрес доставки.',
        };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !phone.trim() || (deliveryType === 'local_delivery' && !address.trim())) {
      setError(t.errRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          deliveryType,
          address: deliveryType === 'pickup' ? settings.storeAddress : address.trim(),
          paymentMethod,
          comment: comment.trim(),
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error submitting order');
      } else {
        setConfirmedOrder(data.order);
        onClearCart();
        setCustomerName('');
        setPhone('');
        setAddress('');
        setComment('');
      }
    } catch {
      setError(lang === 'kk' ? 'Сервермен байланыс үзілді.' : 'Ошибка связи с сервером.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#FAF9F6] h-full flex flex-col border-l border-[#E4E1DA] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E4E1DA] flex items-center justify-between bg-white">
          <h2 className="font-display text-xl font-semibold text-[#18181B]">{t.title}</h2>
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              onClose();
            }}
            aria-label="Close cart"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#F3F1EC] text-[#18181B] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {confirmedOrder ? (
            <div className="bg-white border border-[#E4E1DA] rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-[#1B4332]">
                <CheckCircle2 className="w-7 h-7 shrink-0" />
                <div>
                  <p className="font-semibold text-base text-[#18181B]">{t.orderSuccess}</p>
                  <p className="text-xs text-[#52524C] font-mono">
                    {t.orderNumber}: {confirmedOrder.id}
                  </p>
                </div>
              </div>
              <p className="text-sm text-[#52524C] leading-relaxed">{t.orderSummaryNote}</p>
              <div className="pt-3 border-t border-[#E4E1DA] space-y-2">
                {confirmedOrder.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-[#18181B]">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-mono tabular-nums text-[#18181B]">
                      {(item.price * item.quantity).toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-[#E4E1DA] flex justify-between font-semibold text-[#18181B]">
                  <span>{t.subtotal}</span>
                  <span className="font-mono tabular-nums">
                    {confirmedOrder.totalAmount.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#143326] transition-colors cursor-pointer"
              >
                {t.newOrder}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-sm text-[#6B6B63]">{t.empty}</div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map(({ product, quantity }) => {
                  const name = lang === 'ru' && product.nameRu ? product.nameRu : product.name;
                  return (
                    <div
                      key={product.id}
                      className="flex gap-3 p-3 bg-white border border-[#E4E1DA] rounded-xl"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F3F1EC] shrink-0">
                        <ProductImage
                          src={product.imageUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-[#18181B] line-clamp-1">{name}</h3>
                            <p className="text-xs text-[#6B6B63]">{product.unit}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(product.id)}
                            aria-label="Remove item"
                            className="p-1 text-[#6B6B63] hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center border border-[#E4E1DA] rounded-md">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#F3F1EC] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center text-xs font-medium tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-[#F3F1EC] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="font-mono text-sm font-semibold tabular-nums text-[#18181B]">
                            {(product.price * quantity).toLocaleString('ru-RU')} ₸
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-[#F3F1EC] rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#52524C]">{t.subtotal}</span>
                  <span className="font-mono text-lg font-semibold tabular-nums text-[#18181B]">
                    {subtotal.toLocaleString('ru-RU')} ₸
                  </span>
                </div>
                <p className="text-xs text-[#52524C]">
                  {isFreeDelivery ? t.freeDeliveryNote : t.paidDeliveryNote}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {t.phoneLabel}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1.5">
                    {t.deliveryMethod}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('local_delivery')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        deliveryType === 'local_delivery'
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-[#18181B] border-[#D6D2C9]'
                      }`}
                    >
                      {t.localDelivery}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        deliveryType === 'pickup'
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-[#18181B] border-[#D6D2C9]'
                      }`}
                    >
                      {t.pickup}
                    </button>
                  </div>
                </div>

                {deliveryType === 'local_delivery' && (
                  <div>
                    <label className="block text-xs font-medium text-[#18181B] mb-1">
                      {t.addressLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t.addressPlaceholder}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1.5">
                    {t.paymentLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('kaspi_transfer')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === 'kaspi_transfer'
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-[#18181B] border-[#D6D2C9]'
                      }`}
                    >
                      {t.kaspi}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash_on_delivery')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        paymentMethod === 'cash_on_delivery'
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-[#18181B] border-[#D6D2C9]'
                      }`}
                    >
                      {t.cash}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {t.commentLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                {error && <p className="text-xs text-red-700 font-medium">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#143326] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
