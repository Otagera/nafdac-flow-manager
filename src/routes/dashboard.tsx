import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ApplicationList } from '@/components/ApplicationList';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Settings, LayoutDashboard } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const [role, setRole] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('user_role');
    if (!stored) {
        navigate({ to: '/login' });
    } else {
        setRole(stored);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    navigate({ to: '/login' });
  };

  const handlePlaceholder = (feature: string) => {
    toast({
        title: "Coming Soon",
        description: `The ${feature} module is currently under development.`,
    });
  };

  if (!role) return null; // Prevent flash of content

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">NAFDAC Manager</h1>
        <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Active Session: <span className="font-semibold text-slate-900">{role}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-1 h-fit border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 mb-2">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">Workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-1 p-2">
                <Link 
                    to="/dashboard" 
                    className={`p-2 rounded-md text-sm font-medium transition-all flex items-center gap-3 ${
                        role === 'FINANCE' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-100' :
                        role === 'VETTING' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100' :
                        role === 'DIRECTOR' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100' :
                        'bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                    <LayoutDashboard size={16} />
                    {role === 'FINANCE' ? 'Pending Payments' :
                     role === 'VETTING' ? 'Compliance Review' :
                     role === 'DIRECTOR' ? 'All Operations' :
                     'Overview'}
                </Link>
                
                <div className="pt-6 pb-2 px-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System</p>
                </div>
                
                <button 
                    onClick={() => handlePlaceholder('Analytics')}
                    className="p-2 hover:bg-slate-50 rounded-md text-sm font-medium text-left text-slate-600 transition-colors flex items-center gap-3 group"
                >
                    <BarChart3 size={16} className="text-slate-400 group-hover:text-slate-600" />
                    Reports
                </button>
                
                <button 
                    onClick={() => handlePlaceholder('Settings')}
                    className="p-2 hover:bg-slate-50 rounded-md text-sm font-medium text-left text-slate-600 transition-colors flex items-center gap-3 group"
                >
                    <Settings size={16} className="text-slate-400 group-hover:text-slate-600" />
                    Settings
                </button>
            </CardContent>
        </Card>

        <div className="col-span-3">
            <Outlet /> 
            <DashboardContent role={role} />
        </div>
      </div>
    </div>
  );
}

function DashboardContent({ role }: { role: string }) {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader><CardTitle>Welcome back</CardTitle></CardHeader>
                <CardContent>
                    <ApplicationList role={role} />
                </CardContent>
            </Card>
        </div>
    )
}