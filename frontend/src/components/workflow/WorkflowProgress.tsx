import { Check, Clock, AlertCircle } from 'lucide-react';
import { WorkflowStage } from '@/types';

interface WorkflowProgressProps {
  currentStage: WorkflowStage;
  completedStages: WorkflowStage[];
}

const stages = [
  { key: WorkflowStage.SCRIPT_GENERATION, label: 'Script & Audio', description: 'AI generates script with audio preview' },
  { key: WorkflowStage.IMAGE_GENERATION, label: 'Image Generation', description: 'Create first frame images' },
  { key: WorkflowStage.VIDEO_GENERATION, label: 'Video Generation', description: 'Generate video segments' },
  { key: WorkflowStage.FINAL_ASSEMBLY, label: 'Final Assembly', description: 'Combine all elements' },
];

export function WorkflowProgress({ currentStage, completedStages }: WorkflowProgressProps) {
  const getStageStatus = (stage: WorkflowStage) => {
    if (completedStages.includes(stage)) return 'completed';
    if (stage === currentStage) return 'current';
    return 'pending';
  };

  const getStageIcon = (stage: WorkflowStage) => {
    const status = getStageStatus(stage);
    
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStageClasses = (stage: WorkflowStage) => {
    const status = getStageStatus(stage);
    
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'current':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Workflow Progress</h2>
      
      <div className="flex flex-wrap gap-4">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex items-center">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border ${getStageClasses(stage.key)}`}>
              {getStageIcon(stage.key)}
              <div>
                <div className="font-medium text-sm">{stage.label}</div>
                <div className="text-xs opacity-75">{stage.description}</div>
              </div>
            </div>
            
            {index < stages.length - 1 && (
              <div className="mx-2 h-px w-8 bg-gray-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
