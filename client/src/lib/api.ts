import axios from 'axios';
import type {
  AdminLike,
  AdminUser,
  AuthFormValues,
  Comment,
  CommentWithPost,
  Post,
  Profile,
  Session,
  User,
  UserRole,
} from '@/types/api';
import { clearStoredSession, getAccessToken, getRefreshToken, getStoredSession, setStoredSession } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const API_ORIGIN = new URL(API_BASE_URL).origin;

const publicClient = axios.create({
  baseURL: API_BASE_URL,
});

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<Session | null> | null = null;

export const requestTokenRefresh = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearStoredSession();
    return null;
  }

  try {
    const response = await publicClient.post<Session>('/auth/refresh', { refreshToken });
    setStoredSession(response.data);
    return response.data;
  } catch {
    clearStoredSession();
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const requestUrl = String(originalRequest?.url ?? '');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !requestUrl.includes('/auth/login') &&
      !requestUrl.includes('/auth/register') &&
      !requestUrl.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = requestTokenRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const session = await refreshPromise;

      if (session?.accessToken) {
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(originalRequest);
      }
    }

    throw error;
  },
);

export const getAssetUrl = (assetPath: string | null) => {
  if (!assetPath) {
    return null;
  }

  return assetPath.startsWith('http') ? assetPath : `${API_ORIGIN}${assetPath}`;
};

export const authApi = {
  register: async (payload: AuthFormValues) => {
    const response = await publicClient.post<Session>('/auth/register', payload);
    return response.data;
  },
  login: async (payload: AuthFormValues) => {
    const response = await publicClient.post<Session>('/auth/login', payload);
    return response.data;
  },
  me: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  logout: async () => {
    const refreshToken = getStoredSession()?.refreshToken;

    if (!refreshToken) {
      clearStoredSession();
      return;
    }

    try {
      await publicClient.post('/auth/logout', { refreshToken });
    } finally {
      clearStoredSession();
    }
  },
};

export const postsApi = {
  list: async () => {
    const response = await api.get<Post[]>('/posts');
    return response.data;
  },
  get: async (postId: number) => {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data;
  },
  create: async (payload: { title: string; content: string }) => {
    const response = await api.post<Post>('/posts', payload);
    return response.data;
  },
  update: async (postId: number, payload: { title: string; content: string }) => {
    const response = await api.put<Post>(`/posts/${postId}`, payload);
    return response.data;
  },
  delete: async (postId: number) => {
    await api.delete(`/posts/${postId}`);
  },
  comment: async (postId: number, payload: { content: string }) => {
    const response = await api.post<Comment>(`/posts/${postId}/comments`, payload);
    return response.data;
  },
  deleteComment: async (commentId: number) => {
    await api.delete(`/posts/comments/${commentId}`);
  },
  like: async (postId: number) => {
    await api.post(`/posts/${postId}/likes`);
  },
  unlike: async (postId: number) => {
    await api.delete(`/posts/${postId}/likes`);
  },
};

export const profileApi = {
  get: async () => {
    const response = await api.get<Profile>('/user/profile');
    return response.data;
  },
  update: async (payload: { name: string; email: string }) => {
    const response = await api.put<User>('/user/profile', payload);
    return response.data;
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<User>('/user/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const adminApi = {
  posts: async () => {
    const response = await api.get<Post[]>('/admin/posts');
    return response.data;
  },
  users: async () => {
    const response = await api.get<AdminUser[]>('/admin/users');
    return response.data;
  },
  comments: async () => {
    const response = await api.get<CommentWithPost[]>('/admin/comments');
    return response.data;
  },
  likes: async () => {
    const response = await api.get<AdminLike[]>('/admin/likes');
    return response.data;
  },
  updateUserRole: async (userId: number, role: UserRole) => {
    const response = await api.put<User>(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  deleteUser: async (userId: number) => {
    await api.delete(`/admin/users/${userId}`);
  },
  updatePost: async (postId: number, payload: { title: string; content: string }) => {
    const response = await api.put<Post>(`/admin/posts/${postId}`, payload);
    return response.data;
  },
  deletePost: async (postId: number) => {
    await api.delete(`/admin/posts/${postId}`);
  },
  deleteComment: async (commentId: number) => {
    await api.delete(`/admin/comments/${commentId}`);
  },
  deleteLike: async (likeId: number) => {
    await api.delete(`/admin/likes/${likeId}`);
  },
};

