import { type RaceTierKey } from '../../lib/types';
import { RACE_TIERS, TIER_COLORS, getRacesByTier } from '../../lib/constants';
import { RaceClassCard } from './RaceClassCard';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  selected: RaceTierKey | null;
  onSelect: (tier: RaceTierKey) => void;
}

export function RaceTierSelector({ selected, onSelect }: Props) {
  const { locale } = useAuth();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-[Cinzel] text-gold-gradient mb-2">
          {locale === 'tr' ? 'Irk Katmanı Seç' : 'Choose Your Race Tier'}
        </h2>
        <p className="text-slate-400 text-sm">
          {locale === 'tr'
            ? 'Karakterinin temel yapısını belirle'
            : 'Determine the fundamental nature of your character'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RACE_TIERS.map((tier) => {
          const tierColors = TIER_COLORS[tier.key as RaceTierKey];
          const raceCount = getRacesByTier(tier.key as RaceTierKey).length;
          const desc = locale === 'tr' ? tierColors.description_tr : tierColors.description_en;
          const name = locale === 'tr' ? tier.name_tr : tier.name_en;

          return (
            <RaceClassCard
              key={tier.key}
              title={name}
              subtitle={`${raceCount} ${locale === 'tr' ? 'ırk' : 'races'}`}
              description={desc}
              selected={selected === tier.key}
              dimmed={selected !== null && selected !== tier.key}
              onSelect={() => onSelect(tier.key as RaceTierKey)}
              glowColor={tierColors.primary}
            />
          );
        })}
      </div>
    </div>
  );
}
