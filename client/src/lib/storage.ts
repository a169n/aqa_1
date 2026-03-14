import type { Session } from '@/types/api';

const STORAGE_KEY = 'inkwell.session';

const emitAuthUpdate = () => {
  window.dispatchEvent(new Event('auth:updated'));
};

export const getStoredSession = (): Session | null => {
  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setStoredSession = (session: Session) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emitAuthUpdate();
};

export const clearStoredSession = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  emitAuthUpdate();
};

export const getAccessToken = () => getStoredSession()?.accessToken ?? null;

export const getRefreshToken = () => getStoredSession()?.refreshToken ?? null;
