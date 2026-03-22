import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, GripVertical } from 'lucide-react';

interface Question {
  question_text: string;
  question_type: 'text' | 'number' | 'dropdown';
  options: string[];
}

export default function CreateTemplatePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question_text: '', question_type: 'text', options: [] }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', question_type: 'text', options: [] }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | string[]) => {
    const updated = [...questions];
    if (field === 'options') {
      updated[index] = { ...updated[index], [field]: value as string[] };
    } else if (field === 'question_type') {
      updated[index] = {
        ...updated[index],
        [field]: value as 'text' | 'number' | 'dropdown',
        options: value === 'dropdown' ? [''] : []
      };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push('');
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.splice(oIndex, 1);
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validQuestions = questions.filter(q => q.question_text.trim());
    if (validQuestions.length === 0) {
      setError('At least one question is required');
      return;
    }

    for (const q of validQuestions) {
      if (q.question_type === 'dropdown' && q.options.filter(o => o.trim()).length < 2) {
        setError('Dropdown questions need at least 2 options');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        questions: validQuestions.map(q => ({
          ...q,
          options: q.question_type === 'dropdown' ? q.options.filter(o => o.trim()) : undefined
        }))
      };
      await api.post('/templates', payload);
      navigate('/templates');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Create Template</h1>
        <p className="text-zinc-500 mt-1">Define an audit template with questions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Store Cleanliness Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this audit template"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Questions</h2>
            <Button type="button" variant="outline" onClick={addQuestion} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questions.map((q, qIndex) => (
            <Card key={qIndex}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-zinc-300 mt-2 flex-shrink-0" />
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Question {qIndex + 1}</Label>
                        <Input
                          placeholder="Enter your question"
                          value={q.question_text}
                          onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                        />
                      </div>
                      <div className="w-40 space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={q.question_type}
                          onValueChange={(v) => updateQuestion(qIndex, 'question_type', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {q.question_type === 'dropdown' && (
                      <div className="space-y-2 pl-4 border-l-2 border-zinc-200">
                        <Label className="text-sm text-zinc-500">Options</Label>
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <Input
                              placeholder={`Option ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(qIndex)}
                          className="gap-1 text-blue-600"
                        >
                          <PlusCircle className="h-3 w-3" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length === 1}
                    className="text-red-500 hover:text-red-700 mt-6"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/templates')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
