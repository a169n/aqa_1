import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const SCROLL_LOCK_OPTIONS: AddEventListenerOptions & EventListenerOptions = { passive: false };

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = ({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPending, onCancel, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const blockedKeys = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);

    const preventScroll = (event: Event) => {
      event.preventDefault();
    };

    const preventKeyboardScroll = (event: KeyboardEvent) => {
      if (blockedKeys.has(event.key)) {
        event.preventDefault();
      }
    };

    window.addEventListener('wheel', preventScroll, SCROLL_LOCK_OPTIONS);
    window.addEventListener('touchmove', preventScroll, SCROLL_LOCK_OPTIONS);
    window.addEventListener('keydown', preventKeyboardScroll, SCROLL_LOCK_OPTIONS);

    return () => {
      window.removeEventListener('wheel', preventScroll, SCROLL_LOCK_OPTIONS);
      window.removeEventListener('touchmove', preventScroll, SCROLL_LOCK_OPTIONS);
      window.removeEventListener('keydown', preventKeyboardScroll, SCROLL_LOCK_OPTIONS);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay-enter fixed inset-0 z-[60] flex items-center justify-center bg-background/82 px-4">
      <div
        className="modal-panel-enter w-full max-w-md rounded-[28px] border border-border/80 bg-card p-6 text-card-foreground shadow-[0_30px_90px_hsl(var(--foreground)/0.3)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-description"
      >
        <div className="space-y-3">
          <h2 id="confirmation-modal-title" className="text-2xl">
            {title}
          </h2>
          <p
            id="confirmation-modal-description"
            className="text-sm leading-7 text-muted-foreground"
          >
            {description}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending
              ? confirmLabel.endsWith('...')
                ? confirmLabel
                : `${confirmLabel}...`
              : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
