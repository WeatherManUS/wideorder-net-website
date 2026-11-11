export async function crawlerDiagnostic(url, fetcher = fetch) {
  const checkedAt = new Date().toISOString();
  const base = { url: String(url), checkedAt, identity: 'unverified Googlebot user-agent claim', genuineGooglebot: 'not tested' };
  try {
    const response = await fetcher(url, { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Googlebot', 'Cache-Control': 'no-cache' } });
    const headers = Object.fromEntries(['server', 'x-hcdn-request-id', 'cf-ray', 'retry-after', 'location', 'cache-control', 'x-robots-tag'].map(key => [key, response.headers.get(key)]).filter(([, value]) => value !== null));
    await response.body?.cancel();
    return { ...base, status: response.status, headers, diagnostic: response.status === 403 ? 'Unverified crawler claim rejected; this does not establish genuine Googlebot blocking.' : 'HTTP response only; neither crawler identity nor indexing is established.' };
  } catch {
    return { ...base, status: null, diagnostic: 'Crawler probe unavailable; independent normal-route release checks still determine deployment validity.' };
  }
}
