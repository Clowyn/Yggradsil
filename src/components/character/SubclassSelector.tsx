import type { StatKey } from '../../lib/types';
import { getSubclassesByCategory, CATEGORY_COLORS } from '../../lib/constants';
import { RaceClassCard } from './RaceClassCard';
import { useAuth } from '../../contexts/AuthContext';

const SUBCLASS_IMAGE_MAPPING: Record<string, string> = {
  // Mage
  druid: 'druid',
  warlock: 'warlock',
  priest: 'cleric',
  dark_mage: 'wizard',
  elementalist_mage: 'wizard',
  psychomage: 'wizard',
  blood_mage: 'wizard',
  mana_mage: 'wizard',
  shaman: 'druid',
  oracle_mage: 'cleric',
  
  // Warrior
  monk: 'monk',
  berserker: 'barbarian',
  samurai: 'fighter',
  sword_sentinel: 'fighter',
  weapon_saint: 'fighter',
  executioner: 'fighter',
  drunken_master: 'monk',
  iron_fist: 'monk',
  aura_fighter: 'fighter',
  elemental_swordmaster: 'fighter',
  
  // Tank
  vanguard_guardian: 'paladin',
  wall_guard: 'paladin',
  coreplate: 'paladin',
  sworn_shield: 'paladin',
  guardian_of_faith: 'cleric',
  stoneheart: 'paladin',
  twin_ramparts: 'paladin',
  life_guardian: 'paladin',
  wrestler: 'barbarian',

  // Assassin
  ninja: 'rogue',
  darkcabe: 'rogue',
  venomblood: 'rogue',
  phantom_veil: 'rogue',
  nightmare_stalker: 'rogue',
  echoblade: 'rogue',
  mindhunter: 'rogue',
  spy: 'rogue',

  // Marksman
  stormshot: 'ranger',
  sniper: 'ranger',
  index: 'ranger',
  one_shot: 'ranger',
  gunslinger: 'ranger',
  rune_archer: 'ranger',
  late_chaser: 'ranger',
  elementalist_archer: 'ranger',

  // Crafting & Summoner
  cook: 'bard',
  merchant: 'bard',
  gambler: 'bard',
  necromancer: 'warlock',
  hellbinder: 'warlock',
  oracle_summoner: 'warlock',
  soul_summoner: 'warlock',
};

interface Props {
  categoryKey: string;
  selected: string | null;
  onSelect: (subclassKey: string) => void;
}

export function SubclassSelector({ categoryKey, selected, onSelect }: Props) {
  const { locale } = useAuth();
  const subclasses = getSubclassesByCategory(categoryKey);
  const colors = CATEGORY_COLORS[categoryKey];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-[Cinzel] text-gold-gradient mb-2">
          {locale === 'tr' ? 'Alt Sınıfını Seç' : 'Choose Your Subclass'}
        </h2>
        <p className="text-slate-400 text-sm">
          {locale === 'tr'
              ? `${subclasses.length} alt sınıf mevcut`
              : `${subclasses.length} subclasses available`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subclasses.map((sc) => {
          const name = locale === 'tr' ? sc.name_tr : sc.name_en;
          const abilityName = locale === 'tr' ? sc.ability_name_tr : sc.ability_name_en;
          const abilityDesc = locale === 'tr' ? sc.ability_desc_tr : sc.ability_desc_en;

          let badge: string | undefined;
          if (sc.is_low_rate) badge = '⚡ Low Rate';
          if (sc.is_advanced) badge = '★ Advanced';

          const baseClassImage = SUBCLASS_IMAGE_MAPPING[sc.key];
          const imagePath = baseClassImage ? `/assets/class_${baseClassImage}.png` : undefined;

          return (
            <RaceClassCard
              key={sc.key}
              title={name}
              subtitle={abilityName}
              description={abilityDesc}
              selected={selected === sc.key}
              dimmed={selected !== null && selected !== sc.key}
              onSelect={() => onSelect(sc.key)}
              glowColor={colors?.primary ?? '#ffd700'}
              badge={badge}
              stats={sc.base_stats as Partial<Record<StatKey, number>>}
              image={imagePath}
            />
          );
        })}
      </div>
    </div>
  );
}
