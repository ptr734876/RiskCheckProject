import React from 'react';
import { motion } from 'framer-motion';
import { Home, Building2 } from 'lucide-react';

interface AlgorithmToggleProps {
  leftLabel: string;
  rightLabel: string;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

const AlgorithmToggle: React.FC<AlgorithmToggleProps> = ({
  leftLabel,
  rightLabel,
  isActive,
  onToggle,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="relative flex items-center bg-slate-100 rounded-2xl p-1 cursor-pointer select-none shadow-inner"
        onClick={onToggle}
      >
        <motion.div
          className="absolute bg-white rounded-xl shadow-sm border border-slate-200"
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            top: 4,
            bottom: 4,
            left: isActive ? 4 : '50%',
            right: isActive ? '50%' : 4,
          }}
        />

        <div
          className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            isActive 
              ? 'text-primary' 
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{leftLabel}</span>
        </div>

        <div
          className={`relative z-10 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            !isActive 
              ? 'text-primary' 
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{rightLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default AlgorithmToggle;