import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

export type NotificationTone = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  title: string;
  description?: string;
  tone: NotificationTone;
}

interface NotifyInput {
  title: string;
  description?: string;
  tone?: NotificationTone;
}

interface NotificationContextValue {
  notifications: Notification[];
  notify: (input: NotifyInput) => number;
  dismiss: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
const NOTIFICATION_DURATION_MS = 4200;

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idRef = useRef(0);
  const timeoutsRef = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timeout = timeoutsRef.current.get(id);

    if (timeout) {
      window.clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, description, tone = 'info' }: NotifyInput) => {
      const id = ++idRef.current;

      setNotifications((current) => [...current, { id, title, description, tone }]);

      const timeout = window.setTimeout(() => {
        dismiss(id);
      }, NOTIFICATION_DURATION_MS);

      timeoutsRef.current.set(id, timeout);

      return id;
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      for (const timeout of timeoutsRef.current.values()) {
        window.clearTimeout(timeout);
      }

      timeoutsRef.current.clear();
    },
    [],
  );

  const value = useMemo(
    () => ({
      notifications,
      notify,
      dismiss,
    }),
    [dismiss, notifications, notify],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
};
