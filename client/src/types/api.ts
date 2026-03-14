export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface CommentWithPost extends Comment {
  post: {
    id: number;
    title: string;
  };
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  author: User;
  commentsCount: number;
  likesCount: number;
  viewerHasLiked: boolean;
  viewerLikeId: number | null;
  comments?: Comment[];
}

export interface Profile extends User {
  createdAt: string;
  updatedAt: string;
  posts: Post[];
  comments: CommentWithPost[];
}

export interface AdminUser extends User {
  createdAt: string;
  postsCount: number;
  commentsCount: number;
  likesCount: number;
}

export interface AdminLike {
  id: number;
  postId: number;
  createdAt: string;
  user: User;
  post: {
    id: number;
    title: string;
  };
}

export interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
}
