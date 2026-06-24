-- ==========================================
-- D&D Companion App - Supabase Seed Data
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- RACE TIERS
INSERT INTO race_tiers (key, name_tr, name_en, sort_order) VALUES ('humanoid', 'İnsansı Irklar', 'Humanoids', 1) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_tiers (key, name_tr, name_en, sort_order) VALUES ('demi_humanoid', 'Yarı-İnsansı Irklar', 'Demi-Humanoids', 2) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_tiers (key, name_tr, name_en, sort_order) VALUES ('heteromorphic', 'Heteromorfik Irklar', 'Heteromorphic', 3) ON CONFLICT (key) DO NOTHING;

-- CLASS CATEGORIES
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('mage', 'Büyücü', 'Mage', 1) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('warrior', 'Savaşçı', 'Warrior', 2) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('tank', 'Tank', 'Tank', 3) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('neutral', 'Tarafsız', 'Neutral', 4) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('assassin', 'Suikastçı', 'Assassin', 5) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('marksman', 'Nişancı', 'Marksman', 6) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('crafting', 'Üretim', 'Crafting', 7) ON CONFLICT (key) DO NOTHING;
INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('summoner', 'Çağırıcı', 'Summoner', 8) ON CONFLICT (key) DO NOTHING;

-- RACES
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'humanoid'),
  'human',
  'Human',
  'Standart özelliklere sahip temel ırk.',
  'Basic race with standard characteristics and high learning capacity.',
  '{"STR":1,"DEX":1,"CON":1,"INT":1,"WIS":1,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'humanoid'),
  'elf',
  'Elf',
  'Uzun ömürlü, doğa ile uyumlu; büyü ve okçuluk uzmanı.',
  'Long-lived, harmonious with nature; specializing in magic and archery.',
  '{"DEX":2,"INT":1,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'humanoid'),
  'dark_elf',
  'Dark Elf',
  'Derin ormanlarda yaşayan, koyu tenli Elf alt türü.',
  'Dark-skinned Elf sub-race living in the deep forests with distinct culture.',
  '{"DEX":2,"CHA":1,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'humanoid'),
  'dwarf',
  'Dwarf',
  'Kısa boylu, dayanıklı; madencilik, demircilik ve rün uzmanı.',
  'Short, durable; superior skills in mining, blacksmithing, and runecraft.',
  '{"CON":2,"STR":1,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'goblin',
  'Goblin',
  'Küçük yapılı, sürü halinde hareket eden düşük seviyeli yeşil tenli savaşçılar.',
  'Small, green-skinned low-level warriors that move in packs.',
  '{"DEX":2,"CON":-1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'birdman',
  'Birdman',
  'İnsan gövdeli, kanatlı ve kuş özellikli; hava savaşı avantajlı.',
  'Human-like torso with wings and avian features; advantaged in aerial combat.',
  '{"DEX":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'ogre',
  'Ogre',
  'İri cüsseli, yüksek fiziksel güce sahip, düşük zekalı devasa insansılar.',
  'Huge stature, high physical strength, usually low intelligence.',
  '{"STR":3,"CON":2,"INT":-2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'troll',
  'Troll',
  'Çok yüksek yenilenme yeteneğine sahip, güçlü savaşçılar.',
  'Strong warriors with very high regeneration capability.',
  '{"CON":3,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'lizardman',
  'Lizardman',
  'Pullu, kuyruklu, suda ve karada yaşayabilen savaşçı topluluk.',
  'Scaly, tailed warrior society capable of living in water and land.',
  '{"CON":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'orc',
  'Orc',
  'Domuz benzeri yüz hatlarına sahip, kabile yapısında fiziksel savaşçılar.',
  'Pig-like facial features, tribe-structured physical warriors.',
  '{"STR":2,"CON":1,"INT":-1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'quagoa',
  'Quagoa',
  'Metal yiyerek postlarını güçlendiren, yeraltı köstebek türü.',
  'Underground mole-like species that strengthen hide by eating metal.',
  '{"CON":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'lionese',
  'Lionese',
  'Aslan özelliklerine sahip, gururlu ve fiziksel olarak üstün yırtıcılar.',
  'Lion features, proud and physically superior apex demi-humans.',
  '{"STR":2,"CHA":1,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'minotaur',
  'Minotaur',
  'Boğa başlı, devasa kas kütleli labirent savaşçıları.',
  'Bull-headed, massive muscle mass, labyrinth warriors.',
  '{"STR":3,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'centaur',
  'Centaur',
  'Üstü insan, altı at olan hızlı ve dayanıklı bozkır savaşçıları.',
  'Human upper body, horse lower body; fast steppe warriors.',
  '{"STR":1,"DEX":1,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'naga',
  'Naga',
  'Üstü insan, altı yılan olan zehirli veya büyüsel tür.',
  'Human upper body, snake lower body; poisonous or magical.',
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'boggard',
  'Boggard',
  'Bataklıklarda yaşayan, kurbağa benzeri topluluk.',
  'Swamp-dwelling, frog-like demi-human community.',
  '{"CON":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'satyr',
  'Satyr',
  'Üstü insan, altı keçi olan çevik ve müziğe yatkın tür.',
  'Human upper body, goat legs; agile and music-inclined.',
  '{"CHA":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'gnoll',
  'Gnoll',
  'Sırtlan kafalı, vahşi doğaya sahip, grup halinde avlayan savaşçılar.',
  'Hyena-headed, wild nature, pack hunters.',
  '{"STR":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'rabbitman',
  'Rabbitman',
  'Tavşan kulaklı, gelişmiş duyulara sahip çevik tür.',
  'Rabbit ears, enhanced senses, highly agile species.',
  '{"DEX":3,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'demi_humanoid'),
  'snakeman',
  'Snakeman',
  'Yılan pullu, çatallı dilli; suikast ve gizlilik uzmanı.',
  'Snake scales, forked tongue; assassination and stealth specialist.',
  '{"DEX":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'skeleton',
  'Skeleton',
  'Büyüsel enerjiyle hareket eden temel kemik ölümsüzü.',
  'Basic undead skeleton animated by magical energy.',
  '{"CON":2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'vampire',
  'Vampire',
  'Kanla beslenen, yüksek güç ve hız sahibi ölümsüz.',
  'Blood-feeding undead with high strength, speed, and mind control.',
  '{"STR":2,"CHA":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'zombie',
  'Zombie',
  'Çürümüş bedenli, acı hissetmeyen ölümsüz varlık.',
  'Rotten-bodied, painless undead entities.',
  '{"CON":3,"INT":-2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'wraith',
  'Wraith',
  'Fiziksel bedeni olmayan, yaşam enerjisi emen hayalet.',
  'Incorporeal ghost draining life energy.',
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'ghost',
  'Ghost',
  'Görünmez olabilen ruhani varlık.',
  'Spiritual entity that can turn invisible.',
  '{"WIS":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'dullahan',
  'Dullahan',
  'Kafasını kolunun altında taşıyan ölümsüz.',
  'Headless undead carrying its head under its arm.',
  '{"STR":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'imp',
  'Imp',
  'Küçük, kanatlı ve kurnaz düşük seviyeli iblis.',
  'Small, winged, and cunning low-level demon.',
  '{"DEX":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'succubus_incubus',
  'Succubus / Incubus',
  'Baştan çıkarma ve enerji emme yetenekli iblis.',
  'Demons with seduction and energy draining abilities.',
  '{"CHA":3,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'shadow_demon',
  'Shadow Demon',
  'Gölgelerde saklanan karanlık varlık.',
  'Dark entity hiding in shadows.',
  '{"DEX":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'moloch',
  'Moloch',
  'Boğa boynuzlu, yıkım ve ateş uzmanı iblis.',
  'Bull-horned demon of destruction and hellfire.',
  '{"STR":3,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'angel',
  'Angel',
  'Kutsal enerjili, kanatlı ilahi varlık.',
  'Winged entity of holy energy and divine justice.',
  '{"WIS":2,"CHA":2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'insectoid',
  'Insectoid',
  'Kitin tabakalı böcek formları.',
  'Insect-form races covered in chitin layers.',
  '{"CON":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'arachnoid',
  'Arachnoid',
  'Örümcek özellikli, ağ örebilen tür.',
  'Spider features; web-weaving and venomous.',
  '{"DEX":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'parasite',
  'Parasite',
  'Başka bedene yerleşip kontrol eden canlı.',
  'Organism infesting another body to control it.',
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'slime',
  'Slime',
  'Formsuz, asitli amorf varlık.',
  'Formless acidic amorphous entity.',
  '{"CON":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'shoggoth',
  'Shoggoth',
  'Çok gözlü ve ağızlı form değiştiren kütle.',
  'Terrifying amorphous mass with eyes and mouths.',
  '{"CON":2,"STR":2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'dragonoid',
  'Dragonoid',
  'Ejderha kanlı, insansı formlu tür.',
  'Dragon blood close to humanoid form.',
  '{"STR":2,"CON":1,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'evil_tree',
  'Evil Tree',
  'Kötücül iradeli devasa bitki canavarı.',
  'Colossal plant monster with malicious will.',
  '{"CON":3,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'doppelganger',
  'Doppelgänger',
  'Başka varlıkların görünüşünü kopyalayan şekil değiştirici.',
  'Shape-shifter copying appearances and abilities.',
  '{"CHA":2,"DEX":1,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'automaton',
  'Automaton',
  'Mekanik veya büyüsel enerjiyle çalışan robotik varlık.',
  'Robotic entity powered by magic or mechanics.',
  '{"CON":2,"STR":2,"CHA":-2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'brain_eater',
  'Brain Eater',
  'Kurbanların beyinlerini yiyerek enerji emen tür.',
  'Species eating victims'' brains for info and energy.',
  '{"INT":3,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'mind_flayer',
  'Mind Flayer',
  'Dokunaçlı yüzlü, psiyonik güçlerle zihin kontrolü yapan varlık.',
  'Tentacle-faced being with psionic mind control.',
  '{"INT":3,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'beholder',
  'Beholder',
  'Tek büyük gözlü ve çok sayıda göz saplı yaratık.',
  'Creature with one large central eye and multiple eye stalks.',
  '{"INT":2,"WIS":2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'fairy',
  'Fairy',
  'Küçük yapılı, kanatlı doğa büyüsü uzmanı.',
  'Small-statured winged nature magic specialist.',
  '{"WIS":2,"DEX":1,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'nymph',
  'Nymph',
  'Doğa ile özdeşleşmiş güzel ruhlar.',
  'Nature spirits known for extreme beauty.',
  '{"CHA":3,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'dryad',
  'Dryad',
  'Belirli bir ağaca bağlı yaşayan orman ruhu.',
  'Forest spirit bound to a specific tree.',
  '{"WIS":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'werewolf',
  'Werewolf',
  'İnsandan kurda dönüşebilen güçlü tür.',
  'Species that can transform from human to wolf.',
  '{"STR":2,"DEX":1,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'lamia',
  'Lamia',
  'Yılan kuyruklu, kurbanları büyüleyen avcı.',
  'Snake tail, hunts by charming victims.',
  '{"CHA":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'medusa',
  'Medusa',
  'Yılan saçlı, bakışlarıyla taşa çeviren varlık.',
  'Entity with snake hair, turns beings to stone.',
  '{"CHA":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'gorgon',
  'Gorgon',
  'Taş zırhlı, uçabilen yaratık.',
  'Flying creature with stone-like armor.',
  '{"CON":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'giant',
  'Giant',
  'Devasa boyutlu kaba kuvvetli dev ırkı.',
  'Colossal-sized giant race with brute force.',
  '{"STR":3,"CON":2,"DEX":-2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'golem',
  'Golem',
  'Cansız maddelerden yapılmış yapay varlık.',
  'Artificial entity made from inanimate matter.',
  '{"CON":3,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'living_armor',
  'Living Armor',
  'İçinde beden olmadan hareket eden büyüsel zırh.',
  'Magical armor moving without a body inside.',
  '{"CON":3,"STR":1,"CHA":-2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'alien',
  'Alien',
  'Kozmik veya farklı boyutlardan gelen yabancı tür.',
  'Foreign species from cosmic or different dimensions.',
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'deep_one',
  'Deep One',
  'Okyanus derinliklerinde yaşayan karanlık deniz halkı.',
  'Dark sea folk living in ocean depths.',
  '{"CON":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'half_elemental',
  'Half-Elemental',
  'Bir ebeveyni elementel olan melez tür.',
  'Hybrid with one elemental parent.',
  '{"INT":1,"CON":1,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = 'heteromorphic'),
  'elemental',
  'Elemental',
  'Saf elementel enerjiden oluşan varlık.',
  'Being of pure elemental energy.',
  '{"INT":2,"CON":2}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- SUBCLASSES
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'druid',
  'Druid',
  'Druid',
  'Doğanın Nefesi',
  'Breath of Nature',
  'Çevreni tamamen ormana çevirir.',
  'Turns your surroundings into a forest.',
  false,
  false,
  '{"WIS":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'dark_mage',
  'Kara Büyücü',
  'Dark Mage',
  'Gölge Beslemesi',
  'Shadow Nourishment',
  'Rakibe kalıcı lanet yerleştirebilirsin.',
  'Place a permanent curse on opponent.',
  false,
  false,
  '{"INT":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'elementalist_mage',
  'Elementalist',
  'Elementalist',
  'Element Çağrısı',
  'Elemental Summon',
  'Kendi seviyenizde bir elemental çağırır.',
  'Summons an elemental at your level.',
  false,
  false,
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'psychomage',
  'Psikomag',
  'Psychomage',
  'Bipolar',
  'Bipolar',
  'Zihni etkileyen büyülere karşı farkındalık.',
  'Awareness against mind-affecting spells.',
  false,
  false,
  '{"WIS":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'blood_mage',
  'Kan Büyücüsü',
  'Blood Mage',
  'Büyülü Kan',
  'Magical Blood',
  'Can çeker.',
  'Drains life / HP steal.',
  false,
  false,
  '{"INT":1,"CON":2}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'mana_mage',
  'Mana Büyücüsü',
  'Mana Mage',
  'Mana Sentezi',
  'Mana Synthesis',
  'Rakibin büyüsünün %50''sini yutabilirsin.',
  'Absorb 50% of opponent''s spell.',
  false,
  false,
  '{"INT":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'priest',
  'Rahip',
  'Priest',
  'Kutsal Zırh',
  'Holy Armor',
  'Lanet durumlarına karşı tam direnç.',
  'Full resistance to curses.',
  false,
  false,
  '{"WIS":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'warlock',
  'Warlock',
  'Warlock',
  'Patronun Kırıntısı',
  'Patron''s Crumb',
  'Patronun gücünü çağırıp 3 tur kullanma.',
  'Summon patron''s power for 3 turns.',
  false,
  false,
  '{"CHA":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'shaman',
  'Şaman',
  'Shaman',
  'Totem Dövmesi',
  'Totem Tattoo',
  'Öldürülen canavarın bir ırksal avantajını kalıcı al.',
  'Permanently acquire a racial advantage from killed monster.',
  false,
  false,
  '{"WIS":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'mage'),
  'oracle_mage',
  'Kahin',
  'Oracle',
  'Kaderle Oynamak',
  'Playing with Fate',
  '1 gün gelecekten parçalar görebilirsin.',
  'See fragments of the future for 1 day.',
  false,
  false,
  '{"WIS":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'executioner',
  'İnfazcı',
  'Executioner',
  'Keskin Darbe',
  'Sharp Strike',
  '%50 ihtimalle canı %20 altındaki rakibi infaz eder.',
  'Executes opponent below 20% HP with 50% chance.',
  false,
  false,
  '{"STR":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'drunken_master',
  'Drunken Master',
  'Drunken Master',
  'Sersem Rakip',
  'Stunned Opponent',
  'Sarhoş iken rakiplerin hamlelerini %20 yönlendirme.',
  '20% chance to redirect opponents'' moves while drunk.',
  false,
  false,
  '{"CON":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'berserker',
  'Berserker',
  'Berserker',
  'Öfke Patlaması',
  'Burst of Rage',
  'Gücü artırır, canı azaltır.',
  'Increases power, decreases HP.',
  false,
  false,
  '{"STR":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'monk',
  'Keşiş',
  'Monk',
  'Yüksek Seviye Patlama',
  'High-Level Blast',
  'Meditasyonla canı ve manayı geri kazanır.',
  'Restore HP and mana through meditation.',
  false,
  false,
  '{"WIS":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'iron_fist',
  'Iron Fist',
  'Iron Fist',
  'Zırh Delici',
  'Armor Piercer',
  'Zırh ve savunmayı yok sayar, silah kullanamaz.',
  'Ignores armor and defense, cannot use weapons.',
  false,
  false,
  '{"STR":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'sword_sentinel',
  'Sword Sentinel',
  'Sword Sentinel',
  'Uçan Kılıç',
  'Flying Sword',
  '6 Uçan kılıç kullanabilirsin.',
  'Use 6 flying swords.',
  false,
  false,
  '{"INT":1,"DEX":1,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'samurai',
  'Samuray',
  'Samurai',
  'Ağır Kesik',
  'Heavy Cut',
  'Seçilen saldırı 2X hasar verir.',
  'A chosen attack deals 2X damage.',
  false,
  false,
  '{"STR":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'aura_fighter',
  'Aura Fighter',
  'Aura Fighter',
  'Rakip Analizi',
  'Opponent Analysis',
  'Hedefin sınıfını hissedebilirsin.',
  'Sense the target''s class.',
  false,
  false,
  '{"WIS":1,"STR":1,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'elemental_swordmaster',
  'Elemental Swordmaster',
  'Elemental Swordmaster',
  'Elemental Uzmanlık',
  'Elemental Expertise',
  'Seçilen elemente göre imza hareket üret.',
  'Produce signature move based on element.',
  false,
  false,
  '{"STR":1,"INT":1,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'weapon_saint',
  'Silah Azizi',
  'Weapon Saint',
  'Silah Bağlılığı',
  'Weapon Devotion',
  'Seçilen silah üzerinde tam kontrol. Silah kırılırsa ölürsün.',
  'Full control over chosen weapon. If it breaks, you die.',
  false,
  false,
  '{"STR":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'vanguard_guardian',
  'Öncephe Muhafızı',
  'Vanguard Guardian',
  'Dostu Korumak',
  'Protecting the Ally',
  'Dosta gelen saldırıyı üstlenir, hasarın yarısını alır.',
  'Takes attack aimed at ally, receives half damage.',
  false,
  false,
  '{"CON":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'wall_guard',
  'Wall Guard',
  'Wall Guard',
  'Darbe Önleyici',
  'Impact Preventer',
  'Savunma seviyesinin %50 üstündeki darbeyi yok say.',
  'Ignore hits 50% above defense level.',
  false,
  false,
  '{"CON":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'coreplate',
  'Coreplate',
  'Coreplate',
  'Savunma Alanı',
  'Defense Field',
  'Tüm dostlara +5 savunma.',
  '+5 defense to all allies.',
  false,
  false,
  '{"CON":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'sworn_shield',
  'Yeminli Koruma',
  'Sworn Shield',
  'Büyü Çekici',
  'Spell Attractor',
  'Bir oyuncuya bağlanır, tüm büyüler korumayı vurur.',
  'Binds to player; all magic hits guardian first.',
  false,
  false,
  '{"CON":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'guardian_of_faith',
  'İnanç Muhafızı',
  'Guardian of Faith',
  'Kötücül Bağışıklık',
  'Malicious Immunity',
  'Kötücül durumlara karşı bağışık.',
  'Immune to malicious conditions.',
  false,
  false,
  '{"WIS":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'stoneheart',
  'Stoneheart',
  'Stoneheart',
  'Saldırı Yansıtma',
  'Attack Reflection',
  '%50 fazla hasar alıp saldırıyı aynalayabilir.',
  'Takes 50% more damage and mirrors the attack.',
  true,
  false,
  '{"CON":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'twin_ramparts',
  'İkiz Surlar',
  'Twin Ramparts',
  'Toprak İkiz',
  'Earth Twin',
  '%100 istatistikli kopya yaratır.',
  'Creates 100% stat clone, no abilities.',
  true,
  false,
  '{"CON":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'life_guardian',
  'Hayat Muhafızı',
  'Life Guardian',
  'Darbe Emilimi',
  'Hit Absorption',
  'Darbeyi %30 emip HP''ye dönüştürür.',
  'Absorbs 30% of hit and converts to HP.',
  true,
  false,
  '{"CON":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'wrestler',
  'Güreşçi',
  'Wrestler',
  'Sabitleme',
  'Pinning',
  'Rakip 2 tur sabitlenir.',
  'Opponent is pinned for 2 turns.',
  false,
  false,
  '{"STR":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'commander',
  'Kumandan',
  'Commander',
  'Ekstra Eylem',
  'Extra Action',
  '1 oyuncuya ekstra eylem hakkı verir.',
  'Gives 1 player an extra action.',
  false,
  false,
  '{"CHA":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'gambler',
  'Gambler',
  'Gambler',
  'Şanslı Zar',
  'Lucky Dice',
  'Saldırı dışında zarlara +2.',
  '+2 to non-attack dice rolls.',
  false,
  false,
  '{"CHA":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'merchant',
  'Tüccar',
  'Merchant',
  'İndirim Ustası',
  'Discount Master',
  'Alım satımda %25 bonus.',
  '25% bonus on trade prices.',
  false,
  false,
  '{"CHA":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'curious',
  'Meraklı',
  'Curious',
  'Eşya Kullanımı',
  'Item Usage',
  'Düşük seviye ekipmanları kullanabilir.',
  'Can use low-level equipment.',
  false,
  false,
  '{"INT":1,"WIS":1,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'beast_tamer',
  'Hayvan Terbiyecisi',
  'Beast Tamer',
  'Vahşi Kontrol',
  'Wild Control',
  '1 vahşi hayvanı garanti terbiye et.',
  'Guaranteed tame of 1 wild animal.',
  false,
  false,
  '{"WIS":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'imposter',
  'Imposter',
  'Imposter',
  'Hain',
  'Traitor',
  'Sizi seven kişilere kritik hasar verebilirsiniz.',
  'Deal critical damage to people who trust you.',
  false,
  false,
  '{"CHA":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'neutral'),
  'genius',
  'Dahi',
  'Genius',
  'Büyü Ustası',
  'Magic Master',
  'Tüm sınıfların büyülerini öğrenebilir (10 limit).',
  'Can learn spells from all classes (10 limit).',
  false,
  false,
  '{"INT":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'darkcabe',
  'Darkcabe',
  'Darkcabe',
  'Sessizlik',
  'Silence',
  'Gece vakti bir tur tam Gizlilik.',
  'Full Stealth for one turn at night.',
  false,
  false,
  '{"DEX":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'venomblood',
  'Venomblood',
  'Venomblood',
  'Zehirli Darbe',
  'Poisonous Strike',
  'Saldırıya +3 zehir hasarı.',
  '+3 poison damage to attacks.',
  false,
  false,
  '{"DEX":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'phantom_veil',
  'Phantom Veil',
  'Phantom Veil',
  'Mana Kalkanı',
  'Mana Shield',
  'Günde bir kez yapılardan geçebilir.',
  'Pass through structures once a day.',
  false,
  false,
  '{"DEX":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'nightmare_stalker',
  'Nightmare Stalker',
  'Nightmare Stalker',
  'Yakalama',
  'Catch',
  'Yakın dövüşçünün silahını kitleyip kritik vur.',
  'Lock melee fighter''s weapon and land critical.',
  false,
  false,
  '{"DEX":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'echoblade',
  'Echoblade',
  'Echoblade',
  'Çift Vuruş',
  'Double Strike',
  'Her 4. tur saldırısı 2 kez vurur.',
  'Every 4th turn attack hits twice.',
  true,
  false,
  '{"DEX":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'ninja',
  'Ninja',
  'Ninja',
  'Klonlar',
  'Clones',
  '4 klon yaratılabilir, 1 darbeyle yok edilir.',
  '4 clones, destroyed with 1 hit, no magic.',
  true,
  false,
  '{"DEX":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'mindhunter',
  'Mindhunter',
  'Mindhunter',
  'Zihin Karmaşası',
  'Mind Confusion',
  'Seçilen darbe hedefe zihin karmaşası uygular.',
  'Chosen hit applies mind confusion to target.',
  true,
  false,
  '{"INT":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'assassin'),
  'spy',
  'Casus',
  'Spy',
  'Gözlem Ustası',
  'Observation Master',
  'İstenen bilgiyi hedeften alır.',
  'Gets desired info from target.',
  false,
  false,
  '{"WIS":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'stormshot',
  'Stormshot',
  'Stormshot',
  'Parçalı Ok',
  'Split Arrow',
  'Oku 4 parçaya böl, hasar azalır.',
  'Split arrow into 4 pieces, less damage.',
  false,
  false,
  '{"DEX":2,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'sniper',
  'Sniper',
  'Sniper',
  'Kritik Atış',
  'Critical Shot',
  '2 tur hazırlanırsa çifte kritik.',
  '2 turns prep = double critical.',
  false,
  false,
  '{"DEX":3}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'index',
  'Index',
  'Index',
  'Çifte Hedef',
  'Double Target',
  'Atış 1 rakibi kesin vurur.',
  'Shot definitely hits 1 opponent.',
  false,
  false,
  '{"DEX":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'one_shot',
  'One Shot',
  'One Shot',
  'Güçlü Atış',
  'Powerful Shot',
  'Sonraki atış 2x hasar, 2 tur atış yok.',
  'Next shot 2x damage, no shots for 2 turns.',
  false,
  false,
  '{"STR":2,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'gunslinger',
  'Silahşör',
  'Gunslinger',
  'Sürekli Atış',
  'Continuous Shot',
  '3 kez arka arkaya atış.',
  'Shoot 3 times in a row.',
  false,
  false,
  '{"DEX":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'rune_archer',
  'RuneArcher',
  'RuneArcher',
  'Durum Efekti',
  'Status Effect',
  'Oka geçici durum efekti ekle.',
  'Add temporary status effect to arrow.',
  false,
  false,
  '{"INT":1,"DEX":1,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'late_chaser',
  'LateChaser',
  'LateChaser',
  'İşaretli Hasar',
  'Marked Damage',
  'Her darbe +1 hasar biriktirir.',
  'Each hit accumulates +1 damage.',
  false,
  false,
  '{"DEX":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'marksman'),
  'elementalist_archer',
  'Elementalist Okçu',
  'Elementalist Archer',
  'Elemental Teknik',
  'Elemental Technique',
  'Seçilen elemente göre imza hareketi.',
  'Signature move based on chosen element.',
  true,
  false,
  '{"DEX":1,"INT":1,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'crafting'),
  'rune_master',
  'RuneMaster',
  'RuneMaster',
  'Rün Yazımı',
  'Rune Writing',
  'Kişi rün yazabilir.',
  'Person can write runes.',
  false,
  false,
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'crafting'),
  'blacksmith',
  'Blacksmith',
  'Blacksmith',
  'Ekipman Üretimi',
  'Equipment Crafting',
  'Kişi ekipman üretebilir.',
  'Person can produce equipment.',
  false,
  false,
  '{"STR":2,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'crafting'),
  'alchemist',
  'Simyacı',
  'Alchemist',
  'Simya Ustalığı',
  'Alchemy Mastery',
  'Simyacının tüm becerilerini uygula.',
  'Apply all alchemist skills.',
  false,
  false,
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'crafting'),
  'cook',
  'Cook',
  'Cook',
  'Güçlendirici Yemek',
  'Buff Cooking',
  'Pişirilen yemekler güçlendirme sağlar.',
  'Meals provide selected buffs.',
  false,
  false,
  '{"WIS":1,"CHA":1,"CON":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'summoner'),
  'necromancer',
  'Necromancer',
  'Necromancer',
  'Hortlak Diriltme',
  'Undead Resurrection',
  'Öldürdüğün bedeni %75 istatistikle dirilt.',
  'Resurrect killed body as 75% stat undead.',
  false,
  false,
  '{"INT":2,"WIS":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'summoner'),
  'hellbinder',
  'Hellbinder',
  'Hellbinder',
  'Cehennem Kapısı',
  'Hell Gate',
  'Günde bir kez, cehenneme girme şansı 1/20.',
  'Once per day, 1/20 chance to enter hell.',
  true,
  false,
  '{"CHA":2,"INT":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'summoner'),
  'oracle_summoner',
  'Oracle',
  'Oracle',
  'Cennet Kapısı',
  'Heaven Gate',
  'Günde bir kez, cennete girme şansı 1/20.',
  'Once per day, 1/20 chance to enter heaven.',
  true,
  false,
  '{"WIS":2,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'summoner'),
  'soul_summoner',
  'Soul Summoner',
  'Soul Summoner',
  'Araf Kapısı',
  'Purgatory Gate',
  'Günde bir kez, arafa girme şansı 1/20.',
  'Once per day, 1/20 chance to enter purgatory.',
  true,
  false,
  '{"WIS":1,"INT":1,"CHA":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'last_samurai',
  'Son Samuray',
  'The Last Samurai',
  'Çifte Ağır Kesik',
  'Double Heavy Cut',
  'İki seçilen saldırı 2X hasar.',
  'Two chosen attacks deal 2X damage.',
  false,
  true,
  '{"STR":3,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'tank'),
  'triple_ramparts',
  'Üçüz Surlar',
  'Triple Ramparts',
  'Çifte Toprak İkiz',
  'Double Earth Twin',
  '%100 istatistikli 2 kopya yaratır.',
  'Creates 2 clones with 100% stats.',
  true,
  true,
  '{"CON":3,"STR":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = 'warrior'),
  'executioner_adv',
  'Cellat',
  'Executioner (Advanced)',
  'Gelişmiş İnfaz',
  'Advanced Execution',
  '%40 ihtimalle canı %50 altındaki rakibi infaz et.',
  '40% chance to execute opponent below 50% HP.',
  false,
  true,
  '{"STR":3,"DEX":1}'::jsonb
) ON CONFLICT (key) DO NOTHING;
