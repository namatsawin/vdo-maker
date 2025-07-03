import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/projectStore';
import { ProjectStatus } from '@/types';
import { Plus, Play, Loader2, TrendingUp, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function Dashboard() {
  const { projects, isLoading, error, loadProjects } = useProjectStore();

  // Load projects from server on component mount
  useEffect(() => {
    loadProjects().catch(console.error);
  }, [loadProjects]);

  const totalProjects = projects.length;
  const draftProjects = projects.filter(
    (p) => p.status === ProjectStatus.DRAFT
  ).length;
  const completedProjects = projects.filter(
    (p) => p.status === ProjectStatus.COMPLETED
  ).length;
  const successRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <div className="absolute inset-0 h-12 w-12 rounded-full bg-blue-100 animate-ping mx-auto"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading your projects...</p>
          <p className="text-sm text-slate-400 mt-1">This won't take long</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Card className="max-w-md mx-auto border-red-200 bg-red-50/50">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load Projects</h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{error}</p>
            <Button onClick={() => loadProjects()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-600 text-lg">
            Welcome to your AI video creation workspace
          </p>
        </div>
        <Link to="/projects/create">
          <Button size="lg" className="shadow-lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-slate-600">Total Projects</CardTitle>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-1">{totalProjects}</div>
            <p className="text-sm text-slate-500">
              {totalProjects === 0 ? 'Create your first project!' : 'All your video projects'}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-1">{draftProjects}</div>
            <p className="text-sm text-slate-500">
              Projects in draft status
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-1">{completedProjects}</div>
            <p className="text-sm text-slate-500">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-1">{successRate.toFixed(0)}%</div>
            <p className="text-sm text-slate-500">
              Project completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Recent Projects</CardTitle>
          <CardDescription className="text-base">
            {totalProjects === 0 
              ? 'No projects yet. Create your first AI video project to get started!'
              : 'Your most recently updated projects'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalProjects === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Plus className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No projects yet</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                Get started by creating your first AI-powered video project. Our intelligent workflow will guide you through every step.
              </p>
              <Link to="/projects/create">
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-6 border border-slate-200 rounded-2xl hover:bg-slate-50/50 hover:border-slate-300 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg mb-1">{project.name}</h3>
                    <p className="text-slate-600 mb-3 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === ProjectStatus.COMPLETED
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-slate-500">{project.segments.length} segments</span>
                      <span className="text-slate-500">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-6">
                    <Link to={`/projects/${project.id}/workflow`}>
                      <Button variant="outline" size="icon" className="hover:bg-blue-50 hover:border-blue-200">
                        <Play className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {projects.length > 3 && (
                <div className="text-center pt-6">
                  <Link to="/projects">
                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                      View All Projects →
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
