import type { QueryClient } from '@tanstack/react-query';
import type { Post, Profile } from '@/types/api';

type PostCollection = Post[] | undefined;
type PostUpdater = (post: Post) => Post;

const updateCollection = (
  collection: PostCollection,
  postId: number,
  updater: PostUpdater,
): PostCollection => collection?.map((post) => (post.id === postId ? updater(post) : post));

export const updatePostCaches = (
  queryClient: QueryClient,
  postId: number,
  updater: PostUpdater,
) => {
  queryClient.setQueryData<Post | undefined>(['post', postId], (post) =>
    post && post.id === postId ? updater(post) : post,
  );

  queryClient.setQueryData<PostCollection>(['posts'], (posts) =>
    updateCollection(posts, postId, updater),
  );
  queryClient.setQueryData<PostCollection>(['admin', 'posts'], (posts) =>
    updateCollection(posts, postId, updater),
  );
  queryClient.setQueryData<Profile | undefined>(['profile'], (profile) =>
    profile
      ? {
          ...profile,
          posts: updateCollection(profile.posts, postId, updater) ?? profile.posts,
        }
      : profile,
  );
};
