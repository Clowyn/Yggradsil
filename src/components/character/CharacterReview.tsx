import { STAT_KEYS, STAT_INFO, type StatKey } from '../../lib/types';
import { RACES, SUBCLASSES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  characterName: string;
  onNameChange: (name: string) => void;
  raceKey: string | null;
  subclassKey: string | null;
  onConfirm: () => void;
}

export function CharacterReview({ characterName, onNameChange, raceKey, subclassKey, onConfirm }: Props) {
  const { locale } = useAuth();
  const race = RACES.find(r => r.key === raceKey);
  const subclass = SUBCLASSES.find(s => s.key === subclassKey);

  // Calculate total stats
  const getStatTotal = (stat: StatKey): { base: number; raceBonus: number; classBonus: number; total: number } => {
    const base = 10;
    const raceBonus = (race?.stat_bonuses as Partial<Record<StatKey, number>> | undefined)?.[stat] ?? 0;
    const classBonus = (subclass?.base_stats as Partial<Record<StatKey, number>> | undefined)?.[stat] ?? 0;
    return { base, raceBonus, classBonus, total: base + raceBonus + classBonus };
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-[Cinzel] text-gold-gradient mb-2">
          {locale === 'tr' ? 'Karakterini Onayla' : 'Review Your Character'}
        </h2>
      </div>

      {/* Character Name */}
      <div className="glass rounded-xl p-6">
        <label className="block text-sm text-slate-400 mb-2 font-[Cinzel]">
          {locale === 'tr' ? 'Karakter Adı' : 'Character Name'}
        </label>
        <input
          type="text"
          value={characterName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={locale === 'tr' ? 'Karakterinin adını gir...' : 'Enter your character name...'}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white placeholder-slate-500 outline-none focus:border-[#ffd700]/50 focus:ring-1 focus:ring-[#ffd700]/30 transition-all font-[Cinzel]"
        />
      </div>

      {/* Race & Class Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Race */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            {locale === 'tr' ? 'Irk' : 'Race'}
          </h3>
          <p className="text-lg font-[Cinzel] text-[#ffd700]">{race?.name ?? '—'}</p>
          <p className="text-sm text-slate-400 mt-1">
            {race ? (locale === 'tr' ? race.description_tr : race.description_en) : ''}
          </p>
        </div>

        {/* Subclass */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-2">
            {locale === 'tr' ? 'Sınıf' : 'Class'}
          </h3>
          <p className="text-lg font-[Cinzel] text-[#ffd700]">
            {subclass ? (locale === 'tr' ? subclass.name_tr : subclass.name_en) : '—'}
          </p>
          {subclass && (
            <div className="mt-2 p-3 rounded-lg bg-white/5 border border-[#ffd700]/20">
              <p className="text-xs text-[#ffd700] font-semibold">
                {locale === 'tr' ? subclass.ability_name_tr : subclass.ability_name_en}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {locale === 'tr' ? subclass.ability_desc_tr : subclass.ability_desc_en}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stat Table */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-sm text-slate-400 font-[Cinzel] mb-4">
          {locale === 'tr' ? 'İstatistik Özeti' : 'Stat Summary'}
        </h3>
        <div className="space-y-2">
          {STAT_KEYS.map((stat) => {
            const s = getStatTotal(stat);
            const info = STAT_INFO[stat];
            return (
              <div key={stat} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-lg w-8">{info.icon}</span>
                <span className="w-10 text-sm font-bold" style={{ color: info.color }}>{stat}</span>
                <span className="text-slate-500 text-sm">{locale === 'tr' ? info.name_tr : info.name_en}</span>
                <div className="flex-1 flex items-center justify-end gap-2 text-sm">
                  <span className="text-slate-400">{s.base}</span>
                  {s.raceBonus !== 0 && (
                    <span className={s.raceBonus > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {s.raceBonus > 0 ? '+' : ''}{s.raceBonus}
                    </span>
                  )}
                  {s.classBonus !== 0 && (
                    <span className={s.classBonus > 0 ? 'text-blue-400' : 'text-orange-400'}>
                      {s.classBonus > 0 ? '+' : ''}{s.classBonus}
                    </span>
                  )}
                  <span className="text-white font-bold text-base ml-2" style={{ color: info.color }}>
                    = {s.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={onConfirm}
        disabled={!characterName.trim()}
        className="w-full py-4 rounded-xl font-[Cinzel] text-lg font-bold transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: characterName.trim()
            ? 'linear-gradient(135deg, #ffd700, #ffa500, #ff8c00)'
            : '#333',
          color: characterName.trim() ? '#0a0a0f' : '#666',
          boxShadow: characterName.trim()
            ? '0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.1)'
            : 'none',
        }}
      >
        {locale === 'tr' ? '⚔️ Karakteri Oluştur' : '⚔️ Create Character'}
      </button>
    </div>
  );
}
