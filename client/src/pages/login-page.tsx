import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-provider';
import { getErrorMessage } from '@/lib/errors';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { notify } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      notify({
        tone: 'success',
        title: 'Welcome back',
        description: 'You are now signed in.',
      });
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: 'Login failed',
        description: getErrorMessage(error),
      });
    },
  });

  return (
    <div className="mx-auto max-w-xl">
      <Card className="surface-glow">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Log in with your email and password to continue writing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loginMutation.isError ? (
            <ErrorState message={getErrorMessage(loginMutation.error)} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            className="w-full"
            disabled={loginMutation.isPending}
            onClick={() => loginMutation.mutate({ email, password })}
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-primary">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
