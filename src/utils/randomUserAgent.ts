const DEFAULT_USER_AGENT_POOL = [
  'Interpals/2.4.3 (iPhone; iOS 18.1; Scale/3.00)',
  'Interpals/2.4.3 (iPad; iOS 18.1; Scale/2.00)',
  'Interpals/324 CFNetwork/1494.0.7 Darwin/22.6.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Dalvik/2.1.0 (Linux; U; Android 14; Pixel 6 Build/UPB5.230623.003)',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36',
];

export const randomUserAgent = ({
  base,
  extraPool,
}: {
  base?: string;
  extraPool?: string[];
} = {}): string => {
  const pool = new Set<string>(DEFAULT_USER_AGENT_POOL);
  if (Array.isArray(extraPool)) {
    extraPool.forEach((ua) => {
      if (ua) {
        pool.add(String(ua));
      }
    });
  }
  if (base) {
    pool.add(base);
  }

  const values = Array.from(pool);
  const idx = Math.floor(Math.random() * values.length);
  return values[idx];
};

