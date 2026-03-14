import { AlertTriangle } from 'lucide-react';

export const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-[28px] border border-destructive/20 bg-destructive/5 p-6 text-destructive">
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-5 w-5" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);

