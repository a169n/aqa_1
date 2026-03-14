import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { postsApi } from '@/lib/api';
import { updatePostCaches } from '@/lib/post-cache';
import { cn } from '@/lib/utils';
import type { Post, Profile } from '@/types/api';

interface LikeButtonProps {
  post: Post;
  className?: string;
  size?: 'default' | 'compact';
}

interface LikeMutationContext {
  adminPosts?: Post[];
  post?: Post;
  posts?: Post[];
  profile?: Profile;
}

export const LikeButton = ({ post, className, size = 'default' }: LikeButtonProps) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const likeMutation = useMutation<void, Error, boolean, LikeMutationContext>({
    mutationFn: (shouldLike) => (shouldLike ? postsApi.like(post.id) : postsApi.unlike(post.id)),
    onMutate: async (shouldLike) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['post', post.id] }),
        queryClient.cancelQueries({ queryKey: ['posts'] }),
        queryClient.cancelQueries({ queryKey: ['profile'] }),
        queryClient.cancelQueries({ queryKey: ['admin', 'posts'] }),
      ]);

      const context: LikeMutationContext = {
        adminPosts: queryClient.getQueryData<Post[]>(['admin', 'posts']),
        post: queryClient.getQueryData<Post>(['post', post.id]),
        posts: queryClient.getQueryData<Post[]>(['posts']),
        profile: queryClient.getQueryData<Profile>(['profile']),
      };

      updatePostCaches(queryClient, post.id, (currentPost) => ({
        ...currentPost,
        likesCount: Math.max(0, currentPost.likesCount + (shouldLike ? 1 : -1)),
        viewerHasLiked: shouldLike,
      }));

      return context;
    },
    onError: (_error, _shouldLike, context) => {
      if (context?.post) {
        queryClient.setQueryData(['post', post.id], context.post);
      }

      if (context?.posts) {
        queryClient.setQueryData(['posts'], context.posts);
      }

      if (context?.profile) {
        queryClient.setQueryData(['profile'], context.profile);
      }

      if (context?.adminPosts) {
        queryClient.setQueryData(['admin', 'posts'], context.adminPosts);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['post', post.id] }),
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'likes'] }),
      ]);
    },
  });

  const isCompact = size === 'compact';

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={cn(
          'stat-chip like-chip group',
          isCompact ? 'h-11 min-w-[5.25rem] px-3 text-sm' : 'h-14 min-w-[7rem] px-4 text-base',
          className,
        )}
      >
        <Heart className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
        <span>{post.likesCount}</span>
      </Link>
    );
  }

  const shouldLike = !post.viewerHasLiked;

  return (
    <button
      type="button"
      aria-pressed={post.viewerHasLiked}
      aria-label={post.viewerHasLiked ? 'Remove like from this post' : 'Like this post'}
      disabled={likeMutation.isPending}
      onClick={() => likeMutation.mutate(shouldLike)}
      className={cn(
        'stat-chip like-chip group',
        post.viewerHasLiked && 'is-liked',
        likeMutation.isPending && 'cursor-wait',
        isCompact ? 'h-11 min-w-[5.25rem] px-3 text-sm' : 'h-14 min-w-[7rem] px-4 text-base',
        className,
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-transform duration-300 group-hover:scale-[1.16]',
          post.viewerHasLiked && 'fill-current',
        )}
      />
      <span>{post.likesCount}</span>
    </button>
  );
};
