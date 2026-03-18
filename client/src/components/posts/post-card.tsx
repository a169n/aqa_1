import { MessageSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LikeButton } from '@/components/posts/like-button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Post } from '@/types/api';
import { cn, formatDate, truncate } from '@/lib/utils';

export const PostCard = ({ post }: { post: Post }) => (
  <Card className="paper-stripe float-card group h-full overflow-hidden transition hover:-translate-y-1.5 hover:shadow-[0_28px_70px_hsl(var(--foreground)/0.14)]">
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
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Badge variant={post.status === 'published' ? 'accent' : 'outline'}>{post.status}</Badge>
        {post.category ? <Badge variant="outline">{post.category.name}</Badge> : null}
        {post.tags.slice(0, 2).map((tag) => (
          <Badge key={tag.id} variant="outline">
            #{tag.name}
          </Badge>
        ))}
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm leading-7 text-muted-foreground">
        {truncate(post.excerpt ?? post.content, 210)}
      </p>
    </CardContent>
    <CardFooter className="justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <LikeButton post={post} size="compact" />
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
