import type { RaceTierKey, StatKey } from '../../lib/types';
import { getRacesByTier, TIER_COLORS } from '../../lib/constants';
import { RaceClassCard } from './RaceClassCard';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  tierKey: RaceTierKey;
  selected: string | null;
  onSelect: (raceKey: string) => void;
}

export function RaceSelector({ tierKey, selected, onSelect }: Props) {
  const { locale } = useAuth();
  const races = getRacesByTier(tierKey);
  const tierColors = TIER_COLORS[tierKey];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-[Cinzel] text-gold-gradient mb-2">
          {locale === 'tr' ? 'Irkını Seç' : 'Choose Your Race'}
        </h2>
        <p className="text-slate-400 text-sm">
          {locale === 'tr'
            ? `${races.length} ırk mevcut`
            : `${races.length} races available`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {races.map((race) => (
          <RaceClassCard
            key={race.key}
            title={race.name}
            description={locale === 'tr' ? race.description_tr : race.description_en}
            selected={selected === race.key}
            dimmed={selected !== null && selected !== race.key}
            onSelect={() => onSelect(race.key)}
            glowColor={tierColors.primary}
            stats={race.stat_bonuses as Partial<Record<StatKey, number>>}
            image={`/assets/race_${race.key}.png`}
          />
        ))}
      </div>
    </div>
  );
}
