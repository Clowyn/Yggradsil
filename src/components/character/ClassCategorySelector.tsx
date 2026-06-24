import { CLASS_CATEGORIES, CATEGORY_COLORS, getSubclassesByCategory } from '../../lib/constants';
import { RaceClassCard } from './RaceClassCard';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  selected: string | null;
  onSelect: (categoryKey: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  mage: '🔮',
  warrior: '⚔️',
  tank: '🛡️',
  neutral: '⚖️',
  assassin: '🗡️',
  marksman: '🏹',
  crafting: '🔨',
  summoner: '👻',
};

export function ClassCategorySelector({ selected, onSelect }: Props) {
  const { locale } = useAuth();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-[Cinzel] text-gold-gradient mb-2">
          {locale === 'tr' ? 'Sınıf Kategorisi Seç' : 'Choose Your Class'}
        </h2>
        <p className="text-slate-400 text-sm">
          {locale === 'tr'
            ? 'Savaş tarzını belirle'
            : 'Define your combat specialization'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CLASS_CATEGORIES.map((cat) => {
          const colors = CATEGORY_COLORS[cat.key];
          const subclassCount = getSubclassesByCategory(cat.key).length;
          const icon = CATEGORY_ICONS[cat.key] ?? '✦';
          const name = locale === 'tr' ? cat.name_tr : cat.name_en;

          return (
            <RaceClassCard
              key={cat.key}
              title={`${icon} ${name}`}
              subtitle={`${subclassCount} ${locale === 'tr' ? 'alt sınıf' : 'subclasses'}`}
              description={
                locale === 'tr'
                  ? `${cat.name_tr} kategorisinde ${subclassCount} özel alt sınıf bulunmaktadır.`
                  : `${cat.name_en} category contains ${subclassCount} unique subclasses.`
              }
              selected={selected === cat.key}
              dimmed={selected !== null && selected !== cat.key}
              onSelect={() => onSelect(cat.key)}
              glowColor={colors?.primary ?? '#ffd700'}
            />
          );
        })}
      </div>
    </div>
  );
}
