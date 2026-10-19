export type Locale = 'tr' | 'en';

export interface TranslationDictionary {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    add: string;
    confirm: string;
    back: string;
    close: string;
    loading: string;
    success: string;
    error: string;
    actions: string;
    active: string;
    name: string;
    notes: string;
  };
  combatTracker: {
    title: string;
    subtitle: string;
    newEncounter: string;
    newEncounterTitle: string;
    encounterName: string;
    encounterNamePlaceholder: string;
    gmNotes: string;
    gmNotesPlaceholder: string;
    addCombatant: string;
    addCombatantTitle: string;
    combatantName: string;
    combatantNamePlaceholder: string;
    maxHp: string;
    ac: string;
    initiative: string;
    isNpc: string;
    npcBadge: string;
    playerBadge: string;
    turn: string;
    round: string;
    nextTurn: string;
    activeEncounter: string;
    deleteEncounter: string;
    deleteCombatant: string;
    autoRollInitiative: string;
    pullPartyMembers: string;
    noEncounters: string;
    createFirstEncounter: string;
    conditions: string;
    conditionLabels: Record<string, string>;
    tempHpSuffix: string;
    damage5: string;
    damage1: string;
    heal1: string;
    heal5: string;
    turnNextTurnBadge: string;
    statusPreparing: string;
    statusActive: string;
    statusCompleted: string;
  };
  spellManager: {
    teachAllSpells: string;
    forgetAllSpells: string;
    teachRemoveSpells: string;
    teach: string;
    remove: string;
    noNewSpells: string;
    spellsLearnedCount: string;
  };
  lootDispenser: {
    title: string;
    subtitle: string;
    createChest: string;
    createChestTitle: string;
    chestName: string;
    chestNamePlaceholder: string;
    chestDesc: string;
    chestDescPlaceholder: string;
    goldAmount: string;
    itemsInChest: string;
    addCustomItem: string;
    quickPresets: string;
    deleteChest: string;
    looted: string;
    locked: string;
    contents: string;
    dispenseToCharacter: string;
    noChests: string;
    createFirstChest: string;
    selectCharacter: string;
    dispenseSuccess: string;
    dispenseFailed: string;
    itemName: string;
    itemRarity: string;
    itemType: string;
    itemQuantity: string;
    tableNotice: string;
  };
  atmosphere: {
    title: string;
    subtitle: string;
    writeNewChronicle: string;
    editChronicle: string;
    weatherControls: string;
    activeWeather: string;
    timeOfDay: string;
    audioPreset: string;
    dangerLevel: string;
    stopAudio: string;
    playPreview: string;
    sessionChronicles: string;
    totalRecords: string;
    publicToPlayers: string;
    inGameDate: string;
    inGameDatePlaceholder: string;
    sessionTitle: string;
    sessionTitlePlaceholder: string;
    sessionSummary: string;
    sessionSummaryPlaceholder: string;
    gmNotes: string;
    gmNotesPlaceholder: string;
    publishToPlayers: string;
    noChronicles: string;
    safe: string;
    low: string;
    high: string;
    deadly: string;
    tableNotice: string;
    weatherOptions: Record<string, { label: string; desc: string }>;
    timeOptions: Record<string, { label: string }>;
    dangerOptions: Record<string, { label: string }>;
    ambientPresets: Record<string, { label: string; desc: string; category: string }>;
    hiddenDraft: string;
    sessionNo: string;
    updateChronicle: string;
  };
  map: {
    title: string;
    tacticalBattleMap: string;
    gridTelemetry: string;
    warTableAttuned: string;
    heroesCount: string;
    expeditionTokens: string;
    gmControls: string;
    fogRadius: string;
    toggleFogGm: string;
    toggleFogPlayer: string;
    resetPositions: string;
    mapLibrary: string;
    selectMap: string;
    uploadMap: string;
    mapName: string;
    mapUrl: string;
    activeMap: string;
    freeExploration: string;
    gmApprovedMode: string;
    movementMode: string;
    moveRequested: string;
    approveMove: string;
    rejectMove: string;
    pendingMoves: string;
    clearFog: string;
    resetFog: string;
    uploadImageOrUrl: string;
    dropMapHere: string;
    switchMap: string;
    newMapNamePlaceholder: string;
  };
  arena: {
    title: string;
    subtitle: string;
    lobbyTitle: string;
    teamBlue: string;
    teamRed: string;
    slotSelect: string;
    selectCharacter: string;
    emptySlot: string;
    launchCombat: string;
    rollDice: string;
    rolling: string;
    yourTurn: string;
    waitingFor: string;
    activeTurn: string;
    initiativeOrder: string;
    round: string;
    hp: string;
    mp: string;
    ac: string;
    spells: string;
    inventory: string;
    attacks: string;
    basicStrike: string;
    defend: string;
    passTurn: string;
    logTitle: string;
    introRoar: string;
    hitSuccess: string;
    missed: string;
    critHit: string;
    critMiss: string;
    damageDealt: string;
    healed: string;
    statusInflicted: string;
    poisonTick: string;
    potionUsed: string;
    defeat: string;
    victory: string;
    targetRequired: string;
    notEnoughMana: string;
    itemDepleted: string;
    diceRollResult: string;
    versus: string;
    combatEnded: string;
    startNewEncounter: string;
    logEmpty: string;
    skip: string;
    castSpell: string;
    useItem: string;
    basicAttackDesc: string;
    defendDesc: string;
    targetLabel: string;
    aliveLabel: string;
    combatEngaged: string;
    flamesDecide: string;
  };
}

export const translations: Record<Locale, TranslationDictionary> = {
  tr: {
    common: {
      save: 'Kaydet',
      cancel: 'İptal',
      delete: 'Sil',
      edit: 'Düzenle',
      create: 'Oluştur',
      add: 'Ekle',
      confirm: 'Onayla',
      back: 'Geri',
      close: 'Kapat',
      loading: 'Yükleniyor...',
      success: 'Başarılı',
      error: 'Hata',
      actions: 'Eylemler',
      active: 'Aktif',
      name: 'İsim',
      notes: 'Notlar',
    },
    combatTracker: {
      title: 'Savaş & İnisiyatif Takipçisi',
      subtitle: 'Karşılaşmaları yönetin, inisiyatif atın, D&D 5e durumlarını ve canları anlık takip edin.',
      newEncounter: 'Yeni Karşılaşma',
      newEncounterTitle: 'Yeni Karşılaşma Oluştur',
      encounterName: 'Karşılaşma Adı',
      encounterNamePlaceholder: 'Örn: Goblin Pususu, Ejderha Yuvası',
      gmNotes: 'GM Notları',
      gmNotesPlaceholder: 'Taktikler, çevre tehlikeleri, sürpriz faktörleri...',
      addCombatant: 'Savaşçı / NPC Ekle',
      addCombatantTitle: 'Savaşçı / Yaratık Ekle',
      combatantName: 'İsim',
      combatantNamePlaceholder: 'Örn: Goblin Okçusu, Kara Şövalye',
      maxHp: 'Maks HP',
      ac: 'Zırh (AC)',
      initiative: 'İnisiyatif',
      isNpc: 'NPC / Canavar (Oyuncu karakteri değil)',
      npcBadge: 'NPC',
      playerBadge: 'Oyuncu',
      turn: 'Tur',
      round: 'Raund',
      nextTurn: 'Sıradaki Hamle',
      activeEncounter: 'Aktif Karşılaşma',
      deleteEncounter: 'Karşılaşmayı Sil',
      deleteCombatant: 'Savaşçıyı Sil',
      autoRollInitiative: 'Toplu İnisiyatif Zarı At (d20)',
      pullPartyMembers: 'Grup Üyelerini Çek',
      noEncounters: 'Aktif bir karşılaşma bulunmuyor.',
      createFirstEncounter: 'İlk Karşılaşmayı Oluştur',
      conditions: 'Durumlar:',
      conditionLabels: {
        poisoned: 'Zehirlenmiş',
        stunned: 'Sersemlemiş',
        blinded: 'Kör',
        charmed: 'Büyülenmiş',
        paralyzed: 'Felçli',
        frightened: 'Korkmuş',
        unconscious: 'Baygın',
        prone: 'Yerde',
        invisible: 'Görünmez',
        grappled: 'Yakalanmış',
        restrained: 'Kısıtlanmış',
        exhaustion: 'Tükenmişlik',
      },
      tempHpSuffix: 'Geçici',
      damage5: '-5 Hasar',
      damage1: '-1 Hasar',
      heal1: '+1 İyileş',
      heal5: '+5 İyileş',
      turnNextTurnBadge: 'SIRADA',
      statusPreparing: 'Hazırlık',
      statusActive: 'Savaşta',
      statusCompleted: 'Bitti',
    },
    spellManager: {
      teachAllSpells: 'Tüm Büyüleri Öğret',
      forgetAllSpells: 'Tüm Büyüleri Unut',
      teachRemoveSpells: 'Büyüleri Öğret / Kaldır',
      teach: 'Öğret',
      remove: 'Kaldır',
      noNewSpells: 'Öğretilecek yeni büyü bulunamadı. (Tüm uygun büyüler zaten açık)',
      spellsLearnedCount: 'büyü öğrenildi',
    },
    lootDispenser: {
      title: 'Ganimet Dağıtıcı (Loot Dispenser)',
      subtitle: 'Hazine sandıkları oluşturun, grup ödüllerini yönetin ve 24 slotlu oyuncu envanterlerine dağıtın.',
      createChest: 'Yeni Sandık Oluştur',
      createChestTitle: 'Yeni Ganimet Sandığı Yarat',
      chestName: 'Sandık Adı',
      chestNamePlaceholder: 'Örn: Ejderha Hazinesi, Zindan Sonu Sandığı',
      chestDesc: 'Açıklama / Hikaye Notu',
      chestDescPlaceholder: 'Örn: Altın işlemeli, eski meşe sandık...',
      goldAmount: 'Altın Miktarı (GP)',
      itemsInChest: 'Sandıktaki Eşyalar',
      addCustomItem: 'Özel Eşya Ekle',
      quickPresets: 'Hazır Şablonlar:',
      deleteChest: 'Sandığı Sil',
      looted: 'Toplandı (Looted)',
      locked: 'Kilitli / Dolu',
      contents: 'İçerik',
      dispenseToCharacter: 'Karaktere Dağıt',
      noChests: 'Henüz oluşturulmuş bir ganimet sandığı yok.',
      createFirstChest: 'İlk Sandığı Yarat',
      selectCharacter: 'Eşyaları Alacak Karakteri Seçin:',
      dispenseSuccess: 'Ganimet başarıyla karaktere aktarıldı!',
      dispenseFailed: 'Ganimet dağıtımı başarısız oldu.',
      itemName: 'Eşya Adı',
      itemRarity: 'Nadirlik',
      itemType: 'Tür',
      itemQuantity: 'Adet',
      tableNotice: 'Veritabanı tablosu henüz oluşturulmamış. Lütfen 03_new_gm_modules.sql migrasyonunu çalıştırın.',
    },
    atmosphere: {
      title: 'Atmosfer & Seans Günlüğü',
      subtitle: 'Hava durumu, günün saati, ortam sesleri ve seans özetlerini tek merkezden yönetin.',
      writeNewChronicle: 'Yeni Seans Günlüğü Yaz',
      editChronicle: 'Seans Günlüğünü Düzenle',
      weatherControls: 'Hava Durumu Kontrolleri',
      activeWeather: 'Aktif Hava',
      timeOfDay: 'Günün Saati',
      audioPreset: 'Ortam Ses Önayarı',
      dangerLevel: 'Tehdit Seviyesi',
      stopAudio: 'Sesi Durdur',
      playPreview: 'Önizleme Çal',
      sessionChronicles: 'Seans Günlükleri',
      totalRecords: 'seans kaydı',
      publicToPlayers: 'Oyunculara Açık',
      inGameDate: 'Oyun İçi Tarih',
      inGameDatePlaceholder: 'Örn: 1492 DR, 12 Mirtul',
      sessionTitle: 'Seans Başlığı',
      sessionTitlePlaceholder: 'Örn: Gölge Kalesi Baskını',
      sessionSummary: 'Seans Özeti (Hikaye Günlüğü)',
      sessionSummaryPlaceholder: 'Grup zindan kapısını kırarak içeri girdi...',
      gmNotes: 'GM Gizli Notları (Oyuncular Göremez)',
      gmNotesPlaceholder: 'Heykelin arkasında gizli bir tuzak mekanizması var...',
      publishToPlayers: 'Oyunculara Yayınla (Oyuncular kendi panellerinde görebilir)',
      noChronicles: 'Henüz kaydedilmiş bir seans günlüğü bulunmuyor.',
      safe: 'Güvenli',
      low: 'Düşük Tehdit',
      high: 'Yüksek Tehlike',
      deadly: 'Ölümcül',
      tableNotice: 'Atmosfer tablosu henüz oluşturulmamış. Lütfen 03_new_gm_modules.sql migrasyonunu çalıştırın.',
      weatherOptions: {
        fog: { label: 'Yoğun Sis (Fog)', desc: 'Görüş mesafesi 10ft ile sınırlı, algı zarları dezavantajlı.' },
        rain: { label: 'Sağanak Yağmur (Rain)', desc: 'Zemin çamurlu, menzilli saldırılarda dezavantaj.' },
        storm: { label: 'Fırtına (Storm)', desc: 'Şiddetli rüzgarlar, şimşek tehdidi ve uçuş kısıtlaması.' },
        ash: { label: 'Kül Yağmuru (Ash)', desc: 'Hava zehirli parçacıklarla dolu, nefes almak güçleşir.' },
        sunny: { label: 'Açık / Güneşli (Sunny)', desc: 'Tam görüş, doğal ışık aydınlatması.' },
        clear: { label: 'Berrak Gece (Clear)', desc: 'Yıldızlar net, gizlilik operasyonları için elverişli.' },
      },
      timeOptions: {
        dawn: { label: 'Şafak Vakti (Dawn)' },
        noon: { label: 'Öğle Vakti (Noon)' },
        dusk: { label: 'Alacakaranlık (Dusk)' },
        midnight: { label: 'Gece Yarısı (Midnight)' },
      },
      dangerOptions: {
        safe: { label: 'Güvenli (Safe)' },
        low: { label: 'Düşük Tehdit (Low)' },
        normal: { label: 'Normal (Moderate)' },
        high: { label: 'Yüksek Tehlike (High)' },
        deadly: { label: 'Ölümcül (Deadly)' },
      },
      ambientPresets: {
        abyss_winds: { label: 'Uçurum Rüzgarları', desc: 'Uğuldayan karanlık ve rüzgar yankıları', category: 'Zindan' },
        dungeon_drip: { label: 'Nemli Mahzen', desc: 'Damlama sesleri ve uzak zincir şıngırtıları', category: 'Zindan' },
        tavern_bustle: { label: 'Han & Meyhane', desc: 'Kadeh tokuşturma, ud nameleri ve kahkahalar', category: 'Sosyal' },
        storm_ruins: { label: 'Fırtınalı Harabeler', desc: 'Kükreyen gök gürültüsü ve yıkık tapınak', category: 'Dış Mekan' },
        celestial_choir: { label: 'Semavi Koro', desc: 'Ruhani yankılar ve ilahi fısıltılar', category: 'Mistik' },
        crypt_silence: { label: 'Mezar Sessizliği', desc: 'Neredeyse mutlak sessizlik, kalp atışları', category: 'Korku' },
        mystic_forest: { label: 'Mistik Orman', desc: 'Yggdrasil yaprak hışırtısı ve kristal tınılar', category: 'Doğa' },
        combat_tension: { label: 'Savaş Gerilimi', desc: 'Derin savaş davulları ve yükselen gerilim', category: 'Savaş' },
      },
      hiddenDraft: 'Gizli Taslak',
      sessionNo: 'Seans No',
      updateChronicle: 'Güncelle',
    },
    map: {
      title: 'Taktiksel Savaş Haritası',
      tacticalBattleMap: 'TAKTİKSEL SAVAŞ HARİTASI',
      gridTelemetry: 'IZGARA: 40x40',
      warTableAttuned: 'SEFER MASASI: BAĞLI',
      heroesCount: 'KAHRAMANLAR',
      expeditionTokens: 'KEŞİF TOKENLARI',
      gmControls: 'GM KONTROLLERİ',
      fogRadius: 'GÖRÜŞ / SİS YARIÇAPI',
      toggleFogGm: 'Sisi Gizle (GM Görünümü)',
      toggleFogPlayer: 'Sisi Göster (Oyuncu Görünümü)',
      resetPositions: 'Konumları Sıfırla',
      mapLibrary: 'Harita Kütüphanesi',
      selectMap: 'Harita Seç',
      uploadMap: 'Yeni Harita Yükle',
      mapName: 'Harita Adı',
      mapUrl: 'Görsel URL veya Dosya',
      activeMap: 'Aktif Harita',
      freeExploration: 'Serbest Keşif',
      gmApprovedMode: 'GM Onaylı Hareket',
      movementMode: 'Hareket Modu',
      moveRequested: 'Hareket isteği iletildi, GM onayı bekleniyor',
      approveMove: 'Onayla',
      rejectMove: 'Reddet',
      pendingMoves: 'Bekleyen Hareket İstekleri',
      clearFog: 'Sisi Aç',
      resetFog: 'Sisi Sıfırla',
      uploadImageOrUrl: 'Harita Dosyası Yükle / Görsel Bağla',
      dropMapHere: 'Görsel seçin veya URL girin',
      switchMap: 'Bu Haritayı Aktif Yap',
      newMapNamePlaceholder: 'Örn: Zindan 1. Kat, Taverna Meydanı',
    },
    arena: {
      title: 'Savaş Arenası (4v4)',
      subtitle: 'Taktiksel sıra tabanlı parti karşılaşması & yaşayan durum motoru',
      lobbyTitle: 'Karşılaşma Lobisi & Takım Dağılımı',
      teamBlue: 'Mavi Birlik (Parti 1)',
      teamRed: 'Kırmızı Lejyon (Parti 2)',
      slotSelect: 'Savaşçı Seç',
      selectCharacter: 'Karakter / Yaratık Ata',
      emptySlot: 'Boş Slot',
      launchCombat: 'SAVAŞI BAŞLAT',
      rollDice: 'ZAR AT (d20)',
      rolling: 'Zar Yuvarlanıyor...',
      yourTurn: 'SENİN TURUN!',
      waitingFor: 'Sıra bekleniyor: ',
      activeTurn: 'AKTİF TUR',
      initiativeOrder: 'İnisiyatif Şeridi',
      round: 'Raund',
      hp: 'Can (HP)',
      mp: 'Mana (MP)',
      ac: 'Zırh (AC)',
      spells: 'Büyüler',
      inventory: 'Çanta & İksirler',
      attacks: 'Saldırılar',
      basicStrike: 'Temel Saldırı',
      defend: 'Savunma Pozisyonu',
      passTurn: 'Turu Sonlandır',
      logTitle: 'Savaş Günlüğü',
      introRoar: 'Alevler yükseliyor! Savaş başladı!',
      hitSuccess: 'isabet etti!',
      missed: 'ıskaladı!',
      critHit: 'KRİTİK VURUŞ (DOĞAL 20)!',
      critMiss: 'KRİTİK ISKA (DOĞAL 1)!',
      damageDealt: 'hasar verdi',
      healed: 'can tazeledi',
      statusInflicted: 'etkisi uygulandı',
      poisonTick: 'Zehir hasarı aldı',
      potionUsed: 'iksir kullandı',
      defeat: 'Yenilgi',
      victory: 'Zafer! Takım kazandı:',
      targetRequired: 'Lütfen önce bir hedef seçin!',
      notEnoughMana: 'Yetersiz Mana!',
      itemDepleted: 'Eşya tükendi!',
      diceRollResult: 'Zar Sonucu',
      versus: 'VS',
      combatEnded: 'Karşılaşma Sona Erdi',
      startNewEncounter: 'Yeni Karşılaşma Kur',
      logEmpty: 'Karşılaşma başladı. Eylemler burada listelenecek...',
      skip: 'Geç (Skip) ✕',
      castSpell: 'Büyüyü Kullan',
      useItem: 'Kullan',
      basicAttackDesc: '1d8 + 3 Fiziksel Hasar. Vuruş zarı vs Hedef AC karşılaştırması yapar.',
      defendDesc: 'Savunma pozisyonu alarak bir sonraki tura kadar +2 Zırh (AC) kazanır.',
      targetLabel: 'Hedef:',
      aliveLabel: 'HAYATTA',
      combatEngaged: 'SAVAŞ BAŞLADI',
      flamesDecide: 'KADERİN ALEVLERİ KARAR VERSİN',
    },
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      add: 'Add',
      confirm: 'Confirm',
      back: 'Back',
      close: 'Close',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      actions: 'Actions',
      active: 'Active',
      name: 'Name',
      notes: 'Notes',
    },
    combatTracker: {
      title: 'Combat & Initiative Tracker',
      subtitle: 'Manage encounters, roll initiative, track D&D 5e conditions & HP in real-time.',
      newEncounter: 'New Encounter',
      newEncounterTitle: 'Create New Encounter',
      encounterName: 'Encounter Name',
      encounterNamePlaceholder: 'e.g. Goblin Ambush, Dragon Lair',
      gmNotes: 'GM Notes',
      gmNotesPlaceholder: 'Tactics, environmental hazards, surprise elements...',
      addCombatant: 'Add Combatant / Monster',
      addCombatantTitle: 'Add Combatant / Monster',
      combatantName: 'Name',
      combatantNamePlaceholder: 'e.g. Goblin Scout, Dark Knight',
      maxHp: 'Max HP',
      ac: 'Armor Class (AC)',
      initiative: 'Initiative',
      isNpc: 'NPC / Monster (Not player character)',
      npcBadge: 'NPC',
      playerBadge: 'Player',
      turn: 'Turn',
      round: 'Round',
      nextTurn: 'Next Turn',
      activeEncounter: 'Active Encounter',
      deleteEncounter: 'Delete Encounter',
      deleteCombatant: 'Delete Combatant',
      autoRollInitiative: 'Mass Initiative Roll (d20)',
      pullPartyMembers: 'Pull Party Members',
      noEncounters: 'No active encounters found.',
      createFirstEncounter: 'Create First Encounter',
      conditions: 'Conditions:',
      conditionLabels: {
        poisoned: 'Poisoned',
        stunned: 'Stunned',
        blinded: 'Blinded',
        charmed: 'Charmed',
        paralyzed: 'Paralyzed',
        frightened: 'Frightened',
        unconscious: 'Unconscious',
        prone: 'Prone',
        invisible: 'Invisible',
        grappled: 'Grappled',
        restrained: 'Restrained',
        exhaustion: 'Exhaustion',
      },
      tempHpSuffix: 'Temp',
      damage5: '-5 Damage',
      damage1: '-1 Damage',
      heal1: '+1 Heal',
      heal5: '+5 Heal',
      turnNextTurnBadge: 'ACTIVE',
      statusPreparing: 'Preparing',
      statusActive: 'Active',
      statusCompleted: 'Completed',
    },
    spellManager: {
      teachAllSpells: 'Teach All Spells',
      forgetAllSpells: 'Forget All Spells',
      teachRemoveSpells: 'Teach / Remove Spells',
      teach: 'Teach',
      remove: 'Remove',
      noNewSpells: 'No new spells available to teach. (All eligible spells already unlocked)',
      spellsLearnedCount: 'spells learned',
    },
    lootDispenser: {
      title: 'Loot Dispenser',
      subtitle: 'Create treasure chests, manage party rewards, and dispense directly to 24-slot player inventories.',
      createChest: 'Create New Chest',
      createChestTitle: 'Create New Loot Chest',
      chestName: 'Chest Name',
      chestNamePlaceholder: 'e.g. Dragon Hoard, Dungeon Vault Chest',
      chestDesc: 'Description / Story Note',
      chestDescPlaceholder: 'e.g. Iron-banded ancient oak chest...',
      goldAmount: 'Gold Amount (GP)',
      itemsInChest: 'Items in Chest',
      addCustomItem: 'Add Custom Item',
      quickPresets: 'Quick Presets:',
      deleteChest: 'Delete Chest',
      looted: 'Looted',
      locked: 'Locked / Filled',
      contents: 'Contents',
      dispenseToCharacter: 'Dispense to Character',
      noChests: 'No loot chests created yet.',
      createFirstChest: 'Create First Chest',
      selectCharacter: 'Select Character to Receive Loot:',
      dispenseSuccess: 'Loot dispensed successfully to character!',
      dispenseFailed: 'Failed to dispense loot.',
      itemName: 'Item Name',
      itemRarity: 'Rarity',
      itemType: 'Type',
      itemQuantity: 'Quantity',
      tableNotice: 'Database table not created yet. Please execute migration 03_new_gm_modules.sql in Supabase SQL editor.',
    },
    atmosphere: {
      title: 'Atmosphere & Session Chronicle',
      subtitle: 'Manage weather, time of day, ambient audio, and chronicle summaries in one hub.',
      writeNewChronicle: 'Write New Chronicle',
      editChronicle: 'Edit Session Chronicle',
      weatherControls: 'Weather Controls',
      activeWeather: 'Active Weather',
      timeOfDay: 'Time of Day',
      audioPreset: 'Ambient Audio Preset',
      dangerLevel: 'Threat Level',
      stopAudio: 'Stop Audio',
      playPreview: 'Play Preview',
      sessionChronicles: 'Session Chronicles',
      totalRecords: 'chronicle records',
      publicToPlayers: 'Visible to Players',
      inGameDate: 'In-Game Date',
      inGameDatePlaceholder: 'e.g. 1492 DR, 12 Mirtul',
      sessionTitle: 'Session Title',
      sessionTitlePlaceholder: 'e.g. Shadow Castle Infiltration',
      sessionSummary: 'Session Summary (Story Journal)',
      sessionSummaryPlaceholder: 'The party shattered the dungeon gates...',
      gmNotes: 'GM Secret Notes (Hidden from Players)',
      gmNotesPlaceholder: 'Behind the stone statue hides a mechanism...',
      publishToPlayers: 'Publish to Players (Players can view summary on their dashboard)',
      noChronicles: 'No session chronicles recorded yet.',
      safe: 'Safe',
      low: 'Low Threat',
      high: 'High Danger',
      deadly: 'Deadly',
      tableNotice: 'Atmosphere table not created yet. Please execute migration 03_new_gm_modules.sql in Supabase SQL editor.',
      weatherOptions: {
        fog: { label: 'Dense Fog', desc: 'Visibility limited to 10ft, perception rolls have disadvantage.' },
        rain: { label: 'Heavy Rain', desc: 'Muddy terrain, disadvantage on ranged attack rolls.' },
        storm: { label: 'Tempest Storm', desc: 'Violent winds, lightning hazard, and flight restrictions.' },
        ash: { label: 'Ashfall', desc: 'Air thick with toxic cinders, breathing is difficult.' },
        sunny: { label: 'Bright Daylight', desc: 'Full visibility, natural radiant illumination.' },
        clear: { label: 'Clear Starlight', desc: 'Crisp night sky, advantageous for stealth operations.' },
      },
      timeOptions: {
        dawn: { label: 'Dawn' },
        noon: { label: 'Noon' },
        dusk: { label: 'Dusk' },
        midnight: { label: 'Midnight' },
      },
      dangerOptions: {
        safe: { label: 'Safe' },
        low: { label: 'Low Threat' },
        normal: { label: 'Moderate' },
        high: { label: 'High Danger' },
        deadly: { label: 'Deadly Hazard' },
      },
      ambientPresets: {
        abyss_winds: { label: 'Abyssal Winds', desc: 'Howling void and whispering cavern echoes', category: 'Dungeon' },
        dungeon_drip: { label: 'Dank Catacomb', desc: 'Water drops and distant clanking iron chains', category: 'Dungeon' },
        tavern_bustle: { label: 'Lively Tavern', desc: 'Clinking tankards, lute melodies, and hearty laughter', category: 'Social' },
        storm_ruins: { label: 'Thunderous Ruins', desc: 'Rolling thunder across collapsed temple stones', category: 'Wilderness' },
        celestial_choir: { label: 'Celestial Choir', desc: 'Ethereal chants and sacred divine echoes', category: 'Mystic' },
        crypt_silence: { label: 'Crypt Silence', desc: 'Eerie near-absolute stillness and echoing heartbeats', category: 'Horror' },
        mystic_forest: { label: 'Mystic Forest', desc: 'Rustling Yggdrasil canopy and sylvan chimes', category: 'Nature' },
        combat_tension: { label: 'Combat Tension', desc: 'Rhythmic war drums and ominous bass pulse', category: 'Combat' },
      },
      hiddenDraft: 'Hidden Draft',
      sessionNo: 'Session No',
      updateChronicle: 'Update',
    },
    map: {
      title: 'Tactical Battle Map',
      tacticalBattleMap: 'TACTICAL BATTLE MAP',
      gridTelemetry: 'GRID: 40x40',
      warTableAttuned: 'WAR TABLE: ATTUNED',
      heroesCount: 'HEROES',
      expeditionTokens: 'EXPEDITION TOKENS',
      gmControls: 'GM CONTROLS',
      fogRadius: 'FOG RADIUS',
      toggleFogGm: 'Hide Fog (GM View)',
      toggleFogPlayer: 'Show Fog (Player View)',
      resetPositions: 'Reset Positions',
      mapLibrary: 'Map Library',
      selectMap: 'Select Map',
      uploadMap: 'Upload New Map',
      mapName: 'Map Name',
      mapUrl: 'Image URL or File',
      activeMap: 'Active Map',
      freeExploration: 'Free Exploration',
      gmApprovedMode: 'GM Approved Movement',
      movementMode: 'Movement Mode',
      moveRequested: 'Movement requested, awaiting GM approval',
      approveMove: 'Approve',
      rejectMove: 'Reject',
      pendingMoves: 'Pending Move Requests',
      clearFog: 'Clear Fog',
      resetFog: 'Reset Fog',
      uploadImageOrUrl: 'Upload Map File / Connect Image',
      dropMapHere: 'Select image or paste URL',
      switchMap: 'Set As Active Map',
      newMapNamePlaceholder: 'e.g. Dungeon Level 1, Tavern Square',
    },
    arena: {
      title: 'Combat Arena (4v4)',
      subtitle: 'Tactical turn-based party face-off & living status effect engine',
      lobbyTitle: 'Encounter Lobby & Team Assignment',
      teamBlue: 'Blue Vanguard (Party 1)',
      teamRed: 'Red Legion (Party 2)',
      slotSelect: 'Select Combatant',
      selectCharacter: 'Assign Character / Monster',
      emptySlot: 'Empty Slot',
      launchCombat: 'LAUNCH COMBAT',
      rollDice: 'ROLL DICE (d20)',
      rolling: 'Rolling Dice...',
      yourTurn: 'YOUR TURN!',
      waitingFor: 'Waiting for: ',
      activeTurn: 'ACTIVE TURN',
      initiativeOrder: 'Initiative Order',
      round: 'Round',
      hp: 'HP',
      mp: 'Mana',
      ac: 'AC',
      spells: 'Spells',
      inventory: 'Bag & Potions',
      attacks: 'Attacks',
      basicStrike: 'Basic Strike',
      defend: 'Defensive Stance',
      passTurn: 'End Turn',
      logTitle: 'Combat Log',
      introRoar: 'Flames erupt! Battle has begun!',
      hitSuccess: 'hit!',
      missed: 'missed!',
      critHit: 'CRITICAL HIT (NAT 20)!',
      critMiss: 'CRITICAL MISS (NAT 1)!',
      damageDealt: 'dealt damage',
      healed: 'restored HP',
      statusInflicted: 'status applied',
      poisonTick: 'Poison damage tick',
      potionUsed: 'used potion',
      defeat: 'Defeat',
      victory: 'Victory! Winning Team:',
      targetRequired: 'Please select a target first!',
      notEnoughMana: 'Not enough Mana!',
      itemDepleted: 'Item depleted!',
      diceRollResult: 'Roll Result',
      versus: 'VS',
      combatEnded: 'Encounter Finished',
      startNewEncounter: 'Setup New Encounter',
      logEmpty: 'Encounter began. Actions will be logged here...',
      skip: 'Skip ✕',
      castSpell: 'Cast Spell',
      useItem: 'Use Item',
      basicAttackDesc: '1d8 + 3 Physical Damage. Compares attack roll vs Target AC.',
      defendDesc: 'Adopts a defensive stance, gaining +2 Armor Class (AC) until next turn.',
      targetLabel: 'Target:',
      aliveLabel: 'ALIVE',
      combatEngaged: 'COMBAT ENGAGED',
      flamesDecide: 'LET THE FLAMES OF DESTINY DECIDE',
    },
  },
};
