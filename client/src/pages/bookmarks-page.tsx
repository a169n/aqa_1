import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bookmarksApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { cn, formatDate, truncate } from '@/lib/utils';

export const BookmarksPage = () => {
  const bookmarksQuery = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarksApi.list,
  });

  if (bookmarksQuery.isLoading) {
    return <LoadingState label="Loading bookmarks..." />;
  }

  if (bookmarksQuery.isError) {
    return <ErrorState message={getErrorMessage(bookmarksQuery.error)} />;
  }

  const bookmarks = bookmarksQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="surface-glow">
        <CardContent className="space-y-2">
          <Badge variant="accent" className="w-fit">
            Bookmarks
          </Badge>
          <h1 className="text-4xl">Saved stories</h1>
        </CardContent>
      </Card>

      {bookmarks.length ? (
        bookmarks.map((bookmark) => (
          <Card key={bookmark.id}>
            <CardHeader>
              <CardTitle>{bookmark.post.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {truncate(bookmark.post.excerpt ?? bookmark.post.content, 260)}
              </p>
              <p className="text-xs text-muted-foreground">
                Saved {formatDate(bookmark.createdAt)}
              </p>
              <Link
                to={`/posts/${bookmark.post.id}`}
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
              >
                Open post
              </Link>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
