import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import type { ProjectCreationForm } from '@/types';
import { ProjectStatus, WorkflowStage } from '@/types';

export function ProjectCreateForm() {
  const navigate = useNavigate();
  const { addProject } = useProjectStore();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState<ProjectCreationForm>({
    name: '',
    description: '',
    storyInput: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ProjectCreationForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ProjectCreationForm> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (!formData.storyInput.trim()) {
      newErrors.storyInput = 'Story input is required';
    } else if (formData.storyInput.trim().length < 50) {
      newErrors.storyInput = 'Story should be at least 50 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create new project
      const newProject = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        description: formData.description,
        status: ProjectStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentStage: WorkflowStage.SCRIPT_GENERATION,
        segments: [], // Will be populated during script generation
      };
      
      addProject(newProject);
      
      addToast({
        type: 'success',
        title: 'Project Created',
        message: `${formData.name} has been created successfully`,
      });
      
      // Navigate to the project workflow
      navigate(`/projects/${newProject.id}/workflow`);
      
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create project. Please try again.',
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Video Project</CardTitle>
        <CardDescription>
          Start by providing some basic information about your video project.
          Our AI will generate a script based on your story input.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="Enter a descriptive name for your project"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Briefly describe what this video is about"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storyInput">Story Input</Label>
            <Textarea
              id="storyInput"
              placeholder="Tell us the story you want to turn into a video. Be as detailed as possible - include characters, settings, plot points, and the overall narrative you want to convey."
              value={formData.storyInput}
              onChange={(e) => handleInputChange('storyInput', e.target.value)}
              className={errors.storyInput ? 'border-destructive' : ''}
              rows={8}
            />
            {errors.storyInput && (
              <p className="text-sm text-destructive">{errors.storyInput}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formData.storyInput.length} characters (minimum 50 required)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/projects')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Project...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
