import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { IdeaGenerationDialog } from '@/components/project/IdeaGenerationDialog';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { ProjectCreationForm } from '@/types';
import { Loader2, Sparkles, Lightbulb } from 'lucide-react';

interface VideoIdea {
  title: string;
  description: string;
  isFactBased: boolean;
}

export function ProjectCreateForm() {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState<ProjectCreationForm>({
    name: '',
    description: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ProjectCreationForm>>({});
  const [showIdeaDialog, setShowIdeaDialog] = useState(false);

  const handleIdeaSelect = (idea: VideoIdea) => {
    setFormData({
      name: idea.title,
      description: idea.description,
    });
    
    addToast({
      type: 'success',
      title: 'Idea Applied',
      message: 'The AI-generated idea has been applied to your project form',
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectCreationForm> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create project on server (includes AI script generation)
      const project = await createProject({
        title: formData.name,
        description: formData.description,
      });

      addToast({
        type: 'success',
        title: 'Project Created!',
        message: `${project.name} has been created with ${project.segments?.length || 0} AI-generated segments.`,
      });

      // Navigate to the project workflow
      navigate(`/projects/${project.id}/workflow`);
      
    } catch (error) {
      console.error('Project creation failed:', error);
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: error instanceof Error ? error.message : 'Failed to create project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ProjectCreationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Video Project
          </CardTitle>
          <CardDescription>
            Provide details about your video project and let AI generate the script segments
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIdeaDialog(true)}
                  disabled={isSubmitting}
                >
                  <Lightbulb className="h-4 w-4" />
                  Get AI Ideas
                </Button>
              </div>
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Introduction to AI Technology"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your video project"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 border w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>

            {/* AI Generation Info */}
            {isSubmitting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">AI is working...</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Creating your project and generating script segments. This may take a few moments.
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Idea Generation Dialog */}
      <IdeaGenerationDialog
        isOpen={showIdeaDialog}
        onClose={() => setShowIdeaDialog(false)}
        onSelectIdea={handleIdeaSelect}
      />
    </>
  );
}
