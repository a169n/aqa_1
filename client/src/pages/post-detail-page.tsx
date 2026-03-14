import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageSquare, PencilLine, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CommentList } from '@/components/comments/comment-list';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/features/auth/auth-context';
import { getErrorMessage } from '@/lib/errors';
import { postsApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

export const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [commentValue, setCommentValue] = useState('');
  const postId = Number(id);
  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsApi.get(postId),
    enabled: Number.isFinite(postId),
  });

  const syncAfterMutation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['post', postId] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'likes'] }),
    ]);
  };

  const commentMutation = useMutation({
    mutationFn: (content: string) => postsApi.comment(postId, { content }),
    onSuccess: async () => {
      setCommentValue('');
      await syncAfterMutation();
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const post = postQuery.data;

      if (!post) {
        return;
      }

      if (post.viewerHasLiked) {
        await postsApi.unlike(postId);
        return;
      }

      await postsApi.like(postId);
    },
    onSuccess: syncAfterMutation,
  });

  const deletePostMutation = useMutation({
    mutationFn: () => postsApi.delete(postId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/', { replace: true });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => postsApi.deleteComment(commentId),
    onSuccess: syncAfterMutation,
  });

  if (postQuery.isLoading) {
    return <LoadingState label="Loading story..." />;
  }

  if (postQuery.isError) {
    return <ErrorState message={getErrorMessage(postQuery.error)} />;
  }

  const post = postQuery.data;

  if (!post) {
    return <ErrorState message="Post not found." />;
  }

  const canManage = user?.role === 'admin' || user?.id === post.authorId;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card className="surface-glow">
        <CardHeader className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={post.author.avatarUrl} alt={post.author.name} className="h-12 w-12" />
              <div>
                <p className="text-sm font-semibold">{post.author.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            {post.author.role === 'admin' ? <Badge variant="accent">Admin author</Badge> : null}
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-2">
                <Heart className="h-3.5 w-3.5" />
                {post.likesCount}
              </Badge>
              <Badge variant="outline" className="gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.commentsCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-none whitespace-pre-wrap text-base leading-8 text-foreground/90">
            {post.content}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <Button disabled={likeMutation.isPending} onClick={() => likeMutation.mutate()}>
                <Heart className="mr-2 h-4 w-4" />
                {post.viewerHasLiked ? 'Unlike post' : 'Like post'}
              </Button>
            ) : (
              <Link to="/login" className={buttonVariants()}>
                Login to like
              </Link>
            )}
          </div>
          {canManage ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/posts/${post.id}/edit`}
                className={cn(buttonVariants({ variant: 'secondary' }), 'gap-2')}
              >
                <PencilLine className="h-4 w-4" />
                Edit
              </Link>
              <Button
                variant="destructive"
                disabled={deletePostMutation.isPending}
                onClick={() => deletePostMutation.mutate()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          ) : null}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-3xl">Discussion</h2>
          <p className="text-sm text-muted-foreground">
            Comments are available to authenticated users. Admins can moderate any discussion.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {commentMutation.isError ? <ErrorState message={getErrorMessage(commentMutation.error)} /> : null}
          {isAuthenticated ? (
            <div className="space-y-3">
              <Textarea
                value={commentValue}
                onChange={(event) => setCommentValue(event.target.value)}
                placeholder="Add your comment"
                className="min-h-[140px]"
              />
              <Button
                disabled={commentMutation.isPending}
                onClick={() => commentMutation.mutate(commentValue)}
              >
                {commentMutation.isPending ? 'Posting comment...' : 'Post comment'}
              </Button>
            </div>
          ) : (
            <Link to="/login" className={buttonVariants()}>
              Login to comment
            </Link>
          )}

          {post.comments && post.comments.length > 0 ? (
            <CommentList
              comments={post.comments}
              user={user}
              isDeleting={deleteCommentMutation.isPending}
              onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
