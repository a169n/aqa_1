import { NavLink } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sections = [
  { label: 'Users', href: '/admin/users' },
  { label: 'Posts', href: '/admin/posts' },
  { label: 'Comments', href: '/admin/comments' },
  { label: 'Likes', href: '/admin/likes' },
  { label: 'Reports', href: '/admin/reports' },
  { label: 'Taxonomy', href: '/admin/taxonomy' },
];

export const AdminNav = () => (
  <div className="flex flex-wrap gap-3">
    {sections.map((section) => (
      <NavLink
        key={section.href}
        to={section.href}
        className={({ isActive }) =>
          cn(
            buttonVariants({ variant: isActive ? 'default' : 'secondary', size: 'sm' }),
            'min-w-[7rem] justify-center',
          )
        }
      >
        {section.label}
      </NavLink>
    ))}
  </div>
);
