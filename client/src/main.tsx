import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/auth-context';
import { NotificationProvider } from '@/features/notifications/notification-provider';
import { ThemeProvider } from '@/features/theme/theme-provider';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
