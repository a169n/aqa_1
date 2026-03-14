import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText, PenSquare, Trash2, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/auth-context';
import { postsApi, profileApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';

export const ProfilePage = () => {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setName(profileQuery.data.name);
      setEmail(profileQuery.data.email);
    }
  }, [profileQuery.data]);

  const syncProfileData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['post'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
    ]);
  };

  const updateProfileMutation = useMutation({
    mutationFn: () => profileApi.update({ name, email }),
    onSuccess: async (user) => {
      updateUser(user);
      await syncProfileData();
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: async (user) => {
      updateUser(user);
      await syncProfileData();
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => postsApi.delete(postId),
    onSuccess: syncProfileData,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => postsApi.deleteComment(commentId),
    onSuccess: syncProfileData,
  });

  if (profileQuery.isLoading) {
    return <LoadingState label="Loading profile..." />;
  }

  if (profileQuery.isError) {
    return <ErrorState message={getErrorMessage(profileQuery.error)} />;
  }

  const profile = profileQuery.data;

  if (!profile) {
    return <ErrorState message="Profile not found." />;
  }

  return (
    <div className="space-y-8">
      <Card className="surface-glow">
        <CardContent className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar src={profile.avatarUrl} alt={profile.name} className="h-20 w-20" />
              <div>
                <h1 className="text-4xl">{profile.name}</h1>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Member since {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Posts</p>
                <p className="mt-2 text-3xl font-display">{profile.posts.length}</p>
              </Card>
              <Card className="bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Comments
                </p>
                <p className="mt-2 text-3xl font-display">{profile.comments.length}</p>
              </Card>
              <Card className="bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Role</p>
                <p className="mt-2 text-2xl font-display capitalize">{profile.role}</p>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            {(updateProfileMutation.isError || uploadAvatarMutation.isError) && (
              <ErrorState
                message={getErrorMessage(updateProfileMutation.error ?? uploadAvatarMutation.error)}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={updateProfileMutation.isPending}
                onClick={() => updateProfileMutation.mutate()}
              >
                Save profile
              </Button>
              <Label
                htmlFor="profile-avatar"
                className={buttonVariants({ variant: 'secondary' })}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload avatar
              </Label>
              <input
                id="profile-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    uploadAvatarMutation.mutate(file);
                  }
                }}
              />
              <Link to="/posts/new" className={buttonVariants({ variant: 'ghost' })}>
                New post
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your posts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.posts.length > 0 ? (
              profile.posts.map((post) => (
                <Card key={post.id} className="rounded-[24px] bg-white/80 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <Link to={`/posts/${post.id}`} className="text-xl font-semibold hover:text-primary">
                        {post.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{post.likesCount} likes</Badge>
                        <Badge variant="outline">{post.commentsCount} comments</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        to={`/posts/${post.id}/edit`}
                        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                      >
                        <PenSquare className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletePostMutation.isPending}
                        onClick={() => deletePostMutation.mutate(post.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">You have not published any posts yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.comments.length > 0 ? (
              profile.comments.map((comment) => (
                <Card key={comment.id} className="rounded-[24px] bg-white/80 p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MessageSquareText className="h-4 w-4 text-primary" />
                        <Link
                          to={`/posts/${comment.post.id}`}
                          className="text-sm font-semibold hover:text-primary"
                        >
                          {comment.post.title}
                        </Link>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleteCommentMutation.isPending}
                        onClick={() => deleteCommentMutation.mutate(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm leading-7 text-foreground/85">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">You have not left any comments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
