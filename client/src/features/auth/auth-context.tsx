import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { authApi, requestTokenRefresh } from '@/lib/api';
import { clearStoredSession, getStoredSession, setStoredSession } from '@/lib/storage';
import type { AuthFormValues, Session, User } from '@/types/api';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (values: AuthFormValues) => Promise<Session>;
  register: (values: AuthFormValues) => Promise<Session>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(() => getStoredSession());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredSession());
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener('auth:updated', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('auth:updated', syncSession);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const storedSession = getStoredSession();

      if (!storedSession) {
        setIsReady(true);
        return;
      }

      try {
        const user = await authApi.me();

        if (isMounted) {
          setStoredSession({ ...storedSession, user });
        }
      } catch {
        const refreshedSession = await requestTokenRefresh();

        if (!refreshedSession && isMounted) {
          clearStoredSession();
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (values: AuthFormValues) => {
    const nextSession = await authApi.login(values);
    setStoredSession(nextSession);
    return nextSession;
  };

  const register = async (values: AuthFormValues) => {
    const nextSession = await authApi.register(values);
    setStoredSession(nextSession);
    return nextSession;
  };

  const logout = async () => {
    await authApi.logout();
  };

  const updateUser = (user: User) => {
    const currentSession = getStoredSession();

    if (!currentSession) {
      return;
    }

    setStoredSession({ ...currentSession, user });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.user),
        isReady,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
