import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, X } from 'lucide-react';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  options: string[] | null;
}

interface Template {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export default function NewAuditPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [storeName, setStoreName] = useState('');
  const [notes, setNotes] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/templates');
        const templateList = res.data.templates;
        // Fetch full template details with questions
        const fullTemplates = await Promise.all(
          templateList.map(async (t: { id: number }) => {
            const detail = await api.get(`/templates/${t.id}`);
            return detail.data.template;
          })
        );
        setTemplates(fullTemplates);
      } catch (err) {
        console.error('Failed to fetch templates', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    setSelectedTemplate(template || null);
    setAnswers({});
  };

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setError('');
    setLoading(true);

    try {
      const responses = selectedTemplate.questions.map(q => ({
        question_id: q.id,
        answer: answers[q.id] || ''
      }));

      const auditRes = await api.post('/audits', {
        template_id: selectedTemplate.id,
        store_name: storeName,
        notes,
        responses
      });

      const auditId = auditRes.data.audit_id;

      // Upload images if any
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        await api.post(`/audits/${auditId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate('/audits');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to submit audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">New Audit</h1>
        <p className="text-zinc-500 mt-1">Select a template and fill out the audit form</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Audit Setup</CardTitle>
            <CardDescription>Choose a template and provide store details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                placeholder="e.g., Main Street Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this audit"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>{selectedTemplate.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTemplate.questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {index + 1}. {q.question_text}
                  </Label>
                  {q.question_type === 'text' && (
                    <Input
                      placeholder="Your answer"
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )}
                  {q.question_type === 'number' && (
                    <Input
                      type="number"
                      placeholder="Enter a number"
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  )}
                  {q.question_type === 'dropdown' && q.options && (
                    <Select
                      value={answers[q.id] || ''}
                      onValueChange={(v) => setAnswers({ ...answers, [q.id]: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {q.options.map((opt, i) => (
                          <SelectItem key={i} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photos
              </CardTitle>
              <CardDescription>Attach photos to this audit (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageAdd}
                accept="image/*"
                multiple
                className="hidden"
              />
              <div className="grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-zinc-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Add Photos</span>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading || !selectedTemplate} className="flex-1">
            {loading ? 'Submitting...' : 'Submit Audit'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/audits')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
