import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RaceTierKey, StatKey } from '../../lib/types';
import { RaceTierSelector } from './RaceTierSelector';
import { RaceSelector } from './RaceSelector';
import { ClassCategorySelector } from './ClassCategorySelector';
import { SubclassSelector } from './SubclassSelector';
import { CharacterReview } from './CharacterReview';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { supabase } from '../../lib/supabase';
import { RACE_TIERS, RACES, CLASS_CATEGORIES, SUBCLASSES } from '../../lib/constants';

const STEPS = [
  { key: 'tier', label_en: 'Race Tier', label_tr: 'Irk Katmanı' },
  { key: 'race', label_en: 'Race', label_tr: 'Irk' },
  { key: 'category', label_en: 'Class', label_tr: 'Sınıf' },
  { key: 'subclass', label_en: 'Subclass', label_tr: 'Alt Sınıf' },
  { key: 'review', label_en: 'Review', label_tr: 'Onay' },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export function CharacterCreation() {
  const { user, locale } = useAuth();
  const { campaign, loading: campaignLoading } = useCampaign();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [selectedTier, setSelectedTier] = useState<RaceTierKey | null>(null);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState('');

  const canNext = (): boolean => {
    switch (step) {
      case 0: return selectedTier !== null;
      case 1: return selectedRace !== null;
      case 2: return selectedCategory !== null;
      case 3: return selectedSubclass !== null;
      case 4: return characterName.trim().length > 0;
      default: return false;
    }
  };

  const goNext = () => {
    if (canNext() && step < 4) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const handleConfirm = async () => {
    try {
      if (!user) {
        alert(locale === 'tr' ? 'Oturum açmadınız!' : 'Not logged in!');
        return;
      }
      if (campaignLoading) {
        alert(locale === 'tr' ? 'Hikaye yükleniyor, lütfen bekleyin...' : 'Story is still loading, please wait...');
        return;
      }
      let activeCampaign = campaign;
      if (!activeCampaign) {
        // Fallback: resolve or create a campaign on the fly
        const { data: campList } = await supabase.from('campaigns').select('*').limit(1);
        if (campList && campList.length > 0) {
          activeCampaign = campList[0];
        } else {
          const { data: newCamp } = await supabase.from('campaigns').insert({
            name: 'Gölgeler Diyarı',
            settings: { fog_radius: 80 }
          }).select().single();
          if (newCamp) activeCampaign = newCamp;
        }

        if (activeCampaign) {
          await supabase.from('campaign_members').upsert({
            campaign_id: activeCampaign.id,
            profile_id: user.id,
            role: 'player'
          });
        }
      }

      if (!activeCampaign) {
        console.error('Campaign is null. Check browser console for RLS or Supabase errors.');
        alert(locale === 'tr' ? 'Aktif hikaye bulunamadı! Lütfen Supabase SQL Editor üzerinden admin_migration.sql dosyasını çalıştırdığınızdan emin olun.' : 'No active story found! Please ensure admin_migration.sql has been executed in Supabase SQL Editor.');
        return;
      }

      // 1. Fetch race UUID from the database definition
      const { data: raceData, error: raceErr } = await supabase
        .from('race_definitions')
        .select('id, stat_bonuses')
        .eq('key', selectedRace)
        .single();
      if (raceErr) throw raceErr;

      // 2. Fetch subclass UUID from the database definition
      const { data: subclassData, error: subclassErr } = await supabase
        .from('subclass_definitions')
        .select('id, base_stats')
        .eq('key', selectedSubclass)
        .single();
      if (subclassErr) throw subclassErr;

      // 3. Insert character into character table
      const { data: charData, error: charErr } = await supabase
        .from('characters')
        .insert({
          profile_id: user.id,
          campaign_id: activeCampaign.id,
          name: characterName,
          race_id: raceData.id,
          subclass_id: subclassData.id,
          level: 1,
          xp_total: 0,
          xp_available: 0,
        })
        .select()
        .single();
      if (charErr) throw charErr;

      // 4. Insert starting stats (STR, DEX, CON, INT, WIS, CHA)
      const statsToInsert = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => {
        const raceBonus = (raceData.stat_bonuses as Record<string, number>)?.[stat] ?? 0;
        const classBonus = (subclassData.base_stats as Record<string, number>)?.[stat] ?? 0;
        return {
          character_id: charData.id,
          stat_key: stat as StatKey,
          base_value: 10 + raceBonus + classBonus,
          bonus_value: 0
        };
      });

      const { error: statsErr } = await supabase
        .from('character_stats')
        .insert(statsToInsert);
      if (statsErr) throw statsErr;

      // 5. Add a default map token for this character
      await supabase.from('map_tokens').insert({
        character_id: charData.id,
        campaign_id: activeCampaign.id,
        x_position: 600,
        y_position: 400,
        color: '#ffd700',
      });

      alert(locale === 'tr' ? `${characterName} başarıyla oluşturuldu! 🎉` : `${characterName} has been successfully created! 🎉`);
      
      // Force reload or redirect
      window.location.reload();
    } catch (err) {
      console.error('Error creating character:', err);
      alert(locale === 'tr' ? 'Karakter oluşturulurken hata oluştu.' : 'Failed to create character.');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <RaceTierSelector selected={selectedTier} onSelect={(t) => { setSelectedTier(t); setSelectedRace(null); }} />;
      case 1:
        return selectedTier ? <RaceSelector tierKey={selectedTier} selected={selectedRace} onSelect={setSelectedRace} /> : null;
      case 2:
        return <ClassCategorySelector selected={selectedCategory} onSelect={(c) => { setSelectedCategory(c); setSelectedSubclass(null); }} />;
      case 3:
        return selectedCategory ? <SubclassSelector categoryKey={selectedCategory} selected={selectedSubclass} onSelect={setSelectedSubclass} /> : null;
      case 4:
        return (
          <CharacterReview
            characterName={characterName}
            onNameChange={setCharacterName}
            raceKey={selectedRace}
            subclassKey={selectedSubclass}
            onConfirm={handleConfirm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[1700px] w-full mx-auto px-2 sm:px-4 space-y-6 sm:space-y-8">
      {/* Top Header: Progress Indicator + Compact Quick Next */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/10">
        <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  if (i < step) {
                    setDirection(-1);
                    setStep(i);
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2 transition-all duration-300 cursor-pointer"
              >
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                  style={{
                    backgroundColor: i === step ? '#ffd700' : i < step ? '#ffd70050' : 'rgba(255,255,255,0.1)',
                    color: i === step ? '#0a0a0f' : i < step ? '#ffd700' : '#64748b',
                    boxShadow: i === step ? '0 0 15px rgba(255,215,0,0.5)' : 'none',
                  }}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:inline"
                  style={{ color: i === step ? '#ffd700' : '#64748b' }}
                >
                  {locale === 'tr' ? s.label_tr : s.label_en}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="w-4 sm:w-8 h-px transition-colors duration-300"
                  style={{ backgroundColor: i < step ? '#ffd700' : 'rgba(255,255,255,0.1)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Compact navigation in header */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="px-3.5 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:border-amber-500/30 bg-black/40 text-xs font-[Cinzel] font-semibold transition cursor-pointer"
            >
              ← {locale === 'tr' ? 'Geri' : 'Back'}
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext()}
              className="px-4 py-1.5 rounded-lg font-[Cinzel] text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105 active:scale-95"
              style={{
                background: canNext()
                  ? 'linear-gradient(135deg, #ffd700, #ffa500)'
                  : '#27272a',
                color: canNext() ? '#0a0a0f' : '#71717a',
                boxShadow: canNext() ? '0 0 15px rgba(255,215,0,0.4)' : 'none',
              }}
            >
              <span>{locale === 'tr' ? 'Hızlı İleri' : 'Quick Next'}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>

      {/* Step Content with Animation */}
      <div className="relative min-h-[500px] pb-24">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky / Floating Bar at Bottom */}
      {step < 4 && (
        <div className="sticky bottom-4 z-40 bg-zinc-950/85 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl flex justify-between items-center max-w-4xl mx-auto">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:border-amber-500/30 bg-black/40 text-sm font-[Cinzel] font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            <span>←</span>
            <span>{locale === 'tr' ? 'Geri' : 'Back'}</span>
          </button>

          {/* Current Selection summary */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-[Cinzel] text-amber-200/80 bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
            <span className="text-amber-400 font-bold">
              {STEPS[step] ? (locale === 'tr' ? STEPS[step].label_tr : STEPS[step].label_en) : ''}:
            </span>
            <span className="text-white font-semibold">
              {(() => {
                if (step === 0 && selectedTier) {
                  const t = RACE_TIERS.find(tier => tier.key === selectedTier);
                  return t ? (locale === 'tr' ? t.name_tr : t.name_en) : selectedTier.toUpperCase();
                }
                if (step === 1 && selectedRace) {
                  const r = RACES.find(race => race.key === selectedRace);
                  return r ? r.name : selectedRace.toUpperCase();
                }
                if (step === 2 && selectedCategory) {
                  const c = CLASS_CATEGORIES.find(cat => cat.key === selectedCategory);
                  return c ? (locale === 'tr' ? c.name_tr : c.name_en) : selectedCategory.toUpperCase();
                }
                if (step === 3 && selectedSubclass) {
                  const sc = SUBCLASSES.find(sub => sub.key === selectedSubclass);
                  return sc ? (locale === 'tr' ? sc.name_tr : sc.name_en) : selectedSubclass.toUpperCase();
                }
                return locale === 'tr' ? 'Seçim Yapın' : 'Select';
              })()}
            </span>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!canNext()}
            className="px-8 sm:px-10 py-3 rounded-xl font-[Cinzel] text-base font-extrabold tracking-wide transition-all duration-300 disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-2.5 hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            style={{
              background: canNext()
                ? 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%)'
                : '#27272a',
              color: canNext() ? '#0a0a0f' : '#71717a',
              boxShadow: canNext()
                ? '0 0 25px rgba(245, 158, 11, 0.55), 0 0 50px rgba(251, 191, 36, 0.3)'
                : 'none',
            }}
          >
            <span>{locale === 'tr' ? 'İleri' : 'Next'}</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
