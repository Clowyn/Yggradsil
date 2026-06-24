import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RaceTierKey } from '../../lib/types';
import { RaceTierSelector } from './RaceTierSelector';
import { RaceSelector } from './RaceSelector';
import { ClassCategorySelector } from './ClassCategorySelector';
import { SubclassSelector } from './SubclassSelector';
import { CharacterReview } from './CharacterReview';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { supabase } from '../../lib/supabase';

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
        alert(locale === 'tr' ? 'Kampanya yükleniyor, lütfen bekleyin...' : 'Campaign is still loading, please wait...');
        return;
      }
      if (!campaign) {
        console.error('Campaign is null. Check browser console for RLS or Supabase errors.');
        alert(locale === 'tr' ? 'Aktif kampanya bulunamadı! Lütfen sayfayı yenileyin.' : 'No active campaign found! Please refresh the page or check the browser console for errors.');
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
          campaign_id: campaign.id,
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
          stat_key: stat as any,
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
        campaign_id: campaign.id,
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (i < step) {
                  setDirection(-1);
                  setStep(i);
                }
              }}
              className="flex items-center gap-2 transition-all duration-300"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
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
                className="w-8 h-px transition-colors duration-300"
                style={{ backgroundColor: i < step ? '#ffd700' : 'rgba(255,255,255,0.1)' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content with Animation */}
      <div className="relative min-h-[500px]">
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

      {/* Navigation Buttons */}
      {step < 4 && (
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-20 disabled:cursor-not-allowed font-[Cinzel] text-sm"
          >
            ← {locale === 'tr' ? 'Geri' : 'Back'}
          </button>

          <button
            onClick={goNext}
            disabled={!canNext()}
            className="px-8 py-2.5 rounded-lg font-[Cinzel] text-sm font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              background: canNext()
                ? 'linear-gradient(135deg, #ffd700, #ffa500)'
                : '#333',
              color: canNext() ? '#0a0a0f' : '#666',
              boxShadow: canNext() ? '0 0 15px rgba(255,215,0,0.3)' : 'none',
            }}
          >
            {locale === 'tr' ? 'İleri' : 'Next'} →
          </button>
        </div>
      )}
    </div>
  );
}
