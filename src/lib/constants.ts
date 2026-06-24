// ============================================================
// D&D Homebrew Database — All Races, Classes & Subclasses
// Source: dnd_homebrew_database_v2.md
// ============================================================

import type { RaceTier, RaceDefinition, ClassCategory, SubclassDefinition, RaceTierKey } from './types';

// ---- RACE TIERS ----

export const RACE_TIERS: Omit<RaceTier, 'id'>[] = [
  { key: 'humanoid', name_tr: 'İnsansı Irklar', name_en: 'Humanoids', sort_order: 1 },
  { key: 'demi_humanoid', name_tr: 'Yarı-İnsansı Irklar', name_en: 'Demi-Humanoids', sort_order: 2 },
  { key: 'heteromorphic', name_tr: 'Heteromorfik Irklar', name_en: 'Heteromorphic', sort_order: 3 },
];

// ---- RACE DEFINITIONS ----

type RaceSeed = Omit<RaceDefinition, 'id' | 'tier_id' | 'tier'> & { tier_key: RaceTierKey };

export const RACES: RaceSeed[] = [
  // === HUMANOIDS ===
  { tier_key: 'humanoid', key: 'human', name: 'Human', description_tr: 'Standart özelliklere sahip temel ırk.', description_en: 'Basic race with standard characteristics and high learning capacity.', icon_url: null, stat_bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
  { tier_key: 'humanoid', key: 'elf', name: 'Elf', description_tr: 'Uzun ömürlü, doğa ile uyumlu; büyü ve okçuluk uzmanı.', description_en: 'Long-lived, harmonious with nature; specializing in magic and archery.', icon_url: null, stat_bonuses: { DEX: 2, INT: 1, WIS: 1 } },
  { tier_key: 'humanoid', key: 'dark_elf', name: 'Dark Elf', description_tr: 'Derin ormanlarda yaşayan, koyu tenli Elf alt türü.', description_en: 'Dark-skinned Elf sub-race living in the deep forests with distinct culture.', icon_url: null, stat_bonuses: { DEX: 2, CHA: 1, WIS: 1 } },
  { tier_key: 'humanoid', key: 'dwarf', name: 'Dwarf', description_tr: 'Kısa boylu, dayanıklı; madencilik, demircilik ve rün uzmanı.', description_en: 'Short, durable; superior skills in mining, blacksmithing, and runecraft.', icon_url: null, stat_bonuses: { CON: 2, STR: 1, WIS: 1 } },
  // === DEMI-HUMANOIDS ===
  { tier_key: 'demi_humanoid', key: 'goblin', name: 'Goblin', description_tr: 'Küçük yapılı, sürü halinde hareket eden düşük seviyeli yeşil tenli savaşçılar.', description_en: 'Small, green-skinned low-level warriors that move in packs.', icon_url: null, stat_bonuses: { DEX: 2, CON: -1 } },
  { tier_key: 'demi_humanoid', key: 'birdman', name: 'Birdman', description_tr: 'İnsan gövdeli, kanatlı ve kuş özellikli; hava savaşı avantajlı.', description_en: 'Human-like torso with wings and avian features; advantaged in aerial combat.', icon_url: null, stat_bonuses: { DEX: 2, WIS: 1 } },
  { tier_key: 'demi_humanoid', key: 'ogre', name: 'Ogre', description_tr: 'İri cüsseli, yüksek fiziksel güce sahip, düşük zekalı devasa insansılar.', description_en: 'Huge stature, high physical strength, usually low intelligence.', icon_url: null, stat_bonuses: { STR: 3, CON: 2, INT: -2 } },
  { tier_key: 'demi_humanoid', key: 'troll', name: 'Troll', description_tr: 'Çok yüksek yenilenme yeteneğine sahip, güçlü savaşçılar.', description_en: 'Strong warriors with very high regeneration capability.', icon_url: null, stat_bonuses: { CON: 3, STR: 1 } },
  { tier_key: 'demi_humanoid', key: 'lizardman', name: 'Lizardman', description_tr: 'Pullu, kuyruklu, suda ve karada yaşayabilen savaşçı topluluk.', description_en: 'Scaly, tailed warrior society capable of living in water and land.', icon_url: null, stat_bonuses: { CON: 2, STR: 1 } },
  { tier_key: 'demi_humanoid', key: 'orc', name: 'Orc', description_tr: 'Domuz benzeri yüz hatlarına sahip, kabile yapısında fiziksel savaşçılar.', description_en: 'Pig-like facial features, tribe-structured physical warriors.', icon_url: null, stat_bonuses: { STR: 2, CON: 1, INT: -1 } },
  { tier_key: 'demi_humanoid', key: 'quagoa', name: 'Quagoa', description_tr: 'Metal yiyerek postlarını güçlendiren, yeraltı köstebek türü.', description_en: 'Underground mole-like species that strengthen hide by eating metal.', icon_url: null, stat_bonuses: { CON: 2, STR: 1 } },
  { tier_key: 'demi_humanoid', key: 'lionese', name: 'Lionese', description_tr: 'Aslan özelliklerine sahip, gururlu ve fiziksel olarak üstün yırtıcılar.', description_en: 'Lion features, proud and physically superior apex demi-humans.', icon_url: null, stat_bonuses: { STR: 2, CHA: 1, DEX: 1 } },
  { tier_key: 'demi_humanoid', key: 'minotaur', name: 'Minotaur', description_tr: 'Boğa başlı, devasa kas kütleli labirent savaşçıları.', description_en: 'Bull-headed, massive muscle mass, labyrinth warriors.', icon_url: null, stat_bonuses: { STR: 3, CON: 1 } },
  { tier_key: 'demi_humanoid', key: 'centaur', name: 'Centaur', description_tr: 'Üstü insan, altı at olan hızlı ve dayanıklı bozkır savaşçıları.', description_en: 'Human upper body, horse lower body; fast steppe warriors.', icon_url: null, stat_bonuses: { STR: 1, DEX: 1, CON: 1 } },
  { tier_key: 'demi_humanoid', key: 'naga', name: 'Naga', description_tr: 'Üstü insan, altı yılan olan zehirli veya büyüsel tür.', description_en: 'Human upper body, snake lower body; poisonous or magical.', icon_url: null, stat_bonuses: { INT: 2, WIS: 1 } },
  { tier_key: 'demi_humanoid', key: 'boggard', name: 'Boggard', description_tr: 'Bataklıklarda yaşayan, kurbağa benzeri topluluk.', description_en: 'Swamp-dwelling, frog-like demi-human community.', icon_url: null, stat_bonuses: { CON: 2, DEX: 1 } },
  { tier_key: 'demi_humanoid', key: 'satyr', name: 'Satyr', description_tr: 'Üstü insan, altı keçi olan çevik ve müziğe yatkın tür.', description_en: 'Human upper body, goat legs; agile and music-inclined.', icon_url: null, stat_bonuses: { CHA: 2, DEX: 1 } },
  { tier_key: 'demi_humanoid', key: 'gnoll', name: 'Gnoll', description_tr: 'Sırtlan kafalı, vahşi doğaya sahip, grup halinde avlayan savaşçılar.', description_en: 'Hyena-headed, wild nature, pack hunters.', icon_url: null, stat_bonuses: { STR: 2, DEX: 1 } },
  { tier_key: 'demi_humanoid', key: 'rabbitman', name: 'Rabbitman', description_tr: 'Tavşan kulaklı, gelişmiş duyulara sahip çevik tür.', description_en: 'Rabbit ears, enhanced senses, highly agile species.', icon_url: null, stat_bonuses: { DEX: 3, WIS: 1 } },
  { tier_key: 'demi_humanoid', key: 'snakeman', name: 'Snakeman', description_tr: 'Yılan pullu, çatallı dilli; suikast ve gizlilik uzmanı.', description_en: 'Snake scales, forked tongue; assassination and stealth specialist.', icon_url: null, stat_bonuses: { DEX: 2, INT: 1 } },
  // === HETEROMORPHIC ===
  { tier_key: 'heteromorphic', key: 'skeleton', name: 'Skeleton', description_tr: 'Büyüsel enerjiyle hareket eden temel kemik ölümsüzü.', description_en: 'Basic undead skeleton animated by magical energy.', icon_url: null, stat_bonuses: { CON: 2 } },
  { tier_key: 'heteromorphic', key: 'vampire', name: 'Vampire', description_tr: 'Kanla beslenen, yüksek güç ve hız sahibi ölümsüz.', description_en: 'Blood-feeding undead with high strength, speed, and mind control.', icon_url: null, stat_bonuses: { STR: 2, CHA: 2, DEX: 1 } },
  { tier_key: 'heteromorphic', key: 'zombie', name: 'Zombie', description_tr: 'Çürümüş bedenli, acı hissetmeyen ölümsüz varlık.', description_en: 'Rotten-bodied, painless undead entities.', icon_url: null, stat_bonuses: { CON: 3, INT: -2 } },
  { tier_key: 'heteromorphic', key: 'wraith', name: 'Wraith', description_tr: 'Fiziksel bedeni olmayan, yaşam enerjisi emen hayalet.', description_en: 'Incorporeal ghost draining life energy.', icon_url: null, stat_bonuses: { INT: 2, WIS: 1 } },
  { tier_key: 'heteromorphic', key: 'ghost', name: 'Ghost', description_tr: 'Görünmez olabilen ruhani varlık.', description_en: 'Spiritual entity that can turn invisible.', icon_url: null, stat_bonuses: { WIS: 2, CHA: 1 } },
  { tier_key: 'heteromorphic', key: 'dullahan', name: 'Dullahan', description_tr: 'Kafasını kolunun altında taşıyan ölümsüz.', description_en: 'Headless undead carrying its head under its arm.', icon_url: null, stat_bonuses: { STR: 2, CON: 1 } },
  { tier_key: 'heteromorphic', key: 'imp', name: 'Imp', description_tr: 'Küçük, kanatlı ve kurnaz düşük seviyeli iblis.', description_en: 'Small, winged, and cunning low-level demon.', icon_url: null, stat_bonuses: { DEX: 2, INT: 1 } },
  { tier_key: 'heteromorphic', key: 'succubus_incubus', name: 'Succubus / Incubus', description_tr: 'Baştan çıkarma ve enerji emme yetenekli iblis.', description_en: 'Demons with seduction and energy draining abilities.', icon_url: null, stat_bonuses: { CHA: 3, INT: 1 } },
  { tier_key: 'heteromorphic', key: 'shadow_demon', name: 'Shadow Demon', description_tr: 'Gölgelerde saklanan karanlık varlık.', description_en: 'Dark entity hiding in shadows.', icon_url: null, stat_bonuses: { DEX: 2, INT: 1 } },
  { tier_key: 'heteromorphic', key: 'moloch', name: 'Moloch', description_tr: 'Boğa boynuzlu, yıkım ve ateş uzmanı iblis.', description_en: 'Bull-horned demon of destruction and hellfire.', icon_url: null, stat_bonuses: { STR: 3, CON: 1 } },
  { tier_key: 'heteromorphic', key: 'angel', name: 'Angel', description_tr: 'Kutsal enerjili, kanatlı ilahi varlık.', description_en: 'Winged entity of holy energy and divine justice.', icon_url: null, stat_bonuses: { WIS: 2, CHA: 2 } },
  { tier_key: 'heteromorphic', key: 'insectoid', name: 'Insectoid', description_tr: 'Kitin tabakalı böcek formları.', description_en: 'Insect-form races covered in chitin layers.', icon_url: null, stat_bonuses: { CON: 2, DEX: 1 } },
  { tier_key: 'heteromorphic', key: 'arachnoid', name: 'Arachnoid', description_tr: 'Örümcek özellikli, ağ örebilen tür.', description_en: 'Spider features; web-weaving and venomous.', icon_url: null, stat_bonuses: { DEX: 2, INT: 1 } },
  { tier_key: 'heteromorphic', key: 'parasite', name: 'Parasite', description_tr: 'Başka bedene yerleşip kontrol eden canlı.', description_en: 'Organism infesting another body to control it.', icon_url: null, stat_bonuses: { INT: 2, WIS: 1 } },
  { tier_key: 'heteromorphic', key: 'slime', name: 'Slime', description_tr: 'Formsuz, asitli amorf varlık.', description_en: 'Formless acidic amorphous entity.', icon_url: null, stat_bonuses: { CON: 3 } },
  { tier_key: 'heteromorphic', key: 'shoggoth', name: 'Shoggoth', description_tr: 'Çok gözlü ve ağızlı form değiştiren kütle.', description_en: 'Terrifying amorphous mass with eyes and mouths.', icon_url: null, stat_bonuses: { CON: 2, STR: 2 } },
  { tier_key: 'heteromorphic', key: 'dragonoid', name: 'Dragonoid', description_tr: 'Ejderha kanlı, insansı formlu tür.', description_en: 'Dragon blood close to humanoid form.', icon_url: null, stat_bonuses: { STR: 2, CON: 1, CHA: 1 } },
  { tier_key: 'heteromorphic', key: 'evil_tree', name: 'Evil Tree', description_tr: 'Kötücül iradeli devasa bitki canavarı.', description_en: 'Colossal plant monster with malicious will.', icon_url: null, stat_bonuses: { CON: 3, STR: 1 } },
  { tier_key: 'heteromorphic', key: 'doppelganger', name: 'Doppelgänger', description_tr: 'Başka varlıkların görünüşünü kopyalayan şekil değiştirici.', description_en: 'Shape-shifter copying appearances and abilities.', icon_url: null, stat_bonuses: { CHA: 2, DEX: 1, INT: 1 } },
  { tier_key: 'heteromorphic', key: 'automaton', name: 'Automaton', description_tr: 'Mekanik veya büyüsel enerjiyle çalışan robotik varlık.', description_en: 'Robotic entity powered by magic or mechanics.', icon_url: null, stat_bonuses: { CON: 2, STR: 2, CHA: -2 } },
  { tier_key: 'heteromorphic', key: 'brain_eater', name: 'Brain Eater', description_tr: 'Kurbanların beyinlerini yiyerek enerji emen tür.', description_en: 'Species eating victims\' brains for info and energy.', icon_url: null, stat_bonuses: { INT: 3, WIS: 1 } },
  { tier_key: 'heteromorphic', key: 'mind_flayer', name: 'Mind Flayer', description_tr: 'Dokunaçlı yüzlü, psiyonik güçlerle zihin kontrolü yapan varlık.', description_en: 'Tentacle-faced being with psionic mind control.', icon_url: null, stat_bonuses: { INT: 3, CHA: 1 } },
  { tier_key: 'heteromorphic', key: 'beholder', name: 'Beholder', description_tr: 'Tek büyük gözlü ve çok sayıda göz saplı yaratık.', description_en: 'Creature with one large central eye and multiple eye stalks.', icon_url: null, stat_bonuses: { INT: 2, WIS: 2 } },
  { tier_key: 'heteromorphic', key: 'fairy', name: 'Fairy', description_tr: 'Küçük yapılı, kanatlı doğa büyüsü uzmanı.', description_en: 'Small-statured winged nature magic specialist.', icon_url: null, stat_bonuses: { WIS: 2, DEX: 1, CHA: 1 } },
  { tier_key: 'heteromorphic', key: 'nymph', name: 'Nymph', description_tr: 'Doğa ile özdeşleşmiş güzel ruhlar.', description_en: 'Nature spirits known for extreme beauty.', icon_url: null, stat_bonuses: { CHA: 3, WIS: 1 } },
  { tier_key: 'heteromorphic', key: 'dryad', name: 'Dryad', description_tr: 'Belirli bir ağaca bağlı yaşayan orman ruhu.', description_en: 'Forest spirit bound to a specific tree.', icon_url: null, stat_bonuses: { WIS: 2, CON: 1 } },
  { tier_key: 'heteromorphic', key: 'werewolf', name: 'Werewolf', description_tr: 'İnsandan kurda dönüşebilen güçlü tür.', description_en: 'Species that can transform from human to wolf.', icon_url: null, stat_bonuses: { STR: 2, DEX: 1, CON: 1 } },
  { tier_key: 'heteromorphic', key: 'lamia', name: 'Lamia', description_tr: 'Yılan kuyruklu, kurbanları büyüleyen avcı.', description_en: 'Snake tail, hunts by charming victims.', icon_url: null, stat_bonuses: { CHA: 2, DEX: 1 } },
  { tier_key: 'heteromorphic', key: 'medusa', name: 'Medusa', description_tr: 'Yılan saçlı, bakışlarıyla taşa çeviren varlık.', description_en: 'Entity with snake hair, turns beings to stone.', icon_url: null, stat_bonuses: { CHA: 2, INT: 1 } },
  { tier_key: 'heteromorphic', key: 'gorgon', name: 'Gorgon', description_tr: 'Taş zırhlı, uçabilen yaratık.', description_en: 'Flying creature with stone-like armor.', icon_url: null, stat_bonuses: { CON: 2, STR: 1 } },
  { tier_key: 'heteromorphic', key: 'giant', name: 'Giant', description_tr: 'Devasa boyutlu kaba kuvvetli dev ırkı.', description_en: 'Colossal-sized giant race with brute force.', icon_url: null, stat_bonuses: { STR: 3, CON: 2, DEX: -2 } },
  { tier_key: 'heteromorphic', key: 'golem', name: 'Golem', description_tr: 'Cansız maddelerden yapılmış yapay varlık.', description_en: 'Artificial entity made from inanimate matter.', icon_url: null, stat_bonuses: { CON: 3, STR: 1 } },
  { tier_key: 'heteromorphic', key: 'living_armor', name: 'Living Armor', description_tr: 'İçinde beden olmadan hareket eden büyüsel zırh.', description_en: 'Magical armor moving without a body inside.', icon_url: null, stat_bonuses: { CON: 3, STR: 1, CHA: -2 } },
  { tier_key: 'heteromorphic', key: 'alien', name: 'Alien', description_tr: 'Kozmik veya farklı boyutlardan gelen yabancı tür.', description_en: 'Foreign species from cosmic or different dimensions.', icon_url: null, stat_bonuses: { INT: 2, WIS: 1 } },
  { tier_key: 'heteromorphic', key: 'deep_one', name: 'Deep One', description_tr: 'Okyanus derinliklerinde yaşayan karanlık deniz halkı.', description_en: 'Dark sea folk living in ocean depths.', icon_url: null, stat_bonuses: { CON: 2, STR: 1 } },
  { tier_key: 'heteromorphic', key: 'half_elemental', name: 'Half-Elemental', description_tr: 'Bir ebeveyni elementel olan melez tür.', description_en: 'Hybrid with one elemental parent.', icon_url: null, stat_bonuses: { INT: 1, CON: 1, WIS: 1 } },
  { tier_key: 'heteromorphic', key: 'elemental', name: 'Elemental', description_tr: 'Saf elementel enerjiden oluşan varlık.', description_en: 'Being of pure elemental energy.', icon_url: null, stat_bonuses: { INT: 2, CON: 2 } },
];

// ---- CLASS CATEGORIES ----

export const CLASS_CATEGORIES: Omit<ClassCategory, 'id'>[] = [
  { key: 'mage', name_tr: 'Büyücü', name_en: 'Mage', icon_url: null, sort_order: 1 },
  { key: 'warrior', name_tr: 'Savaşçı', name_en: 'Warrior', icon_url: null, sort_order: 2 },
  { key: 'tank', name_tr: 'Tank', name_en: 'Tank', icon_url: null, sort_order: 3 },
  { key: 'neutral', name_tr: 'Tarafsız', name_en: 'Neutral', icon_url: null, sort_order: 4 },
  { key: 'assassin', name_tr: 'Suikastçı', name_en: 'Assassin', icon_url: null, sort_order: 5 },
  { key: 'marksman', name_tr: 'Nişancı', name_en: 'Marksman', icon_url: null, sort_order: 6 },
  { key: 'crafting', name_tr: 'Üretim', name_en: 'Crafting', icon_url: null, sort_order: 7 },
  { key: 'summoner', name_tr: 'Çağırıcı', name_en: 'Summoner', icon_url: null, sort_order: 8 },
];

// ---- SUBCLASS DEFINITIONS ----

type SubclassSeed = Omit<SubclassDefinition, 'id' | 'category_id' | 'category'> & { category_key: string };

export const SUBCLASSES: SubclassSeed[] = [
  // MAGE
  { category_key: 'mage', key: 'druid', name_tr: 'Druid', name_en: 'Druid', ability_name_tr: 'Doğanın Nefesi', ability_name_en: 'Breath of Nature', ability_desc_tr: 'Çevreni tamamen ormana çevirir.', ability_desc_en: 'Turns your surroundings into a forest.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, INT: 1 } },
  { category_key: 'mage', key: 'dark_mage', name_tr: 'Kara Büyücü', name_en: 'Dark Mage', ability_name_tr: 'Gölge Beslemesi', ability_name_en: 'Shadow Nourishment', ability_desc_tr: 'Rakibe kalıcı lanet yerleştirebilirsin.', ability_desc_en: 'Place a permanent curse on opponent.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 2, CHA: 1 } },
  { category_key: 'mage', key: 'elementalist_mage', name_tr: 'Elementalist', name_en: 'Elementalist', ability_name_tr: 'Element Çağrısı', ability_name_en: 'Elemental Summon', ability_desc_tr: 'Kendi seviyenizde bir elemental çağırır.', ability_desc_en: 'Summons an elemental at your level.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 2, WIS: 1 } },
  { category_key: 'mage', key: 'psychomage', name_tr: 'Psikomag', name_en: 'Psychomage', ability_name_tr: 'Bipolar', ability_name_en: 'Bipolar', ability_desc_tr: 'Zihni etkileyen büyülere karşı farkındalık.', ability_desc_en: 'Awareness against mind-affecting spells.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, INT: 1 } },
  { category_key: 'mage', key: 'blood_mage', name_tr: 'Kan Büyücüsü', name_en: 'Blood Mage', ability_name_tr: 'Büyülü Kan', ability_name_en: 'Magical Blood', ability_desc_tr: 'Can çeker.', ability_desc_en: 'Drains life / HP steal.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 1, CON: 2 } },
  { category_key: 'mage', key: 'mana_mage', name_tr: 'Mana Büyücüsü', name_en: 'Mana Mage', ability_name_tr: 'Mana Sentezi', ability_name_en: 'Mana Synthesis', ability_desc_tr: 'Rakibin büyüsünün %50\'sini yutabilirsin.', ability_desc_en: 'Absorb 50% of opponent\'s spell.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 3 } },
  { category_key: 'mage', key: 'priest', name_tr: 'Rahip', name_en: 'Priest', ability_name_tr: 'Kutsal Zırh', ability_name_en: 'Holy Armor', ability_desc_tr: 'Lanet durumlarına karşı tam direnç.', ability_desc_en: 'Full resistance to curses.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, CHA: 1 } },
  { category_key: 'mage', key: 'warlock', name_tr: 'Warlock', name_en: 'Warlock', ability_name_tr: 'Patronun Kırıntısı', ability_name_en: 'Patron\'s Crumb', ability_desc_tr: 'Patronun gücünü çağırıp 3 tur kullanma.', ability_desc_en: 'Summon patron\'s power for 3 turns.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CHA: 2, INT: 1 } },
  { category_key: 'mage', key: 'shaman', name_tr: 'Şaman', name_en: 'Shaman', ability_name_tr: 'Totem Dövmesi', ability_name_en: 'Totem Tattoo', ability_desc_tr: 'Öldürülen canavarın bir ırksal avantajını kalıcı al.', ability_desc_en: 'Permanently acquire a racial advantage from killed monster.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, CON: 1 } },
  { category_key: 'mage', key: 'oracle_mage', name_tr: 'Kahin', name_en: 'Oracle', ability_name_tr: 'Kaderle Oynamak', ability_name_en: 'Playing with Fate', ability_desc_tr: '1 gün gelecekten parçalar görebilirsin.', ability_desc_en: 'See fragments of the future for 1 day.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 3 } },
  // WARRIOR
  { category_key: 'warrior', key: 'executioner', name_tr: 'İnfazcı', name_en: 'Executioner', ability_name_tr: 'Keskin Darbe', ability_name_en: 'Sharp Strike', ability_desc_tr: '%50 ihtimalle canı %20 altındaki rakibi infaz eder.', ability_desc_en: 'Executes opponent below 20% HP with 50% chance.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, DEX: 1 } },
  { category_key: 'warrior', key: 'drunken_master', name_tr: 'Drunken Master', name_en: 'Drunken Master', ability_name_tr: 'Sersem Rakip', ability_name_en: 'Stunned Opponent', ability_desc_tr: 'Sarhoş iken rakiplerin hamlelerini %20 yönlendirme.', ability_desc_en: '20% chance to redirect opponents\' moves while drunk.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CON: 2, DEX: 1 } },
  { category_key: 'warrior', key: 'berserker', name_tr: 'Berserker', name_en: 'Berserker', ability_name_tr: 'Öfke Patlaması', ability_name_en: 'Burst of Rage', ability_desc_tr: 'Gücü artırır, canı azaltır.', ability_desc_en: 'Increases power, decreases HP.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 3 } },
  { category_key: 'warrior', key: 'monk', name_tr: 'Keşiş', name_en: 'Monk', ability_name_tr: 'Yüksek Seviye Patlama', ability_name_en: 'High-Level Blast', ability_desc_tr: 'Meditasyonla canı ve manayı geri kazanır.', ability_desc_en: 'Restore HP and mana through meditation.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, DEX: 1 } },
  { category_key: 'warrior', key: 'iron_fist', name_tr: 'Iron Fist', name_en: 'Iron Fist', ability_name_tr: 'Zırh Delici', ability_name_en: 'Armor Piercer', ability_desc_tr: 'Zırh ve savunmayı yok sayar, silah kullanamaz.', ability_desc_en: 'Ignores armor and defense, cannot use weapons.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, CON: 1 } },
  { category_key: 'warrior', key: 'sword_sentinel', name_tr: 'Sword Sentinel', name_en: 'Sword Sentinel', ability_name_tr: 'Uçan Kılıç', ability_name_en: 'Flying Sword', ability_desc_tr: '6 Uçan kılıç kullanabilirsin.', ability_desc_en: 'Use 6 flying swords.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 1, DEX: 1, STR: 1 } },
  { category_key: 'warrior', key: 'samurai', name_tr: 'Samuray', name_en: 'Samurai', ability_name_tr: 'Ağır Kesik', ability_name_en: 'Heavy Cut', ability_desc_tr: 'Seçilen saldırı 2X hasar verir.', ability_desc_en: 'A chosen attack deals 2X damage.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, DEX: 1 } },
  { category_key: 'warrior', key: 'aura_fighter', name_tr: 'Aura Fighter', name_en: 'Aura Fighter', ability_name_tr: 'Rakip Analizi', ability_name_en: 'Opponent Analysis', ability_desc_tr: 'Hedefin sınıfını hissedebilirsin.', ability_desc_en: 'Sense the target\'s class.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 1, STR: 1, DEX: 1 } },
  { category_key: 'warrior', key: 'elemental_swordmaster', name_tr: 'Elemental Swordmaster', name_en: 'Elemental Swordmaster', ability_name_tr: 'Elemental Uzmanlık', ability_name_en: 'Elemental Expertise', ability_desc_tr: 'Seçilen elemente göre imza hareket üret.', ability_desc_en: 'Produce signature move based on element.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 1, INT: 1, DEX: 1 } },
  { category_key: 'warrior', key: 'weapon_saint', name_tr: 'Silah Azizi', name_en: 'Weapon Saint', ability_name_tr: 'Silah Bağlılığı', ability_name_en: 'Weapon Devotion', ability_desc_tr: 'Seçilen silah üzerinde tam kontrol. Silah kırılırsa ölürsün.', ability_desc_en: 'Full control over chosen weapon. If it breaks, you die.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, WIS: 1 } },
  // TANK
  { category_key: 'tank', key: 'vanguard_guardian', name_tr: 'Öncephe Muhafızı', name_en: 'Vanguard Guardian', ability_name_tr: 'Dostu Korumak', ability_name_en: 'Protecting the Ally', ability_desc_tr: 'Dosta gelen saldırıyı üstlenir, hasarın yarısını alır.', ability_desc_en: 'Takes attack aimed at ally, receives half damage.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CON: 2, STR: 1 } },
  { category_key: 'tank', key: 'wall_guard', name_tr: 'Wall Guard', name_en: 'Wall Guard', ability_name_tr: 'Darbe Önleyici', ability_name_en: 'Impact Preventer', ability_desc_tr: 'Savunma seviyesinin %50 üstündeki darbeyi yok say.', ability_desc_en: 'Ignore hits 50% above defense level.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CON: 3 } },
  { category_key: 'tank', key: 'coreplate', name_tr: 'Coreplate', name_en: 'Coreplate', ability_name_tr: 'Savunma Alanı', ability_name_en: 'Defense Field', ability_desc_tr: 'Tüm dostlara +5 savunma.', ability_desc_en: '+5 defense to all allies.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CON: 2, CHA: 1 } },
  { category_key: 'tank', key: 'sworn_shield', name_tr: 'Yeminli Koruma', name_en: 'Sworn Shield', ability_name_tr: 'Büyü Çekici', ability_name_en: 'Spell Attractor', ability_desc_tr: 'Bir oyuncuya bağlanır, tüm büyüler korumayı vurur.', ability_desc_en: 'Binds to player; all magic hits guardian first.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CON: 2, WIS: 1 } },
  { category_key: 'tank', key: 'guardian_of_faith', name_tr: 'İnanç Muhafızı', name_en: 'Guardian of Faith', ability_name_tr: 'Kötücül Bağışıklık', ability_name_en: 'Malicious Immunity', ability_desc_tr: 'Kötücül durumlara karşı bağışık.', ability_desc_en: 'Immune to malicious conditions.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, CON: 1 } },
  { category_key: 'tank', key: 'stoneheart', name_tr: 'Stoneheart', name_en: 'Stoneheart', ability_name_tr: 'Saldırı Yansıtma', ability_name_en: 'Attack Reflection', ability_desc_tr: '%50 fazla hasar alıp saldırıyı aynalayabilir.', ability_desc_en: 'Takes 50% more damage and mirrors the attack.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { CON: 3 } },
  { category_key: 'tank', key: 'twin_ramparts', name_tr: 'İkiz Surlar', name_en: 'Twin Ramparts', ability_name_tr: 'Toprak İkiz', ability_name_en: 'Earth Twin', ability_desc_tr: '%100 istatistikli kopya yaratır.', ability_desc_en: 'Creates 100% stat clone, no abilities.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { CON: 2, STR: 1 } },
  { category_key: 'tank', key: 'life_guardian', name_tr: 'Hayat Muhafızı', name_en: 'Life Guardian', ability_name_tr: 'Darbe Emilimi', ability_name_en: 'Hit Absorption', ability_desc_tr: 'Darbeyi %30 emip HP\'ye dönüştürür.', ability_desc_en: 'Absorbs 30% of hit and converts to HP.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { CON: 2, WIS: 1 } },
  { category_key: 'tank', key: 'wrestler', name_tr: 'Güreşçi', name_en: 'Wrestler', ability_name_tr: 'Sabitleme', ability_name_en: 'Pinning', ability_desc_tr: 'Rakip 2 tur sabitlenir.', ability_desc_en: 'Opponent is pinned for 2 turns.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, CON: 1 } },
  // NEUTRAL
  { category_key: 'neutral', key: 'commander', name_tr: 'Kumandan', name_en: 'Commander', ability_name_tr: 'Ekstra Eylem', ability_name_en: 'Extra Action', ability_desc_tr: '1 oyuncuya ekstra eylem hakkı verir.', ability_desc_en: 'Gives 1 player an extra action.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CHA: 2, WIS: 1 } },
  { category_key: 'neutral', key: 'gambler', name_tr: 'Gambler', name_en: 'Gambler', ability_name_tr: 'Şanslı Zar', ability_name_en: 'Lucky Dice', ability_desc_tr: 'Saldırı dışında zarlara +2.', ability_desc_en: '+2 to non-attack dice rolls.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CHA: 2, DEX: 1 } },
  { category_key: 'neutral', key: 'merchant', name_tr: 'Tüccar', name_en: 'Merchant', ability_name_tr: 'İndirim Ustası', ability_name_en: 'Discount Master', ability_desc_tr: 'Alım satımda %25 bonus.', ability_desc_en: '25% bonus on trade prices.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CHA: 2, INT: 1 } },
  { category_key: 'neutral', key: 'curious', name_tr: 'Meraklı', name_en: 'Curious', ability_name_tr: 'Eşya Kullanımı', ability_name_en: 'Item Usage', ability_desc_tr: 'Düşük seviye ekipmanları kullanabilir.', ability_desc_en: 'Can use low-level equipment.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 1, WIS: 1, DEX: 1 } },
  { category_key: 'neutral', key: 'beast_tamer', name_tr: 'Hayvan Terbiyecisi', name_en: 'Beast Tamer', ability_name_tr: 'Vahşi Kontrol', ability_name_en: 'Wild Control', ability_desc_tr: '1 vahşi hayvanı garanti terbiye et.', ability_desc_en: 'Guaranteed tame of 1 wild animal.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, CHA: 1 } },
  { category_key: 'neutral', key: 'imposter', name_tr: 'Imposter', name_en: 'Imposter', ability_name_tr: 'Hain', ability_name_en: 'Traitor', ability_desc_tr: 'Sizi seven kişilere kritik hasar verebilirsiniz.', ability_desc_en: 'Deal critical damage to people who trust you.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { CHA: 2, DEX: 1 } },
  { category_key: 'neutral', key: 'genius', name_tr: 'Dahi', name_en: 'Genius', ability_name_tr: 'Büyü Ustası', ability_name_en: 'Magic Master', ability_desc_tr: 'Tüm sınıfların büyülerini öğrenebilir (10 limit).', ability_desc_en: 'Can learn spells from all classes (10 limit).', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 3 } },
  // ASSASSIN
  { category_key: 'assassin', key: 'darkcabe', name_tr: 'Darkcabe', name_en: 'Darkcabe', ability_name_tr: 'Sessizlik', ability_name_en: 'Silence', ability_desc_tr: 'Gece vakti bir tur tam Gizlilik.', ability_desc_en: 'Full Stealth for one turn at night.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, INT: 1 } },
  { category_key: 'assassin', key: 'venomblood', name_tr: 'Venomblood', name_en: 'Venomblood', ability_name_tr: 'Zehirli Darbe', ability_name_en: 'Poisonous Strike', ability_desc_tr: 'Saldırıya +3 zehir hasarı.', ability_desc_en: '+3 poison damage to attacks.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, CON: 1 } },
  { category_key: 'assassin', key: 'phantom_veil', name_tr: 'Phantom Veil', name_en: 'Phantom Veil', ability_name_tr: 'Mana Kalkanı', ability_name_en: 'Mana Shield', ability_desc_tr: 'Günde bir kez yapılardan geçebilir.', ability_desc_en: 'Pass through structures once a day.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, INT: 1 } },
  { category_key: 'assassin', key: 'nightmare_stalker', name_tr: 'Nightmare Stalker', name_en: 'Nightmare Stalker', ability_name_tr: 'Yakalama', ability_name_en: 'Catch', ability_desc_tr: 'Yakın dövüşçünün silahını kitleyip kritik vur.', ability_desc_en: 'Lock melee fighter\'s weapon and land critical.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, STR: 1 } },
  { category_key: 'assassin', key: 'echoblade', name_tr: 'Echoblade', name_en: 'Echoblade', ability_name_tr: 'Çift Vuruş', ability_name_en: 'Double Strike', ability_desc_tr: 'Her 4. tur saldırısı 2 kez vurur.', ability_desc_en: 'Every 4th turn attack hits twice.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { DEX: 2, STR: 1 } },
  { category_key: 'assassin', key: 'ninja', name_tr: 'Ninja', name_en: 'Ninja', ability_name_tr: 'Klonlar', ability_name_en: 'Clones', ability_desc_tr: '4 klon yaratılabilir, 1 darbeyle yok edilir.', ability_desc_en: '4 clones, destroyed with 1 hit, no magic.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { DEX: 3 } },
  { category_key: 'assassin', key: 'mindhunter', name_tr: 'Mindhunter', name_en: 'Mindhunter', ability_name_tr: 'Zihin Karmaşası', ability_name_en: 'Mind Confusion', ability_desc_tr: 'Seçilen darbe hedefe zihin karmaşası uygular.', ability_desc_en: 'Chosen hit applies mind confusion to target.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { INT: 2, DEX: 1 } },
  { category_key: 'assassin', key: 'spy', name_tr: 'Casus', name_en: 'Spy', ability_name_tr: 'Gözlem Ustası', ability_name_en: 'Observation Master', ability_desc_tr: 'İstenen bilgiyi hedeften alır.', ability_desc_en: 'Gets desired info from target.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 2, DEX: 1 } },
  // MARKSMAN
  { category_key: 'marksman', key: 'stormshot', name_tr: 'Stormshot', name_en: 'Stormshot', ability_name_tr: 'Parçalı Ok', ability_name_en: 'Split Arrow', ability_desc_tr: 'Oku 4 parçaya böl, hasar azalır.', ability_desc_en: 'Split arrow into 4 pieces, less damage.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, STR: 1 } },
  { category_key: 'marksman', key: 'sniper', name_tr: 'Sniper', name_en: 'Sniper', ability_name_tr: 'Kritik Atış', ability_name_en: 'Critical Shot', ability_desc_tr: '2 tur hazırlanırsa çifte kritik.', ability_desc_en: '2 turns prep = double critical.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 3 } },
  { category_key: 'marksman', key: 'index', name_tr: 'Index', name_en: 'Index', ability_name_tr: 'Çifte Hedef', ability_name_en: 'Double Target', ability_desc_tr: 'Atış 1 rakibi kesin vurur.', ability_desc_en: 'Shot definitely hits 1 opponent.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, WIS: 1 } },
  { category_key: 'marksman', key: 'one_shot', name_tr: 'One Shot', name_en: 'One Shot', ability_name_tr: 'Güçlü Atış', ability_name_en: 'Powerful Shot', ability_desc_tr: 'Sonraki atış 2x hasar, 2 tur atış yok.', ability_desc_en: 'Next shot 2x damage, no shots for 2 turns.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, DEX: 1 } },
  { category_key: 'marksman', key: 'gunslinger', name_tr: 'Silahşör', name_en: 'Gunslinger', ability_name_tr: 'Sürekli Atış', ability_name_en: 'Continuous Shot', ability_desc_tr: '3 kez arka arkaya atış.', ability_desc_en: 'Shoot 3 times in a row.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, CHA: 1 } },
  { category_key: 'marksman', key: 'rune_archer', name_tr: 'RuneArcher', name_en: 'RuneArcher', ability_name_tr: 'Durum Efekti', ability_name_en: 'Status Effect', ability_desc_tr: 'Oka geçici durum efekti ekle.', ability_desc_en: 'Add temporary status effect to arrow.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 1, DEX: 1, WIS: 1 } },
  { category_key: 'marksman', key: 'late_chaser', name_tr: 'LateChaser', name_en: 'LateChaser', ability_name_tr: 'İşaretli Hasar', ability_name_en: 'Marked Damage', ability_desc_tr: 'Her darbe +1 hasar biriktirir.', ability_desc_en: 'Each hit accumulates +1 damage.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { DEX: 2, WIS: 1 } },
  { category_key: 'marksman', key: 'elementalist_archer', name_tr: 'Elementalist Okçu', name_en: 'Elementalist Archer', ability_name_tr: 'Elemental Teknik', ability_name_en: 'Elemental Technique', ability_desc_tr: 'Seçilen elemente göre imza hareketi.', ability_desc_en: 'Signature move based on chosen element.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { DEX: 1, INT: 1, WIS: 1 } },
  // CRAFTING
  { category_key: 'crafting', key: 'rune_master', name_tr: 'RuneMaster', name_en: 'RuneMaster', ability_name_tr: 'Rün Yazımı', ability_name_en: 'Rune Writing', ability_desc_tr: 'Kişi rün yazabilir.', ability_desc_en: 'Person can write runes.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 2, WIS: 1 } },
  { category_key: 'crafting', key: 'blacksmith', name_tr: 'Blacksmith', name_en: 'Blacksmith', ability_name_tr: 'Ekipman Üretimi', ability_name_en: 'Equipment Crafting', ability_desc_tr: 'Kişi ekipman üretebilir.', ability_desc_en: 'Person can produce equipment.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { STR: 2, CON: 1 } },
  { category_key: 'crafting', key: 'alchemist', name_tr: 'Simyacı', name_en: 'Alchemist', ability_name_tr: 'Simya Ustalığı', ability_name_en: 'Alchemy Mastery', ability_desc_tr: 'Simyacının tüm becerilerini uygula.', ability_desc_en: 'Apply all alchemist skills.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 2, WIS: 1 } },
  { category_key: 'crafting', key: 'cook', name_tr: 'Cook', name_en: 'Cook', ability_name_tr: 'Güçlendirici Yemek', ability_name_en: 'Buff Cooking', ability_desc_tr: 'Pişirilen yemekler güçlendirme sağlar.', ability_desc_en: 'Meals provide selected buffs.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { WIS: 1, CHA: 1, CON: 1 } },
  // SUMMONER
  { category_key: 'summoner', key: 'necromancer', name_tr: 'Necromancer', name_en: 'Necromancer', ability_name_tr: 'Hortlak Diriltme', ability_name_en: 'Undead Resurrection', ability_desc_tr: 'Öldürdüğün bedeni %75 istatistikle dirilt.', ability_desc_en: 'Resurrect killed body as 75% stat undead.', is_low_rate: false, is_advanced: false, icon_url: null, base_stats: { INT: 2, WIS: 1 } },
  { category_key: 'summoner', key: 'hellbinder', name_tr: 'Hellbinder', name_en: 'Hellbinder', ability_name_tr: 'Cehennem Kapısı', ability_name_en: 'Hell Gate', ability_desc_tr: 'Günde bir kez, cehenneme girme şansı 1/20.', ability_desc_en: 'Once per day, 1/20 chance to enter hell.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { CHA: 2, INT: 1 } },
  { category_key: 'summoner', key: 'oracle_summoner', name_tr: 'Oracle', name_en: 'Oracle', ability_name_tr: 'Cennet Kapısı', ability_name_en: 'Heaven Gate', ability_desc_tr: 'Günde bir kez, cennete girme şansı 1/20.', ability_desc_en: 'Once per day, 1/20 chance to enter heaven.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { WIS: 2, CHA: 1 } },
  { category_key: 'summoner', key: 'soul_summoner', name_tr: 'Soul Summoner', name_en: 'Soul Summoner', ability_name_tr: 'Araf Kapısı', ability_name_en: 'Purgatory Gate', ability_desc_tr: 'Günde bir kez, arafa girme şansı 1/20.', ability_desc_en: 'Once per day, 1/20 chance to enter purgatory.', is_low_rate: true, is_advanced: false, icon_url: null, base_stats: { WIS: 1, INT: 1, CHA: 1 } },
  // ADVANCED
  { category_key: 'warrior', key: 'last_samurai', name_tr: 'Son Samuray', name_en: 'The Last Samurai', ability_name_tr: 'Çifte Ağır Kesik', ability_name_en: 'Double Heavy Cut', ability_desc_tr: 'İki seçilen saldırı 2X hasar.', ability_desc_en: 'Two chosen attacks deal 2X damage.', is_low_rate: false, is_advanced: true, icon_url: null, base_stats: { STR: 3, DEX: 1 } },
  { category_key: 'tank', key: 'triple_ramparts', name_tr: 'Üçüz Surlar', name_en: 'Triple Ramparts', ability_name_tr: 'Çifte Toprak İkiz', ability_name_en: 'Double Earth Twin', ability_desc_tr: '%100 istatistikli 2 kopya yaratır.', ability_desc_en: 'Creates 2 clones with 100% stats.', is_low_rate: true, is_advanced: true, icon_url: null, base_stats: { CON: 3, STR: 1 } },
  { category_key: 'warrior', key: 'executioner_adv', name_tr: 'Cellat', name_en: 'Executioner (Advanced)', ability_name_tr: 'Gelişmiş İnfaz', ability_name_en: 'Advanced Execution', ability_desc_tr: '%40 ihtimalle canı %50 altındaki rakibi infaz et.', ability_desc_en: '40% chance to execute opponent below 50% HP.', is_low_rate: false, is_advanced: true, icon_url: null, base_stats: { STR: 3, DEX: 1 } },
];

// ---- HELPER FUNCTIONS ----

export function getRacesByTier(tierKey: RaceTierKey): RaceSeed[] {
  return RACES.filter(r => r.tier_key === tierKey);
}

export function getSubclassesByCategory(categoryKey: string): SubclassSeed[] {
  return SUBCLASSES.filter(s => s.category_key === categoryKey && !s.is_advanced);
}

export function getAdvancedClasses(): SubclassSeed[] {
  return SUBCLASSES.filter(s => s.is_advanced);
}

export const CATEGORY_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  mage: { primary: '#6366f1', secondary: '#818cf8', glow: '#4f46e5' },
  warrior: { primary: '#ef4444', secondary: '#f87171', glow: '#dc2626' },
  tank: { primary: '#d97706', secondary: '#fbbf24', glow: '#b45309' },
  neutral: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#7c3aed' },
  assassin: { primary: '#10b981', secondary: '#34d399', glow: '#059669' },
  marksman: { primary: '#06b6d4', secondary: '#22d3ee', glow: '#0891b2' },
  crafting: { primary: '#f59e0b', secondary: '#fcd34d', glow: '#d97706' },
  summoner: { primary: '#ec4899', secondary: '#f472b6', glow: '#db2777' },
};

export const TIER_COLORS: Record<RaceTierKey, { primary: string; secondary: string; glow: string; description_en: string; description_tr: string }> = {
  humanoid: {
    primary: '#fbbf24', secondary: '#fcd34d', glow: '#f59e0b',
    description_en: 'Standard humanoid races with balanced abilities and high adaptability.',
    description_tr: 'Dengeli yeteneklere ve yüksek uyum kabiliyetine sahip standart insansı ırklar.',
  },
  demi_humanoid: {
    primary: '#34d399', secondary: '#6ee7b7', glow: '#10b981',
    description_en: 'Hybrid races combining human and beast traits. Unique physical advantages.',
    description_tr: 'İnsan ve hayvan özelliklerini birleştiren melez ırklar. Benzersiz fiziksel avantajlar.',
  },
  heteromorphic: {
    primary: '#a78bfa', secondary: '#c4b5fd', glow: '#8b5cf6',
    description_en: 'Otherworldly beings — undead, demons, elementals with extraordinary powers.',
    description_tr: 'Öteki dünya varlıkları — ölümsüzler, iblisler ve olağanüstü güçlere sahip varlıklar.',
  },
};
