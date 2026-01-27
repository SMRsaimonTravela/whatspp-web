import * as Popover from '@radix-ui/react-popover';
import React from 'react';

export interface TruncatedPopoverProps {
  text: string;
  limit?: number;
  className?: string;
}

const DEFAULT_LIMIT = 40;

const TruncatedPopover: React.FC<TruncatedPopoverProps> = ({ text, limit = DEFAULT_LIMIT, className }) => {
  if (!text || text.length <= limit) return <>{text || '-'}</>;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <span className={className ? className : 'cursor-pointer'}>
          {text.slice(0, limit)}... <span className="underline">see more</span>
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="max-w-xs p-4 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <span className="break-words text-gray-800 dark:text-white">{text}</span>
          <Popover.Close className="block mt-2 text-xs text-brand-500 underline cursor-pointer">Close</Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default TruncatedPopover;
