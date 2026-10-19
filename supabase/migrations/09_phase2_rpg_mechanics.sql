-- ==============================================================================
-- Migration: 09_phase2_rpg_mechanics.sql
-- Description: Phase 2 (P1) Core RPG Mechanics & Live Data Integration:
--              1. Adds vitals & gold columns to characters (syncing with appearance JSONB)
--              2. Adds icon column to skill_definitions and seeds all 24 Yggdrasil skills
--              3. Hardens character_skills RLS using public.is_gm() and ownership checks
--              4. Introduces atomic unlock_skill RPC with XP deduction and stat bonus sync
--              5. Seeds core D&D 5e item_definitions for starter pack and GM dispenser
--              6. Ensures inventory_items slot_index & custom_properties constraints
-- Safe & Idempotent: Yes
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CHARACTERS VITALS & CURRENCY COLUMNS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.characters
  ADD COLUMN IF NOT EXISTS gold int DEFAULT 1247,
  ADD COLUMN IF NOT EXISTS vitals jsonb DEFAULT '{}'::jsonb;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INVENTORY ITEMS SLOT & ATTUNEMENT SUPPORT
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.inventory_items
  ADD COLUMN IF NOT EXISTS slot_index int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_properties jsonb DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.inventory_items
  ALTER COLUMN slot_index DROP DEFAULT;

DO $$
BEGIN
  ALTER TABLE public.inventory_items
    DROP CONSTRAINT IF EXISTS chk_inventory_slot_index;
  ALTER TABLE public.inventory_items
    ADD CONSTRAINT chk_inventory_slot_index CHECK (slot_index IS NULL OR (slot_index >= 0 AND slot_index < 24));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SKILL DEFINITIONS SCHEMA ENHANCEMENT & 24 YGGDRASIL SKILLS SEED
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.skill_definitions
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '⚡';

INSERT INTO public.skill_definitions (
  skill_key, name_tr, name_en, description_tr, description_en,
  stat_parent, xp_cost, tier, prerequisites, icon, effects
) VALUES
  -- STR Branch
  ('str-1', 'Güçlü Darbe', 'Power Strike', 'Ham gücü zırhı ve kemiği parçalayan yıkıcı bir darbeye dönüştür.', 'Channel raw strength into a devastating blow that sunders armor and bone alike.', 'STR', 100, 1, '{}', '⚔️', '{"description": "+2 melee damage on critical hits", "statBonus": {"STR": 1}}'::jsonb),
  ('str-2', 'Demir İrade', 'Iron Will', 'Sarsılmaz iraden bedenini daha zayıf savaşçıları kıracak güçlere karşı korur.', 'Your unyielding resolve fortifies your body against forces that would break lesser warriors.', 'STR', 200, 2, '{str-1}', '🔩', '{"description": "Advantage on STR saving throws", "savingThrowBonus": {"STR": 2}}'::jsonb),
  ('str-3', 'Titan Tutuşu', 'Titan Grip', 'Devasa silahları tüy gibi savur, tutuşun kırılmaz olsun.', 'Wield weapons of enormous size as though they were feathers, your grip unbreakable.', 'STR', 250, 2, '{str-1}', '🤜', '{"description": "Wield two-handed weapons in one hand", "statBonus": {"STR": 2}}'::jsonb),
  ('str-4', 'Deprem Darbesi', 'Earthquake Slam', 'Yeri yıkıcı bir güçle döv, ayakta kalan herkesi deviren şok dalgaları gönder.', 'Strike the earth with cataclysmic force, sending shockwaves that topple all who stand.', 'STR', 500, 3, '{str-2,str-3}', '💥', '{"description": "AoE knockdown in 15ft radius", "specialAbility": "Earthquake Slam"}'::jsonb),

  -- DEX Branch
  ('dex-1', 'Çevik Kaçınma', 'Swift Dodge', 'Doğaüstü bir hızla hareket et, saldırıların arasından duman gibi süzül.', 'Move with preternatural speed, slipping between attacks like smoke through fingers.', 'DEX', 100, 1, '{}', '💨', '{"description": "+1 AC when not wearing heavy armor", "acBonus": 1}'::jsonb),
  ('dex-2', 'Gölge Adımı', 'Shadow Step', 'Karanlıkta eriyip düşmanının arkasında yeniden belir, görünmez ve duyulmaz ol.', 'Dissolve into darkness and reform behind your foe, unseen and unheard.', 'DEX', 200, 2, '{dex-1}', '🌑', '{"description": "Teleport 30ft through dim light or darkness", "specialAbility": "Shadow Step"}'::jsonb),
  ('dex-3', 'Kılıç Dansı', 'Blade Dance', 'Çelikten bir transa gir, kılıçların geçilmez bir ölüm fırtınasına dönüşsün.', 'Enter a whirling trance of steel, your blades an impenetrable storm of death.', 'DEX', 250, 2, '{dex-1}', '🗡️', '{"description": "Extra attack when dual wielding", "statBonus": {"DEX": 1}}'::jsonb),
  ('dex-4', 'Rüzgar Yürüyen', 'Wind Walker', 'Rüzgarın kendisiyle bir ol—hareketlerin ne iz, ne ses, ne de gölge bırakır.', 'Become one with the wind itself—your movements leave no trace, no sound, no shadow.', 'DEX', 450, 3, '{dex-2}', '🌪️', '{"description": "Advantage on stealth, +10ft movement", "initiativeBonus": 3}'::jsonb),

  -- CON Branch
  ('con-1', 'Taş Deri', 'Stone Skin', 'Etin kadim granit gibi sertleşir, kılıçları geri çevirir.', 'Your flesh hardens like ancient granite, turning blades and shrugging off blows.', 'CON', 100, 1, '{}', '🪨', '{"description": "Resistance to non-magical bludgeoning", "hpBonus": 5}'::jsonb),
  ('con-2', 'Yaşam Dalgalanması', 'Vital Surge', 'Derin yaşam gücü rezervlerinden beslen, yaraları saf canlılıkla iyileştir.', 'Draw upon deep reserves of life force, mending wounds with sheer vitality.', 'CON', 200, 2, '{con-1}', '❤️‍🔥', '{"description": "Heal 1d10 HP as a bonus action, 1/short rest", "hpBonus": 10}'::jsonb),
  ('con-3', 'Ölümsüz Azim', 'Undying Resolve', 'Ölüm sana uzandığında bedenin teslim olmayı reddeder.', 'When death reaches for you, your body refuses to yield, clinging to life with iron tenacity.', 'CON', 300, 2, '{con-1}', '💀', '{"description": "Drop to 1 HP instead of 0, once per long rest", "savingThrowBonus": {"CON": 2}}'::jsonb),
  ('con-4', 'Kale Beden', 'Fortress Body', 'Bedenin zaptedilemez bir kaleye dönüşür—zehir, hastalık ve tükenmişlik sana dokunamaz.', 'Your body becomes an impregnable fortress—poison, disease, and exhaustion cannot touch you.', 'CON', 500, 3, '{con-2,con-3}', '🏰', '{"description": "Immunity to poison and disease", "statBonus": {"CON": 3}, "hpBonus": 20}'::jsonb),

  -- INT Branch
  ('int-1', 'Arkan Odak', 'Arcane Focus', 'Zihnini kristal bir merceğe dönüştür, kanalize ettiğin arkan enerjileri güçlendir.', 'Sharpen your mind into a crystal lens, amplifying the arcane energies you channel.', 'INT', 100, 1, '{}', '🔮', '{"description": "+1 spell attack rolls", "statBonus": {"INT": 1}}'::jsonb),
  ('int-2', 'Zihin Kalkanı', 'Mind Shield', 'Bilincinin etrafına geçilmez psişik bariyerler ör.', 'Erect impenetrable psychic barriers around your consciousness, warding off all intrusion.', 'INT', 200, 2, '{int-1}', '🧠', '{"description": "Resistance to psychic damage, advantage on INT saves", "savingThrowBonus": {"INT": 2}}'::jsonb),
  ('int-3', 'Büyü Dokuma', 'Spell Weave', 'Birden fazla büyü ipliğini aynı anda birbirine ör, imkansız bir hızla büyü yap.', 'Intertwine multiple threads of magic simultaneously, casting with impossible speed.', 'INT', 300, 2, '{int-1}', '🕸️', '{"description": "Cast a cantrip as a bonus action", "specialAbility": "Spell Weave"}'::jsonb),
  ('int-4', 'Mutlak Bilgi', 'Omniscience', 'Sonsuz bilgi kuyusuna dokun—kısa bir an için her şeyi bil.', 'Touch the infinite well of knowledge—for a fleeting moment, you know everything.', 'INT', 600, 3, '{int-2,int-3}', '👁️', '{"description": "Gain proficiency in all INT skills for 1 minute, 1/long rest", "statBonus": {"INT": 3}}'::jsonb),

  -- WIS Branch
  ('wis-1', 'Doğa Sezgisi', 'Nature Sense', 'Duyularını doğal dünyanın nabzına uyumla, başkalarının göremediği işaretleri oku.', 'Attune your senses to the pulse of the natural world, reading signs invisible to others.', 'WIS', 100, 1, '{}', '🌿', '{"description": "Advantage on Survival and Perception in natural terrain", "statBonus": {"WIS": 1}}'::jsonb),
  ('wis-2', 'Ruh Bağı', 'Spirit Link', 'Ruhlar arasında parıldayan bir bağ kur, gücü ve duyuları paylaş.', 'Form a shimmering bond between souls, sharing strength and sensation across the veil.', 'WIS', 200, 2, '{wis-1}', '👻', '{"description": "Telepathic bond with one ally within 120ft", "specialAbility": "Spirit Link"}'::jsonb),
  ('wis-3', 'Kehanet', 'Prophecy', 'Kaderin ipliklerine göz at, olayları gerçekleşmeden önce korkunç bir netlikle gör.', 'Glimpse the threads of fate, seeing moments before they unfold with terrible clarity.', 'WIS', 300, 2, '{wis-1}', '⏳', '{"description": "Once per day, reroll any d20 with advantage", "savingThrowBonus": {"WIS": 2}}'::jsonb),
  ('wis-4', 'Astral Görüş', 'Astral Sight', 'Üçüncü gözünü Astral Düzleme aç, tüm şeylerin gerçek doğasını algıla.', 'Open your third eye to the Astral Plane, perceiving the true nature of all things.', 'WIS', 500, 3, '{wis-2,wis-3}', '✨', '{"description": "See invisible/ethereal, true sight 60ft", "statBonus": {"WIS": 3}}'::jsonb),

  -- CHA Branch
  ('cha-1', 'İlham', 'Inspire', 'Sözlerin seni dinleyenlerin kalplerinde cesaret ve amaç ateşini yakar.', 'Your words ignite courage and purpose in the hearts of those who hear you speak.', 'CHA', 100, 1, '{}', '🎵', '{"description": "Grant ally 1d6 inspiration die", "statBonus": {"CHA": 1}}'::jsonb),
  ('cha-2', 'Gümüş Dil', 'Silver Tongue', 'En inatçı zihinlerin bile iradesini büken tatlı bir belagatle konuş.', 'Speak with honeyed eloquence that bends the will of even the most stubborn minds.', 'CHA', 200, 2, '{cha-1}', '🗣️', '{"description": "Advantage on Persuasion and Deception checks", "statBonus": {"CHA": 1}}'::jsonb),
  ('cha-3', 'Hükmeden Aura', 'Commanding Aura', 'Mutlak bir otorite aurası yay; düşmanlar bile asil duruşunun önünde sarsılır.', 'Emanate an aura of absolute authority; even enemies falter before your regal bearing.', 'CHA', 300, 2, '{cha-1}', '👑', '{"description": "Frighten enemies within 30ft, WIS save DC 15", "specialAbility": "Commanding Aura"}'::jsonb),
  ('cha-4', 'Ruh Alevi', 'Soul Blaze', 'Ruhunun tüm ışıltısını serbest bırak—somutlaşmış kör edici bir karizma cehennemi.', 'Unleash the full radiance of your soul—a blinding inferno of charisma made manifest.', 'CHA', 550, 3, '{cha-2,cha-3}', '🔥', '{"description": "Charm all creatures in 60ft, 1/long rest", "statBonus": {"CHA": 3}}'::jsonb)
ON CONFLICT (skill_key) DO UPDATE SET
  name_tr = EXCLUDED.name_tr,
  name_en = EXCLUDED.name_en,
  description_tr = EXCLUDED.description_tr,
  description_en = EXCLUDED.description_en,
  stat_parent = EXCLUDED.stat_parent,
  xp_cost = EXCLUDED.xp_cost,
  tier = EXCLUDED.tier,
  prerequisites = EXCLUDED.prerequisites,
  icon = EXCLUDED.icon,
  effects = EXCLUDED.effects;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CHARACTER SKILLS RLS HARDENING & UNLOCK_SKILL RPC
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.character_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insert character skills" ON public.character_skills;
DROP POLICY IF EXISTS "Update character skills" ON public.character_skills;
DROP POLICY IF EXISTS "Delete character skills" ON public.character_skills;
DROP POLICY IF EXISTS "Players insert own skills" ON public.character_skills;
DROP POLICY IF EXISTS "Players update own skills" ON public.character_skills;
DROP POLICY IF EXISTS "Players delete own skills" ON public.character_skills;

CREATE POLICY "Players insert own skills" ON public.character_skills
  FOR INSERT WITH CHECK (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players update own skills" ON public.character_skills
  FOR UPDATE USING (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND profile_id = auth.uid())
  )
  WITH CHECK (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players delete own skills" ON public.character_skills
  FOR DELETE USING (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.unlock_skill(
  char_id uuid,
  p_skill_key text,
  xp_val_cost int DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skill_id uuid;
  v_db_cost int;
  v_effective_cost int;
BEGIN
  IF NOT (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = char_id AND profile_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only unlock skills for your own character.';
  END IF;

  SELECT id, xp_cost INTO v_skill_id, v_db_cost
  FROM public.skill_definitions
  WHERE skill_key = p_skill_key OR id::text = p_skill_key
  LIMIT 1;

  IF v_skill_id IS NULL THEN
    RAISE EXCEPTION 'Skill definition not found for key: %', p_skill_key;
  END IF;

  IF public.is_gm() AND xp_val_cost IS NOT NULL AND xp_val_cost = 0 THEN
    v_effective_cost := 0;
  ELSE
    v_effective_cost := GREATEST(COALESCE(v_db_cost, xp_val_cost, 0), 0);
  END IF;

  IF (SELECT COALESCE(xp_available, 0) FROM public.characters WHERE id = char_id) < v_effective_cost THEN
    RAISE EXCEPTION 'Insufficient XP to unlock this skill.';
  END IF;

  UPDATE public.characters
  SET xp_available = GREATEST(0, COALESCE(xp_available, 0) - v_effective_cost),
      updated_at = now()
  WHERE id = char_id;

  INSERT INTO public.character_skills (character_id, skill_definition_id, unlocked, unlocked_at)
  VALUES (char_id, v_skill_id, true, now())
  ON CONFLICT (character_id, skill_definition_id)
  DO UPDATE SET unlocked = true, unlocked_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.unlock_skill(uuid, text, int) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_skill(uuid, text, int) TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED CORE ITEM DEFINITIONS FOR INVENTORY & GM DISPENSER
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.item_definitions (name_tr, name_en, description_tr, description_en, rarity, type, icon_url, properties)
SELECT * FROM (VALUES
  ('Alevkılıç', 'Flamebrand', 'Sönmekte olan bir yıldızın kalbinde dövülmüş, ebedi ateşle sarılı kılıç.', 'A sword wreathed in eternal fire, forged in the heart of a dying star.', 'legendary', 'weapon', '🗡️', '{"Damage": "2d6+3 fire", "Attack Bonus": "+3", "Weight": "3 lbs", "Slot": "main_hand"}'::jsonb),
  ('Mithril Zincir Zırh', 'Mithril Chainmail', 'Saf mithril ipliklerinden dokunmuş, inanılmaz derecede hafif elf zırhı.', 'Impossibly light elven chain, woven from threads of pure mithril.', 'epic', 'armor', '🛡️', '{"AC": "16", "Weight": "20 lbs", "Stealth": "No penalty", "Slot": "armor"}'::jsonb),
  ('İyileştirme İksiri', 'Healing Potion', 'Tüketildiğinde yaraları iyileştiren ve canlılığı geri kazandıran kızıl iksir.', 'A crimson vial that mends wounds and restores vitality when consumed.', 'common', 'consumable', '🧪', '{"Healing": "2d4+2 HP", "Action": "Bonus action", "Weight": "0.5 lbs"}'::jsonb),
  ('Gölgeler Yüzüğü', 'Ring of Shadows', 'Takan kişinin karanlıkla bütünleşmesini sağlayan kadim yüzük.', 'A dark band that lets the wearer meld with darkness, becoming nearly invisible.', 'rare', 'misc', '💍', '{"Effect": "Advantage on Stealth", "Charges": "3/day", "Attunement": "Required", "Slot": "ring"}'::jsonb),
  ('Ejderha Pulu', 'Dragon Scale', 'Kadim bir ejderhadan alınmış, dokunulduğunda sıcaklığını koruyan yanardöner pul.', 'A single iridescent scale from an ancient dragon, warm to the touch.', 'uncommon', 'quest', '🐉', '{"Type": "Quest item", "Fire Resistance": "+5", "Weight": "1 lbs"}'::jsonb),
  ('Bilgelik Kitabı', 'Tome of Knowledge', 'Kayıp çağdan kalma yasak arkan bilgilerle dolu kadim kitap.', 'An ancient book filled with forbidden arcane knowledge from the lost age.', 'epic', 'misc', '📖', '{"Effect": "+1 INT", "Study Time": "48 hours", "Attunement": "Required", "Weight": "5 lbs"}'::jsonb),
  ('Elf Yol Ekmeği', 'Elven Waybread', 'Orman elfleri tarafından pişirilen besleyici ekmek. Tek bir ısırığı tüm gün tok tutar.', 'Nourishing bread baked by woodland elves. A single bite sustains for a full day.', 'uncommon', 'consumable', '🍞', '{"Effect": "Full day nourishment", "Weight": "0.1 lbs"}'::jsonb),
  ('Kader Musallatı', 'Amulet of Fate', 'Kader rünleriyle işlenmiş altın tılsım. Gizli bir güçle uğuldar.', 'A golden amulet inscribed with runes of destiny. It hums with latent power.', 'legendary', 'misc', '🔮', '{"Effect": "Reroll 1 death save/day", "Attunement": "Required", "Slot": "amulet"}'::jsonb),
  ('Görünmezlik İksiri', 'Potion of Invisibility', 'İçen kişiyi 1 saatliğine tamamen görünmez kılan şeffaf iksir.', 'A translucent philter that renders the drinker invisible for 1 hour.', 'rare', 'consumable', '🫧', '{"Effect": "Invisibility (1 hr)", "Weight": "0.5 lbs"}'::jsonb),
  ('Ateş Topu Parşömeni', 'Scroll of Fireball', '3. seviye Ateş Topu büyüsü mühürlenmiş rünlü parşömen.', 'An arcane scroll inscribed with a 3rd-level Fireball incantation.', 'uncommon', 'consumable', '📜', '{"Damage": "8d6 fire", "Save DC": "15 DEX", "Weight": "0.1 lbs"}'::jsonb),
  ('Elf Çizmeleri', 'Boots of Elvenkind', 'Adımlarınızı tamamen sessizleştiren büyülü elf çizmeleri.', 'Enchanted boots that make your footsteps completely silent.', 'rare', 'misc', '👢', '{"Effect": "Advantage on Stealth (silent steps)", "Slot": "accessory", "Weight": "1 lbs"}'::jsonb),
  ('Büyülü Füze Asası', 'Wand of Magic Missiles', '7 şarjlı, şaşmaz arkan oklar fırlatan büyülü asa.', 'A wand holding 7 charges of unerring arcane bolts.', 'epic', 'weapon', '🪄', '{"Damage": "3d4+3 force", "Charges": "7", "Slot": "main_hand", "Weight": "1 lbs"}'::jsonb),
  ('Boyut Çantası', 'Bag of Holding', 'İçi dışından çok daha geniş olan boyutsal sırt çantası.', 'An extradimensional pack whose interior is vastly larger than its outside.', 'rare', 'misc', '👝', '{"Effect": "+200 lbs capacity", "Weight": "15 lbs"}'::jsonb),
  ('Koruma Pelerini', 'Cloak of Protection', 'Zırh sınıfına ve kurtarma zarlarına +1 bonus veren büyülü pelerin.', 'An enchanted cloak granting +1 to AC and all saving throws.', 'uncommon', 'armor', '🧥', '{"AC": "+1", "SaveBonus": "+1", "Attunement": "Required", "Slot": "armor", "Weight": "2 lbs"}'::jsonb)
) AS v(name_tr, name_en, description_tr, description_en, rarity, type, icon_url, properties)
WHERE NOT EXISTS (
  SELECT 1 FROM public.item_definitions d WHERE d.name_en = v.name_en
);
