import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { LoadingState } from '@/components/common/loading-state';
import { PostEditorForm } from '@/components/posts/post-editor-form';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-provider';
import { postsApi, taxonomyApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

export const PostEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { notify } = useNotifications();
  const isEditing = Boolean(id);
  const postId = Number(id);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const postQuery = useQuery({
    queryKey: ['post', postId],
    queryFn: () => postsApi.get(postId),
    enabled: isEditing && Number.isFinite(postId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: taxonomyApi.categories,
  });

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: taxonomyApi.tags,
  });

  useEffect(() => {
    if (!postQuery.data) {
      return;
    }

    setTitle(postQuery.data.title);
    setExcerpt(postQuery.data.excerpt ?? '');
    setContent(postQuery.data.content);
    setCategoryId(postQuery.data.category?.id ?? null);
    setSelectedTagIds(postQuery.data.tags.map((tag) => tag.id));
  }, [postQuery.data]);

  const invalidatePostQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['post', postId] }),
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['workspace', 'posts'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        content,
        excerpt,
        categoryId,
        tagIds: selectedTagIds,
      };

      if (isEditing) {
        return postsApi.update(postId, payload);
      }

      return postsApi.create(payload);
    },
    onSuccess: async (post) => {
      await invalidatePostQueries();
      notify({
        tone: 'success',
        title: isEditing ? 'Draft updated' : 'Draft created',
        description: `"${post.title}" was saved successfully.`,
      });
      navigate(`/posts/${post.id}`, { replace: true });
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: isEditing ? 'Update failed' : 'Create failed',
        description: getErrorMessage(error),
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => postsApi.publish(postId),
    onSuccess: async (post) => {
      await invalidatePostQueries();
      notify({
        tone: 'success',
        title: 'Post published',
        description: `"${post.title}" is now visible in the public feed.`,
      });
      navigate(`/posts/${post.id}`, { replace: true });
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: 'Publish failed',
        description: getErrorMessage(error),
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => postsApi.archive(postId),
    onSuccess: async () => {
      await invalidatePostQueries();
      notify({
        tone: 'success',
        title: 'Post archived',
        description: 'The post moved to archive.',
      });
    },
    onError: (error) => {
      notify({ tone: 'error', title: 'Archive failed', description: getErrorMessage(error) });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => postsApi.restore(postId),
    onSuccess: async () => {
      await invalidatePostQueries();
      notify({
        tone: 'success',
        title: 'Post restored',
        description: 'The post returned to draft status.',
      });
    },
    onError: (error) => {
      notify({ tone: 'error', title: 'Restore failed', description: getErrorMessage(error) });
    },
  });

  if (postQuery.isLoading || categoriesQuery.isLoading || tagsQuery.isLoading) {
    return <LoadingState label="Loading editor..." />;
  }

  if (postQuery.isError || categoriesQuery.isError || tagsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(postQuery.error ?? categoriesQuery.error ?? tagsQuery.error)}
      />
    );
  }

  if (postQuery.data && user && user.role !== 'admin' && user.id !== postQuery.data.authorId) {
    return <ErrorState message="You do not have permission to edit this post." />;
  }

  const currentStatus = postQuery.data?.status ?? 'draft';
  const canPublish = isEditing && currentStatus !== 'published';
  const canArchive = isEditing && currentStatus !== 'archived';
  const canRestore = isEditing && currentStatus === 'archived';
  const isPending =
    saveMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending;

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((item) => item !== tagId) : [...current, tagId],
    );
  };

  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {saveMutation.isError ||
      publishMutation.isError ||
      archiveMutation.isError ||
      restoreMutation.isError ? (
        <ErrorState
          message={getErrorMessage(
            saveMutation.error ??
              publishMutation.error ??
              archiveMutation.error ??
              restoreMutation.error,
          )}
        />
      ) : null}
      <PostEditorForm
        mode={isEditing ? 'edit' : 'create'}
        title={title}
        excerpt={excerpt}
        content={content}
        status={currentStatus}
        categoryId={categoryId}
        selectedTagIds={selectedTagIds}
        categories={categories}
        tags={tags}
        isSubmitting={isPending}
        onTitleChange={setTitle}
        onExcerptChange={setExcerpt}
        onContentChange={setContent}
        onCategoryChange={setCategoryId}
        onTagToggle={toggleTag}
        onSubmit={() => saveMutation.mutate()}
        onPublish={canPublish ? () => publishMutation.mutate() : undefined}
        onArchive={canArchive ? () => archiveMutation.mutate() : undefined}
        onRestore={canRestore ? () => restoreMutation.mutate() : undefined}
      />
    </div>
  );
};
