import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { SystemInstruction, SystemInstructionCategory } from '@/types/shared';
import { SystemInstructionDialog } from './SystemInstructionDialog';
import { apiClient } from '@/lib/api';

interface SystemInstructionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemInstructionManager({ isOpen, onClose }: SystemInstructionManagerProps) {
  const [instructions, setInstructions] = useState<SystemInstruction[]>([]);
  const [categories, setCategories] = useState<SystemInstructionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<SystemInstruction | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInstructions();
      loadCategories();
    }
  }, [isOpen, selectedCategory]);

  const loadInstructions = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      queryParams.append('active', 'true');
      
      const endpoint = `/system-instructions?${queryParams.toString()}`;
      const response = await apiClient.get(endpoint);
      if (response.success) {
        setInstructions(response.data.instructions);
      }
    } catch (err) {
      setError('Failed to load system instructions');
      console.error('Load instructions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/system-instructions/categories');
      if (response.success) {
        setCategories([
          { name: 'all', count: 0, label: 'All Categories' },
          ...response.data.categories
        ]);
      }
    } catch (err) {
      console.error('Load categories error:', err);
    }
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
        loadInstructions();
      }
    } catch (err) {
      setError('Failed to delete system instruction');
      console.error('Delete instruction error:', err);
    }
  };

  const handleSave = () => {
    setDialogOpen(false);
    setEditingInstruction(null);
    loadInstructions();
    loadCategories();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">System Instructions</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Instruction
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-64 border-r bg-gray-50 p-4">
            <h3 className="font-semibold mb-3">Categories</h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.label}</span>
                    {category.name !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions List */}
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {instructions.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No instructions found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Create your first system instruction to get started.
                    </p>
                    <Button onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Instruction
                    </Button>
                  </div>
                ) : (
                  instructions.map((instruction) => (
                    <Card key={instruction.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {instruction.name}
                              {instruction.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  Default
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {instruction.category}
                              </Badge>
                            </CardTitle>
                            {instruction.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {instruction.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(instruction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(instruction)}
                              disabled={instruction.isDefault}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 rounded-md p-3">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {instruction.instruction}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>
                            Created by {instruction.creator?.name || 'System'}
                          </span>
                          <span>
                            {new Date(instruction.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SystemInstructionDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        instruction={editingInstruction}
      />
    </div>
  );
}
