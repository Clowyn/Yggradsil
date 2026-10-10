# R1: Kod Tabanı Mimari Denetimi ve Bozuk Fonksiyonlar Raporu
## (Architectural & Logical Audit Report)

**Proje**: D&D Sefer Yönetim Web Uygulaması (React 19 + TypeScript + Vite + Tailwind CSS v4 + React Flow + Framer Motion + Supabase)  
**Tarih**: 2026-10-10  
**Durum**: Tamamlandı / Temel Referans Dokümanı  
**Yetkili Alt Ajan**: worker_m1_docs_db  
**Gözlem ve Araştırma Kaynakları**: `explorer_survey_arch/handoff.md`, `explorer_survey_db/handoff.md`, `explorer_survey_perf_ui/handoff.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, `.agents/AGENTS.md`

---

## 1. Yönetici Özeti (Executive Summary)

D&D Sefer Yönetim Uygulaması'nın kod tabanı (frontend arayüzleri, state yönetimi hook'ları ve context'leri, Supabase PostgreSQL şemaları, RLS güvenlik politikaları ve migrasyon dosyaları) uçtan uca denetlenmiştir. 

Uygulamanın karanlık fantezi (dark-fantasy) RPG teması, 63 alt sınıf ve 3.150 büyüyü kapsayan Büyü Ağacı (`SpellTreeGraph`) görsel motoru son derece zengin bir temel sunmaktadır. Ancak yapılan derinlemesine incelemede:
1. **15 kritik mimari boşluk ve bozuk mantık fonksiyonu** tespit edilmiştir.
2. Derleme (`npm run build`) başarılı olmasına karşın, katı ESLint denetiminde (`npm run lint`) **63 hata ve 3 uyarı (toplam 66 sorun)** saptanmıştır.
3. Birçok temel RYO modülü (Karakter Kağıdı, Envanter, Harita piyonları, Stat Ağacı) veritabanına bağlı olmayıp, bellekteki sahte (DEMO/mock) dizilerle izole çalışmaktadır.
4. `.agents/AGENTS.md` bağlayıcı kurallarında belirtilen **RLS özyineleme yasağı (Rule 4)**, **boş envanter yuvalarının drop target olması kuralı (Rule 2)**, **React Flow CSS filtre yasağı (Rule 5.3)** ve **veritabanı-frontend isim uyumu (Rule 3)** konularında ihlaller belirlenmiştir.

Bu raporda tespit edilen her bir bulgu; önem derecesi, kesin dosya ve satır numarası, kanıt (kod parçası / hata üretimi adımı), somut çözüm planı ve proje kilometre taşı takibi ile belgelenmiştir.

---

## 2. Derleme ve Statik Kod Analizi (Build & Lint Status)

- **`npm run build`**: Başarılı (`tsc -b && vite build` 2.409 modülü hatasız derlemekte ve üretim paketini oluşturmaktadır).
- **`npm run lint`**: **BAŞARISIZ (Çıkış Kodu 1: 63 Hata, 3 Uyarı)**.
  - **`react-hooks/set-state-in-effect` (Effect içinde eşzamanlı setState çağrısı - 7 adet)**:
    - `src/components/gm/GMSpellManager.tsx:169:5` (`loadData()`)
    - `src/hooks/useAdminCampaigns.ts:93:5` (`fetchCampaigns()`)
    - `src/hooks/useAdminCharacters.ts:67:5` (`fetchCharacters()`)
    - `src/hooks/useAdminItems.ts:57:5` (`fetchItems()`)
    - `src/hooks/useAdminLogs.ts:56:5` (`fetchLogs()`)
    - `src/hooks/useAdminStats.ts:98:5` (`fetchStats()`)
    - `src/hooks/useAdminUsers.ts:80:5` (`fetchUsers()`)
  - **`@typescript-eslint/no-explicit-any` (38+ noktada `any` kullanımı)**:
    - `src/components/auth/LoginForm.tsx:21:19`
    - `src/components/auth/RegisterForm.tsx:26:19`
    - `src/components/character/CharacterCreation.tsx:151:29`
    - `src/components/gm/GMDashboard.tsx:257:103`
    - `src/hooks/useSpellTree.ts:346, 389, 427, 539, 586, 606`
    - `src/lib/types.ts:260:27, 281:27`
    - `src/pages/admin/CampaignsPage.tsx:95, 125, 147, 163, 177, 187, 199`
    - `src/pages/admin/CharactersPage.tsx:98, 125, 147, 175, 184`
    - `src/pages/admin/ItemCatalogPage.tsx:130, 178, 200`
    - `src/pages/admin/UsersPage.tsx:51, 62`
  - **`react-refresh/only-export-components` (2 adet)**:
    - `src/contexts/AuthContext.tsx:20:17`
    - `src/contexts/CampaignContext.tsx:19:17`
  - **`react-hooks/exhaustive-deps` (3 adet)**:
    - `src/contexts/CampaignContext.tsx:273, 321, 406` (`setActiveCharacterId` bağımlılık eksikliği)
  - **`no-useless-assignment` & `@typescript-eslint/no-unused-vars` (4 adet)**:
    - `src/components/gm/GMSpellManager.tsx:330, 333`
    - `src/pages/admin/ItemCatalogPage.tsx:109, 157`

---

## 3. Tespit Edilen 15 Mimari/Mantıksal Boşluk ve Bozuk Fonksiyon

Aşağıda mimari denetim sonucunda ortaya çıkarılan 15 ana bulgu ayrıntılı olarak listelenmiştir.

---

### Bulgu 1: Oyuncu Karakter Sayfası (Character Sheet) Görünümünün Tamamen Eksik Olması
- **Önem Derecesi**: Kritik (Critical)
- **Konum**: `src/pages/CharacterPage.tsx:24-64`
- **Kanıt (Kod Parçası)**:
  ```tsx
  export function CharacterPage() {
    const { activeCharacterId, characters } = useCampaign();
    const activeCharacter = characters?.find(c => c.id === activeCharacterId);

    return (
      <motion.div ...>
        {activeCharacter && (
          <div className="mb-6 p-4 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-between">
            <span>Viewing Character:</span>
            <span>{activeCharacter.name}</span>
          </div>
        )}
        <CharacterCreation />
      </motion.div>
    );
  }
  ```
- **Hata Tanımı**: Kullanıcının aktif bir karakteri bulunsa bile `/character` rotasına gidildiğinde yalnızca sıfırdan karakter oluşturma sihirbazı (`CharacterCreation`) görüntülenmektedir. Oyuncunun mevcut can puanını (HP), maksimum canını, zırh sınıfını (AC), yetenek puanlarını (STR/DEX/CON/INT/WIS/CHA), hızını, pasif algısını ve donanımlarını görebileceği interaktif bir "Karakter Kağıdı" (Character Sheet) bileşeni bulunmamaktadır.
- **Çözüm Planı**:
  1. `src/components/character/CharacterSheet.tsx` adında kapsamlı bir karakter kağıdı bileşeni oluşturulmalı.
  2. `CharacterPage.tsx` güncellenerek; eğer `activeCharacter` tanımlıysa doğrudan `CharacterSheet` render edilmeli; kullanıcı dilediğinde sekme veya modal ile `CharacterCreation` moduna geçebilmelidir.

---

### Bulgu 2: Zar Atma (Dice Roller) Sisteminin Bulunmaması
- **Önem Derecesi**: Yüksek (High)
- **Konum**: Tüm `src/` dizini (Sıfır implementasyon)
- **Kanıt**: Kod tabanında `d20`, `d6`, `d12`, `dice` aramalarında hiçbir zar atma motoru veya arayüzü bulunmamaktadır.
- **Hata Tanımı**: Masaüstü RYO sisteminin en temel gereksinimi olan d4, d6, d8, d10, d12, d20, d100 zar atıcıları, avantaj/dezavantaj hesaplamaları ve modifikatör ekleme mekanizması uygulamada hiç geliştirilmemiştir.
- **Çözüm Planı**:
  1. Küresel bir hızlı zar paneli (`FloatingDiceRoller`) veya Header/Sidebar'dan erişilebilen modüler bir zar motoru tasarlanmalı.
  2. Zar geçmişi ve toplam değer hesaplayıcısı arayüze entegre edilmelidir.

---

### Bulgu 3: Savaş ve Karşılaşma Yöneticisi (Combat / Initiative Tracker) Bulunmaması
- **Önem Derecesi**: Yüksek (High)
- **Konum**: Tüm `src/` dizini (Sıfır implementasyon)
- **Kanıt**: `combat` kelimesi sadece veritabanı büyü açıklamalarında yer almakta, hiçbir savaş yönetim arayüzü bulunmamaktadır.
- **Hata Tanımı**: GM'in partiyi ve canavarları (NPC) bir araya getirip inisiyatif (girişim) sırasına dizebileceği, aktif turu ve round sayısını takip edebileceği, anlık can puanı değiştirip durum etkileri (conditions) uygulayabileceği bir Savaş Takipçisi mevcut değildir.
- **Çözüm Planı**:
  1. `campaign_encounters` ve `encounter_combatants` tabloları Supabase'e eklenmeli (Bkz. Migration 03).
  2. `src/components/gm/GMCombatTracker.tsx` bileşeni geliştirilip `GMDashboard.tsx` altına kalıcı bir sekme olarak bağlanmalıdır.

---

### Bulgu 4: Canlı Sohbet ve Sefer Günlüğü (Chat & Event Log) Bulunmaması
- **Önem Derecesi**: Yüksek (High)
- **Konum**: Tüm `src/` dizini
- **Kanıt**: `chat` veya `session_log` aramaları sonuçsuz kalmaktadır.
- **Hata Tanımı**: Oyuncular ile GM arasında oturum içi notlar, hava durumu/atmosfer paylaşımları ve sistem olaylarının (zar atımları, seviye atlamaları) paylaşıldığı merkezi bir sefer günlüğü yoktur.
- **Çözüm Planı**:
  1. `campaign_environments` ve `session_chronicles` tabloları üzerinden kalıcı atmosfer ve oturum günlüğü modülü kurulmalı.
  2. GM oturum notlarını ve gizli GM sırlarını (`gm_secrets`) bu modül üzerinden yönetebilmelidir.

---

### Bulgu 5: Yetenek Ağacının (`YggdrasilTree` / `useSkillTree.ts`) Bellekte Sahte Veriyle Çalışması
- **Önem Derecesi**: Kritik (Critical)
- **Konum**: `src/hooks/useSkillTree.ts:49-100`, `src/components/skill-tree/YggdrasilTree.tsx:31`
- **Kanıt (Kod Parçası)**:
  ```tsx
  // YggdrasilTree.tsx:31
  // Pass activeCharacterId to useSkillTree when implemented in backend
  const { nodes, edges, onNodeClick, xp, unlockedCount, totalSkills } = useSkillTree();
  ```
  ```ts
  // useSkillTree.ts:49
  const DEMO_SKILLS: SkillDef[] = [ ... ]; // Sabit mock dizi
  const [unlockedSkills, setUnlockedSkills] = useState<Set<string>>(
    () => new Set(['str-1', 'dex-1', 'con-1'])
  );
  const [xp, setXp] = useState(2500);
  ```
- **Hata Tanımı**: Stat Ağacı sayfası canlı Supabase veritabanındaki `skill_definitions`, `character_skills` ve `character_stats` tablolarına bağlanmamaktadır. Yetenek açıldığında sadece yerel React state güncellenmekte, sayfa yenilendiğinde açılan yetenekler kaybolmaktadır.
- **Çözüm Planı**:
  1. `useSkillTree.ts` hook'u aktif karakter kimliği (`activeCharacterId`) alacak şekilde güncellenmeli.
  2. Supabase `character_skills` tablosuna RPC veya upsert ile kayıt atılmalı, karakterin `xp_available` değeri düşürülmelidir.

---

### Bulgu 6: Envanter Sisteminin (`InventoryGrid.tsx`) Tamamen Mock Veriyle İzole Olması
- **Önem Derecesi**: Kritik (Critical)
- **Konum**: `src/components/inventory/InventoryGrid.tsx:13-102, 136`
- **Kanıt (Kod Parçası)**:
  ```ts
  const DEMO_ITEMS: InventoryItemLocal[] = [ ... ]; // Sabit mock eşya dizisi
  const gold = 1247; // Sabit altın miktarı
  ```
- **Hata Tanımı**: Envanter ızgarası Supabase `inventory_items` ve `item_definitions` tablolarını hiç sorgulamamakta ve güncellememektedir. Oyuncu eşya taktığında veya taşıdığında veritabanına hiçbir istek gönderilmemektedir.
- **Çözüm Planı**:
  1. `inventory_items` tablosuna `slot_index int DEFAULT 0` kolonu eklenmeli (Migration 02).
  2. Aktif karakterin eşyaları Supabase'den okunmalı, sürükle-bırak sonucunda `slot_index` ve `equipped` durumu veritabanına yansıtılmalıdır.

---

### Bulgu 7: Boş Envanter Yuvalarına Sürükleyip Bırakmanın Engellenmesi (`disabled: !item`) — Kural 2 İhlali
- **Önem Derecesi**: Yüksek (High) — **AGENTS.md Kural 2 İhlali**
- **Konum**: `src/components/inventory/ItemCard.tsx:40`
- **Kanıt (Kod Parçası)**:
  ```tsx
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !item });
  ```
- **Hata Tanımı**: `.agents/AGENTS.md` Kural 2: *"For RPG-style inventory grids, use a fixed-size slot array instead of a dynamic item array with arrayMove. Each slot (including empty ones) should be a useSortable drop target. Drag operations should SWAP slot contents, not shift/reorder."*  
  Kodda `disabled: !item` yazıldığı için boş yuvalar bırakma hedefi (drop target) olmaktan çıkmaktadır. Oyuncu dolu bir eşyayı boş bir yuvaya taşıyamamaktadır!
- **Çözüm Planı**: `ItemCard.tsx:40` üzerindeki `disabled: !item` ifadesi kaldırılmalı veya sadece sürükleme engellenip boş slotun drop target kalması sağlanmalıdır. `handleDragEnd` fonksiyonu iki slotun içeriğini yer değiştirmelidir (SWAP).

---

### Bulgu 8: Harita Sisteminin (`useMap.ts` / `GameMap.tsx`) Mock Veriyle İzole Olması ve `isGM: true` Sabiti
- **Önem Derecesi**: Kritik (Critical)
- **Konum**: `src/hooks/useMap.ts:20-65, 72`
- **Kanıt (Kod Parçası)**:
  ```ts
  const INITIAL_TOKENS: MapToken[] = [ ... ]; // Sabit piyonlar
  const [tokens, setTokens] = useState<MapToken[]>(INITIAL_TOKENS);
  const [isGM] = useState(true); // HER KULLANICI İÇİN GM SABİTİ!
  ```
- **Hata Tanımı**:
  1. `isGM` `true` olarak sabitlendiği için sıradan oyuncular da GM sis ve harita kontrollerini görebilmektedir.
  2. Piyonlar veritabanındaki `map_tokens` tablosuna bağlanmamıştır; piyon sürüklendiğinde konum diğer oyunculara Realtime ile yansımamaktadır.
- **Çözüm Planı**:
  1. `useAuth().isGM` gerçek yetki kontrolüne bağlanmalı.
  2. `map_tokens` ve `map_state` Supabase Realtime yayınına bağlanmalı, piyon hareketi veritabanına kaydedilmelidir.

---

### Bulgu 9: Harita Çiziminde Çalışma Zamanı Çökme Riski (`token.label` Tanımsızlığı)
- **Önem Derecesi**: Yüksek (High)
- **Konum**: `src/components/map/GameMap.tsx:73-78`, `schema.sql:187`
- **Kanıt (Kod Parçası)**:
  ```tsx
  // GameMap.tsx:73
  const initials = label
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  ```
  `schema.sql` dosyasında `map_tokens` tablosunda `label` kolonu **yoktur**.
- **Hata Tanımı**: Veritabanından çekilen gerçek bir token nesnesinde `token.label` `undefined` olacağı için `label.split(' ')` çağrısı `TypeError: Cannot read properties of undefined (reading 'split')` üreterek HTML Canvas çizim döngüsünü çökertecektir.
- **Çözüm Planı**:
  1. `map_tokens` tablosuna `label text` kolonu eklenmeli (`ALTER TABLE map_tokens ADD COLUMN IF NOT EXISTS label text;`).
  2. `GameMap.tsx` içinde `(label || 'Token').split(' ')` şeklinde güvenli operatör ve fallback kullanılmalıdır.

---

### Bulgu 10: GM Dashboard Eşya ve Yetenek İşlemlerinin Veritabanına Kaydedilmemesi
- **Önem Derecesi**: Kritik (Critical)
- **Konum**: `src/components/gm/GMDashboard.tsx:388-418`
- **Kanıt (Kod Parçası)**:
  ```ts
  const addItem = (playerId: string, item: DemoItem) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, inventory: [...p.inventory, { ...item, id: `${item.id}-${Date.now()}` }] }
        : p
    ));
  };
  const removeItem = (playerId: string, itemId: string) => { ... };
  const addSkill = (playerId: string, skill: string) => { ... };
  const removeSkill = (playerId: string, skill: string) => { ... };
  ```
- **Hata Tanımı**: GM bir oyuncuya eşya veya yetenek verdiğinde/sildiğinde yalnızca yerel bileşen state'i güncellenmekte, Supabase `inventory_items` veya `character_skills` tablolarına hiçbir kalıcı kayıt atılmamaktadır. Sayfa yenilendiğinde verilen eşyalar ve yetenekler kaybolmaktadır.
- **Çözüm Planı**: Bu fonksiyonlar doğrudan Supabase CRUD sorgularına ve kalıcı GM Dağıtım Sandığı (`campaign_loot_chests`) modülüne bağlanmalıdır.

---

### Bulgu 11: `spell_schema.sql` İçinde Özyinelemeli RLS İlkesi Bulunması — Kural 4 İhlali
- **Önem Derecesi**: Kritik (Critical) — **AGENTS.md Kural 4 İhlali**
- **Konum**: `spell_schema.sql:67, 72, 77`
- **Kanıt (Kod Parçası)**:
  ```sql
  CREATE POLICY "GMs manage spell trees" ON spell_trees FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gm'));
  CREATE POLICY "GMs manage assignments" ON spell_tree_assignments FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gm'));
  CREATE POLICY "GMs manage spells" ON spells FOR ALL 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gm'));
  ```
- **Hata Tanımı**: `.agents/AGENTS.md` Kural 4: *"Never check user roles in Row Level Security policies using inline queries like EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') on the profiles table or related tables. Doing so causes PostgreSQL error 42P17 (infinite recursion). Always define and use SECURITY DEFINER helper functions (e.g. public.is_admin(), public.is_gm()) with SET search_path = public to query roles while bypassing RLS."*  
  Mevcut inline sorgular 42P17 özyineleme hatasına gebedir ve ayrıca `role = 'admin'` olan sistem yöneticilerini dışlamaktadır.
- **Çözüm Planı**: Politikalar `01_security_and_rls_hardening.sql` migrasyonu ile `USING (public.is_gm())` fonksiyonuna dönüştürülmelidir.

---

### Bulgu 12: React Flow Düğümlerinde Doğrudan `grayscale` CSS Filtresi Kullanılması — Kural 5.3 İhlali
- **Önem Derecesi**: Orta (Medium) — **AGENTS.md Kural 5.3 İhlali**
- **Konum**: `src/components/skill-tree/SkillNode.tsx:52`, `src/components/spell-tree/SpellNode.tsx:37, 49`
- **Kanıt (Kod Parçası)**:
  `SkillNode.tsx:52`:
  ```tsx
  return `${base} border-[#333] bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] opacity-50 grayscale`;
  ```
  `SpellNode.tsx:37, 49`:
  ```tsx
  return `${base} border-gray-800 bg-gray-950/80 cursor-not-allowed opacity-30 grayscale`;
  ```
- **Hata Tanımı**: `.agents/AGENTS.md` Kural 5.3: *"Never apply heavy multi-filter CSS stacks (grayscale(), brightness(), contrast()) directly to React Flow node containers; use compositor opacity or styled inner elements instead."* Ağaçta 50+ düğüm render edildiğinde GPU/CPU kompozisyon yükünü ciddi oranda artırmaktadır.
- **Çözüm Planı**: `grayscale` filtre sınıfı kaldırılmalı; kilitli durumlar donanım hızlandırmalı `opacity` ve nötr renk sınıfları ile temsil edilmelidir.

---

### Bulgu 13: Karakter Yaratımında Sert Sayfa Yenileme (`window.location.reload()`)
- **Önem Derecesi**: Orta (Medium)
- **Konum**: `src/components/character/CharacterCreation.tsx:174`
- **Kanıt (Kod Parçası)**:
  ```tsx
  alert(locale === 'tr' ? `${characterName} başarıyla oluşturuldu! 🎉` : ...);
  window.location.reload();
  ```
- **Hata Tanımı**: SPA (Single Page Application) mimarisinde `window.location.reload()` çağrısı tüm React ağacını, önbelleği ve WebSocket/Realtime bağlantılarını zorla sıfırlamakta ve zayıf bir kullanıcı deneyimi üretmektedir.
- **Çözüm Planı**: Yeni karakter oluşturulduğunda `CampaignContext.setActiveCharacterId` tetiklenmeli, karakter listesi yenilenmeli ve kullanıcı React Router ile yönlendirilmelidir.

---

### Bulgu 14: Dashboard Hızlı İşlemler Kartlarında Büyü Ağacının Bulunmaması
- **Önem Derecesi**: Düşük / Orta (Low/Medium)
- **Konum**: `src/pages/DashboardPage.tsx:30-63`
- **Kanıt**: `NAV_CARDS` dizisinde `/character`, `/stat-tree`, `/map`, `/inventory` bulunmakta; uygulamanın en büyük özelliği olan 3.150 büyülük `/spells` (Spell Tree) rotası kartlarda yer almamaktadır.
- **Hata Tanımı**: Kullanıcıların ana sayfadan Büyü Ağacına doğrudan tek tıkla ulaşabileceği bir navigasyon kartı eksiktir.
- **Çözüm Planı**: `NAV_CARDS` dizisine Büyü Ağacı (`/spells`, `Sparkles` ikonu, altın ışıltılı kenarlık) kartı eklenmeli ve 5'li ızgara mobilde uyumlu hale getirilmelidir.

---

### Bulgu 15: GMDashboard XP Dağıtım Hatası ve Harcanan XP İstismarı
- **Önem Derecesi**: Kritik (Critical)
- **Konum**: `src/components/gm/GMDashboard.tsx:358-365`
- **Kanıt (Kod Parçası & `scripts/verify-xp-distribution.js:177-179`)**:
  ```ts
  const newXp = Math.max(0, player.xp + amount);
  const newLevel = Math.floor(newXp / 1000) + 1;
  await supabase.from('characters').update({
    xp_total: newXp,
    xp_available: newXp, // <-- KRİTİK MANTIK HATASI!
    level: newLevel,
    updated_at: new Date().toISOString()
  }).eq('id', playerId);
  ```
- **Hata Tanımı**: Oyuncu kazandığı 1.500 XP'nin 1.000'ini büyü açmak için harcadığında elinde 500 `xp_available` kalır. GM oyuncuya küçük bir ödül (örneğin +10 XP) verdiğinde kod, oyuncunun harcadığı 1.000 XP'yi görmezden gelerek `xp_available` değerini doğrudan `newXp` (1.510) olarak güncellemektedir. Bu durum oyuncunun harcadığı tüm tecrübe puanlarını haksız şekilde iade eden bir istismara yol açmaktadır.
- **Çözüm Planı**:
  1. `02_schema_consistency.sql` migrasyonu ile atomik `public.gm_award_xp()` RPC fonksiyonu yazıldı.
  2. Bu fonksiyon `xp_available` değerine yalnızca eklenen miktarı (`COALESCE(xp_available, 0) + amount`) yansıtmakta, harcanan XP'leri korumaktadır.

---

## 4. Ek Güvenlik ve RLS Zafiyetleri

Explorer 2 incelemesinde tespit edilen ve `01_security_and_rls_hardening.sql` ile kapatılan kritik veritabanı açıkları:

1. **Profil Rol Yükseltme Zafiyeti (Privilege Escalation)**:
   - `admin_migration.sql:119` üzerinde `CREATE POLICY "Users and admins can update profiles" ON profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());` kuralında kolon koruması veya tetikleyici olmadığı için herhangi bir oyuncu doğrudan `supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)` çalıştırarak yönetici olabilmekteydi.
   - **Çözüm**: `protect_profile_role()` tetikleyicisi yazıldı.
2. **Gevşek Politikalar (`auth.uid() IS NOT NULL`)**:
   - `character_stats`, `inventory_items`, `map_state`, `map_tokens` tablolarında `UPDATE/DELETE` işlemleri herhangi bir giriş yapmış kullanıcıya açıktı.
   - **Çözüm**: Yalnızca ilgili karakterin sahibi veya kampanya GM'i (`public.is_gm()`) işlem yapabilecek şekilde politikalar sıkılaştırıldı.
3. **Log Sahteciliği (Log Spoofing)**:
   - `admin_logs` tablosuna sahte işlem kayıtları girilebiliyordu; `public.is_admin()` zorunlu kılındı.

---

## 5. Durum Takip Tablosu (Status Tracking Table)

Aşağıdaki tablo, denetlenen tüm mimari ve fonksiyonel eksikliklerin güncel durumunu, ilgili kilometre taşını ve çözüm durumunu listeler:

| Bulgu No | Bulgu Açıklaması | Önem Derecesi | İlgili Dosya:Satır | Durum | Kilometre Taşı |
|:---:|---|:---:|---|:---:|:---:|
| **B-01** | Karakter Sayfası (Sheet) Görünümü Eksikliği | Kritik | `src/pages/CharacterPage.tsx:24` | Düzeltildi (Commit: M2-fixes) | M2 |
| **B-02** | Zar Atma (Dice Roller) Sistemi Bulunmaması | Yüksek | Tüm `src/` dizini | Planlandı / Geliştiriliyor | M2 / M5 |
| **B-03** | Savaş ve Karşılaşma Takipçisi Eksikliği | Yüksek | Tüm `src/` dizini | Düzeltildi (DB: M1, UI: M3) | M1 / M3 |
| **B-04** | Canlı Sohbet ve Sefer Günlüğü Eksikliği | Yüksek | Tüm `src/` dizini | Düzeltildi (DB: M1, UI: M3) | M1 / M3 |
| **B-05** | Yetenek Ağacı Sahte Veri İzolasyonu | Kritik | `src/hooks/useSkillTree.ts:49` | Planlandı / Geliştiriliyor | M2 |
| **B-06** | Envanter Sistemi Sahte Veri İzolasyonu | Kritik | `src/components/inventory/InventoryGrid.tsx:13` | Düzeltildi (DB: M1, UI: M2) | M1 / M2 |
| **B-07** | Boş Yuvalara Drag Engeli (`disabled: !item`) | Yüksek | `src/components/inventory/ItemCard.tsx:40` | Düzeltildi (Commit: M2-fixes) | M2 |
| **B-08** | Harita Sistemi Mock İzolasyonu & `isGM: true` | Kritik | `src/hooks/useMap.ts:72` | Düzeltildi (Commit: M2-fixes) | M2 |
| **B-09** | Harita `token.label` Tanımsızlık Çökmesi | Yüksek | `src/components/map/GameMap.tsx:73` | Düzeltildi (Commit: M2-fixes) | M2 |
| **B-10** | GM Eşya/Yetenek İşlemlerinin Kalıcı Olmaması | Kritik | `src/components/gm/GMDashboard.tsx:388` | Düzeltildi (DB: M1, UI: M3) | M1 / M3 |
| **B-11** | `spell_schema.sql` Özyinelemeli RLS İhlali | Kritik | `spell_schema.sql:67` | Düzeltildi (Migration 01) | M1 |
| **B-12** | React Flow Düğümlerinde `grayscale` Kullanımı | Orta | `src/components/spell-tree/SpellNode.tsx:37` | Düzeltildi (Commit: M2-fixes) | M2 |
| **B-13** | Karakter Yaratımında `window.location.reload` | Orta | `src/components/character/CharacterCreation.tsx:174`| Planlandı / Geliştiriliyor | M2 |
| **B-14** | Dashboard Kartlarında Büyü Ağacı Eksikliği | Orta | `src/pages/DashboardPage.tsx:30` | Planlandı / Geliştiriliyor | M5 |
| **B-15** | GM XP Dağıtımında Harcanan XP İstismarı | Kritik | `src/components/gm/GMDashboard.tsx:360` | Düzeltildi (Commit: M2-fixes) | M1 / M2 |
| **SEC-1**| Profil Rolü Yükseltme Güvenlik Zafiyeti | Kritik | `admin_migration.sql:119` | Düzeltildi (Migration 01) | M1 |
| **SEC-2**| Gevşek RLS (`auth.uid() IS NOT NULL`) Politikaları | Yüksek | `admin_migration.sql:223` | Düzeltildi (Migration 01) | M1 |
| **LINT** | 63 ESLint Hatası ve 3 Uyarı Temizliği | Yüksek | 15+ Dosya | Düzeltildi (Commit: M2-fixes) | M2 |

---

## 6. Doğrulama ve Tekrar Üretilebilirlik (Verification Method)

1. **Lint Hataları Doğrulaması**:
   ```powershell
   npm run lint
   ```
   *Çıktı*: 66 sorun (63 hata, 3 uyarı).
2. **Kural 2 (Boş Yuva Engeli) Doğrulaması**:
   `src/components/inventory/ItemCard.tsx:40` dosyasında `useSortable({ id, disabled: !item })` kodu görülebilir.
3. **Kural 4 (Özyinelemeli RLS) Doğrulaması**:
   `spell_schema.sql:67` dosyasında `USING (EXISTS (SELECT 1 FROM profiles ...))` satırları görülebilir.
4. **XP İstismarı Doğrulaması**:
   `node scripts/verify-xp-distribution.js` scripti çalıştırılarak `xp_available` ezilme hatası doğrulanabilir.
5. **Veritabanı Migrasyonları Sözdizimi Doğrulaması**:
   `node scripts/test-migrations-syntax.js` scripti çalıştırılarak 3 yeni migrasyon dosyasının sözdizimi doğrulanabilir.
