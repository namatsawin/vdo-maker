import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export function Collapsible({
  children,
  trigger,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const handleToggle = () => {
    if (disabled) return;
    
    const newOpen = !isOpen;
    
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    
    onOpenChange?.(newOpen);
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex items-center cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50',
          triggerClassName
        )}
        onClick={handleToggle}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500 transition-transform" />
          )}
          {trigger}
        </div>
      </div>
      
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isOpen ? 'max-h-none opacity-100' : 'max-h-0 opacity-0',
          contentClassName
        )}
      >
        <div className={cn('pt-4', isOpen && 'animate-in slide-in-from-top-2')}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function CollapsibleTrigger({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  );
}

export function CollapsibleContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}
