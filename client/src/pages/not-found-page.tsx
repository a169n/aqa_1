import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const NotFoundPage = () => (
  <div className="mx-auto max-w-2xl">
    <Card className="surface-glow text-center">
      <CardContent className="space-y-5">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">404</p>
        <h1 className="text-5xl">This page is not on the editorial map.</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          The route does not exist or the resource was removed.
        </p>
        <Link to="/">
          <Button>Back to feed</Button>
        </Link>
      </CardContent>
    </Card>
  </div>
);

