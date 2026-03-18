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
import type { CommentWithPost } from '@/types/api';

export const AdminCommentsPage = () => {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<CommentWithPost | null>(null);
  const commentsQuery = useQuery({
    queryKey: ['admin', 'comments'],
    queryFn: adminApi.comments,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: adminApi.deleteComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      await queryClient.invalidateQueries({ queryKey: ['post'] });
      setPendingDelete(null);
    },
  });

  if (commentsQuery.isLoading) {
    return <LoadingState label="Loading comment moderation..." />;
  }

  if (commentsQuery.isError) {
    return <ErrorState message={getErrorMessage(commentsQuery.error)} />;
  }

  const comments = commentsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <ConfirmationModal
        open={Boolean(pendingDelete)}
        title="Delete this comment?"
        description="This permanently removes the comment from the discussion."
        confirmLabel="Delete comment"
        isPending={deleteCommentMutation.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteCommentMutation.mutate(pendingDelete.id)}
      />

      <Card className="surface-glow">
        <CardContent className="space-y-4">
          <Badge variant="accent" className="w-fit">
            Admin Comments
          </Badge>
          <h1 className="text-4xl">Moderate reader discussions</h1>
          <AdminNav />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Comment</TableHeaderCell>
                <TableHeaderCell>Author</TableHeaderCell>
                <TableHeaderCell>Post</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="max-w-md whitespace-pre-wrap">{comment.content}</TableCell>
                  <TableCell>{comment.author.name}</TableCell>
                  <TableCell>
                    <Link
                      to={`/posts/${comment.post.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {comment.post.title}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(comment.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteCommentMutation.isPending}
                      onClick={() => setPendingDelete(comment)}
                    >
                      Delete
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
