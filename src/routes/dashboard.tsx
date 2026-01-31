import { createFileRoute, Link, Outlet, useNavigate } from '@tanstack/react-router';
import { BarChart3, Building2, LayoutDashboard, Menu, Settings, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' });
    }
  }, [user, loading, navigate]);

  const handlePlaceholder = (feature: string) => {
    toast({
      title: 'Coming Soon',
      description: `The ${feature} module is currently under development.`,
    });
  };

  if (loading || !user) return <div className="p-8 text-center">Loading session...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <div className="py-4">
                <h2 className="text-lg font-bold mb-4">Menu</h2>
                <SidebarContent role={user.role} handlePlaceholder={handlePlaceholder} />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-2xl font-bold text-slate-800">NAFDAC Manager</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full border border-slate-200 whitespace-nowrap">
            <span className="hidden lg:inline">Active Session: </span>
            <span className="font-semibold text-slate-900">
              {user.username} ({user.role})
            </span>
          </div>
          {/* Logout handled in Header or useAuth context, but we can keep a button here if needed. 
                Actually the previous design had it here. Let's keep it. */}
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hidden md:block md:col-span-1 h-fit border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 mb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <SidebarContent role={user.role} handlePlaceholder={handlePlaceholder} />
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Button variant="outline" size="sm" onClick={() => logout()}>
      Logout
    </Button>
  );
}

function SidebarContent({
  role,
  handlePlaceholder,
}: {
  role: string;
  handlePlaceholder: (f: string) => void;
}) {
  const activeStyle = 'bg-slate-200 text-slate-900 font-semibold border-slate-300';

  return (
    <div className="flex flex-col space-y-1">
      <Link
        to="/dashboard"
        activeProps={{ className: activeStyle }}
        activeOptions={{ exact: true }}
        className={`p-2 rounded-md text-sm font-medium transition-all flex items-center gap-3 border border-transparent ${
          role === 'FINANCE'
            ? 'text-yellow-700 hover:bg-yellow-50'
            : role === 'VETTING'
              ? 'text-blue-700 hover:bg-blue-50'
              : role === 'DIRECTOR'
                ? 'text-purple-700 hover:bg-purple-50'
                : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <LayoutDashboard size={16} />
        {role === 'FINANCE'
          ? 'Pending Payments'
          : role === 'VETTING'
            ? 'Compliance Review'
            : role === 'DIRECTOR'
              ? 'All Operations'
              : 'Overview'}
      </Link>

      {role === 'DIRECTOR' && (
        <>
          <Link
            to="/dashboard/team"
            activeProps={{ className: activeStyle }}
            className="p-2 hover:bg-slate-50 rounded-md text-sm font-medium text-left text-slate-600 transition-colors flex items-center gap-3 border border-transparent"
          >
            <Users size={16} className="text-slate-400" />
            Team Management
          </Link>
          <Link
            to="/dashboard/clients"
            activeProps={{ className: activeStyle }}
            className="p-2 hover:bg-slate-50 rounded-md text-sm font-medium text-left text-slate-600 transition-colors flex items-center gap-3 border border-transparent"
          >
            <Building2 size={16} className="text-slate-400" />
            Companies
          </Link>
        </>
      )}

      <div className="pt-6 pb-2 px-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</p>
      </div>

      <button
        type="button"
        onClick={() => handlePlaceholder('Analytics')}
        className="p-2 hover:bg-slate-50 rounded-md text-sm font-medium text-left text-slate-600 transition-colors flex items-center gap-3 group border border-transparent"
      >
        <BarChart3 size={16} className="text-slate-400 group-hover:text-slate-600" />
        Reports
      </button>

      <button
        type="button"
        onClick={() => handlePlaceholder('Settings')}
        className="p-2 hover:bg-slate-50 rounded-md text-sm font-medium text-left text-slate-600 transition-colors flex items-center gap-3 group border border-transparent"
      >
        <Settings size={16} className="text-slate-400 group-hover:text-slate-600" />
        Settings
      </button>
    </div>
  );
}
