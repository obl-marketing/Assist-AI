import { create } from 'zustand';
import { setAccessToken } from '../lib/api';

interface SessionState {
  userId: string | null;
  name: string | null;
  isExpert: boolean;
  signIn: (user: { id: string; name: string | null; role: string }, token: string) => void;
  signOut: () => void;
}

/** Lightweight client state. Server data lives in TanStack Query, not here. */
export const useSession = create<SessionState>((set) => ({
  userId: null,
  name: null,
  isExpert: false,
  signIn: (user, token) => {
    setAccessToken(token);
    set({ userId: user.id, name: user.name, isExpert: user.role === 'EXPERT' });
  },
  signOut: () => {
    setAccessToken(null);
    set({ userId: null, name: null, isExpert: false });
  },
}));
