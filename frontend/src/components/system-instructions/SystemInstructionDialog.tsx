import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import type { SystemInstruction } from '@/types/shared';
import { apiClient } from '@/lib/api';

interface SystemInstructionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  instruction?: SystemInstruction | null;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'educational', label: 'Educational' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
];

export function SystemInstructionDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  instruction 
}: SystemInstructionDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instruction: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (instruction) {
      setFormData({
        name: instruction.name,
        description: instruction.description || '',
        instruction: instruction.instruction,
        category: instruction.category
      });
    } else {
      setFormData({
        name: '',
        description: '',
        instruction: '',
        category: 'general'
      });
    }
    setError(null);
  }, [instruction, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.instruction.trim()) {
      setError('Name and instruction are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        instruction: formData.instruction.trim(),
        category: formData.category
      };

      let response;
      if (instruction) {
        response = await apiClient.put(`/system-instructions/${instruction.id}`, payload);
      } else {
        response = await apiClient.post('/system-instructions', payload);
      }

      if (response.success) {
        onSave();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save system instruction');
      console.error('Save instruction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">
            {instruction ? 'Edit System Instruction' : 'Create System Instruction'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter instruction name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this instruction"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="instruction">System Instruction *</Label>
            <Textarea
              id="instruction"
              value={formData.instruction}
              onChange={(e) => handleChange('instruction', e.target.value)}
              placeholder="Enter the system instruction that will guide AI behavior..."
              rows={8}
              required
              className='bg-white focus:z-20 focus:w-[80vw] focus:h-[80vh] focus:fixed focus:top-1/2 focus:left-1/2 focus:transform focus:-translate-x-1/2 focus:-translate-y-1/2'
            />
            <p className="text-sm text-gray-500 mt-1">
              This instruction will be used to guide the AI when generating video scripts.
            </p>
          </div>

          <div className="sticky flex items-center justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {instruction ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
