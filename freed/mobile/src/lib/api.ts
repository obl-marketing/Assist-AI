import Constants from 'expo-constants';
import type { MatchResult, TrustProfile, VerticalSummary } from '../types';

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:4000/api';

let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth (progressive)
  requestOtp: (id: { phone?: string; email?: string }) =>
    request<{ sent: boolean }>('/auth/otp/request', { method: 'POST', body: JSON.stringify(id) }),
  verifyOtp: (id: { phone?: string; email?: string }, code: string) =>
    request<{ user: { id: string; name: string | null; role: string }; accessToken: string }>(
      '/auth/otp/verify',
      { method: 'POST', body: JSON.stringify({ ...id, code }) },
    ),

  // Catalog
  verticals: () => request<VerticalSummary[]>('/catalog/verticals'),

  // The AI front door
  match: (body: { text?: string; categoryKey?: string; liveOnly?: boolean; limit?: number }) =>
    request<MatchResult>('/match', { method: 'POST', body: JSON.stringify(body) }),

  // Experts
  trustProfile: (id: string) => request<TrustProfile>(`/experts/${id}/trust-profile`),
  expert: (id: string) => request<any>(`/experts/${id}`),

  // Bookings / consultation
  createBooking: (body: { seekerId: string; serviceId: string; mode?: string; scheduledAt?: string; durationMinutes?: number }) =>
    request<any>('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  startConsult: (bookingId: string, mode: string) =>
    request<any>(`/bookings/${bookingId}/start`, { method: 'POST', body: JSON.stringify({ mode }) }),
  endConsult: (bookingId: string) =>
    request<any>(`/bookings/${bookingId}/end`, { method: 'POST' }),
};
