import { MoonStar, PenSquare, ShieldCheck, SunMedium, UserCircle2 } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useTheme } from '@/features/theme/theme-provider';
import { cn } from '@/lib/utils';

const navClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-4 py-2 text-sm font-semibold transition',
    isActive
      ? 'bg-secondary text-secondary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  );

export const RootLayout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="surface-glow page-reveal rounded-[32px] border border-border/70 bg-card/75 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_40px_hsl(var(--primary)/0.28)]">
                <PenSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Editorial Workspace
                </p>
                <NavLink to="/" className="font-display text-3xl text-foreground">
                  Inkwell
                </NavLink>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <nav className="flex flex-wrap items-center gap-2">
                <NavLink to="/" className={navClassName}>
                  Feed
                </NavLink>
                {isAuthenticated && (
                  <>
                    <NavLink to="/posts/new" className={navClassName}>
                      Write
                    </NavLink>
                    <NavLink to="/profile" className={navClassName}>
                      Profile
                    </NavLink>
                  </>
                )}
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={navClassName}>
                    Admin
                  </NavLink>
                )}
              </nav>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <span className="theme-toggle__icon">
                    {theme === 'light' ? (
                      <MoonStar className="h-4 w-4" />
                    ) : (
                      <SunMedium className="h-4 w-4" />
                    )}
                  </span>
                  <span className="hidden sm:inline">
                    {theme === 'light' ? 'Dark mode' : 'Light mode'}
                  </span>
                </button>
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-[0_14px_30px_hsl(var(--foreground)/0.08)]">
                      <Avatar src={user.avatarUrl} alt={user.name} className="h-10 w-10" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      {user.role === 'admin' ? (
                        <ShieldCheck className="h-4 w-4 text-accent" />
                      ) : (
                        <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        void logout().then(() => navigate('/'));
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className={buttonVariants({ variant: 'ghost' })}>
                      Login
                    </NavLink>
                    <NavLink to="/register" className={buttonVariants()}>
                      Create account
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="page-reveal mt-8 flex-1 [animation-delay:120ms]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
