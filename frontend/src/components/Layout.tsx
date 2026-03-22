import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, LogOut, LayoutDashboard, FileText, PlusCircle } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 text-zinc-900 font-bold text-lg">
                <ClipboardCheck className="h-6 w-6 text-blue-600" />
                RetailAudit
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/templates">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Templates
                      </Button>
                    </Link>
                    <Link to="/templates/new">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New Template
                      </Button>
                    </Link>
                  </>
                )}
                {user?.role === 'auditor' && (
                  <Link to="/audits/new">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <PlusCircle className="h-4 w-4" />
                      New Audit
                    </Button>
                  </Link>
                )}
                <Link to="/audits">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Audits
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">
                {user?.name}{' '}
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  {user?.role}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
