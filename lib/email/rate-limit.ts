/**
 * Limit wysyłek — ZAŚLEPKA NA CZAS PUBLICZNEGO DEMA.
 *
 * Liczniki żyją w pamięci modułu, więc zerują się przy każdym zimnym starcie
 * funkcji serverless, a każda równoległa instancja ma własne. To NIE jest
 * szczelny limit i nie należy go za taki uważać — ma jedynie odciąć oczywiste
 * nadużycie w czasie, gdy endpoint wysyłki jest publiczny i nieuwierzytelniony.
 *
 * Powód istnienia: po weryfikacji domeny w Resend otwarty endpoint pozwalałby
 * wysyłać maile z załącznikiem na dowolny adres z konta właściciela.
 *
 * Docelowo: endpoint za Supabase Auth, a licznik w tabeli powiązanej
 * z użytkownikiem — wtedy ten moduł znika w całości.
 */

const WINDOW_MS = 60 * 60 * 1000;
const PER_IP_LIMIT = 3;
const GLOBAL_LIMIT = 20;

const perIp = new Map<string, number[]>();
let globalHits: number[] = [];

export type RateLimitResult = { allowed: true } | { allowed: false; message: string };

function withinWindow(timestamps: number[], now: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
}

/**
 * x-forwarded-for bywa listą adresów rozdzielonych przecinkami — pierwszy
 * wpis to klient, kolejne to proxy po drodze. Brak nagłówka (np. wywołanie
 * lokalne) trafia do wspólnego kubełka "unknown".
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

/**
 * Liczy PRÓBY, nie udane wysyłki. Gdyby liczyła tylko sukcesy, wystarczyłoby
 * wywoływać endpoint tak, żeby kończył się błędem, i limit nigdy by nie zadziałał.
 */
export function checkSendLimit(ip: string): RateLimitResult {
  const now = Date.now();

  globalHits = withinWindow(globalHits, now);
  if (globalHits.length >= GLOBAL_LIMIT) {
    return {
      allowed: false,
      message: `Demo osiągnęło godzinny limit wysyłek (${GLOBAL_LIMIT}). Spróbuj ponownie za jakiś czas.`,
    };
  }

  const hits = withinWindow(perIp.get(ip) ?? [], now);
  if (hits.length >= PER_IP_LIMIT) {
    perIp.set(ip, hits);
    return {
      allowed: false,
      message: `Z tego adresu wysłano już ${PER_IP_LIMIT} skierowania w ciągu godziny. Spróbuj ponownie później.`,
    };
  }

  hits.push(now);
  perIp.set(ip, hits);
  globalHits.push(now);

  // Kubełki bez trafień w oknie tylko zajmowałyby pamięć między zimnymi startami.
  for (const [key, timestamps] of perIp) {
    if (withinWindow(timestamps, now).length === 0) perIp.delete(key);
  }

  return { allowed: true };
}
