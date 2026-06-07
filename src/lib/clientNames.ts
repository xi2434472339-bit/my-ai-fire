const CLIENT_NAME_FIXES: Record<string, string> = {
  '\u93c4\u30e7\u6553': '\u6625\u751f',
  '\u7039\u56ec\ue5e3': '\u5b87\u98de',
  '\u95c3\u630e\u6f83': '\u963f\u6770',
  '\u6769\u581d\u53cd\u74a7\ue0a3\u5f41\u7ee1\ue1bc\u74d9': '\u8fc8\u5df4\u8d6b\u63d0\u7bee\u5b50',
};

export const DEFAULT_KNOWN_CLIENTS = [
  '\u6625\u751f',
  '\u5b87\u98de',
  '\u963f\u6770',
  '\u8fc8\u5df4\u8d6b\u63d0\u7bee\u5b50',
];

export function normalizeClientName(client: unknown): string {
  const value = String(client ?? '').trim();
  return CLIENT_NAME_FIXES[value] ?? value;
}

export function normalizeKnownClients(clients: unknown, fallback: string[] = []): string[] {
  const source = Array.isArray(clients) ? clients : fallback;
  return Array.from(new Set(source.map(normalizeClientName).filter(Boolean)));
}

export function hasLegacyClientNames(clients: unknown): boolean {
  return Array.isArray(clients)
    && clients.some((client) => normalizeClientName(client) !== String(client ?? '').trim());
}
