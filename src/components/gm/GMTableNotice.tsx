import { AlertTriangle, Database } from 'lucide-react';

interface GMTableNoticeProps {
  tableName: string;
}

export function GMTableNotice({ tableName }: GMTableNoticeProps) {
  return (
    <div
      data-testid="gm-table-missing-notice"
      className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md mb-4 text-amber-200 text-xs font-inter flex items-start gap-3 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-cinzel font-bold text-amber-300">Tablo Eksik ({tableName})</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-mono flex items-center gap-1">
            <Database className="w-2.5 h-2.5" /> Yerel Demo Modu
          </span>
        </div>
        <p className="text-amber-200/80 leading-relaxed">
          Veritabanı tablosu henüz oluşturulmamış. Lütfen 03_new_gm_modules.sql migrasyonunu Supabase SQL Editor'da çalıştırın.
        </p>
      </div>
    </div>
  );
}
