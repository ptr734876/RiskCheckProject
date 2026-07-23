/**
 * Кэш геоданных в localStorage.
 *
 * Запросы к геокодеру, OpenStreetMap и парсеру Росреестра идут
 * через внешние сервисы и занимают секунды, а иногда падают по
 * таймауту. Повторный поиск того же адреса не должен запускать
 * их заново.
 *
 * Почему localStorage, а не куки: куки ограничены ~4 КБ на домен
 * и отправляются на сервер с каждым запросом. Список объектов
 * окружения туда не помещается, а если бы помещался — замедлял
 * бы все запросы.
 *
 * Срок жизни разный по типам данных:
 *  - адрес и окружение меняются медленно, храним сутки;
 *  - офисы (МФЦ) — тоже сутки;
 *  - кадастровые сведения храним всего час: обременения и аресты
 *    появляются в любой момент, а показать устаревшее
 *    "обременений нет" опаснее, чем сходить в сеть ещё раз.
 */

const PREFIX = 'atlas.geo.';
const VERSION = 'v1';

/** Срок жизни записей по типам, мс. */
export const TTL = {
  lookup: 24 * 60 * 60 * 1000, // адрес + окружение — сутки
  offices: 24 * 60 * 60 * 1000, // МФЦ и Росреестр — сутки
  cadastral: 60 * 60 * 1000, // кадастр — час
} as const;

export type CacheKind = keyof typeof TTL;

interface CacheEntry<T> {
  value: T;
  savedAt: number;
  ttl: number;
}

/** Сколько записей держим, чтобы не разрастаться бесконечно. */
const MAX_ENTRIES = 60;

function isAvailable(): boolean {
  try {
    // В приватном режиме Safari localStorage существует,
    // но выбрасывает при записи — проверяем реальной операцией.
    const probe = `${PREFIX}probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const available = typeof window !== 'undefined' && isAvailable();

/** Нормализует адрес: регистр и лишние пробелы не должны плодить записи. */
function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildKey(kind: CacheKind, query: string): string {
  return `${PREFIX}${VERSION}.${kind}.${normalizeQuery(query)}`;
}

/** Ключ для координат: округляем до ~10 м, иначе кэш не сработает. */
export function coordsKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

export function readCache<T>(kind: CacheKind, query: string): T | null {
  if (!available || !query) return null;

  try {
    const raw = window.localStorage.getItem(buildKey(kind, query));
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry<T>;

    if (Date.now() - entry.savedAt > entry.ttl) {
      window.localStorage.removeItem(buildKey(kind, query));
      return null;
    }

    return entry.value;
  } catch {
    // Повреждённая запись — ведём себя как при промахе.
    return null;
  }
}

export function writeCache<T>(kind: CacheKind, query: string, value: T): void {
  if (!available || !query) return;

  const entry: CacheEntry<T> = {
    value,
    savedAt: Date.now(),
    ttl: TTL[kind],
  };

  const key = buildKey(kind, query);
  const payload = JSON.stringify(entry);

  try {
    window.localStorage.setItem(key, payload);
    return;
  } catch {
    // Квота исчерпана. Освобождаем место постепенно, начиная
    // с самых старых записей, чтобы не потерять свежие.
  }

  const entries = listEntries();

  for (const old of entries) {
    window.localStorage.removeItem(old.key);
    try {
      window.localStorage.setItem(key, payload);
      return;
    } catch {
      // Места всё ещё мало — удаляем следующую по старшинству.
    }
  }

  // Кэш необязателен: если записать не удалось, просто работаем
  // без него, приложение от этого не ломается.
}

/** Все ключи кэша, отсортированные от старых к новым. */
function listEntries(): Array<{ key: string; savedAt: number }> {
  const entries: Array<{ key: string; savedAt: number }> = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;

    let savedAt = 0;
    try {
      savedAt = JSON.parse(window.localStorage.getItem(key) || '{}').savedAt || 0;
    } catch {
      savedAt = 0; // битую запись считаем самой старой
    }
    entries.push({ key, savedAt });
  }

  return entries.sort((a, b) => a.savedAt - b.savedAt);
}

/** Убирает просроченное и лишнее. Вызывается при старте приложения. */
export function pruneCache(): void {
  if (!available) return;

  const now = Date.now();
  const entries: Array<{ key: string; savedAt: number }> = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;

    try {
      const raw = window.localStorage.getItem(key);
      const entry = JSON.parse(raw || '{}') as CacheEntry<unknown>;

      if (!entry.savedAt || now - entry.savedAt > (entry.ttl || 0)) {
        window.localStorage.removeItem(key);
        continue;
      }
      entries.push({ key, savedAt: entry.savedAt });
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  if (entries.length > MAX_ENTRIES) {
    entries
      .sort((a, b) => a.savedAt - b.savedAt)
      .slice(0, entries.length - MAX_ENTRIES)
      .forEach((e) => window.localStorage.removeItem(e.key));
  }
}

/** Полностью очищает кэш геоданных. */
export function clearCache(): void {
  if (!available) return;

  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX)) keys.push(key);
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}

/** Возраст записи в минутах — чтобы показать «данные от такого-то времени». */
export function cacheAgeMinutes(kind: CacheKind, query: string): number | null {
  if (!available || !query) return null;

  try {
    const raw = window.localStorage.getItem(buildKey(kind, query));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<unknown>;
    return Math.floor((Date.now() - entry.savedAt) / 60000);
  } catch {
    return null;
  }
}
