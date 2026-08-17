type Entry<T> = { expires: number; value: Promise<T> };

export function cached<T>(store: Map<string, Entry<T>>, key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) return hit.value;
  let value: Promise<T>;
  value = load().catch((error) => {
    if (store.get(key)?.value === value) store.delete(key);
    throw error;
  });
  store.set(key, { expires: now + ttlMs, value });
  return value;
}
