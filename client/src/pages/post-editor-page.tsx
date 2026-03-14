import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PostEditorForm } from '@/components/posts/post-editor-form';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-provider';
import { postsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export const PostEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotifications();
  const isEditing = Boolean(id);
  const postId = Number(id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsApi.get(postId),
    enabled: isEditing && Number.isFinite(postId),
  });

  useEffect(() => {
    if (postQuery.data) {
      setTitle(postQuery.data.title);
      setContent(postQuery.data.content);
    }
  }, [postQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        return postsApi.update(postId, { title, content });
      }

      return postsApi.create({ title, content });
    },
    onSuccess: (post) => {
      notify({
        tone: 'success',
        title: isEditing ? 'Post updated' : 'Post published',
        description: `"${post.title}" is live now.`,
      });
      navigate(`/posts/${post.id}`, { replace: true });
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: isEditing ? 'Update failed' : 'Publish failed',
        description: getErrorMessage(error),
      });
    },
  });

  if (postQuery.isLoading) {
    return <LoadingState label="Loading draft..." />;
  }

  if (postQuery.isError) {
    return <ErrorState message={getErrorMessage(postQuery.error)} />;
  }

  if (postQuery.data && user && user.role !== 'admin' && user.id !== postQuery.data.authorId) {
    return <ErrorState message="You do not have permission to edit this post." />;
  }

  return (
    <div className="space-y-6">
      {mutation.isError ? <ErrorState message={getErrorMessage(mutation.error)} /> : null}
      <PostEditorForm
        mode={isEditing ? 'edit' : 'create'}
        title={title}
        content={content}
        isSubmitting={mutation.isPending}
        onTitleChange={setTitle}
        onContentChange={setContent}
        onSubmit={() => mutation.mutate()}
      />
    </div>
  );
};
