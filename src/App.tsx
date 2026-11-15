import { ArrowRight, Check, MapPin, Phone, Search, ShoppingBag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { Header } from './components/Header';
import { ProductImage } from './components/ProductImage';
import { ProductModal } from './components/ProductModal';
import { HERO_BANNER_SRC } from './lib/images';
import type { CartItem, Language, Product, StoreSettings } from './types';

const DEFAULT_SETTINGS: StoreSettings = {
  deliveryNote:
    'Орал қаласы және жақын аудандарға тапсырыс берген күні 1–3 сағат ішінде жеткіземіз. 15 000 ₸-ден жоғары тапсырысқа жеткізу тегін.',
  deliveryNoteRu:
    'Быстрая доставка по г. Уральск и ближайшим районам в день заказа за 1–3 часа. Бесплатная доставка при заказе от 15 000 ₸.',
  freeDeliveryThreshold: 15000,
  contactPhone: '+7 (747) 365-75-10',
  storeAddress: 'Батыс Қазақстан облысы, Орал қаласы',
  storeAddressRu: 'Западно-Казахстанская область, г. Уральск',
};

const ADMIN_TOKEN_KEY = 'qainar_admin_token';

export default function App() {
  const [lang, setLang] = useState<Language>('kk');
  const [view, setView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'butter' | 'balm'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const fetchStoreData = useCallback(async () => {
    try {
      const [prodRes, setRes] = await Promise.all([fetch('/api/products'), fetch('/api/settings')]);
      const prodData = await prodRes.json();
      const setData = await setRes.json();
      if (Array.isArray(prodData?.products)) {
        setProducts(prodData.products);
      }
      if (setData?.settings) {
        setSettings(setData.settings);
      }
    } catch {
      // Keep graceful empty state if offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  // Verify saved admin token on load
  useEffect(() => {
    if (!adminToken) return;
    fetch('/api/admin/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          setAdminToken(null);
          try {
            sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});
  }, [adminToken]);

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    try {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  };

  const handleLogout = useCallback(() => {
    setAdminToken(null);
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleNavigateSection = (sectionId: string, filter?: 'all' | 'butter' | 'balm') => {
    if (filter) {
      setCategoryFilter(filter);
    }
    setView('store');
    setTimeout(() => {
      if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 30);
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i,
        );
      }
      return [...prev, { product, quantity }];
    });
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((curr) => (curr === product.id ? null : curr));
    }, 1200);
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: Math.min(99, quantity) } : i)),
    );
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat =
        categoryFilter === 'all'
          ? true
          : categoryFilter === 'butter'
            ? p.category === 'butter'
            : p.category === 'balm' || p.category === 'set';

      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.nameRu && p.nameRu.toLowerCase().includes(q)) ||
        p.shortDescription.toLowerCase().includes(q)
      );
    });
  }, [products, categoryFilter, searchQuery]);

  const copy =
    lang === 'kk'
      ? {
          heroTitle: 'Таза сары май және Global Trend нано бальзамдары',
          heroDesc:
            'Ауылдың табиғи таза сары майы қолжетімді бағада және түпнұсқа Global Trend Company өсімдік нано бальзамдары. Жақын жерлерге жылдам жеткіземіз.',
          heroCta: 'Тауарларды көру',
          heroSecondary: 'Бальзамдар туралы',
          kpis: [
            { num: '01.', title: 'Таза табиғи май', desc: 'Қоспасыз, таза сүт кілегейінен' },
            { num: '02.', title: 'Түпнұсқа Global Trend', desc: '189 өсімдік негізіндегі бальзамдар' },
            { num: '03.', title: 'Қолжетімді баға', desc: 'Артық үстемесіз тікелей жеткізу' },
            { num: '04.', title: 'Жақын жерге жеткізу', desc: 'Тапсырыс берілген күні есікке дейін' },
          ],
          catalogTitle: 'Дүкен сөресі',
          catalogSubtitle: 'Қажетті өнімді таңдап, себетке қосыңыз',
          filterAll: 'Барлығы',
          filterButter: 'Сары май',
          filterBalm: 'Нано бальзамдар',
          searchPlaceholder: 'Тауар атауын іздеу...',
          details: 'Толығырақ',
          add: 'Себетке',
          added: 'Қосылды',
          outOfStock: 'Таусылды',
          loading: 'Тауарлар жүктелуде...',
          emptySearch: 'Іздеу бойынша тауар табылмады.',
          balmSectionTitle: 'Global Trend Company нано бальзамдары туралы',
          balmSectionText:
            'Global Trend Company — жасушалық қоректендіруге арналған отандық озық өнімдер өндірушісі. Барлық нано бальзамдардың негізінде 189 түрлі емдік өсімдік, 40 теңіз балдыры және 4 түрлі женьшень кіретін патенттелген «Pavlov Spring» концентраты бар. Құрамында Коэнзим Q-10, Ресвератрол және 250-ге жуық макро-микроэлементтер қамтылған.',
          balmList: [
            {
              name: 'Perfecto Lux',
              text: 'Жасушаларды терең тазарту, қан айналымы мен жүрек-қантамыр жүйесін қолдау (цитрус шырындарымен).',
            },
            {
              name: 'Vitality Lux',
              text: 'Иммунитетті нығайту, шаршауды басу және жүйке жүйесін қуаттандыру (анар мен мангостин шырынымен).',
            },
            {
              name: 'Smart Lux',
              text: 'Ми белсенділігі, есте сақтау, зейін мен сапалы ұйқыны қолдауға арналған антиоксидантты кешен.',
            },
            {
              name: 'Pavlov Spring',
              text: 'Ауыз суға тамшылатып қосылатын 189 өсімдік сығындысы бар негізгі концентрат.',
            },
          ],
          balmDisclaimer:
            'Өнімдер сауықтыруға арналған биологиялық белсенді қоспа (ББҚ) болып табылады, дәрілік зат емес.',
          deliveryTitle: 'Сары май және жақын жерлерге жеткізу',
          deliveryButterText:
            'Біздің сары май 100% табиғи сиыр сүтінен жасалады — пальма майы, маргарин немесе консерванттар қосылмайды. Отбасылық дастарханға қолжетімді бағамен ұсынылады.',
          footerRights: 'Барлық құқықтар қорғалған.',
        }
      : {
          heroTitle: 'Чистое Сары май и нано-бальзамы Global Trend',
          heroDesc:
            'Натуральное домашнее топлёное масло без добавок по доступной цене и оригинальные растительные нано-бальзамы Global Trend Company. Быстрая доставка по ближайшим районам.',
          heroCta: 'Перейти в каталог',
          heroSecondary: 'О нано-бальзамах',
          kpis: [
            { num: '01.', title: '100% чистое масло', desc: 'Без пальмового масла и добавок' },
            { num: '02.', title: 'Оригинал Global Trend', desc: 'На базе 189 целебных растений' },
            { num: '03.', title: 'Доступная цена', desc: 'Напрямую без лишних наценок' },
            { num: '04.', title: 'Доставка поблизости', desc: 'Привезём в день заказа до двери' },
          ],
          catalogTitle: 'Каталог товаров',
          catalogSubtitle: 'Выберите свежее сары май или нано-бальзам и добавьте в корзину',
          filterAll: 'Все товары',
          filterButter: 'Сары май',
          filterBalm: 'Нано-бальзамы',
          searchPlaceholder: 'Поиск по названию...',
          details: 'Подробнее',
          add: 'В корзину',
          added: 'Добавлено',
          outOfStock: 'Нет в наличии',
          loading: 'Загрузка каталога...',
          emptySearch: 'По вашему запросу ничего не найдено.',
          balmSectionTitle: 'О нано-бальзамах Global Trend Company',
          balmSectionText:
            'Global Trend Company — казахстанский производитель продуктов клеточного питания четвёртого поколения. В основе линейки лежит запатентованный концентрат «Pavlov Spring», объединяющий 189 растительных компонентов, около 40 видов водорослей, 4 вида женьшеня, Коэнзим Q-10, Ресвератрол и около 250 макро- и микроэлементов.',
          balmList: [
            {
              name: 'Perfecto Lux',
              text: 'Глубокое очищение клеток, поддержка сердечно-сосудистой системы и ЖКТ (с соком цитрусовых).',
            },
            {
              name: 'Vitality Lux',
              text: 'Энергия клеток, укрепление иммунитета и снятие усталости (с соком граната и мангостина).',
            },
            {
              name: 'Smart Lux',
              text: 'Поддержка мозга, памяти, концентрации внимания и нервной системы.',
            },
            {
              name: 'Pavlov Spring',
              text: 'Базовый высококонцентрированный эликсир на 189 травах для добавления в питьевую воду.',
            },
          ],
          balmDisclaimer:
            'Продукция относится к средствам оздоровительного питания (БАД) и не является лекарственным средством.',
          deliveryTitle: 'Натуральное Сары май и доставка поблизости',
          deliveryButterText:
            'Наше сары май изготавливается из свежих деревенских сливок по традиционной технологии. Золотистый цвет, чистый сливочный вкус и честная доступная цена.',
          footerRights: 'Все права защищены.',
        };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#18181B]">
      <Header
        lang={lang}
        cartCount={cartCount}
        activeView={view}
        onNavigateSection={handleNavigateSection}
        onOpenAdmin={() => {
          setView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setCartOpen(true)}
      />

      {view === 'admin' ? (
        <main className="flex-1">
          <AdminPanel
            lang={lang}
            token={adminToken}
            products={products}
            settings={settings}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
            onProductsUpdated={setProducts}
            onSettingsUpdated={setSettings}
            onBackToStore={() => setView('store')}
          />
        </main>
      ) : (
        <main className="flex-1">
          {/* Hero Section: Balanced 2-Column Split */}
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-12 sm:pt-12 sm:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-2">
                <p className="text-xs font-medium tracking-wide text-[#52524C]">
                  {lang === 'kk'
                    ? 'Табиғи сүт өнімі · Global Trend Company'
                    : 'Натуральный продукт · Global Trend Company'}
                </p>

                <h1
                  className="font-display text-4xl sm:text-5xl font-semibold text-[#18181B] leading-[1.12] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {copy.heroTitle}
                </h1>

                <p className="text-base text-[#52524C] leading-relaxed max-w-xl">{copy.heroDesc}</p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleNavigateSection('catalog')}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>{copy.heroCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateSection('balms-info')}
                    className="px-4 py-3 text-sm font-medium text-[#18181B] hover:underline underline-offset-4 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copy.heroSecondary}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="w-full h-full min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden bg-[#EFECE4] border border-[#E4E1DA]">
                  <img
                    src={HERO_BANNER_SRC}
                    alt={copy.heroTitle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-Column KPI / Value Strip */}
            <div className="mt-10 pt-8 border-t border-[#E4E1DA] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {copy.kpis.map((item) => (
                <div key={item.num} className="space-y-1">
                  <p className="text-xs font-mono text-[#B47B1B] font-medium">{item.num}</p>
                  <h2 className="text-sm font-semibold text-[#18181B]">{item.title}</h2>
                  <p className="text-xs text-[#52524C] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Catalog Section */}
          <section
            id="catalog"
            className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[#E4E1DA]"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-1.5">
                <h2 className="font-display text-3xl font-semibold text-[#18181B]">
                  {copy.catalogTitle}
                </h2>
                <p className="text-sm text-[#52524C]">{copy.catalogSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter Tabs */}
                <div className="inline-flex items-center gap-1 p-1 bg-[#EFECE4] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      categoryFilter === 'all'
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#52524C] hover:text-[#18181B]'
                    }`}
                  >
                    {copy.filterAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('butter')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      categoryFilter === 'butter'
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#52524C] hover:text-[#18181B]'
                    }`}
                  >
                    {copy.filterButter}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('balm')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      categoryFilter === 'balm'
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#52524C] hover:text-[#18181B]'
                    }`}
                  >
                    {copy.filterBalm}
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#6B6B63] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={copy.searchPlaceholder}
                    className="pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-[#D6D2C9] rounded-lg focus:outline-none focus:border-[#1B4332] w-48 sm:w-56"
                  />
                </div>

                {/* Language Switch (KK / RU) */}
                <div className="inline-flex items-center gap-1 p-1 bg-[#EFECE4] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLang('kk')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      lang === 'kk' ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#52524C]'
                    }`}
                  >
                    ҚАЗ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('ru')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      lang === 'ru' ? 'bg-white text-[#18181B] shadow-sm' : 'text-[#52524C]'
                    }`}
                  >
                    РУС
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm text-[#6B6B63]">{copy.loading}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-sm text-[#6B6B63]">{copy.emptySearch}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {filteredProducts.map((product) => {
                  const title = lang === 'ru' && product.nameRu ? product.nameRu : product.name;
                  const shortDesc =
                    lang === 'ru' && product.shortDescriptionRu
                      ? product.shortDescriptionRu
                      : product.shortDescription;
                  const catText =
                    product.category === 'butter'
                      ? lang === 'kk'
                        ? 'Сары май'
                        : 'Сары май'
                      : product.category === 'set'
                        ? lang === 'kk'
                          ? 'Жиынтық'
                          : 'Набор'
                        : lang === 'kk'
                          ? 'Global Trend'
                          : 'Global Trend';
                  const isAdded = addedProductId === product.id;

                  return (
                    <article
                      key={product.id}
                      className="group bg-white border border-[#E4E1DA] rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="aspect-[4/3] w-full bg-[#F3F1EC] overflow-hidden block cursor-pointer"
                      >
                        <ProductImage
                          src={product.imageUrl}
                          alt={title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </button>

                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-[#6B6B63]">
                            <span>{catText}</span>
                            <span aria-hidden="true">·</span>
                            <span>{product.unit}</span>
                            {!product.inStock && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-red-700 font-medium">{copy.outOfStock}</span>
                              </>
                            )}
                          </div>

                          <h3
                            onClick={() => setSelectedProduct(product)}
                            className="text-base font-semibold text-[#18181B] leading-snug cursor-pointer hover:text-[#1B4332] transition-colors"
                          >
                            {title}
                          </h3>

                          <p className="text-xs text-[#52524C] leading-relaxed line-clamp-2">
                            {shortDesc}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#F0EDE5] flex items-center justify-between gap-3">
                          <span className="font-mono text-base font-semibold tabular-nums text-[#18181B]">
                            {product.price.toLocaleString('ru-RU')} ₸
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedProduct(product)}
                              className="px-3 py-1.5 text-xs font-medium text-[#52524C] hover:text-[#18181B] transition-colors cursor-pointer whitespace-nowrap"
                            >
                              {copy.details}
                            </button>
                            <button
                              type="button"
                              disabled={!product.inStock}
                              onClick={() => handleAddToCart(product, 1)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                                isAdded
                                  ? 'bg-[#B47B1B] text-white'
                                  : 'bg-[#1B4332] text-white hover:bg-[#143326] disabled:opacity-40 disabled:cursor-not-allowed'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{copy.added}</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>{copy.add}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Editorial Information & Delivery Section */}
          <section
            id="balms-info"
            className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 border-t border-[#E4E1DA]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-5">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#18181B]">
                  {copy.balmSectionTitle}
                </h2>
                <p className="text-sm text-[#3F3F3A] leading-relaxed">{copy.balmSectionText}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {copy.balmList.map((item) => (
                    <div
                      key={item.name}
                      className="p-4 bg-white border border-[#E4E1DA] rounded-xl space-y-1.5"
                    >
                      <h3 className="text-sm font-semibold text-[#18181B]">{item.name}</h3>
                      <p className="text-xs text-[#52524C] leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#6B6B63]">{copy.balmDisclaimer}</p>
              </div>

              <div id="delivery" className="lg:col-span-5">
                <div className="bg-[#F3F1EC] border border-[#E4E1DA] rounded-xl p-6 sm:p-7 space-y-5 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <h2 className="font-display text-2xl font-semibold text-[#18181B]">
                      {copy.deliveryTitle}
                    </h2>
                    <p className="text-sm text-[#3F3F3A] leading-relaxed">
                      {copy.deliveryButterText}
                    </p>
                    <p className="text-sm text-[#18181B] font-medium leading-relaxed">
                      {lang === 'kk' ? settings.deliveryNote : settings.deliveryNoteRu}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-[#DEDAD0] space-y-3 text-sm text-[#18181B]">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#1B4332] shrink-0" />
                      <span>{lang === 'kk' ? settings.storeAddress : settings.storeAddressRu}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#1B4332] shrink-0" />
                      <a
                        href={`tel:+${settings.contactPhone.replace(/\D/g, '')}`}
                        className="font-mono hover:text-[#1B4332] hover:underline underline-offset-4 transition-colors"
                      >
                        {settings.contactPhone}
                      </a>
                    </div>
                    <div className="pt-2">
                      <a
                        href={`https://wa.me/${settings.contactPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium bg-[#1B4332] text-white rounded-lg hover:bg-[#143326] transition-colors"
                      >
                        {lang === 'kk' ? 'WhatsApp арқылы жазу' : 'Написать в WhatsApp'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-[#E4E1DA] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6B63]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-base font-semibold text-[#18181B]">Қайнар</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'kk' ? settings.storeAddress : settings.storeAddressRu}</span>
            <span aria-hidden="true">·</span>
            <a
              href={`tel:+${settings.contactPhone.replace(/\D/g, '')}`}
              className="font-mono hover:text-[#18181B] transition-colors"
            >
              {settings.contactPhone}
            </a>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigateSection('catalog')}
              className="hover:text-[#18181B] transition-colors cursor-pointer"
            >
              {lang === 'kk' ? 'Каталог' : 'Каталог'}
            </button>
            <button
              type="button"
              onClick={() => handleNavigateSection('delivery')}
              className="hover:text-[#18181B] transition-colors cursor-pointer"
            >
              {lang === 'kk' ? 'Жеткізу' : 'Доставка'}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#18181B] transition-colors cursor-pointer"
            >
              {lang === 'kk' ? 'Админ панель' : 'Админ-панель'}
            </button>
          </div>
        </div>
      </footer>

      <ProductModal
        product={selectedProduct}
        lang={lang}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        open={cartOpen}
        items={cart}
        lang={lang}
        settings={settings}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={(id) => setCart((prev) => prev.filter((i) => i.product.id !== id))}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}
