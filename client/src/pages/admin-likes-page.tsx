import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminNav } from '@/components/common/admin-nav';
import { ConfirmationModal } from '@/components/common/confirmation-modal';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { formatDate } from '@/lib/utils';
import type { AdminLike } from '@/types/api';

export const AdminLikesPage = () => {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<AdminLike | null>(null);
  const likesQuery = useQuery({
    queryKey: ['admin', 'likes'],
    queryFn: adminApi.likes,
  });

  const deleteLikeMutation = useMutation({
    mutationFn: adminApi.deleteLike,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'likes'] });
      await queryClient.invalidateQueries({ queryKey: ['post'] });
      setPendingDelete(null);
    },
  });

  if (likesQuery.isLoading) {
    return <LoadingState label="Loading like activity..." />;
  }

  if (likesQuery.isError) {
    return <ErrorState message={getErrorMessage(likesQuery.error)} />;
  }

  const likes = likesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <ConfirmationModal
        open={Boolean(pendingDelete)}
        title="Remove this like?"
        description={
          pendingDelete
            ? `This removes ${pendingDelete.user.name}'s like from "${pendingDelete.post.title}".`
            : ''
        }
        confirmLabel="Remove like"
        isPending={deleteLikeMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteLikeMutation.mutate(pendingDelete.id)}
      />

      <Card className="surface-glow">
        <CardContent className="space-y-4">
          <Badge variant="accent" className="w-fit">
            Admin Likes
          </Badge>
          <h1 className="text-4xl">Inspect and moderate reactions</h1>
          <AdminNav />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Likes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Post</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {likes.map((like) => (
                <TableRow key={like.id}>
                  <TableCell>{like.user.name}</TableCell>
                  <TableCell>
                    <Link
                      to={`/posts/${like.post.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {like.post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(like.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteLikeMutation.isPending}
                      onClick={() => setPendingDelete(like)}
                    >
                      Remove
                    </Button>
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
