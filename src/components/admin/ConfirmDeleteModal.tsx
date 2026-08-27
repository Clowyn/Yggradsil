import { AlertTriangle, Loader2 } from 'lucide-react';

interface ImpactItem {
  label: string;
  count: number;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  entityName: string;
  entityType?: string;
  impacts?: ImpactItem[];
  isDeleting?: boolean;
  dangerMessage?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  entityType = 'record',
  impacts = [],
  isDeleting = false,
  dangerMessage = 'This action cannot be undone and will permanently delete this record and its associated data.',
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up text-neutral-200">
        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Target: <span className="font-mono font-medium text-red-300">{entityName}</span> ({entityType})
            </p>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-xs text-red-300 space-y-2">
          <p>{dangerMessage}</p>
        </div>

        {/* Cascade Impact List */}
        {impacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Cascade deletion breakdown:
            </p>
            <div className="bg-neutral-950 rounded-lg border border-neutral-800/80 p-3 space-y-1.5 text-xs">
              {impacts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-neutral-300">
                  <span className="flex items-center gap-1.5 text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {item.label}
                  </span>
                  <span className="font-mono font-bold text-red-400">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Permanently Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
