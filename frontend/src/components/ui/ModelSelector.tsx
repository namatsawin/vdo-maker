import { useState, useEffect } from 'react';
import { ChevronDown, Zap, Brain, Cpu, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { apiClient } from '@/lib/api';

interface ModelOption {
  value: string;
  label: string;
  description: string;
}

interface ModelSelectorProps {
  value?: string;
  onChange: (model: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  showDescription?: boolean;
}

const getModelIcon = (modelValue: string) => {
  if (modelValue.includes('2.5-flash-8b')) return <Zap className="h-4 w-4 text-yellow-500" />;
  if (modelValue.includes('2.5-flash')) return <Clock className="h-4 w-4 text-blue-500" />;
  if (modelValue.includes('2.5-pro')) return <Brain className="h-4 w-4 text-emerald-500" />;
  if (modelValue.includes('1.5-flash')) return <Clock className="h-4 w-4 text-indigo-500" />;
  if (modelValue.includes('1.5-pro')) return <Brain className="h-4 w-4 text-purple-500" />;
  return <Cpu className="h-4 w-4 text-gray-500" />;
};

const getModelBadge = (modelValue: string) => {
  if (modelValue.includes('2.5-flash-8b')) return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">Ultra Fast</span>;
  if (modelValue.includes('2.5-flash')) return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Fast & Smart</span>;
  if (modelValue.includes('2.5-pro')) return <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-800">Latest & Best</span>;
  if (modelValue.includes('1.5-flash')) return <span className="px-2 py-1 text-xs rounded bg-indigo-100 text-indigo-800">Balanced</span>;
  if (modelValue.includes('1.5-pro')) return <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">Capable</span>;
  if (modelValue.includes('1.0-pro')) return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">Legacy</span>;
  return null;
};

export function ModelSelector({ 
  value, 
  onChange, 
  disabled = false, 
  className = '', 
  label = 'AI Model',
  showDescription = true 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedModel = models.find(m => m.value === value) || models[0];

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getAvailableModels();
        
        if (response.success && response.data?.models) {
          setModels(response.data.models);
          // Set default if no value is selected
          if (!value && response.data.models.length > 0) {
            onChange(response.data.models[0].value);
          }
        } else {
          throw new Error(response.error?.message || 'Failed to fetch models');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
        // Fallback models if API fails
        const fallbackModels = [
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Fast and efficient for most tasks' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Most capable model for complex tasks' }
        ];
        setModels(fallbackModels);
        if (!value) {
          onChange(fallbackModels[0].value);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [value, onChange]);

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label className="text-sm font-medium">{label}</Label>
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between h-auto p-3"
        >
          <div className="flex items-center space-x-3">
            {selectedModel && getModelIcon(selectedModel.value)}
            <div className="text-left">
              <div className="font-medium">{selectedModel?.label || 'Select Model'}</div>
              {showDescription && selectedModel && (
                <div className="text-xs text-muted-foreground">{selectedModel.description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedModel && getModelBadge(selectedModel.value)}
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>

        {isOpen && (
          <Card className="z-50 mt-1 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {models.map((model) => (
                  <Button
                    key={model.value}
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      onChange(model.value);
                      setIsOpen(false);
                    }}
                    className={`w-full justify-start h-auto p-3 ${
                      value === model.value ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      {getModelIcon(model.value)}
                      <div className="flex-1 text-left">
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getModelBadge(model.value)}
                        {value === model.value && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
