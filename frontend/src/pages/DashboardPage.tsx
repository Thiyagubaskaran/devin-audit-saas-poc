import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardCheck, FileText, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface Stats {
  totalAudits: number;
  totalTemplates: number;
  totalAuditors: number;
  recentAudits: Array<{
    submitted_at: string;
    template_title: string;
    auditor_name: string;
  }>;
  auditsByTemplate: Array<{
    title: string;
    count: number;
  }>;
}

interface AuditItem {
  id: number;
  template_title: string;
  store_name: string;
  submitted_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          const res = await api.get('/audits/stats/summary');
          setStats(res.data.stats);
        }
        const auditsRes = await api.get('/audits');
        setAudits(auditsRes.data.audits);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">
          Welcome back, {user?.name}
        </p>
      </div>

      {user?.role === 'admin' && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Total Audits</CardTitle>
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalAudits}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Templates</CardTitle>
                <FileText className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalTemplates}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500">Auditors</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalAuditors}</div>
              </CardContent>
            </Card>
          </div>

          {stats.auditsByTemplate.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Audits by Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.auditsByTemplate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {user?.role === 'admin' ? 'Recent Audits' : 'My Audits'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No audits yet</p>
          ) : (
            <div className="space-y-3">
              {audits.slice(0, 10).map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{audit.template_title}</p>
                    {audit.store_name && (
                      <p className="text-sm text-zinc-500">{audit.store_name}</p>
                    )}
                  </div>
                  <span className="text-sm text-zinc-400">
                    {new Date(audit.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
