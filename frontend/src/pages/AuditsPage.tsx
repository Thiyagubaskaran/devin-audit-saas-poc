import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, ClipboardCheck } from 'lucide-react';

interface Audit {
  id: number;
  template_title: string;
  auditor_name: string;
  store_name: string;
  status: string;
  submitted_at: string;
}

export default function AuditsPage() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const res = await api.get('/audits');
        setAudits(res.data.audits);
      } catch (err) {
        console.error('Failed to fetch audits', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">
            {user?.role === 'admin' ? 'All Audits' : 'My Audits'}
          </h1>
          <p className="text-zinc-500 mt-1">
            {user?.role === 'admin' ? 'View all submitted audits' : 'View your submitted audits'}
          </p>
        </div>
        {user?.role === 'auditor' && (
          <Link to="/audits/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Audit
            </Button>
          </Link>
        )}
      </div>

      {audits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="h-12 w-12 text-zinc-300 mb-4" />
            <p className="text-zinc-500 text-lg">No audits yet</p>
            {user?.role === 'auditor' && (
              <Link to="/audits/new" className="mt-4">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Submit Your First Audit
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submitted Audits</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Template</TableHead>
                  {user?.role === 'admin' && <TableHead>Auditor</TableHead>}
                  <TableHead>Store</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">#{audit.id}</TableCell>
                    <TableCell>{audit.template_title}</TableCell>
                    {user?.role === 'admin' && <TableCell>{audit.auditor_name}</TableCell>}
                    <TableCell>{audit.store_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        {audit.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {new Date(audit.submitted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/audits/${audit.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
