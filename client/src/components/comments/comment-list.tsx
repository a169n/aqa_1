import { Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Comment, User } from '@/types/api';
import { formatDate } from '@/lib/utils';

interface CommentListProps {
  comments: Comment[];
  user: User | null;
  isDeleting: boolean;
  onDelete: (comment: Comment) => void;
}

export const CommentList = ({ comments, user, isDeleting, onDelete }: CommentListProps) => (
  <div className="space-y-4">
    {comments.map((comment) => {
      const canDelete = user?.role === 'admin' || user?.id === comment.author.id;

      return (
        <Card
          key={comment.id}
          className="rounded-[24px] border-border/60 bg-card/90 p-5 text-card-foreground"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Avatar src={comment.author.avatarUrl} alt={comment.author.name} />
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold">{comment.author.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                </div>
                <p className="text-sm leading-7 text-card-foreground/85">{comment.content}</p>
              </div>
            </div>
            {canDelete ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={() => onDelete(comment)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </Card>
      );
    })}
  </div>
);
