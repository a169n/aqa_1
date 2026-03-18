import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute } from '@/components/common/admin-route';
import { ProtectedRoute } from '@/components/common/protected-route';
import { RootLayout } from '@/components/layout/root-layout';
import { AdminPage } from '@/pages/admin-page';
import { AdminCommentsPage } from '@/pages/admin-comments-page';
import { AdminLikesPage } from '@/pages/admin-likes-page';
import { AdminPostsPage } from '@/pages/admin-posts-page';
import { AdminReportsPage } from '@/pages/admin-reports-page';
import { AdminTaxonomyPage } from '@/pages/admin-taxonomy-page';
import { AdminUsersPage } from '@/pages/admin-users-page';
import { BookmarksPage } from '@/pages/bookmarks-page';
import { CategoriesPage } from '@/pages/categories-page';
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { PostDetailPage } from '@/pages/post-detail-page';
import { PostEditorPage } from '@/pages/post-editor-page';
import { ProfilePage } from '@/pages/profile-page';
import { RegisterPage } from '@/pages/register-page';
import { WorkspacePage } from '@/pages/workspace-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'posts/:id',
        element: <PostDetailPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'posts/new',
            element: <PostEditorPage />,
          },
          {
            path: 'posts/:id/edit',
            element: <PostEditorPage />,
          },
          {
            path: 'profile',
            element: <ProfilePage />,
          },
          {
            path: 'workspace',
            element: <WorkspacePage />,
          },
          {
            path: 'bookmarks',
            element: <BookmarksPage />,
          },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminPage />,
          },
          {
            path: 'admin/users',
            element: <AdminUsersPage />,
          },
          {
            path: 'admin/posts',
            element: <AdminPostsPage />,
          },
          {
            path: 'admin/comments',
            element: <AdminCommentsPage />,
          },
          {
            path: 'admin/likes',
            element: <AdminLikesPage />,
          },
          {
            path: 'admin/reports',
            element: <AdminReportsPage />,
          },
          {
            path: 'admin/taxonomy',
            element: <AdminTaxonomyPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
