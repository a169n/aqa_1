import { useState, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
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
import type { UserRole } from '@/types/api';

type AdminTab = 'users' | 'posts' | 'comments' | 'likes';

const tabs: AdminTab[] = ['users', 'posts', 'comments', 'likes'];

export const AdminPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isPendingTabChange, startTransition] = useTransition();
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.users,
  });
  const postsQuery = useQuery({
    queryKey: ['admin', 'posts'],
    queryFn: adminApi.posts,
  });
  const commentsQuery = useQuery({
    queryKey: ['admin', 'comments'],
    queryFn: adminApi.comments,
  });
  const likesQuery = useQuery({
    queryKey: ['admin', 'likes'],
    queryFn: adminApi.likes,
  });

  const refreshAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'likes'] }),
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
    ]);
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: UserRole }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: refreshAdminData,
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: refreshAdminData,
  });

  const deletePostMutation = useMutation({
    mutationFn: adminApi.deletePost,
    onSuccess: refreshAdminData,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: adminApi.deleteComment,
    onSuccess: refreshAdminData,
  });

  const deleteLikeMutation = useMutation({
    mutationFn: adminApi.deleteLike,
    onSuccess: refreshAdminData,
  });

  if (
    usersQuery.isLoading ||
    postsQuery.isLoading ||
    commentsQuery.isLoading ||
    likesQuery.isLoading
  ) {
    return <LoadingState label="Loading moderation data..." />;
  }

  const firstError =
    usersQuery.error ?? postsQuery.error ?? commentsQuery.error ?? likesQuery.error;

  if (firstError) {
    return <ErrorState message={getErrorMessage(firstError)} />;
  }

  const users = usersQuery.data ?? [];
  const posts = postsQuery.data ?? [];
  const comments = commentsQuery.data ?? [];
  const likes = likesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <Card className="surface-glow">
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="accent" className="w-fit">
              Admin Dashboard
            </Badge>
            <h1 className="text-5xl">Moderate the whole platform from one screen.</h1>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground">
              Review users, content, comments, and likes. All lists are live and can be managed
              without leaving the dashboard.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Users</p>
              <p className="mt-2 text-3xl font-display">{users.length}</p>
            </Card>
            <Card className="bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Posts</p>
              <p className="mt-2 text-3xl font-display">{posts.length}</p>
            </Card>
            <Card className="bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Comments</p>
              <p className="mt-2 text-3xl font-display">{comments.length}</p>
            </Card>
            <Card className="bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Likes</p>
              <p className="mt-2 text-3xl font-display">{likes.length}</p>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => startTransition(() => setActiveTab(tab))}
              className={cn(
                buttonVariants({
                  variant: activeTab === tab ? 'default' : 'secondary',
                  size: 'sm',
                }),
                'capitalize',
              )}
            >
              {tab}
            </button>
          ))}
          {isPendingTabChange ? (
            <span className="self-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Switching view...
            </span>
          ) : null}
        </CardContent>
      </Card>

      {activeTab === 'users' ? (
        <Card>
          <CardHeader>
            <CardTitle>User management</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>User</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Activity</TableHeaderCell>
                  <TableHeaderCell>Joined</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onChange={(event) =>
                          updateRoleMutation.mutate({
                            userId: user.id,
                            role: event.target.value as UserRole,
                          })
                        }
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{user.postsCount} posts</Badge>
                        <Badge variant="outline">{user.commentsCount} comments</Badge>
                        <Badge variant="outline">{user.likesCount} likes</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteUserMutation.isPending}
                        onClick={() => deleteUserMutation.mutate(user.id)}
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
      ) : null}

      {activeTab === 'posts' ? (
        <Card>
          <CardHeader>
            <CardTitle>Post moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Post</TableHeaderCell>
                  <TableHeaderCell>Author</TableHeaderCell>
                  <TableHeaderCell>Signals</TableHeaderCell>
                  <TableHeaderCell>Published</TableHeaderCell>
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
                    <TableCell>{post.author.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{post.commentsCount} comments</Badge>
                        <Badge variant="outline">{post.likesCount} likes</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(post.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          to={`/posts/${post.id}/edit`}
                          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                        >
                          Edit
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletePostMutation.isPending}
                          onClick={() => deletePostMutation.mutate(post.id)}
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
      ) : null}

      {activeTab === 'comments' ? (
        <Card>
          <CardHeader>
            <CardTitle>Comment moderation</CardTitle>
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
                    <TableCell className="max-w-md whitespace-pre-wrap">
                      {comment.content}
                    </TableCell>
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
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
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
      ) : null}

      {activeTab === 'likes' ? (
        <Card>
          <CardHeader>
            <CardTitle>Like activity</CardTitle>
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
                        onClick={() => deleteLikeMutation.mutate(like.id)}
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
      ) : null}
    </div>
  );
};
