import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, showLabel = true }) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="flex items-center gap-3">
      {showLabel && <span className="text-xs text-muted-foreground">{value} / {max}</span>}
      <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className="text-xs text-accent font-medium">{percentage}%</span>}
    </div>
  );
};

export default ProgressBar;