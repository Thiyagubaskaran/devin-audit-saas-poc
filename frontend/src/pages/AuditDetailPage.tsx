import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Camera, FileText } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AuditResponse {
  id: number;
  question_text: string;
  question_type: string;
  answer: string;
  options: string[] | null;
}

interface AuditImage {
  id: number;
  filename: string;
  original_name: string;
  url: string;
}

interface AuditDetail {
  id: number;
  template_title: string;
  template_description: string;
  auditor_name: string;
  auditor_email: string;
  store_name: string;
  notes: string;
  status: string;
  submitted_at: string;
  responses: AuditResponse[];
  images: AuditImage[];
}

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await api.get(`/audits/${id}`);
        setAudit(res.data.audit);
      } catch (err) {
        console.error('Failed to fetch audit', err);
        setError('Failed to load audit details');
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500">{error || 'Audit not found'}</p>
        <Link to="/audits" className="mt-4 inline-block">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Audits
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/audits">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Audit #{audit.id}</h1>
          <p className="text-zinc-500">{audit.template_title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-500">Auditor</div>
            <div className="font-medium">{audit.auditor_name}</div>
            <div className="text-sm text-zinc-400">{audit.auditor_email}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-500">Store</div>
            <div className="font-medium">{audit.store_name || 'Not specified'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-zinc-500">Status</div>
            <Badge variant="secondary" className="bg-green-50 text-green-700 mt-1">
              {audit.status}
            </Badge>
            <div className="text-xs text-zinc-400 mt-1">
              {new Date(audit.submitted_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {audit.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-700">{audit.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Responses
          </CardTitle>
          <CardDescription>{audit.responses.length} questions answered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audit.responses.map((response, index) => (
              <div key={response.id}>
                {index > 0 && <Separator className="mb-4" />}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-700">
                    {index + 1}. {response.question_text}
                  </p>
                  <p className="text-zinc-900 bg-zinc-50 rounded-md px-3 py-2">
                    {response.answer || <span className="text-zinc-400 italic">No answer</span>}
                  </p>
                  <p className="text-xs text-zinc-400">Type: {response.question_type}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {audit.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photos
            </CardTitle>
            <CardDescription>{audit.images.length} photos attached</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {audit.images.map((image) => (
                <a
                  key={image.id}
                  href={`${API_URL}${image.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={`${API_URL}${image.url}`}
                    alt={image.original_name}
                    className="w-full h-48 object-cover rounded-lg border border-zinc-200 hover:shadow-md transition-shadow"
                  />
                  <p className="text-xs text-zinc-400 mt-1 truncate">{image.original_name}</p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
