import { createBrowserRouter } from 'react-router-dom';
import { AdminRoute } from '@/components/common/admin-route';
import { ProtectedRoute } from '@/components/common/protected-route';
import { RootLayout } from '@/components/layout/root-layout';
import { AdminPage } from '@/pages/admin-page';
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { PostDetailPage } from '@/pages/post-detail-page';
import { PostEditorPage } from '@/pages/post-editor-page';
import { ProfilePage } from '@/pages/profile-page';
import { RegisterPage } from '@/pages/register-page';

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
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: 'admin',
            element: <AdminPage />,
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
