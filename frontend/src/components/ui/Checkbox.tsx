import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, className = '' }) => (
  <button onClick={onChange} className={`shrink-0 ${className}`}>
    <div
      className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
        checked ? 'border-accent bg-accent/20' : 'border-white/20'
      }`}
    >
      {checked && <Check className="w-2.5 h-2.5 text-accent" strokeWidth={3} />}
    </div>
  </button>
);

export default Checkbox;