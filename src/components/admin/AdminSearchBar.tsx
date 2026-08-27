import { Search, X } from 'lucide-react';

interface AdminSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function AdminSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: AdminSearchBarProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search size={15} className="absolute left-3 text-neutral-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-8 py-2 text-xs text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all font-sans"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 text-neutral-400 hover:text-neutral-300 p-0.5"
          title="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
