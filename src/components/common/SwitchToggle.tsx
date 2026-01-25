import React from 'react';

interface SwitchToggleProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({ checked, onChange, className = '' }) => {
  return (
    <button
      onClick={onChange}
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
      } ${className}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default SwitchToggle;

