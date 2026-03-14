import { Heart, MessageSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Post } from '@/types/api';
import { cn, formatDate, truncate } from '@/lib/utils';

export const PostCard = ({ post }: { post: Post }) => (
  <Card className="paper-stripe group h-full transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(30,49,45,0.14)]">
    <CardHeader>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.author.avatarUrl} alt={post.author.name} />
          <div>
            <p className="text-sm font-semibold">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
          </div>
        </div>
        {post.author.role === 'admin' ? <Badge variant="accent">Admin</Badge> : null}
      </div>
      <CardTitle className="pt-4 text-3xl leading-tight">{post.title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm leading-7 text-muted-foreground">{truncate(post.content, 210)}</p>
    </CardContent>
    <CardFooter className="justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-2">
          <Heart className="h-3.5 w-3.5" />
          {post.likesCount} likes
        </Badge>
        <Badge variant="outline" className="gap-2">
          <MessageSquare className="h-3.5 w-3.5" />
          {post.commentsCount} comments
        </Badge>
      </div>
      <Link
        to={`/posts/${post.id}`}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'gap-2')}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Read
      </Link>
    </CardFooter>
  </Card>
);
