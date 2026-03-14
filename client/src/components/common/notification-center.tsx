import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  useNotifications,
  type NotificationTone,
} from '@/features/notifications/notification-provider';
import { cn } from '@/lib/utils';

const toneStyles: Record<NotificationTone, string> = {
  success:
    'border-[hsl(var(--accent)/0.28)] bg-[hsl(var(--card)/0.96)] text-card-foreground shadow-[0_24px_50px_hsl(var(--accent)/0.18)]',
  error:
    'border-[hsl(var(--destructive)/0.28)] bg-[hsl(var(--card)/0.96)] text-card-foreground shadow-[0_24px_50px_hsl(var(--destructive)/0.16)]',
  info: 'border-border/70 bg-[hsl(var(--card)/0.96)] text-card-foreground shadow-paper',
};

const toneIcon: Record<NotificationTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export const NotificationCenter = () => {
  const { notifications, dismiss } = useNotifications();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 sm:right-6 sm:top-6">
      {notifications.map((notification) => {
        const Icon = toneIcon[notification.tone];

        return (
          <div
            key={notification.id}
            className={cn(
              'pointer-events-auto notification-enter rounded-[24px] border p-4 backdrop-blur-xl',
              toneStyles[notification.tone],
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-secondary/70 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{notification.title}</p>
                {notification.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(notification.id)}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
