'use client';

import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CollapsedNavTooltipProps {
  label: string;
  collapsed: boolean;
  children: React.ReactElement;
}

export function CollapsedNavTooltip({
  label,
  collapsed,
  children,
}: CollapsedNavTooltipProps) {
  if (!collapsed) return children;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" align="center" className="bg-mp-surface text-mp-text-primary border border-mp-border">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
