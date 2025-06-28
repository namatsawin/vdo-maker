import { useState, useCallback } from 'react';
import { 
  ApprovalStatus, 
  isValidTransition, 
  createStatusChangeEvent,
  type StatusChangeEvent 
} from '@/types/approvalStatus';
import { useUIStore } from '@/stores/uiStore';

interface UseStatusManagerOptions {
  onStatusChange?: (event: StatusChangeEvent) => void;
  enableLogging?: boolean;
}

export function useStatusManager(options: UseStatusManagerOptions = {}) {
  const { addToast } = useUIStore();
  const [statusHistory, setStatusHistory] = useState<StatusChangeEvent[]>([]);

  const changeStatus = useCallback(
    (
      segmentId: string,
      field: string,
      fromStatus: ApprovalStatus,
      toStatus: ApprovalStatus,
      reason?: string
    ): boolean => {
      // Validate transition
      if (!isValidTransition(fromStatus, toStatus)) {
        const errorMessage = `Invalid status transition: ${fromStatus} → ${toStatus}`;
        
        if (options.enableLogging) {
          console.error(errorMessage);
        }
        
        addToast({
          type: 'error',
          title: 'Invalid Status Change',
          message: errorMessage,
        });
        
        return false;
      }

      // Create status change event
      const event = createStatusChangeEvent(segmentId, field, fromStatus, toStatus, reason);

      // Log the change
      if (options.enableLogging) {
        console.log('Status change:', event);
      }

      // Update history
      setStatusHistory(prev => [...prev, event]);

      // Call callback if provided
      if (options.onStatusChange) {
        options.onStatusChange(event);
      }

      return true;
    },
    [options, addToast]
  );

  const getStatusHistory = useCallback(
    (segmentId?: string, field?: string) => {
      let filtered = statusHistory;
      
      if (segmentId) {
        filtered = filtered.filter(event => event.segmentId === segmentId);
      }
      
      if (field) {
        filtered = filtered.filter(event => event.field === field);
      }
      
      return filtered.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    [statusHistory]
  );

  const clearHistory = useCallback(() => {
    setStatusHistory([]);
  }, []);

  return {
    changeStatus,
    statusHistory,
    getStatusHistory,
    clearHistory,
  };
}

/**
 * Hook for managing a single status field
 */
export function useFieldStatus(
  initialStatus: ApprovalStatus,
  segmentId: string,
  fieldName: string,
  options: UseStatusManagerOptions = {}
) {
  const [status, setStatus] = useState<ApprovalStatus>(initialStatus);
  const { changeStatus } = useStatusManager(options);

  const updateStatus = useCallback(
    (newStatus: ApprovalStatus, reason?: string): boolean => {
      const success = changeStatus(segmentId, fieldName, status, newStatus, reason);
      
      if (success) {
        setStatus(newStatus);
      }
      
      return success;
    },
    [changeStatus, segmentId, fieldName, status]
  );

  const transitionTo = useCallback(
    (targetStatus: ApprovalStatus, reason?: string) => {
      return updateStatus(targetStatus, reason);
    },
    [updateStatus]
  );

  // Convenience methods for common transitions
  const submit = useCallback(() => transitionTo(ApprovalStatus.SUBMITTED, 'User submitted'), [transitionTo]);
  const startProcessing = useCallback(() => transitionTo(ApprovalStatus.PROCESSING, 'AI processing started'), [transitionTo]);
  const approve = useCallback(() => transitionTo(ApprovalStatus.APPROVED, 'Content approved'), [transitionTo]);
  const reject = useCallback((reason?: string) => transitionTo(ApprovalStatus.REJECTED, reason || 'Content rejected'), [transitionTo]);
  const reset = useCallback(() => transitionTo(ApprovalStatus.DRAFT, 'Reset to draft'), [transitionTo]);

  return {
    status,
    updateStatus,
    transitionTo,
    submit,
    startProcessing,
    approve,
    reject,
    reset,
  };
}

/**
 * Hook for managing AI generation workflow
 */
export function useAIGenerationStatus(
  segmentId: string,
  fieldName: string,
  generateFunction: () => Promise<any>
) {
  const { status, submit, startProcessing, approve, reject, reset } = useFieldStatus(
    ApprovalStatus.DRAFT,
    segmentId,
    fieldName,
    { enableLogging: true }
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      setError(null);

      // Submit for processing
      if (!submit()) return;

      // Start processing
      if (!startProcessing()) return;

      // Call the generation function
      const result = await generateFunction();

      // Mark as approved
      approve();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Generation failed';
      setError(errorMessage);
      reject(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, submit, startProcessing, approve, reject, generateFunction]);

  const retry = useCallback(async () => {
    reset();
    return generate();
  }, [reset, generate]);

  const cancel = useCallback(() => {
    if (isGenerating) {
      setIsGenerating(false);
      reset();
    }
  }, [isGenerating, reset]);

  return {
    status,
    isGenerating,
    error,
    generate,
    retry,
    cancel,
    reset,
  };
}
