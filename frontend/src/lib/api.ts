import type {
  AacSymbol,
  CommunicationProfile,
  Comparison,
  CurrentPairing,
  GuardianNotification,
  PairedDevice,
  PairingClaim,
  PairingCredential,
  RecommendationStats,
  SystemReadiness,
  UserSettings,
} from '@/types';

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text || `API ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {}
    throw new Error(message);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  readiness: () => request<SystemReadiness>('/api/health/ready'),
  getUserSettings: (userId: number) => request<UserSettings>(`/api/users/${userId}/settings`),
  saveUserSettings: (userId: number, settings: Omit<UserSettings, 'userId'>) =>
    request<UserSettings>(`/api/users/${userId}/settings`, { method: 'PUT', body: JSON.stringify(settings) }),
  getProfile: (userId: number) => request<CommunicationProfile>(`/api/users/${userId}/communication-profile`),
  saveProfile: (userId: number, profile: Omit<CommunicationProfile, 'userId'>) =>
    request<CommunicationProfile>(`/api/users/${userId}/communication-profile`, { method: 'PUT', body: JSON.stringify(profile) }),
  getSymbols: (userId: number) => request<AacSymbol[]>(`/api/users/${userId}/symbols`),
  getEmergencySymbols: (userId: number) => request<AacSymbol[]>(`/api/users/${userId}/emergency-symbols`),
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
  recordUsage: (userId: number, words: string[]) =>
    request<void>(`/api/users/${userId}/usage`, { method: 'POST', body: JSON.stringify({ words }) }),
  compare: (body: { userId: number; situation: string; intent: string; selectedWords: string[] }) =>
    request<Comparison>('/api/recommendations/compare', { method: 'POST', body: JSON.stringify(body) }),
  markRecommendationSelected: (userId: number, mode: 'baseline' | 'personalized', sentence: string) =>
    request<void>('/api/recommendations/selection', { method: 'POST', body: JSON.stringify({ userId, mode, sentence }) }),
  recommendationStats: (userId: number) => request<RecommendationStats>(`/api/recommendations/stats/${userId}`),
  experimentExportUrl: (userId: number) => `${BASE}/api/recommendations/export/${userId}`,
  notifications: (userId: number) => request<GuardianNotification[]>(`/api/users/${userId}/notifications`),
  markNotificationRead: (userId: number, id: number) =>
    request<GuardianNotification>(`/api/users/${userId}/notifications/${id}/read`, { method: 'PATCH' }),
  issuePairing: (userId: number) => request<PairingCredential>(`/api/users/${userId}/device-pairings`, { method: 'POST' }),
  refreshPairing: (userId: number) => request<PairingCredential>(`/api/users/${userId}/device-pairings/refresh`, { method: 'POST' }),
  currentPairing: (userId: number) => request<CurrentPairing>(`/api/users/${userId}/device-pairings/current`),
  pairedDevices: (userId: number) => request<PairedDevice[]>(`/api/users/${userId}/devices`),
  claimPairingCode: (code: string, device: { deviceId: string; deviceName: string; deviceType: PairedDevice['deviceType'] }) =>
    request<PairingClaim>('/api/device-pairings/claim/code', { method: 'POST', body: JSON.stringify({ code, ...device }) }),
  claimPairingQr: (token: string, device: { deviceId: string; deviceName: string; deviceType: PairedDevice['deviceType'] }) =>
    request<PairingClaim>('/api/device-pairings/claim/qr', { method: 'POST', body: JSON.stringify({ token, ...device }) }),
};
