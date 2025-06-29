import { ApprovalStatus, StatusDisplay, isProcessing } from '@/types/approvalStatus';
import { Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: ApprovalStatus;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ 
  status, 
  showIcon = true, 
  showText = true, 
  size = 'md',
  className = '' 
}: StatusBadgeProps) {
  const config = StatusDisplay[status];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses[size]}
        ${className}
      `}
      title={config.description}
    >
      {showIcon && (
        <span className="flex items-center">
          {isProcessing(status) ? (
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
          ) : (
            <span className={iconSizes[size]} style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px' }}>
              {config.icon}
            </span>
          )}
        </span>
      )}
      {showText && <span>{config.text}</span>}
    </span>
  );
}

interface StatusProgressProps {
  statuses: {
    label: string;
    status: ApprovalStatus;
  }[];
  className?: string;
}

export function StatusProgress({ statuses, className = '' }: StatusProgressProps) {
  const totalSteps = statuses.length;
  const completedSteps = statuses.filter(s => s.status === ApprovalStatus.APPROVED).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Status List */}
      <div className="space-y-2">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {item.label}
            </span>
            <StatusBadge status={item.status} size="sm" />
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-500 text-center">
        {completedSteps} of {totalSteps} steps completed
      </div>
    </div>
  );
}

interface StatusActionButtonsProps {
  status: ApprovalStatus;
  onEdit?: () => void;
  onSubmit?: () => void;
  onRegenerate?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
  className?: string;
}

export function StatusActionButtons({
  status,
  onEdit,
  onSubmit,
  onRegenerate,
  onCancel,
  onRetry,
  disabled = false,
  className = ''
}: StatusActionButtonsProps) {
  const buttonClass = "px-3 py-1 text-sm rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const renderButtons = () => {
    switch (status) {
      case ApprovalStatus.DRAFT:
        return (
          <>
            {onEdit && (
              <button
                onClick={onEdit}
                disabled={disabled}
                className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
              >
                Edit
              </button>
            )}
            {onSubmit && (
              <button
                onClick={onSubmit}
                disabled={disabled}
                className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
              >
                Generate
              </button>
            )}
          </>
        );

      case ApprovalStatus.PROCESSING:
        return (
          <>
            {onCancel && (
              <button
                onClick={onCancel}
                disabled={disabled}
                className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
              >
                Cancel
              </button>
            )}
          </>
        );

      case ApprovalStatus.APPROVED:
        return (
          <>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={disabled}
                className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
              >
                Regenerate
              </button>
            )}
          </>
        );

      case ApprovalStatus.REJECTED:
        return (
          <>
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={disabled}
                className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
              >
                Try Again
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                disabled={disabled}
                className={`${buttonClass} bg-gray-100 text-gray-700 hover:bg-gray-200`}
              >
                Edit
              </button>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {renderButtons()}
    </div>
  );
}
