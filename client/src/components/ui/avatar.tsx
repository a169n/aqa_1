import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAssetUrl } from '@/lib/api';

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export const Avatar = ({ src, alt, className }: AvatarProps) => {
  const resolvedSource = getAssetUrl(src ?? null);

  return (
    <div
      className={cn(
        'flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-secondary text-muted-foreground',
        className,
      )}
    >
      {resolvedSource ? (
        <img src={resolvedSource} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <UserRound className="h-5 w-5" />
      )}
    </div>
  );
};

