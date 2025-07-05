import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Play, Trash2, Calendar, Clock, Eye } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { VideoPreviewDialog } from '@/components/project/VideoPreviewDialog';
import { ProjectStatus, WorkflowStage } from '@/types';
import type { Project } from '@/types';

export function ProjectList() {
  const { projects, deleteProject, loadProjects } = useProjectStore();
  const { addToast } = useUIStore();
  
  useEffect(() => {
    loadProjects()
  }, [])

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('updated');
  const [previewProject, setPreviewProject] = useState<Project | null>(null);

  // No more mock data loading - projects come from real user creation

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = (project.name || project.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || a.title || '').localeCompare(b.name || b.title || '');
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const handleDeleteProject = (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      deleteProject(project.id).then(loadProjects);
      addToast({
        type: 'success',
        title: 'Project Deleted',
        message: `${project.name} has been deleted successfully`,
      });
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDisplay = (stage: WorkflowStage) => {
    const stageMap: Record<WorkflowStage, string> = {
      [WorkflowStage.SCRIPT_GENERATION]: 'Script & Audio',
      [WorkflowStage.IMAGE_GENERATION]: 'Image Generation',
      [WorkflowStage.VIDEO_GENERATION]: 'Video Generation',
      [WorkflowStage.FINAL_ASSEMBLY]: 'Final Assembly',
      [WorkflowStage.COMPLETED]: 'Completed',
    };
    
    return stageMap[stage] || stage.replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your AI video generation projects
          </p>
        </div>
        <Link to="/projects/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value={ProjectStatus.DRAFT}>Draft</option>
              <option value={ProjectStatus.COMPLETED}>Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'updated')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="updated">Sort by Updated</option>
              <option value="created">Sort by Created</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Plus className="mx-auto h-16 w-16" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
              </h3>
              <p className="text-gray-500 mb-6">
                {projects.length === 0 
                  ? 'Get started by creating your first AI-powered video project'
                  : 'Try adjusting your search terms or filters'
                }
              </p>
              {projects.length === 0 && (
                <Link to="/projects/create">
                  <Button className="flex items-center mx-auto gap-2 hover:cursor-pointer">
                    <Plus className="h-4 w-4" />
                    Create Your First Project
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{project.name || project.title}</CardTitle>
                    <p className="text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                    
                    <div className="relative">
                      <button className="p-2 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <div>
                      {project.segments.length} segments
                    </div>
                    <div>
                      Current: {getStageDisplay(project.currentStage)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Preview button - only show if project has final video */}
                    {project.final_video_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewProject(project)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                    )}
                    
                    <Link to={`/projects/${project.id}/workflow`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        Open
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Video Preview Dialog */}
      {previewProject && (
        <VideoPreviewDialog
          project={previewProject}
          isOpen={!!previewProject}
          onClose={() => setPreviewProject(null)}
        />
      )}
    </div>
  );
}
