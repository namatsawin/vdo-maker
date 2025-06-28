import { ProjectCreateForm } from '@/components/forms/ProjectCreateForm';

export function ProjectCreate() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Start a new AI video generation project
        </p>
      </div>

      <ProjectCreateForm />
    </div>
  );
}
