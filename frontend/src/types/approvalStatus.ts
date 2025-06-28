/**
 * Improved Approval Status System
 * 
 * This provides a clearer, more semantic status system for the video generation workflow.
 * Each status has a specific meaning and clear transitions.
 */

export const ApprovalStatus = {
  // User can edit content, not yet submitted for processing
  DRAFT: 'DRAFT',
  
  // User submitted content, queued for AI processing
  SUBMITTED: 'SUBMITTED',
  
  // AI is actively processing the content
  PROCESSING: 'PROCESSING',
  
  // Content generated successfully and approved
  APPROVED: 'APPROVED',
  
  // Content generation failed or user rejected the result
  REJECTED: 'REJECTED',
} as const;

export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

/**
 * Status transition rules and validation
 */
export const StatusTransitions: Record<ApprovalStatus, ApprovalStatus[]> = {
  [ApprovalStatus.DRAFT]: [ApprovalStatus.SUBMITTED],
  [ApprovalStatus.SUBMITTED]: [ApprovalStatus.PROCESSING, ApprovalStatus.DRAFT], // Can cancel
  [ApprovalStatus.PROCESSING]: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED],
  [ApprovalStatus.APPROVED]: [ApprovalStatus.DRAFT], // Can regenerate
  [ApprovalStatus.REJECTED]: [ApprovalStatus.DRAFT], // Can retry
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return StatusTransitions[from].includes(to);
}

/**
 * Status display configuration for UI components
 */
export const StatusDisplay = {
  [ApprovalStatus.DRAFT]: {
    icon: '🖊️',
    text: 'Draft',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    description: 'Ready to edit and submit',
  },
  [ApprovalStatus.SUBMITTED]: {
    icon: '📤',
    text: 'Queued',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: 'Waiting for AI processing',
  },
  [ApprovalStatus.PROCESSING]: {
    icon: '⚙️',
    text: 'Generating',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    description: 'AI is generating content',
  },
  [ApprovalStatus.APPROVED]: {
    icon: '✅',
    text: 'Approved',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    description: 'Ready for next stage',
  },
  [ApprovalStatus.REJECTED]: {
    icon: '❌',
    text: 'Failed',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    description: 'Generation failed or rejected',
  },
} as const;

/**
 * Get available actions for a given status
 */
export function getAvailableActions(status: ApprovalStatus): string[] {
  switch (status) {
    case ApprovalStatus.DRAFT:
      return ['edit', 'submit', 'generate'];
    case ApprovalStatus.SUBMITTED:
      return ['cancel'];
    case ApprovalStatus.PROCESSING:
      return ['cancel']; // If cancellation is supported
    case ApprovalStatus.APPROVED:
      return ['approve', 'reject', 'regenerate', 'next'];
    case ApprovalStatus.REJECTED:
      return ['retry', 'edit', 'regenerate'];
    default:
      return [];
  }
}

/**
 * Check if user can interact with content in current status
 */
export function canUserEdit(status: ApprovalStatus): boolean {
  return status === ApprovalStatus.DRAFT;
}

/**
 * Check if content is being processed
 */
export function isProcessing(status: ApprovalStatus): boolean {
  return status === ApprovalStatus.SUBMITTED || status === ApprovalStatus.PROCESSING;
}

/**
 * Check if content is ready for next stage
 */
export function isReadyForNext(status: ApprovalStatus): boolean {
  return status === ApprovalStatus.APPROVED;
}

/**
 * Check if content needs user attention
 */
export function needsUserAction(status: ApprovalStatus): boolean {
  return status === ApprovalStatus.DRAFT || status === ApprovalStatus.REJECTED;
}

/**
 * Get overall segment status based on individual approval statuses
 */
export function getOverallSegmentStatus(segment: {
  scriptApprovalStatus: ApprovalStatus;
  imageApprovalStatus: ApprovalStatus;
  videoApprovalStatus: ApprovalStatus;
  audioApprovalStatus: ApprovalStatus;
  finalApprovalStatus: ApprovalStatus;
}): ApprovalStatus {
  const statuses = [
    segment.scriptApprovalStatus,
    segment.imageApprovalStatus,
    segment.videoApprovalStatus,
    segment.audioApprovalStatus,
    segment.finalApprovalStatus,
  ];

  // If any stage is processing, overall is processing
  if (statuses.some(isProcessing)) {
    return ApprovalStatus.PROCESSING;
  }

  // If any stage is rejected, overall is rejected
  if (statuses.some(status => status === ApprovalStatus.REJECTED)) {
    return ApprovalStatus.REJECTED;
  }

  // If all stages are approved, overall is approved
  if (statuses.every(status => status === ApprovalStatus.APPROVED)) {
    return ApprovalStatus.APPROVED;
  }

  // If any stage needs action, overall is draft
  if (statuses.some(needsUserAction)) {
    return ApprovalStatus.DRAFT;
  }

  // Default to draft
  return ApprovalStatus.DRAFT;
}

/**
 * Status change event for tracking and analytics
 */
export interface StatusChangeEvent {
  segmentId: string;
  field: string;
  fromStatus: ApprovalStatus;
  toStatus: ApprovalStatus;
  timestamp: string;
  reason?: string;
}

/**
 * Create a status change event
 */
export function createStatusChangeEvent(
  segmentId: string,
  field: string,
  fromStatus: ApprovalStatus,
  toStatus: ApprovalStatus,
  reason?: string
): StatusChangeEvent {
  return {
    segmentId,
    field,
    fromStatus,
    toStatus,
    timestamp: new Date().toISOString(),
    reason,
  };
}
