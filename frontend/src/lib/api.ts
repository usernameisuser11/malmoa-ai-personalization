import type { AacSymbol, CommunicationProfile, Comparison } from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  getProfile(userId: number) {
    return request<CommunicationProfile>(`/api/users/${userId}/communication-profile`);
  },
  saveProfile(userId: number, profile: Omit<CommunicationProfile, 'userId'>) {
    return request<CommunicationProfile>(`/api/users/${userId}/communication-profile`, {
      method: 'PUT', body: JSON.stringify(profile),
    });
  },
  getSymbols(userId: number) {
    return request<AacSymbol[]>(`/api/users/${userId}/symbols`);
  },
  getEmergencySymbols(userId: number) {
    return request<AacSymbol[]>(`/api/users/${userId}/emergency-symbols`);
  },
  customizeSymbol(userId: number, symbolId: number, body: Partial<AacSymbol>) {
    return request<AacSymbol>(`/api/users/${userId}/symbols/${symbolId}`, {
      method: 'PUT',
      body: JSON.stringify({
        displayText: body.displayText ?? null,
        ttsText: body.ttsText ?? null,
        userAlias: body.userAlias ?? null,
        customImageUrl: body.imageUrl ?? null,
        favorite: body.favorite ?? false,
        importantWord: body.importantWord ?? false,
        sortOrder: body.sortOrder ?? null,
      }),
    });
  },
  recordUsage(userId: number, words: string[]) {
    return request<void>(`/api/users/${userId}/usage`, { method: 'POST', body: JSON.stringify({ words }) });
  },
  compare(body: { userId: number; situation: string; intent: string; selectedWords: string[] }) {
    return request<Comparison>('/api/recommendations/compare', { method: 'POST', body: JSON.stringify(body) });
  },
};
