import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminNav } from '@/components/common/admin-nav';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { cn, formatDate } from '@/lib/utils';
import type { Post } from '@/types/api';

export const AdminPostsPage = () => {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const postsQuery = useQuery({
    queryKey: ['admin', 'posts'],
    queryFn: adminApi.posts,
  });

  const deletePostMutation = useMutation({
    mutationFn: adminApi.deletePost,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setPendingDelete(null);
    },
  });

  if (postsQuery.isLoading) {
    return <LoadingState label="Loading post moderation..." />;
  }

  if (postsQuery.isError) {
    return <ErrorState message={getErrorMessage(postsQuery.error)} />;
  }

  const posts = postsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <ConfirmationModal
        open={Boolean(pendingDelete)}
        title="Delete this post?"
        description={pendingDelete ? `This permanently removes "${pendingDelete.title}".` : ''}
        confirmLabel="Delete post"
        isPending={deletePostMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deletePostMutation.mutate(pendingDelete.id)}
      />

      <Card className="surface-glow">
        <CardContent className="space-y-4">
          <Badge variant="accent" className="w-fit">
            Admin Posts
          </Badge>
          <h1 className="text-4xl">Moderate editorial content</h1>
          <AdminNav />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Post</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Author</TableHeaderCell>
                <TableHeaderCell>Signals</TableHeaderCell>
                <TableHeaderCell>Updated</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link to={`/posts/${post.id}`} className="font-semibold hover:text-primary">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === 'published' ? 'accent' : 'outline'}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{post.author.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{post.commentsCount} comments</Badge>
                      <Badge variant="outline">{post.likesCount} likes</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(post.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/posts/${post.id}/edit`}
                        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                      >
                        Edit
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletePostMutation.isPending}
                        onClick={() => setPendingDelete(post)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
