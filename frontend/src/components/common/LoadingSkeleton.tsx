import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; height?: string }> = ({
  rows = 3,
  height = 'h-24',
}) => {
  return (
    <div className="space-y-4 animate-pulse w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-surface-card/60 border border-surface-border/50 rounded-xl`}
        />
      ))}
    </div>
  );
};
