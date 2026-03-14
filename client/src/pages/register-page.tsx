import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/auth-context';
import { useNotifications } from '@/features/notifications/notification-provider';
import { getErrorMessage } from '@/lib/errors';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { notify } = useNotifications();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      notify({
        tone: 'success',
        title: 'Account created',
        description: 'Your workspace is ready to use.',
      });
      navigate('/', { replace: true });
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: 'Registration failed',
        description: getErrorMessage(error),
      });
    },
  });

  return (
    <div className="mx-auto max-w-xl">
      <Card className="surface-glow">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            The first account created on a fresh database becomes the platform admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {registerMutation.isError ? (
            <ErrorState message={getErrorMessage(registerMutation.error)} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="register-name">Name</Label>
            <Input
              id="register-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Choose a secure password"
                className="pr-12"
              />
              <button
                type="button"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={registerMutation.isPending}
            onClick={() => registerMutation.mutate({ name, email, password })}
          >
            {registerMutation.isPending ? 'Creating account...' : 'Register'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
