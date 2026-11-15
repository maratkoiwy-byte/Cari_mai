import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import type { Order, OrderStatus, Product, StoreSettings } from '../src/types';

dotenv.config();

const IS_SERVERLESS =
  process.env.VERCEL === '1' ||
  process.env.NETLIFY === 'true' ||
  Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DATA_DIR = path.join(process.cwd(), 'data');
const BUNDLED_STORE_FILE = path.join(BUNDLED_DATA_DIR, 'store.json');
const RUNTIME_STORE_FILE = IS_SERVERLESS ? '/tmp/qainar-store.json' : BUNDLED_STORE_FILE;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'Marat';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '7777';
const TOKEN_SECRET = process.env.SESSION_SECRET || 'qainar-store-hmac-secret-2026';

const REDIS_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
const REDIS_TOKEN = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const REDIS_KEY = 'qainar_store_v1';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface StoreData {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  telegram: TelegramConfig;
  nextOrderNumber: number;
}

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

const SEED_PRODUCTS: Product[] = [
  {
    id: 'sary-mai-1kg',
    name: 'Таза сары май — Отбасылық',
    nameRu: 'Чистое Сары май — Семейная банка',
    category: 'butter',
    price: 7500,
    unit: '1 кг',
    shortDescription: 'Үлкен отбасыға арналған үнемді 1 кг қаптама. Апта сайын жаңа партия келеді.',
    shortDescriptionRu: 'Выгодный семейный объём 1 кг. Свежая партия каждую неделю напрямую без посредников.',
    description:
      'Делдалсыз тікелей өндірушіден жеткізілетін 1 келілік таза сары май. Хош иісті, алтын түстес, дәрумендерге (A, D, E, K) бай табиғи өнім. Жақын жерлерге жылдам жеткіземіз.',
    descriptionRu:
      'Свежее домашнее сары май напрямую от производителя по доступной цене. Богатый сливочный аромат, золотистый цвет, источник натуральных жирорастворимых витаминов A, D, E, K.',
    ingredients: '100% табиғи тазартылған сүт майы',
    ingredientsRu: '100% натуральный молочный жир',
    usage: 'Қуыруға, пісіруге және күнделікті тағамға қолдануға жарамды.',
    usageRu: 'Подходит для жарки, выпечки и ежедневного употребления.',
    imageUrl: '/src/assets/images/custom_sary-mai-1kg.jpg',
    inStock: true,
    featured: true,
    createdAt: '2026-11-01T08:05:00.000Z',
  },
  {
    id: 'perfecto-lux',
    name: 'Perfecto Lux — Нано бальзам',
    nameRu: 'Нано-бальзам Perfecto Lux (Перфекто Люкс)',
    category: 'balm',
    price: 15000,
    unit: '100 мл',
    shortDescription: 'Global Trend Company: жасушаны терең тазартуға және қан айналымын жақсартуға арналған антиоксидантты бальзам.',
    shortDescriptionRu: 'Global Trend Company: антиоксидантный концентрат для глубокого клеточного очищения и поддержки сосудов.',
    description:
      'Global Trend Company ұсынған төртінші буындағы жасушалық қоректендіру өнімі. Негізінде 189 түрлі өсімдік сығындысы бар «Pavlov Spring» концентраты жатыр. Ағзаны токсиндер мен шлактардан тазартуға, жүрек-қантамыр және асқазан-ішек жолдарының жұмысын қолдауға, қанды сұйылтуға көмектеседі.',
    descriptionRu:
      'Продукт клеточного питания четвёртого поколения от Global Trend Company на основе концентрата Pavlov Spring (189 растительных компонентов). Способствует глубокому очищению организма от токсинов, поддержке сердечно-сосудистой системы и ЖКТ.',
    ingredients: 'Pavlov Spring (189 өсімдік, 40 теңіз балдыры, женьшень), Коэнзим Q-10, Ресвератрол, 250 микроэлемент, табиғи цитрус шырындары, ара аналық сүті.',
    ingredientsRu: 'Концентрат Pavlov Spring (189 трав, водоросли, женьшень), коэнзим Q-10, ресвератрол, ксантоны, натуральные соки цитрусовых, пчелиное маточное молочко.',
    usage: 'Күніне 1 рет таңертең аш қарынға 0,5 шай қасықтан (немесе тамшылап бастап) жылы сумен ішіледі. Дәрілік зат болып табылмайды (ББҚ).',
    usageRu: 'Принимать утром натощак с минимальной дозировки (от нескольких капель до 0,5 чайной ложки), запивая водой. Не является лекарственным средством.',
    imageUrl: '/src/assets/images/custom_perfecto-lux.jpg',
    inStock: true,
    featured: true,
    createdAt: '2026-11-01T08:10:00.000Z',
  },
  {
    id: 'vitality-lux',
    name: 'Vitality Lux — Нано бальзам',
    nameRu: 'Нано-бальзам Vitality Lux (Виталити Люкс)',
    category: 'balm',
    price: 15000,
    unit: '100 мл',
    shortDescription: 'Global Trend Company: иммунитетті нығайтуға, қуат беруге және жүйке жүйесін қолдауға арналған эликсир.',
    shortDescriptionRu: 'Global Trend Company: энергетическое питание клеток, укрепление иммунитета и снятие хронической усталости.',
    description:
      'Жасушаларды дәрумендермен және минералдармен қанықтыратын жоғары биожетімді (98%-ға дейін) фитоконцентрат. Шаршауды басады, иммунитетті көтереді, зат алмасуды реттейді және ағзаның өміршеңдігін арттырады. Perfecto Lux-пен бірге қабылдағанда кешенді әсер береді.',
    descriptionRu:
      'Высокобиодоступный клеточный концентрат с соком граната и мангостина. Насыщает организм энергией, укрепляет иммунную и нервную системы, помогает восстановить силы и нормализовать обмен веществ.',
    ingredients: 'Pavlov Spring (189 өсімдік компоненті), гранат және мангостин шырыны, Коэнзим Q-10, Ресвератрол, ксантондар, В, С, Е дәрумендері, минералдар кешені.',
    ingredientsRu: 'Концентрат Pavlov Spring (189 растений), сок граната и мангостина, коэнзим Q-10, ресвератрол, витамины и 250 макро- и микроэлементов.',
    usage: 'Perfecto Lux ішкеннен кейін 10–15 минут өткен соң немесе күндіз 0,5 шай қасықтан сумен қабылданады. Қолданар алдында маманмен кеңесу ұсынылады.',
    usageRu: 'Принимать через 10–15 минут после Perfecto Lux (от нескольких капель до 0,5 ч.л. в день), запивая водой.',
    imageUrl: '/src/assets/images/custom_vitality-lux.jpg',
    inStock: true,
    featured: true,
    createdAt: '2026-11-01T08:15:00.000Z',
  },
  {
    id: 'base-pair-set',
    name: 'Базалық жиынтық: Perfecto Lux + Vitality Lux',
    nameRu: 'Базовый комплекс: Perfecto Lux + Vitality Lux',
    category: 'set',
    price: 28000,
    unit: '2 × 100 мл',
    shortDescription: 'Global Trend Company басты жұбы — кешенді тазарту және жасушалық қоректендіру курсы.',
    shortDescriptionRu: 'Рекомендованная базовая пара бальзамов для комплексного очищения и восстановления энергии.',
    description:
      'Ең танымал базалық курс: Perfecto Lux ағзаны тазартуға, ал Vitality Lux жасушаларды қоректендіру мен иммунитетті күшейтуге бағытталған. Бірге алғанда бағасы тиімдірек.',
    descriptionRu:
      'Классический дуэт Global Trend Company: Perfecto Lux отвечает за очищение и микроциркуляцию, а Vitality Lux — за восполнение энергии и защиту иммунитета. Выгоднее при покупке комплектом.',
    ingredients: 'Perfecto Lux (100 мл) + Vitality Lux (100 мл) — 189 өсімдік сығындысы, Q-10, ресвератрол, цитрус, гранат және мангостин шырындары.',
    ingredientsRu: 'Perfecto Lux (100 мл) + Vitality Lux (100 мл) на базе концентрата Pavlov Spring.',
    usage: 'Күн сайын кезекпен (арасы 10–15 минут) аз мөлшерден бастап сумен ішу ұсынылады.',
    usageRu: 'Принимать поочерёдно с интервалом 10–15 минут, начиная с минимальных доз.',
    imageUrl: '/src/assets/images/custom_base-pair-set.jpg',
    inStock: true,
    featured: true,
    createdAt: '2026-11-01T08:20:00.000Z',
  },
  {
    id: 'smart-lux',
    name: 'Smart Lux — Нано бальзам',
    nameRu: 'Нано-бальзам Smart Lux (Смарт Люкс)',
    category: 'balm',
    price: 16000,
    unit: '100 мл',
    shortDescription: 'Ми қызметін, есте сақтауды, зейінді және жүйке жүйесін қолдауға арналған фитоконцентрат.',
    shortDescriptionRu: 'Инновационный бальзам для поддержки мозга, памяти, концентрации и нервной системы.',
    description:
      'Орталық жүйке жүйесі мен ми қан айналымына бағытталған Global Trend өнімі. Стресс пен созылмалы шаршауды азайтуға, ұйқы сапасын және ойлау белсенділігін жақсартуға көмектеседі.',
    descriptionRu:
      'Специализированный антиоксидантный концентрат с коэнзимом Q-10 и свежим соком граната. Поддерживает когнитивные функции, память, стрессоустойчивость и здоровье сосудов.',
    ingredients: 'Pavlov Spring негізі, Коэнзим Q-10 (убихинон), табиғи гранат шырыны, өсімдік полифенолдары мен микроэлементтер.',
    ingredientsRu: 'Растительный комплекс Pavlov Spring, коэнзим Q-10, свежевыжатый сок граната, антиоксиданты.',
    usage: 'Күніне 1 рет 0,5 шай қасықтан таза сумен бірге қабылдау ұсынылады.',
    usageRu: 'Рекомендуется принимать по 0,5 чайной ложки в день, запивая чистой водой.',
    imageUrl: '/src/assets/images/product_smart_lux_pavlov_1794738805271.jpg',
    inStock: true,
    featured: false,
    createdAt: '2026-11-01T08:25:00.000Z',
  },
  {
    id: 'pavlov-spring',
    name: 'Pavlov Spring — 189 шөпті концентрат',
    nameRu: 'Концентрат Pavlov Spring (Павлов Спринг)',
    category: 'balm',
    price: 32000,
    unit: '100 мл',
    shortDescription: 'Global Trend компаниясының патенттелген базалық концентраты. Ауыз суға тамшылатып қосылады.',
    shortDescriptionRu: 'Базовый запатентованный концентрат из 189 растений. Добавляется по каплям в питьевую воду.',
    description:
      'Барлық нано бальзамдардың негізі болып табылатын жоғары концентрациялы өсімдік эликсирі. Құрамында бес құрлықтың 189 емдік шөбі, 40-қа жуық теңіз балдыры және 4 түрлі женьшень бар. Судың құрылымын байытып, жасушалық детоксикацияны іске қосады.',
    descriptionRu:
      'Фундаментальный растительный эликсир Global Trend Company. Содержит 189 лекарственных растений, кореньев, ягод, около 40 видов водорослей и 4 вида женьшеня. Обогащает питьевую воду и активирует клеточный энергообмен.',
    ingredients: '189 түрлі емдік өсімдіктер (шайқурай, мелисса, итмұрын, долана, мия тамыры), 40 балдыр түрі, 4 түрлі женьшень, Q-10, 250 микроэлемент.',
    ingredientsRu: '189 растительных компонентов, 40 видов водорослей, 4 вида женьшеня, коэнзим Q-10, ксантоны, 250 макро- и микроэлементов.',
    usage: '5–10 литр таза ауыз суға 1 тамшыдан (немесе нұсқаулыққа сай) араластырып, күні бойы ішеді.',
    usageRu: 'Разводится в питьевой воде (обычно 1 капля на 5–10 литров воды) для употребления в течение дня.',
    imageUrl: '/src/assets/images/product_smart_lux_pavlov_1794738805271.jpg',
    inStock: true,
    featured: false,
    createdAt: '2026-11-01T08:30:00.000Z',
  },
];

function normalizeStore(raw?: Partial<StoreData> | null): StoreData {
  return {
    products: Array.isArray(raw?.products) ? raw.products : SEED_PRODUCTS,
    orders: Array.isArray(raw?.orders) ? raw.orders : [],
    settings: raw?.settings ? { ...DEFAULT_SETTINGS, ...raw.settings } : DEFAULT_SETTINGS,
    telegram: raw?.telegram
      ? {
          botToken: typeof raw.telegram.botToken === 'string' ? raw.telegram.botToken : '',
          chatId: typeof raw.telegram.chatId === 'string' ? raw.telegram.chatId : '',
        }
      : { botToken: '', chatId: '' },
    nextOrderNumber: typeof raw?.nextOrderNumber === 'number' ? raw.nextOrderNumber : 1001,
  };
}

function readBundledSeed(): StoreData {
  try {
    if (fs.existsSync(BUNDLED_STORE_FILE)) {
      const raw = fs.readFileSync(BUNDLED_STORE_FILE, 'utf8');
      return normalizeStore(JSON.parse(raw) as Partial<StoreData>);
    }
  } catch {
    // ignore read error
  }
  return normalizeStore(null);
}

async function readStore(): Promise<StoreData> {
  // 1. Optional Vercel KV / Upstash Redis persistence
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(REDIS_KEY)}`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const payload = (await res.json()) as { result?: string | null };
        if (payload.result) {
          return normalizeStore(JSON.parse(payload.result) as Partial<StoreData>);
        }
        const seeded = readBundledSeed();
        await writeStore(seeded);
        return seeded;
      }
    } catch {
      // Fallback to local/tmp file if Redis temporarily unreachable
    }
  }

  // 2. Runtime file (data/store.json locally, /tmp/qainar-store.json on Vercel)
  if (fs.existsSync(RUNTIME_STORE_FILE)) {
    try {
      const raw = fs.readFileSync(RUNTIME_STORE_FILE, 'utf8');
      return normalizeStore(JSON.parse(raw) as Partial<StoreData>);
    } catch {
      // Fall through to re-seed
    }
  }

  const initial = readBundledSeed();
  await writeStore(initial);
  return initial;
}

async function writeStore(data: StoreData): Promise<void> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      await fetch(`${REDIS_URL}/set/${encodeURIComponent(REDIS_KEY)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${REDIS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(data)),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      console.error('Failed to write Redis store:', err);
    }
  }

  try {
    const dir = path.dirname(RUNTIME_STORE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RUNTIME_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    if (!IS_SERVERLESS) {
      console.error('Failed to write store file:', err);
    }
  }
}

function signToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { sub: string; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      exp: number;
    };
    if (typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const verified = token ? verifyToken(token) : null;
  if (!verified || verified.sub !== ADMIN_USERNAME) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  textHtml: string,
): Promise<{ ok: boolean; error?: string }> {
  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();
  if (!cleanToken || !cleanChatId) {
    return { ok: false, error: 'Bot Token and Chat ID are required' };
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: textHtml,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await response.json()) as { ok?: boolean; description?: string };
    if (!response.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

function formatOrderTelegramMessage(order: Order): string {
  const deliveryLabel =
    order.deliveryType === 'pickup' ? 'Өзі алып кету / Самовывоз' : 'Жеткізу / Доставка';
  const paymentLabel =
    order.paymentMethod === 'kaspi_transfer' ? 'Kaspi аударым' : 'Қолма-қол / Наличные';

  const itemsLines = order.items
    .map(
      (item) =>
        `• ${escapeHtml(item.name)} (${escapeHtml(item.unit)}) × ${item.quantity} — <b>${(
          item.price * item.quantity
        ).toLocaleString('ru-RU')} ₸</b>`,
    )
    .join('\n');

  const lines = [
    `🛒 <b>Жаңа тапсырыс / Новый заказ: ${escapeHtml(order.id)}</b>`,
    '',
    `👤 <b>Клиент:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(order.phone)}`,
    `🚚 <b>Алу тәсілі:</b> ${deliveryLabel}`,
    `📍 <b>Мекенжай:</b> ${escapeHtml(order.address)}`,
    `💳 <b>Төлем:</b> ${paymentLabel}`,
    '',
    `📦 <b>Тауарлар:</b>`,
    itemsLines,
    '',
    `💰 <b>Жиыны / Итого:</b> ${order.totalAmount.toLocaleString('ru-RU')} ₸`,
  ];

  if (order.comment) {
    lines.push('', `💬 <b>Түсініктеме:</b> ${escapeHtml(order.comment)}`);
  }

  return lines.join('\n');
}

export function createApiApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = signToken(ADMIN_USERNAME);
      res.json({ ok: true, username: ADMIN_USERNAME, token });
      return;
    }
    res.status(401).json({ ok: false, error: 'Invalid credentials' });
  });

  app.get('/api/admin/me', requireAdmin, (_req: Request, res: Response) => {
    res.json({ ok: true, username: ADMIN_USERNAME });
  });

  app.get('/api/products', async (_req: Request, res: Response) => {
    const store = await readStore();
    res.json({ products: store.products });
  });

  app.get('/api/settings', async (_req: Request, res: Response) => {
    const store = await readStore();
    res.json({ settings: store.settings });
  });

  app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
    const body = req.body as Partial<Product>;
    const name = (body.name || '').trim();
    const price = Number(body.price);
    if (!name || Number.isNaN(price) || price < 0) {
      res.status(400).json({ error: 'Product name and valid price are required' });
      return;
    }
    const store = await readStore();
    const newProduct: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      nameRu: (body.nameRu || '').trim() || undefined,
      category:
        body.category === 'butter' || body.category === 'balm' || body.category === 'set'
          ? body.category
          : 'butter',
      price: Math.round(price),
      unit: (body.unit || '1 дана').trim(),
      shortDescription: (body.shortDescription || '').trim() || name,
      shortDescriptionRu: (body.shortDescriptionRu || '').trim() || undefined,
      description: (body.description || body.shortDescription || name).trim(),
      descriptionRu: (body.descriptionRu || '').trim() || undefined,
      ingredients: (body.ingredients || '').trim() || undefined,
      ingredientsRu: (body.ingredientsRu || '').trim() || undefined,
      usage: (body.usage || '').trim() || undefined,
      usageRu: (body.usageRu || '').trim() || undefined,
      imageUrl:
        (body.imageUrl || '').trim() || '/src/assets/images/product_sary_mai_jar_1794738803072.jpg',
      inStock: body.inStock !== false,
      featured: Boolean(body.featured),
      createdAt: new Date().toISOString(),
    };
    store.products.unshift(newProduct);
    await writeStore(store);
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as Partial<Product>;
    const store = await readStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const existing = store.products[idx];
    const nextPrice = body.price !== undefined ? Number(body.price) : existing.price;
    const updated: Product = {
      ...existing,
      name: body.name !== undefined ? body.name.trim() || existing.name : existing.name,
      nameRu: body.nameRu !== undefined ? body.nameRu.trim() || undefined : existing.nameRu,
      category:
        body.category === 'butter' || body.category === 'balm' || body.category === 'set'
          ? body.category
          : existing.category,
      price: Number.isNaN(nextPrice) ? existing.price : Math.round(nextPrice),
      unit: body.unit !== undefined ? body.unit.trim() || existing.unit : existing.unit,
      shortDescription:
        body.shortDescription !== undefined ? body.shortDescription.trim() : existing.shortDescription,
      shortDescriptionRu:
        body.shortDescriptionRu !== undefined
          ? body.shortDescriptionRu.trim() || undefined
          : existing.shortDescriptionRu,
      description: body.description !== undefined ? body.description.trim() : existing.description,
      descriptionRu:
        body.descriptionRu !== undefined ? body.descriptionRu.trim() || undefined : existing.descriptionRu,
      ingredients:
        body.ingredients !== undefined ? body.ingredients.trim() || undefined : existing.ingredients,
      ingredientsRu:
        body.ingredientsRu !== undefined ? body.ingredientsRu.trim() || undefined : existing.ingredientsRu,
      usage: body.usage !== undefined ? body.usage.trim() || undefined : existing.usage,
      usageRu: body.usageRu !== undefined ? body.usageRu.trim() || undefined : existing.usageRu,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl.trim() || existing.imageUrl : existing.imageUrl,
      inStock: body.inStock !== undefined ? Boolean(body.inStock) : existing.inStock,
      featured: body.featured !== undefined ? Boolean(body.featured) : existing.featured,
    };
    store.products[idx] = updated;
    await writeStore(store);
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const store = await readStore();
    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== id);
    if (store.products.length === before) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    await writeStore(store);
    res.json({ ok: true });
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    const body = req.body as {
      customerName?: string;
      phone?: string;
      address?: string;
      deliveryType?: 'local_delivery' | 'pickup';
      paymentMethod?: 'cash_on_delivery' | 'kaspi_transfer';
      comment?: string;
      items?: Array<{ productId: string; quantity: number }>;
    };

    const customerName = (body.customerName || '').trim();
    const phone = (body.phone || '').trim();
    const deliveryType = body.deliveryType === 'pickup' ? 'pickup' : 'local_delivery';
    const address = deliveryType === 'pickup' ? 'Өзім алып кетемін' : (body.address || '').trim();

    if (!customerName || !phone || (deliveryType === 'local_delivery' && !address)) {
      res.status(400).json({ error: 'Customer name, phone, and address are required' });
      return;
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    const store = await readStore();
    const verifiedItems: Order['items'] = [];
    let totalAmount = 0;

    for (const item of body.items) {
      const product = store.products.find((p) => p.id === item.productId);
      const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
      if (!product) continue;
      verifiedItems.push({
        productId: product.id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity: qty,
      });
      totalAmount += product.price * qty;
    }

    if (verifiedItems.length === 0) {
      res.status(400).json({ error: 'No valid items in order' });
      return;
    }

    const orderId = `ORD-${store.nextOrderNumber}`;
    store.nextOrderNumber += 1;

    const newOrder: Order = {
      id: orderId,
      customerName,
      phone,
      address,
      deliveryType,
      paymentMethod: body.paymentMethod === 'kaspi_transfer' ? 'kaspi_transfer' : 'cash_on_delivery',
      comment: (body.comment || '').trim() || undefined,
      items: verifiedItems,
      totalAmount,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);
    await writeStore(store);

    const botToken = (store.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (store.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || '').trim();
    if (botToken && chatId) {
      const result = await sendTelegramMessage(botToken, chatId, formatOrderTelegramMessage(newOrder));
      if (!result.ok) {
        console.error('Telegram notification failed:', result.error);
      }
    }

    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders', requireAdmin, async (_req: Request, res: Response) => {
    const store = await readStore();
    res.json({ orders: store.orders });
  });

  app.patch('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const status = req.body?.status as OrderStatus;
    if (status !== 'new' && status !== 'preparing' && status !== 'delivered') {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    const store = await readStore();
    const order = store.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    order.status = status;
    await writeStore(store);
    res.json({ order });
  });

  app.delete('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const store = await readStore();
    store.orders = store.orders.filter((o) => o.id !== id);
    await writeStore(store);
    res.json({ ok: true });
  });

  app.put('/api/settings', requireAdmin, async (req: Request, res: Response) => {
    const body = req.body as Partial<StoreSettings>;
    const store = await readStore();
    store.settings = {
      deliveryNote: body.deliveryNote !== undefined ? body.deliveryNote.trim() : store.settings.deliveryNote,
      deliveryNoteRu:
        body.deliveryNoteRu !== undefined ? body.deliveryNoteRu.trim() : store.settings.deliveryNoteRu,
      freeDeliveryThreshold:
        body.freeDeliveryThreshold !== undefined && !Number.isNaN(Number(body.freeDeliveryThreshold))
          ? Math.max(0, Number(body.freeDeliveryThreshold))
          : store.settings.freeDeliveryThreshold,
      contactPhone: body.contactPhone !== undefined ? body.contactPhone.trim() : store.settings.contactPhone,
      storeAddress: body.storeAddress !== undefined ? body.storeAddress.trim() : store.settings.storeAddress,
      storeAddressRu:
        body.storeAddressRu !== undefined ? body.storeAddressRu.trim() : store.settings.storeAddressRu,
    };
    await writeStore(store);
    res.json({ settings: store.settings });
  });

  app.get('/api/admin/telegram', requireAdmin, async (_req: Request, res: Response) => {
    const store = await readStore();
    res.json({
      botToken: store.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: store.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || '',
    });
  });

  app.put('/api/admin/telegram', requireAdmin, async (req: Request, res: Response) => {
    const botToken = typeof req.body?.botToken === 'string' ? req.body.botToken.trim() : '';
    const chatId = typeof req.body?.chatId === 'string' ? req.body.chatId.trim() : '';
    const store = await readStore();
    store.telegram = { botToken, chatId };
    await writeStore(store);
    res.json({ ok: true, botToken, chatId });
  });

  app.post('/api/admin/telegram/test', requireAdmin, async (req: Request, res: Response) => {
    const store = await readStore();
    const botToken =
      typeof req.body?.botToken === 'string' && req.body.botToken.trim()
        ? req.body.botToken.trim()
        : store.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId =
      typeof req.body?.chatId === 'string' && req.body.chatId.trim()
        ? req.body.chatId.trim()
        : store.telegram?.chatId || process.env.TELEGRAM_CHAT_ID || '';

    const result = await sendTelegramMessage(
      botToken,
      chatId,
      '✅ <b>Қайнар дүкені:</b> Telegram хабарламалары сәтті бапталды! Жаңа тапсырыстар осында келеді.',
    );

    if (!result.ok) {
      res.status(400).json({ ok: false, error: result.error });
      return;
    }
    res.json({ ok: true });
  });

  return app;
}

const vercelApp = createApiApp();
export default vercelApp;
