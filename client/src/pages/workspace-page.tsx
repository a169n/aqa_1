import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { postsApi, workspaceApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { cn, formatDate, truncate } from '@/lib/utils';
import type { PostStatus } from '@/types/api';

export const WorkspacePage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const postsQuery = useQuery({
    queryKey: ['workspace', 'posts', statusFilter],
    queryFn: () => workspaceApi.posts(statusFilter === 'all' ? undefined : statusFilter),
  });

  const publishMutation = useMutation({
    mutationFn: postsApi.publish,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace', 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
  const archiveMutation = useMutation({
    mutationFn: postsApi.archive,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace', 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
  const restoreMutation = useMutation({
    mutationFn: postsApi.restore,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workspace', 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  if (postsQuery.isLoading) {
    return <LoadingState label="Loading your workspace..." />;
  }

  if (postsQuery.isError) {
    return <ErrorState message={getErrorMessage(postsQuery.error)} />;
  }

  const posts = postsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="surface-glow">
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="accent" className="w-fit">
              Workspace
            </Badge>
            <h1 className="text-4xl">Drafts, published stories, and archive</h1>
          </div>
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PostStatus | 'all')}
              className="min-w-[12rem]"
            >
              <option value="all">all statuses</option>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </Select>
            <Link to="/posts/new" className={buttonVariants()}>
              New draft
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{post.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatDate(post.updatedAt)}
                  </p>
                </div>
                <Badge variant={post.status === 'published' ? 'accent' : 'outline'}>
                  {post.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {truncate(post.excerpt ?? post.content, 220)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/posts/${post.id}/edit`}
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                >
                  Edit
                </Link>
                {post.status !== 'published' ? (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate(post.id)}
                    disabled={publishMutation.isPending}
                  >
                    Publish
                  </Button>
                ) : null}
                {post.status !== 'archived' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => archiveMutation.mutate(post.id)}
                    disabled={archiveMutation.isPending}
                  >
                    Archive
                  </Button>
                ) : null}
                {post.status === 'archived' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => restoreMutation.mutate(post.id)}
                    disabled={restoreMutation.isPending}
                  >
                    Restore to draft
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
