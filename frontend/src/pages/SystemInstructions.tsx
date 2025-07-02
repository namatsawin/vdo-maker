import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, BookOpen, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/layout/LoadingSpinner';
import { SystemInstructionDialog } from '@/components/system-instructions/SystemInstructionDialog';
import { useUIStore } from '@/stores/uiStore';
import type { SystemInstruction, SystemInstructionCategory } from '@/types/shared';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

export function SystemInstructions() {
  const [instructions, setInstructions] = useState<SystemInstruction[]>([]);
  const [categories, setCategories] = useState<SystemInstructionCategory[]>([]);
  const [filteredInstructions, setFilteredInstructions] = useState<SystemInstruction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<SystemInstruction | null>(null);

  const { addToast } = useUIStore();

  useEffect(() => {
    loadInstructions();
    loadCategories();
  }, []);

  useEffect(() => {
    filterInstructions();
  }, [instructions, selectedCategory, searchQuery]);

  const loadInstructions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/system-instructions');
      if (response.success) {
        setInstructions(response.data.instructions || []);
      }
    } catch (err) {
      setError('Failed to load system instructions');
      console.error('Load instructions error:', err);
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load system instructions. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/system-instructions/categories');
      if (response.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Load categories error:', err);
    }
  };

  const filterInstructions = () => {
    let filtered = instructions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(instruction => instruction.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(instruction =>
        instruction.name.toLowerCase().includes(query) ||
        instruction.description?.toLowerCase().includes(query) ||
        instruction.instruction.toLowerCase().includes(query)
      );
    }

    setFilteredInstructions(filtered);
  };

  const handleCreate = () => {
    setEditingInstruction(null);
    setDialogOpen(true);
  };

  const handleEdit = (instruction: SystemInstruction) => {
    setEditingInstruction(instruction);
    setDialogOpen(true);
  };

  const handleDelete = async (instruction: SystemInstruction) => {
    if (!confirm(`Are you sure you want to delete "${instruction.name}"?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/system-instructions/${instruction.id}`);
      if (response.success) {
        setInstructions(prev => prev.filter(i => i.id !== instruction.id));
        addToast({
          type: 'success',
          title: 'Deleted',
          message: `System instruction "${instruction.name}" has been deleted.`,
        });
      }
    } catch (err) {
      console.error('Delete instruction error:', err);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete system instruction. Please try again.',
      });
    }
  };

  const handleDialogSave = async () => {
    // The dialog handles the save internally, we just need to reload data
    await loadInstructions();
    setDialogOpen(false);
    addToast({
      type: 'success',
      title: editingInstruction ? 'Updated' : 'Created',
      message: `System instruction has been ${editingInstruction ? 'updated' : 'created'} successfully.`,
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(instructions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system-instructions-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    addToast({
      type: 'success',
      title: 'Exported',
      message: 'System instructions have been exported successfully.',
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      'video': 'bg-purple-100 text-purple-800',
      'image': 'bg-blue-100 text-blue-800',
      'audio': 'bg-green-100 text-green-800',
      'script': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner text="Loading system instructions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            System Instructions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage AI system instructions and prompts for video generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Instruction
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{instructions.length}</p>
                <p className="text-sm text-muted-foreground">Total Instructions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{instructions.filter(i => i.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{filteredInstructions.length}</p>
                <p className="text-sm text-muted-foreground">Filtered Results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search instructions by name, description, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Settings className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions List */}
      {filteredInstructions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'No matching instructions found' : 'No system instructions yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first system instruction to get started with AI customization.'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Instruction
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInstructions.map((instruction) => (
            <Card key={instruction.id} className={cn(
              'transition-all duration-200 hover:shadow-md',
              !instruction.isActive && 'opacity-60 bg-gray-50'
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{instruction.name}</CardTitle>
                      <Badge className={getCategoryBadgeColor(instruction.category)}>
                        {categories.find(c => c.name === instruction.category)?.label || instruction.category}
                      </Badge>
                      {!instruction.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    {instruction.description && (
                      <p className="text-sm text-muted-foreground">{instruction.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(instruction)}
                      title="Edit instruction"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(instruction)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete instruction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {instruction.instruction}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>
                    Created: {new Date(instruction.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Updated: {new Date(instruction.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* System Instruction Dialog */}
      <SystemInstructionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleDialogSave}
        instruction={editingInstruction}
      />
    </div>
  );
}
