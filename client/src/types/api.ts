export type UserRole = 'user' | 'admin';
export type PostStatus = 'draft' | 'published' | 'archived';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface Session {
  accessToken: string;
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
  status: PostStatus;
  excerpt: string | null;
  authorId: number;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: User;
  category: Category | null;
  tags: Tag[];
  isBookmarked: boolean;
  commentsCount: number;
  likesCount: number;
  viewerHasLiked: boolean;
  viewerLikeId: number | null;
  comments?: Comment[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: number;
  createdAt: string;
  post: Post;
}

export interface Report {
  id: number;
  reason: string;
  status: ReportStatus;
  reporterId: number;
  postId: number | null;
  commentId: number | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: User;
  resolvedBy: User | null;
  post: {
    id: number;
    title: string;
    status: PostStatus;
  } | null;
  comment: {
    id: number;
    content: string;
  } | null;
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
