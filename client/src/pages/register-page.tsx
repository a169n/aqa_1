import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/auth-context';
import { getErrorMessage } from '@/lib/errors';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate('/', { replace: true });
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
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Choose a secure password"
            />
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

