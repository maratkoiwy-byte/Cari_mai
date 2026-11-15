import { Eye, EyeOff, Lock, LogOut, Pencil, Plus, Send, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { compressImageFile, PRESET_IMAGES } from '../lib/images';
import type { Language, Order, OrderStatus, Product, ProductCategory, StoreSettings } from '../types';
import { ProductImage } from './ProductImage';

interface AdminPanelProps {
  lang: Language;
  token: string | null;
  products: Product[];
  settings: StoreSettings;
  onLoginSuccess: (token: string) => void;
  onLogout: () => void;
  onProductsUpdated: (products: Product[]) => void;
  onSettingsUpdated: (settings: StoreSettings) => void;
  onBackToStore: () => void;
}

interface ProductFormState {
  id?: string;
  name: string;
  nameRu: string;
  category: ProductCategory;
  price: string;
  unit: string;
  shortDescription: string;
  shortDescriptionRu: string;
  description: string;
  descriptionRu: string;
  ingredients: string;
  usage: string;
  imageUrl: string;
  inStock: boolean;
  featured: boolean;
}

const EMPTY_FORM: ProductFormState = {
  name: '',
  nameRu: '',
  category: 'butter',
  price: '',
  unit: '500 г',
  shortDescription: '',
  shortDescriptionRu: '',
  description: '',
  descriptionRu: '',
  ingredients: '',
  usage: '',
  imageUrl: '/src/assets/images/product_sary_mai_jar_1794738803072.jpg',
  inStock: true,
  featured: true,
};

export function AdminPanel({
  lang,
  token,
  products,
  settings,
  onLoginSuccess,
  onLogout,
  onProductsUpdated,
  onSettingsUpdated,
  onBackToStore,
}: AdminPanelProps) {
  // Login state (strictly empty, no hints)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard tabs
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'telegram'>('products');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Product editor modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  // Telegram settings form
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [showTgToken, setShowTgToken] = useState(false);
  const [savingTg, setSavingTg] = useState(false);
  const [testingTg, setTestingTg] = useState(false);
  const [tgStatus, setTgStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (!token || activeTab !== 'telegram') return;
    let active = true;
    fetch('/api/admin/telegram', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          onLogout();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (active && data) {
          setTgBotToken(data.botToken || '');
          setTgChatId(data.chatId || '');
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, activeTab, onLogout]);

  useEffect(() => {
    if (!token || activeTab !== 'orders') return;
    let active = true;
    setLoadingOrders(true);
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          onLogout();
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (active && data?.orders) {
          setOrders(data.orders);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingOrders(false);
      });
    return () => {
      active = false;
    };
  }, [token, activeTab, onLogout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setLoginError(lang === 'kk' ? 'Логин немесе құпия сөз қате.' : 'Неверный логин или пароль.');
      } else {
        setUsername('');
        setPassword('');
        onLoginSuccess(data.token);
      }
    } catch {
      setLoginError(lang === 'kk' ? 'Сервермен байланыс жоқ.' : 'Нет связи с сервером.');
    } finally {
      setLoggingIn(false);
    }
  };

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditorOpen(true);
  };

  const openEditForm = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      nameRu: product.nameRu || '',
      category: product.category,
      price: String(product.price),
      unit: product.unit,
      shortDescription: product.shortDescription,
      shortDescriptionRu: product.shortDescriptionRu || '',
      description: product.description,
      descriptionRu: product.descriptionRu || '',
      ingredients: product.ingredients || '',
      usage: product.usage || '',
      imageUrl: product.imageUrl,
      inStock: product.inStock,
      featured: Boolean(product.featured),
    });
    setFormError('');
    setEditorOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError('');
    try {
      const compressed = await compressImageFile(file, 1000);
      setForm((prev) => ({ ...prev, imageUrl: compressed }));
    } catch {
      setFormError(lang === 'kk' ? 'Суретті жүктеу мүмкін болмады.' : 'Не удалось загрузить изображение.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setFormError('');

    const numericPrice = Number(form.price);
    if (!form.name.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) {
      setFormError(
        lang === 'kk'
          ? 'Тауар атауын және дұрыс бағасын енгізіңіз.'
          : 'Укажите название товара и корректную цену.',
      );
      return;
    }

    setSavingProduct(true);
    try {
      const payload = {
        name: form.name.trim(),
        nameRu: form.nameRu.trim(),
        category: form.category,
        price: numericPrice,
        unit: form.unit.trim() || '1 дана',
        shortDescription: form.shortDescription.trim() || form.name.trim(),
        shortDescriptionRu: form.shortDescriptionRu.trim(),
        description: form.description.trim() || form.shortDescription.trim() || form.name.trim(),
        descriptionRu: form.descriptionRu.trim(),
        ingredients: form.ingredients.trim(),
        usage: form.usage.trim(),
        imageUrl: form.imageUrl.trim(),
        inStock: form.inStock,
        featured: form.featured,
      };

      const url = form.id ? `/api/products/${form.id}` : '/api/products';
      const method = form.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        onLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Error saving product');
        return;
      }

      // Refresh product list so storefront updates immediately
      const listRes = await fetch('/api/products');
      const listData = await listRes.json();
      if (listData?.products) {
        onProductsUpdated(listData.products);
      }
      setEditorOpen(false);
    } catch {
      setFormError(lang === 'kk' ? 'Сақтау кезінде қате кетті.' : 'Ошибка при сохранении.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    if (!token) return;
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ inStock: !product.inStock }),
    });
    if (res.status === 401) {
      onLogout();
      return;
    }
    if (res.ok) {
      const listRes = await fetch('/api/products');
      const listData = await listRes.json();
      if (listData?.products) onProductsUpdated(listData.products);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!token) return;
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      onLogout();
      return;
    }
    if (res.ok) {
      onProductsUpdated(products.filter((p) => p.id !== productId));
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!token) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.status === 401) {
      onLogout();
      return;
    }
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingSettings(true);
    setSettingsSavedMsg('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.settings) {
        onSettingsUpdated(data.settings);
        setSettingsSavedMsg(lang === 'kk' ? 'Баптаулар сақталды.' : 'Настройки сохранены.');
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingTg(true);
    setTgStatus(null);
    try {
      const res = await fetch('/api/admin/telegram', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim() }),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (res.ok) {
        setTgStatus({
          type: 'ok',
          text:
            lang === 'kk'
              ? 'Telegram баптаулары сақталды.'
              : 'Настройки Telegram сохранены.',
        });
      }
    } catch {
      setTgStatus({
        type: 'err',
        text: lang === 'kk' ? 'Сақтау кезінде қате кетті.' : 'Ошибка при сохранении.',
      });
    } finally {
      setSavingTg(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!token) return;
    setTestingTg(true);
    setTgStatus(null);
    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim() }),
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.ok) {
        setTgStatus({
          type: 'ok',
          text:
            lang === 'kk'
              ? 'Тест хабарлама Telegram-ға жіберілді!'
              : 'Тестовое сообщение отправлено в Telegram!',
        });
      } else {
        setTgStatus({
          type: 'err',
          text: data.error || (lang === 'kk' ? 'Жіберу сәтсіз аяқталды.' : 'Не удалось отправить.'),
        });
      }
    } catch {
      setTgStatus({
        type: 'err',
        text: lang === 'kk' ? 'Сервермен байланыс жоқ.' : 'Нет связи с сервером.',
      });
    } finally {
      setTestingTg(false);
    }
  };

  // Unauthenticated view: clean login form with NO visible credentials or hints
  if (!token) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-white border border-[#E4E1DA] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#F3F1EC] flex items-center justify-center text-[#1B4332]">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[#18181B]">
              {lang === 'kk' ? 'Әкімшілік панельге кіру' : 'Вход в панель управления'}
            </h1>
            <p className="text-sm text-[#52524C]">
              {lang === 'kk'
                ? 'Тауарларды қосу және тапсырыстарды басқару үшін логин мен құпия сөзді енгізіңіз.'
                : 'Введите логин и пароль для управления товарами и заказами.'}
            </p>
          </div>

          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#18181B] mb-1">
                {lang === 'kk' ? 'Логин' : 'Логин'}
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                name="admin_user_field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'kk' ? 'Логинді енгізіңіз' : 'Введите логин'}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#18181B] mb-1">
                {lang === 'kk' ? 'Құпия сөз' : 'Пароль'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  name="admin_pass_field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B6B63] hover:text-[#18181B] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && <p className="text-xs text-red-700 font-medium">{loginError}</p>}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={loggingIn}
                className="flex-1 py-2.5 px-4 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#143326] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loggingIn
                  ? lang === 'kk'
                    ? 'Тексерілуде...'
                    : 'Проверка...'
                  : lang === 'kk'
                    ? 'Кіру'
                    : 'Войти'}
              </button>
              <button
                type="button"
                onClick={onBackToStore}
                className="py-2.5 px-4 text-sm font-medium text-[#52524C] border border-[#D6D2C9] rounded-lg hover:bg-[#F3F1EC] transition-colors cursor-pointer"
              >
                {lang === 'kk' ? 'Дүкенге' : 'В магазин'}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E4E1DA]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#18181B]">
            {lang === 'kk' ? 'Дүкенді басқару панелі' : 'Панель управления магазином'}
          </h1>
          <p className="text-sm text-[#52524C] mt-1">
            {lang === 'kk'
              ? 'Бұл жерде қосылған тауарлар басты бетте бірден көрсетіледі.'
              : 'Добавленные здесь товары сразу отображаются на главной витрине.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToStore}
            className="px-4 py-2 text-sm font-medium text-[#18181B] bg-white border border-[#D6D2C9] rounded-lg hover:bg-[#F3F1EC] transition-colors cursor-pointer whitespace-nowrap"
          >
            {lang === 'kk' ? 'Басты бетті көру' : 'На главную'}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'kk' ? 'Шығу' : 'Выйти'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1 p-1 bg-[#EFECE4] rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-white text-[#18181B] shadow-sm'
                : 'text-[#52524C] hover:text-[#18181B]'
            }`}
          >
            {lang === 'kk' ? `Тауарлар (${products.length})` : `Товары (${products.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-white text-[#18181B] shadow-sm'
                : 'text-[#52524C] hover:text-[#18181B]'
            }`}
          >
            {lang === 'kk' ? 'Тапсырыстар' : 'Заказы'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-white text-[#18181B] shadow-sm'
                : 'text-[#52524C] hover:text-[#18181B]'
            }`}
          >
            {lang === 'kk' ? 'Жеткізу баптаулары' : 'Настройки доставки'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'telegram'
                ? 'bg-white text-[#18181B] shadow-sm'
                : 'text-[#52524C] hover:text-[#18181B]'
            }`}
          >
            Telegram
          </button>
        </div>

        {activeTab === 'products' && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'kk' ? 'Жаңа тауар қосу' : 'Добавить товар'}</span>
          </button>
        )}
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="bg-white border border-[#E4E1DA] rounded-xl overflow-hidden">
          {products.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#6B6B63]">
              {lang === 'kk'
                ? 'Әзірге тауар жоқ. «Жаңа тауар қосу» батырмасын басыңыз.'
                : 'Товаров пока нет. Нажмите «Добавить товар».'}
            </div>
          ) : (
            <div className="divide-y divide-[#E4E1DA]">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#F3F1EC] shrink-0">
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#6B6B63]">
                        <span>
                          {product.category === 'butter'
                            ? 'Сары май'
                            : product.category === 'set'
                              ? 'Жиынтық'
                              : 'Нано бальзам'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{product.unit}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#18181B] truncate">
                        {product.name}
                      </h3>
                      <p className="font-mono text-sm font-medium tabular-nums text-[#18181B]">
                        {product.price.toLocaleString('ru-RU')} ₸
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        product.inStock
                          ? 'border-[#1B4332]/30 bg-[#1B4332]/10 text-[#1B4332]'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {product.inStock
                        ? lang === 'kk'
                          ? 'Қоймада бар'
                          : 'В наличии'
                        : lang === 'kk'
                          ? 'Таусылды'
                          : 'Нет в наличии'}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#18181B] bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg hover:bg-[#EFECE4] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{lang === 'kk' ? 'Өңдеу' : 'Изм.'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      aria-label="Delete product"
                      className="p-2 text-[#6B6B63] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E4E1DA] rounded-xl overflow-hidden">
          {loadingOrders ? (
            <div className="p-12 text-center text-sm text-[#6B6B63]">
              {lang === 'kk' ? 'Тапсырыстар жүктелуде...' : 'Загрузка заказов...'}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#6B6B63]">
              {lang === 'kk' ? 'Әзірге жаңа тапсырыстар жоқ.' : 'Новых заказов пока нет.'}
            </div>
          ) : (
            <div className="divide-y divide-[#E4E1DA]">
              {orders.map((order) => (
                <div key={order.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-semibold text-[#18181B]">{order.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#18181B]">{order.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[#52524C]">{order.phone}</span>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value as OrderStatus)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    >
                      <option value="new">{lang === 'kk' ? 'Жаңа тапсырыс' : 'Новый'}</option>
                      <option value="preparing">{lang === 'kk' ? 'Дайындалуда' : 'Готовится'}</option>
                      <option value="delivered">{lang === 'kk' ? 'Жеткізілді' : 'Доставлен'}</option>
                    </select>
                  </div>

                  <p className="text-xs text-[#52524C]">
                    {order.deliveryType === 'pickup'
                      ? lang === 'kk'
                        ? 'Өзі алып кетеді'
                        : 'Самовывоз'
                      : `${lang === 'kk' ? 'Мекенжай' : 'Адрес'}: ${order.address}`}{' '}
                    ·{' '}
                    {order.paymentMethod === 'kaspi_transfer'
                      ? 'Kaspi'
                      : lang === 'kk'
                        ? 'Қолма-қол'
                        : 'Наличными'}
                  </p>

                  {order.comment && (
                    <p className="text-xs text-[#52524C] italic">{order.comment}</p>
                  )}

                  <div className="pt-2 border-t border-[#F0EDE5] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-[#3F3F3A] space-x-3">
                      {order.items.map((item) => (
                        <span key={item.productId}>
                          {item.name} ({item.unit}) × {item.quantity}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-sm font-semibold tabular-nums text-[#18181B]">
                      {order.totalAmount.toLocaleString('ru-RU')} ₸
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-[#E4E1DA] rounded-xl p-6 space-y-5 max-w-2xl"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#18181B] mb-1">
                {lang === 'kk' ? 'Байланыс телефоны' : 'Контактный телефон'}
              </label>
              <input
                type="text"
                value={settingsForm.contactPhone}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#18181B] mb-1">
                {lang === 'kk' ? 'Тегін жеткізу шегі (₸)' : 'Порог бесплатной доставки (₸)'}
              </label>
              <input
                type="number"
                value={settingsForm.freeDeliveryThreshold}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, freeDeliveryThreshold: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] mb-1">
              {lang === 'kk' ? 'Орналасқан жері (Қазақша)' : 'Адрес / Район (Каз)'}
            </label>
            <input
              type="text"
              value={settingsForm.storeAddress}
              onChange={(e) => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] mb-1">
              {lang === 'kk' ? 'Жеткізу шарттары (Қазақша)' : 'Условия доставки (Каз)'}
            </label>
            <textarea
              rows={2}
              value={settingsForm.deliveryNote}
              onChange={(e) => setSettingsForm({ ...settingsForm, deliveryNote: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] mb-1">
              {lang === 'kk' ? 'Жеткізу шарттары (Орысша)' : 'Условия доставки (Рус)'}
            </label>
            <textarea
              rows={2}
              value={settingsForm.deliveryNoteRu}
              onChange={(e) => setSettingsForm({ ...settingsForm, deliveryNoteRu: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg"
            />
          </div>

          {settingsSavedMsg && <p className="text-xs font-medium text-[#1B4332]">{settingsSavedMsg}</p>}

          <button
            type="submit"
            disabled={savingSettings}
            className="px-5 py-2.5 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#143326] transition-colors cursor-pointer"
          >
            {savingSettings
              ? lang === 'kk'
                ? 'Сақталуда...'
                : 'Сохранение...'
              : lang === 'kk'
                ? 'Сақтау'
                : 'Сохранить'}
          </button>
        </form>
      )}

      {/* Telegram Notifications Tab */}
      {activeTab === 'telegram' && (
        <form
          onSubmit={handleSaveTelegram}
          className="bg-white border border-[#E4E1DA] rounded-xl p-6 space-y-5 max-w-2xl"
        >
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold text-[#18181B]">
              {lang === 'kk' ? 'Telegram хабарламалары' : 'Уведомления в Telegram'}
            </h2>
            <p className="text-xs sm:text-sm text-[#52524C] leading-relaxed">
              {lang === 'kk'
                ? 'Себет арқылы жаңа тапсырыс түскенде, мәліметтер бірден көрсетілген Telegram ботқа жіберіледі.'
                : 'При оформлении заказа из корзины уведомление сразу придёт в указанный Telegram-бот.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] mb-1">
              Bot Token (Token ID)
            </label>
            <div className="relative">
              <input
                type={showTgToken ? 'text' : 'password'}
                autoComplete="off"
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                placeholder="1234567890:ABCdef..."
                className="w-full px-3.5 py-2.5 pr-10 text-sm font-mono bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
              <button
                type="button"
                onClick={() => setShowTgToken((v) => !v)}
                aria-label="Toggle token visibility"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B6B63] hover:text-[#18181B] cursor-pointer"
              >
                {showTgToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] mb-1">
              Chat ID
            </label>
            <input
              type="text"
              autoComplete="off"
              value={tgChatId}
              onChange={(e) => setTgChatId(e.target.value)}
              placeholder="987654321"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#FAF9F6] border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332]"
            />
          </div>

          <div className="p-4 bg-[#F3F1EC] rounded-lg text-xs text-[#52524C] space-y-1 leading-relaxed">
            <p className="font-semibold text-[#18181B]">
              {lang === 'kk' ? 'Қалай баптау керек:' : 'Как настроить:'}
            </p>
            <p>
              {lang === 'kk'
                ? '1. Telegram-да @BotFather арқылы бот ашып, Bot Token алыңыз.'
                : '1. Создайте бота через @BotFather в Telegram и скопируйте Bot Token.'}
            </p>
            <p>
              {lang === 'kk'
                ? '2. Өзіңіздің ботыңызды ашып, /start батырмасын басыңыз.'
                : '2. Откройте своего бота и обязательно нажмите кнопку Start (/start).'}
            </p>
            <p>
              {lang === 'kk'
                ? '3. @userinfobot немесе @getmyid_bot арқылы Chat ID нөміріңізді алып, осында енгізіңіз.'
                : '3. Узнайте свой Chat ID через @userinfobot или @getmyid_bot и вставьте его выше.'}
            </p>
          </div>

          {tgStatus && (
            <p
              className={`text-xs font-medium ${
                tgStatus.type === 'ok' ? 'text-[#1B4332]' : 'text-red-700'
              }`}
            >
              {tgStatus.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={savingTg}
              className="px-5 py-2.5 bg-[#1B4332] text-white text-sm font-medium rounded-lg hover:bg-[#143326] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {savingTg
                ? lang === 'kk'
                  ? 'Сақталуда...'
                  : 'Сохранение...'
                : lang === 'kk'
                  ? 'Сақтау'
                  : 'Сохранить'}
            </button>

            <button
              type="button"
              disabled={testingTg || !tgBotToken.trim() || !tgChatId.trim()}
              onClick={handleTestTelegram}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#18181B] bg-white border border-[#D6D2C9] rounded-lg hover:bg-[#F3F1EC] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {testingTg
                  ? lang === 'kk'
                    ? 'Жіберілуде...'
                    : 'Отправка...'
                  : lang === 'kk'
                    ? 'Тест хабарлама жіберу'
                    : 'Отправить тест'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Product Add/Edit Modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl overflow-hidden shadow-xl my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#E4E1DA] flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-[#18181B]">
                {form.id
                  ? lang === 'kk'
                    ? 'Тауарды өңдеу'
                    : 'Редактировать товар'
                  : lang === 'kk'
                    ? 'Жаңа тауар қосу'
                    : 'Добавить новый товар'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F3F1EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              {/* Image upload & preview */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#18181B]">
                  {lang === 'kk' ? 'Тауар суреті' : 'Фотография товара'}
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-32 h-24 rounded-lg overflow-hidden bg-[#F3F1EC] border border-[#E4E1DA] shrink-0">
                    <ProductImage
                      src={form.imageUrl}
                      alt={form.name || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white border border-[#D6D2C9] rounded-lg hover:bg-[#F3F1EC] cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>
                        {uploadingImage
                          ? lang === 'kk'
                            ? 'Жүктелуде...'
                            : 'Загрузка...'
                          : lang === 'kk'
                            ? 'Құрылғыдан сурет жүктеу'
                            : 'Загрузить фото с устройства'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://... немесе дайын суретті таңдаңыз"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#D6D2C9] rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => setForm({ ...form, imageUrl: preset.path })}
                          className="px-2 py-1 text-[11px] bg-[#EFECE4] hover:bg-[#E4E1DA] text-[#18181B] rounded transition-colors cursor-pointer"
                        >
                          {lang === 'kk' ? preset.labelKk : preset.labelRu}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Тауар атауы (Қаз) *' : 'Название (Каз) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Мысалы: Таза сары май 1 кг"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Атауы (Орысша — міндетті емес)' : 'Название (Рус — необяз.)'}
                  </label>
                  <input
                    type="text"
                    value={form.nameRu}
                    onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
                    placeholder="Например: Чистое сары май 1 кг"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Санат' : 'Категория'}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                  >
                    <option value="butter">{lang === 'kk' ? 'Сары май' : 'Сары май'}</option>
                    <option value="balm">{lang === 'kk' ? 'Нано бальзам' : 'Нано-бальзам'}</option>
                    <option value="set">{lang === 'kk' ? 'Жиынтық' : 'Набор'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Бағасы (₸) *' : 'Цена (₸) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="2800"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Салмағы / Көлемі' : 'Вес / Объём'}
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="500 г / 100 мл"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  {lang === 'kk' ? 'Қысқаша сипаттама (витринада көрінеді)' : 'Краткое описание (на витрине)'}
                </label>
                <input
                  type="text"
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  placeholder="Қоспасыз табиғи ауыл сары майы..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#18181B] mb-1">
                  {lang === 'kk' ? 'Толық сипаттама' : 'Подробное описание'}
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Құрамы (міндетті емес)' : 'Состав (необязательно)'}
                  </label>
                  <input
                    type="text"
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#18181B] mb-1">
                    {lang === 'kk' ? 'Қолдану тәсілі (міндетті емес)' : 'Способ применения (необяз.)'}
                  </label>
                  <input
                    type="text"
                    value={form.usage}
                    onChange={(e) => setForm({ ...form, usage: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D6D2C9] rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-sm text-[#18181B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                    className="w-4 h-4 accent-[#1B4332]"
                  />
                  <span>{lang === 'kk' ? 'Қоймада бар' : 'В наличии'}</span>
                </label>
              </div>

              {formError && <p className="text-xs text-red-700 font-medium">{formError}</p>}

              <div className="pt-3 border-t border-[#E4E1DA] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#52524C] border border-[#D6D2C9] rounded-lg hover:bg-[#F3F1EC] cursor-pointer"
                >
                  {lang === 'kk' ? 'Болдырмау' : 'Отмена'}
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] disabled:opacity-50 cursor-pointer"
                >
                  {savingProduct
                    ? lang === 'kk'
                      ? 'Сақталуда...'
                      : 'Сохранение...'
                    : lang === 'kk'
                      ? 'Тауарды сақтау'
                      : 'Сохранить товар'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
