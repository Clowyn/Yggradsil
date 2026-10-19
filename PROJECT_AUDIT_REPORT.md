# D&D KAMPANYA YÖNETİM PLATFORMU
## Kapsamlı Mimari, Güvenlik, Veritabanı ve Rol Yapma Mekanikleri Teknik Denetim Raporu

**Tarih:** 16 Ekim 2026  
**Denetim Kapsamı:** `d:\DnD` Deposu Uçtan Uca Teknik ve Ürün Denetimi  
**Çalışma Modu:** main dalı (Geri Alınabilir Kontrol Noktaları, Salt Okunur Kod İncelemesi)  
**Yönetici Kılavuz:** `.agents/AGENTS.md`, `.agents/teamwork/ORIGINAL_REQUEST.md`  
**Raporlama Dili:** Türkçe  

---

## YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)

Bu denetim raporu; React 19, TypeScript, Vite, TailwindCSS v4, React Flow (`@xyflow/react`), Framer Motion, `@dnd-kit` ve Supabase teknolojileriyle inşa edilen, koyu fantezi (dark fantasy) temalı D&D Sefer Yönetim Platformunun (`d:\DnD`) kapsamlı teknik ve ürün denetimini sunmaktadır.

Denetim; uygulamanın derleme ve lint bütünlüğünü, istemci mimarisini ve çift kabuklu (dual-shell) gezinme yapısını, özel React hook'larını, durum yönetimini, 13 adet SQL şeması/migrasyon dosyasını, 31 adet veritabanı tablosunu, Supabase Satır Düzeyi Güvenlik (RLS) politikalarını, TypeScript tip arayüzlerini, D&D 5e mekanik kurallarını ve Playwright uçtan uca (E2E) test altyapısını ayrıntılı olarak incelemiştir.

### Temel Kritik Bulgular Özeti
1. **Çalışma Zamanını Bozan Kritik Kolon Uyuşmazlığı (`CharacterSheet.tsx:92`):**  
   Karakter sayfasında `item_definitions` tablosundan var olmayan `name` kolonu sorgulanmaktadır (`name_tr` ve `name_en` bulunmaktadır). PostgREST `42703 (undefined_column)` hatası üretmekte, bu hata sessizce yutularak yedek sahte eşyalar (`Reforged Longsword`, `Shadowmail Vestment`) render edilmektedir. Oyuncuların gerçek envanterleri föyde hiçbir zaman görüntülenememektedir.
2. **Kritik Yetki Denetimi İhmali ve RPC Açığı (`07_gm_bulk_teach_spells.sql:9-48`):**  
   Veritabanı sahibi yetkisiyle çalışan (`SECURITY DEFINER`) `public.gm_teach_spells` ve `public.gm_forget_spells` fonksiyonları `anon` ve `authenticated` rollerine açılmış; ancak fonksiyon gövdelerinde Zindan Yöneticisi (`public.is_gm()`) rol kontrolü unutulmuştur. Anonim veya oyuncu yetkisine sahip herhangi bir istemci, Seferdeki tüm karakterlerin büyülerini uzaktan tek bir RPC çağrısıyla silebilmektedir.
3. **Açık Bırakılmış Tehlikeli RLS Politikaları (`auth.uid() IS NOT NULL`):**  
   `campaign_maps`, `combat_arenas` ve `combat_arena_participants` tablolarında `UPDATE` veya `FOR ALL` kuralları `auth.uid() IS NOT NULL` olarak yapılandırılmıştır. Oturum açmış herhangi bir oyuncu diğer GM'lerin haritalarını tahrif edebilmekte (`04_map_library_and_movement.sql:44-47`) veya arenadaki rakip gladyatörlerin canını sıfırlayıp silebilmektedir (`05_combat_arena_engine.sql:81-85`). Ayrıca `session_chronicles` tablosunda yayınlanan günlüklerin `gm_secrets` alanı doğrudan oyunculara sızmaktadır.
4. **İllüzyon Mekanikleri ve Veritabanı Kopukluğu:**  
   Yggdrasil Yetenek Ağacı (`useSkillTree.ts`), 24 Slotlu Envanter Izgarası (`InventoryGrid.tsx`), Sefer Günlükleri (`DashboardPage.tsx`), Savaş Arenası Başlangıç Kadrosu (`ArenaPage.tsx`) ve GM Atmosfer Ses Çaları (`GMAtmosphereManager.tsx`) veritabanına bağlı olmayıp tamamen sabit/sahte (mock) verilerle çalışmaktadır. GM panelinde (`GMDashboard.tsx`) oyunculara verilen eşyalar ve yetenekler yalnızca React yerel state'ine yazılmakta, sayfa yenilendiğinde yok olmaktadır.
5. **Kod Tabanında Unutulmuş Ölü Bileşenler:**  
   Projede hiçbir sayfaya bağlanmamış 4 adet atıl bileşen (`GMItemManager.tsx`, `PlayerManager.tsx`, `XPDistributor.tsx`, `MapToken.tsx`) bulunmaktadır.
6. **Kullanıcı Deneyimi ve Hata Yönetimi Açıkları:**  
   Uygulama genelinde tek bir React `ErrorBoundary` bulunmamaktadır. Beklenmeyen bir grafik veya canvas hatası tüm uygulamayı beyaz ekrana düşürmektedir. Koyu fantezi atmosferi yerine 26 farklı noktada tarayıcıyı kilitleyen ilkel `alert(...)` diyalogları kullanılmaktadır.

---

# BÖLÜM 1: PROJE GENEL İNCELEMESİ VE MEVCUT MİMARİ DURUM

## 1.1 Teknoloji Yığını (Technology Stack)

Proje, modern web standartları ve performans odaklı kütüphaneler üzerine inşa edilmiştir:

| Katman / Kütüphane | Versiyon | Görevi ve Projedeki Kullanımı |
|---|---|---|
| **React** | `19.2.6` | Kullanıcı arayüzü motoru, React Server Components uyumlu en güncel sürüm. |
| **TypeScript** | `6.0.2` | Tip güvenliği (`verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`). |
| **Vite** | `8.0.12` | Hızlı HMR, Rollup tabanlı derleyici ve ESM paketleyici. |
| **TailwindCSS** | `v4.3.0` | CSS derleme motoru; `@tailwindcss/vite` eklentisiyle derlenir, `@theme` ile özel token'lar üretir. |
| **@xyflow/react** | `12.11.0` | React Flow graf motoru; Büyü Grimoire'ı ve Yggdrasil Stat Ağacı düğüm haritalarını çizer. |
| **@supabase/supabase-js** | `2.107.0` | PostgreSQL veritabanı, Row Level Security, RPC ve Realtime WebSocket istemcisi. |
| **Framer Motion** | `12.38.0` | Koyu fantezi mikro-etkileşimleri, modal geçişleri ve Floating Dock yay fiziği animasyonları. |
| **@dnd-kit/core & sortable** | `6.3.1` | 24 slotlu sabit RPG envanter ızgarasında sürükle-bırak ve slot takası (swap) motoru. |
| **Lucide React** | `1.16.0` | Koyu fantezi ikonografisi. |

---

## 1.2 Derleme ve Statik Kod Analizi Tanı Çıktıları (Build & Lint Diagnostics)

Proje üzerinde komut satırı aracılığıyla sıfır tahribat ilkesiyle (`non-destructive`) derleme ve lint kontrolleri koşturulmuştur:

### A. Üretim Derlemesi Tanısı (`npm run build`)
- **Çalıştırılan Komut:** `npm run build` (`tsc -b && vite build`)
- **Çıkış Kodu:** `0` (Başarılı)
- **Derleme Süresi:** 1.58 saniye
- **Dönüştürülen Modül Sayısı:** 2,430 modül
- **TypeScript Derlemesi:** `tsc -b` sıfır hata ile tamamlandı.
- **Rollup / Vite Üretim Çıktısı:** 0 hata, 0 uyarı.

#### Paket ve Chunk Boyut Dağılımı Tablosu:
| Çıktı Dosyası (Asset / Chunk) | Ham Boyut (Raw) | Sıkıştırılmış Boyut (Gzip) | Tür ve İçerik |
|---|---|---|---|
| `dist/index.html` | 2.05 kB | 0.74 kB | Kök HTML giriş noktası |
| `dist/assets/vendor-xyflow-DtxX27Jz.css` | 15.41 kB | 2.56 kB | React Flow stilleri |
| `dist/assets/index-B_b8y0fR.css` | 197.44 kB | 24.05 kB | Tailwind v4 derlenmiş koyu fantezi teması ve sınıfları |
| `dist/assets/vendor-react-Ds3HLuqZ.js` | 230.99 kB | 73.89 kB | React 19, React DOM, React Router v7, Scheduler |
| `dist/assets/vendor-supabase-C9YTnhaN.js` | 199.77 kB | 51.03 kB | `@supabase/supabase-js` istemci kütüphanesi |
| `dist/assets/vendor-xyflow-DAg3NMKr.js` | 175.20 kB | 56.60 kB | `@xyflow/react` graf motoru çekirdeği |
| `dist/assets/GMPage-B2lexZqE.js` | 143.97 kB | 28.79 kB | GM Odası ve modülleri (`GMDashboard`, `GMSpellManager`, `GMCombatTracker`, vb.) |
| `dist/assets/proxy-OrN1SCOk.js` | 121.20 kB | 39.33 kB | Framer Motion animasyon motoru |
| `dist/assets/ArenaPage-DRnJWAxv.js` | 67.05 kB | 15.98 kB | 4v4 Sıra tabanlı taktiksel muharebe arenası motoru |
| `dist/assets/InventoryPage-DEEIRdoF.js` | 55.62 kB | 17.58 kB | 24 Slotlu sabit RPG envanter ızgarası (`@dnd-kit`) |
| `dist/assets/CharacterPage-DGjjkHl3.js` | 43.98 kB | 12.21 kB | Karakter Föyü ve 4 Adımlı Karakter Yaratım Sihirbazı |
| `dist/assets/constants-UAh3EppO.js` | 37.00 kB | 10.17 kB | Alt sınıf ve kategori veri tabloları |
| `dist/assets/MapPage-Dsf4qQVa.js` | 29.32 kB | 8.22 kB | Canvas Savaş Haritası, Savaş Sisi (Fog of War) |
| `dist/assets/SkillTreePage-D-7v1JYs.js` | 20.57 kB | 7.10 kB | Yggdrasil Stat Ağacı graf görünümü |
| `dist/assets/CampaignsPage-BvZKEBxA.js` | 19.50 kB | 4.86 kB | Admin Sefer Yönetimi |
| `dist/assets/DashboardPage-CHJYLPFe.js` | 19.49 kB | 5.81 kB | Sefer Masası / Ana Sefer Paneli |
| `dist/assets/ItemCatalogPage-BKXriuis.js` | 19.41 kB | 4.13 kB | Admin Eşya Kataloğu |
| `dist/assets/SpellTreePage-BpBVffaS.js` | 19.01 kB | 6.27 kB | Büyü Grimoire React Flow ağaç görünümü |
| `dist/assets/CharactersPage-SKgxD3MC.js` | 16.68 kB | 4.38 kB | Admin Karakter Yönetimi |
| `dist/assets/LoginPage-Boy2lCzj.js` | 14.54 kB | 3.31 kB | Kimlik doğrulama portalı |
| `dist/assets/AppLayout-CuMNJL7X.js` | 14.82 kB | 4.55 kB | Ana uygulama gezinme kabuğu |
| `dist/assets/AdminDashboardPage-Ci3IydKI.js` | 12.64 kB | 2.99 kB | Admin Genel Bakış paneli |
| `dist/assets/UsersPage-C4BP_Jhv.js` | 8.06 kB | 3.07 kB | Admin Kullanıcı Yönetimi |
| `dist/assets/AdminTable-Dw3HEC9L.js` | 7.24 kB | 2.18 kB | Admin jenerik tablo bileşeni |
| `dist/assets/LogsPage-Be809hoq.js` | 6.43 kB | 2.24 kB | Admin Güvenlik Denetim Günlüğü |
| `dist/assets/AdminLayout-D3Xshvat.js` | 6.21 kB | 2.09 kB | Admin yerleşim kabuğu |

#### Paket Boyutu Analizi:
- **İlk Yükleme Boyutu (Initial Load Bundle - Dashboard `/`):**
  - İndirilen parçalar: `index.html` (0.74 kB gzip) + `index.css` (24.05 kB gzip) + `vendor-react` (73.89 kB gzip) + `vendor-supabase` (51.03 kB gzip) + `AppLayout` (4.55 kB gzip) + `DashboardPage` (5.81 kB gzip) + paylaşılan ikon/yardımcılar (~10 kB gzip).
  - **Toplam İlk Yükleme (Gzip):** ~**170.07 kB** (Ham: ~685 kB).
- **Tüm Rotalar ve Kütüphaneler Dahil Toplam Paket Boyutu:**
  - Ham (Raw): ~1,150 kB
  - Sıkıştırılmış (Gzip): ~342 kB
- **Vite Chunking Değerlendirmesi:** `vite.config.ts:13-26` satırlarında tanımlanan `manualChunks` ile `vendor-react`, `vendor-xyflow` ve `vendor-supabase` başarılı bir şekilde ayrıştırılmıştır. `App.tsx` içindeki dinamik `lazy()` importları sayesinde oyuncular admin sayfalarını veya GM panelini asla indirmemektedir.

### B. Kod Kalitesi ve Lint Tanısı (`npm run lint`)
- **Çalıştırılan Komut:** `npm run lint` (`eslint .`)
- **Çıkış Kodu:** `0` (Başarılı)
- **Sonuç:** 0 hata, 0 uyarı.
- **Yapılandırma:** ESLint Flat Config (`eslint.config.js`) üzerinde `@eslint/js`, `typescript-eslint` ve `eslint-plugin-react-hooks` kuralları eksiksiz işletilmektedir.

---

## 1.3 Proje Dizin Yapısı ve Çift Kabuklu (Dual-Shell) Gezinme Mimarisi

Uygulama, rol ayrımını ve kullanıcı arayüzünü iki bağımsız kabuk (`shell`) üzerinden yönetir:

```
src/
├── components/
│   ├── admin/           # AdminLayout, AdminSidebar, AdminTable, StatCard
│   ├── character/       # CharacterSheet, CharacterCreation (4 adımlı sihirbaz)
│   ├── common/          # ArcaneLoadingFallback, LanguageToggle, GlassModal
│   ├── gm/              # GMDashboard, GMSpellManager, GMCombatTracker, GMAtmosphereManager, GMLootDispenser
│   ├── inventory/       # InventoryGrid (24 slot), ItemCard, inventoryConstants
│   ├── layout/          # AppLayout, Header, Sidebar (mobil çekmece), FloatingDock (macOS ada dock), ProtectedRoute
│   ├── map/             # GameMap (HTML5 canvas), MapControls, Fog of War
│   └── spell-tree/      # SpellTreeGraph, SpellNode, SpellEdge, YggdrasilTree, SkillNode, SkillEdge
├── contexts/            # AuthContext, CampaignContext
├── hooks/               # useSkillTree, useSpellTree, useMap, useAdmin*
├── pages/               # DashboardPage, CharacterPage, ArenaPage, GMPage, admin/*
├── lib/                 # supabase.ts, types.ts, audio.ts
├── App.tsx              # Rota tanımları, lazy loading ve Suspense
└── index.css            # Tailwind v4 tema değişkenleri ve animasyonlar
```

### Rota Hiyerarşisi (`src/App.tsx:35-96`)

```
Kök Rota (Browser Root)
├── /login ────────────────────────── [Açık Rota] LoginPage
│
├── AppLayout Kabuğu ──────────────── [Korumalı: Authenticated]
│   ├── / ─────────────────────────── Sefer Masası (DashboardPage)
│   ├── /dashboard ────────────────── Dashboard Takma Adı (DashboardPage)
│   ├── /character ────────────────── Karakter Föyü ve Yaratım Sihirbazı (CharacterPage)
│   ├── /stat-tree ────────────────── Yggdrasil Stat Ağacı (SkillTreePage)
│   ├── /spells ───────────────────── Büyü Grimoire Ağacı (SpellTreePage)
│   ├── /map ──────────────────────── Taktiksel Savaş Haritası (MapPage)
│   ├── /inventory ────────────────── 24 Slotlu RPG Çantası (InventoryPage)
│   ├── /arena ────────────────────── 4v4 Sıra Tabanlı Muharebe Arenası (ArenaPage)
│   └── /gm ───────────────────────── [Korumalı: requireGM] Zindan Yöneticisi Odası (GMPage)
│
├── AdminLayout Kabuğu ────────────── [Korumalı: requireAdmin]
│   ├── /admin ────────────────────── Sistem İstatistikleri (AdminDashboardPage)
│   ├── /admin/users ──────────────── Kullanıcı ve Rol Yönetimi (UsersPage)
│   ├── /admin/characters ─────────── Karakter Listesi ve Transfer (CharactersPage)
│   ├── /admin/campaigns ──────────── Seferler ve GM Atama (CampaignsPage)
│   ├── /admin/items ──────────────── Eşya Kataloğu Tanımları (ItemCatalogPage)
│   └── /admin/logs ───────────────── Güvenlik Denetim Kütüğü (LogsPage)
│
└── * ─────────────────────────────── Yakalanmayan Rotalar (Redirect: /)
```

### Çift Kabuklu Gezinme Analizi:
1. **Oyuncu Kabuğu (`AppLayout.tsx:1-33`):**  
   - Masaüstünde ekranın altında asılı duran, yay fiziğine (`framer-motion`) sahip, aktif sayfa noktası barındıran ada doku (`FloatingDock.tsx:98-186`).
   - Mobilde ekran genişliği `<768px` olduğunda dock gizlenir, `Header.tsx` üzerindeki antik kabartmalı hamburger butonu ile 280px genişliğinde `Sidebar.tsx` çekmecesi açılır. Sayfa değiştiğinde çekmece otomatik kapanır.
   - Üst bilgi çubuğu (`Header.tsx:31-143`); aktif sefer rozeti, ses açma/kapama, GM için karakter seçici açılır menüsü, dil değiştirici (TR/EN) ve güvenli çıkış butonunu barındırır.
2. **Yönetici Kabuğu (`AdminLayout.tsx:1-50`):**  
   - Oyun arayüzünden tamamen yalıtılmış obsidyen ve kızıl temalı yönetim konsolu. `AdminSidebar.tsx:59-161` paneli 260px'den 72px ikon moduna daralabilir ve tek tıkla "Oyuna Dön" köprüsü sunar.
3. **Erişim Güvenliği (`ProtectedRoute.tsx:1-27`):**  
   - Oturum doğrulanırken tam ekran `<ArcaneLoadingFallback message="VERIFYING SANCTUARY..." />` gösterilir.
   - Oturumu olmayanlar anında `/login` sayfasına yönlendirilir (`replace: true`).
   - Oyuncu rolündeki kullanıcılar `/gm` veya `/admin` rotalarına girmeye çalıştığında yetkisiz erişim engellenerek ana sayfaya (`/`) yönlendirilir.

---

## 1.4 Özel Hook'lar (Custom Hooks) ve Ağ Çağrıları Analizi

| Hook Dosyası | Sorumluluk Alanı | Durum Yönetimi | Supabase / Ağ Çağrıları | Tespit Edilen Riskler ve Açıklar |
|---|---|---|---|---|
| `useSkillTree.ts` (`src/hooks/useSkillTree.ts:222-438`) | 6 temel nitelik (STR, DEX, CON, INT, WIS, CHA) için Yggdrasil ağaç düğümlerini üretir. | `unlockedSkills: Set<string>`, `xp: number` | **YOK.** Veritabanı sorgusu içermez. | **KRİTİK MOCK:** Tamamen sabit `DEMO_SKILLS` (24 yetenek) kullanır. Yetenek açıldığında yerel state güncellenir, DB'ye hiçbir şey yazılmaz. F5 yapıldığında sıfırlanır. |
| `useSpellTree.ts` (`src/hooks/useSpellTree.ts:460-916`) | Büyü ağaçları için yönlendirilmiş çevrimsiz graf (DAG) topolojisi kurar. | `spellTrees`, `spells`, `characterSpells`, önbellekler. | `spell_trees`, `spell_tree_assignments`, `spells`, `character_spells`, RPC `unlock_spell`. | Koordinat ve ağaç önbelleği ile optimize edilmiştir. Ancak hata durumunda ilkel `alert()` kullanır (`satır 655`). |
| `useMap.ts` (`src/hooks/useMap.ts:84-577`) | Harita kütüphanesi, serbest/onaylı hareket modları, token sürükleme, Savaş Sisi. | `maps`, `tokens`, `movementRequests`. | `campaign_maps`, `map_movement_requests`. Her iki tabloda Realtime abonelik. | **EPHEMERAL TOKENS:** Token koordinatları `map_tokens` tablosuna yazılmaz (`satır 307-313`), yalnızca React state güncellenir. Yenilemede tokenlar varsayılan konuma döner. |
| `useAdminCampaigns.ts` (`src/hooks/useAdminCampaigns.ts:12-366`) | Sefer oluşturma, GM değiştirme, silme etki analizi. | `campaigns`, `totalCount`, sayfalama. | `campaigns`, `campaign_members`, `characters`. | **ŞEMA ÇATIŞMASI:** Sefer oluştururken (`satır 127`) migration 04 ile terk edilen `map_state` tablosuna kayıt atar; `campaign_maps` boş kalır. |
| `useAdminCharacters.ts` (`src/hooks/useAdminCharacters.ts:6-326`) | Karakter listesi, kullanıcılar arası transfer, toplu seviye güncelleme. | `characters`, `totalCount`, filtreler. | `characters` (profile, campaign, race, subclass joinleri ile). | **N+1 DÖNGÜSÜ:** `bulkUpdateLevel` (`satır 262-271`) seçilen karakterleri `for` döngüsü içinde teker teker `update` eder. Tek bir toplu sorgu veya RPC kullanılmamıştır. |
| `useAdminItems.ts` (`src/hooks/useAdminItems.ts:6-204`) | Eşya kataloğu CRUD işlemleri, nadirlik ve tür filtreleri. | `items`, `totalCount`, filtreler. | `item_definitions` tablosunda Insert/Update/Delete. | `.or('name_en.ilike...,name_tr.ilike...')` ile çift dilli arama başarılı kurgulanmıştır. |
| `useAdminLogs.ts` (`src/hooks/useAdminLogs.ts:5-89`) | Sistem denetim kütüğü akışı. | `logs`, `totalCount`, filtreler. | `admin_logs` tablosu (`admin:profiles` ilişkisi ile). | `admin_logs_admin_id_fkey` yabancı anahtar kısıtlamasına bağımlıdır. |
| `useAdminStats.ts` (`src/hooks/useAdminStats.ts:5-110`) | Üst düzey metrik kartları ve istatistikler. | `stats: AdminStats`, `recentLogs`. | `profiles`, `characters`, `campaigns`, `item_definitions`, `spells`. | **BELLEK TÜKETİMİ:** Satır 24'te `supabase.from('profiles').select('role')` tüm profil kayıtlarını bellek içine çeker. Kullanıcı sayısı arttığında tarayıcı çöker. |
| `useAdminUsers.ts` (`src/hooks/useAdminUsers.ts:11-262`) | Kullanıcı rolleri değiştirme (admin/gm/player), hesap silme. | `users`, `totalCount`, sayfalama. | `profiles`, `characters`. | Kullanıcı silerken (`satır 194`) Edge Function dener, başarısız olursa doğrudan `profiles` siler. CASCADE kısıtlamaları eksikse hata verir. |

---

## 1.5 Global Durum Yönetimi (Global State Management)

Uygulamanın durum yönetimi `src/contexts/` altında iki temel React Context sağlayıcısı ile yürütülmektedir:

### A. `AuthContext.tsx` (`src/contexts/AuthContext.tsx:1-262`)
- **Yönetilen Durum:** `user`, `profile`, `isAdmin`, `isGM`, `loading`, `locale`, `setLocale`, `signIn`, `signUp`, `signOut`.
- **Eşzamanlı İstek Tekilleştirme:** Satır 40'ta `inFlightProfileFetchRef = useRef<Map<string, Promise<Profile | null>>>(new Map())` kullanılarak sayfa ilk açıldığında veya sekme odaklandığında tetiklenen çoklu profil sorguları tekilleştirilmiştir.
- **Otomatik Profil Sağlama (Auto-Provisioning):** Satır 66-98: Supabase Auth'ta oturum açmış ancak `profiles` tablosunda kaydı bulunmayan kullanıcılar için toplam profil sayısı kontrol edilir. Eğer veritabanı boşsa (`count === 0`), kullanıcıya `'admin'` rolü verilir; aksi halde `'player'` atanır.
- **Yarış Durumu (Race Condition) Riski:** Satır 202-214: `signUp` metodunda istemci tarafı profil sayısını sorgulayıp rol belirler. İki kullanıcı veritabanı boşken aynı anda kayıt olursa ikisi de admin rolü alabilir. Bu mantık veritabanı trigger'ı seviyesinde korunmalıdır.

### B. `CampaignContext.tsx` (`src/contexts/CampaignContext.tsx:1-439`)
- **Yönetilen Durum:** `campaign`, `members`, `characters`, `activeCharacterId`, `setActiveCharacterId`, `loading`.
- **Ağ Şelalesi Engelleme (Waterfall Elimination):** Satır 181-206: `Promise.all` kullanılarak sefer bilgisi, üyeler ve karakterler eşzamanlı çekilir.
- **Realtime WebSocket Senkronizasyonu:** Satır 291-337: `characters` tablosundaki `campaign_id=eq.${campaign.id}` filtresine PostgreSQL değişiklik kanalı (`postgres_changes`) açılır. Karakter seviye atladığında veya canı değiştiğinde tüm oyuncuların föyü anında güncellenir.
- **Aktif Karakter Belleği:** Aktif karakter kimliği `localStorage` (`dnd_active_character_id`) üzerinde saklanır. Karakter silinirse veya başka hesaba geçilirse otomatik olarak geçerli karaktere düşülür (`fallback`).

---

## 1.6 React Flow Graf ve Düğüm Mimarisi

Büyü Kitabı (`SpellTreeGraph.tsx`) ve Dünya Ağacı (`YggdrasilTree.tsx`) bileşenleri `@xyflow/react` kütüphanesi üzerinde özel düğüm ve kenarlarla render edilir:

1. **Düğüm Bileşenleri:**
   - `SpellNode.tsx:69-266` ve `SkillNode.tsx:71-150`: Koyu fantezi altın çerçeveli, seviye ve durum göstergeli özel düğümler.
   - `.agents/AGENTS.md` kuralına tam uyum sağlanarak React Flow'un mutlak konumlandırma motoruyla çakışmaması için en dış `.react-flow__node` elemanlarına asla doğrudan CSS `transform` verilmemiştir.
2. **Kenar Bileşenleri ve SVG SMIL Optimizasyonu:**
   - `SpellEdge.tsx:44-96` ve `SkillEdge.tsx:42-90`: Büyüler ve yetenekler arasındaki bağlantı yolları.
   - `isUnlocked && !isDimmed` koşuluna bağlanarak karartılmış veya kapalı yollarda `<animateMotion>` parçacık döngüleri kapatılmıştır. Böylece 100+ düğümlü ağaçlarda CPU ve GPU tüketimi engellenmiştir.
3. **Ekran Dışı Ayıklama (Culling):**
   - Hem `SpellTreeGraph.tsx:457` hem de `YggdrasilTree.tsx:110` üzerinde `onlyRenderVisibleElements={true}` bayrağı aktiftir. Görünüm alanının dışındaki düğümler DOM'dan çıkarılmaktadır.

---

## 1.7 Veritabanı ve Migrasyon Altyapısı Genel Durumu

Veritabanı katmanında kök dizinde 6 SQL dosyası, `supabase/migrations/` altında 7 SQL dosyası olmak üzere toplam **13 adet SQL şeması/migrasyonu** ve **31 adet tablo** yer almaktadır.

- **Temel Tablolar (15 Tablo - `schema.sql`):** `profiles`, `campaigns`, `campaign_members`, `class_categories`, `subclass_definitions`, `race_tiers`, `race_definitions`, `characters`, `character_stats`, `skill_definitions`, `character_skills`, `item_definitions`, `inventory_items`, `map_state`, `map_tokens`.
- **Yönetim ve Büyü Tabloları (5 Tablo - `admin_migration.sql`, `spell_schema.sql`):** `admin_logs`, `spell_trees`, `spell_tree_assignments`, `spells`, `character_spells`.
- **Yeni Modül ve Sistem Tabloları (11 Tablo - `supabase/migrations/02-05`):** `xp_ledger`, `campaign_encounters`, `encounter_combatants`, `campaign_environments`, `session_chronicles`, `campaign_loot_chests`, `campaign_maps`, `map_movement_requests`, `combat_arenas`, `combat_arena_participants`, `combat_arena_logs`.

---

## 1.8 Test Altyapısı ve Doğrulama Durumu (Playwright Test Suite)

Playwright uçtan uca test paketi (`tests/e2e/`), 4 dosyada toplam **46 adet test senaryosu** barındırmaktadır:

1. `tests/e2e/01-route-health.spec.ts` (11 Test): Zindan Yöneticisi ve Oyuncu oturumu ile tüm temel rotaların konsol hatası vermeden açıldığını denetler.
2. `tests/e2e/02-gm-modules-crud.spec.ts` (3 Test): Karşılaşma Takipçisi, Atmosfer & Günlük ve Sandık modüllerinin UI üzerinden veri ekleme/güncelleme/silme döngüsünü ve sayfa yenileme sonrası kalıcılığını denetler.
3. `tests/e2e/03-player-security-rls.spec.ts` (19 Test): Oyuncu hesabının GM panellerine UI erişiminin engellendiğini ve 5 GM tablosuna doğrudan Supabase üzerinden yazma denemelerinin RLS tarafından reddedildiğini (`42501`) kanıtlar.
4. `tests/e2e/04-bug-regressions.spec.ts` (13 Test): Envanter boş slot sürükleme hedefleri, harita etiketi boş değer güvenliği ve XP ekleme matematiği gerileme testleri.

### Test Koşumu Bütünlüğü ve Kapsama Açıkları:
- **Gerçek Kimlik Doğrulama:** `tests/e2e/helpers/auth.ts:44-59` sahte anon key enjeksiyonunu tamamen yasaklamıştır. `.env.local` içinde `E2E_GM_EMAIL` ve `E2E_PLAYER_EMAIL` kimlik bilgileri tanımlı olmadığında test paketi sessizce geçmek yerine açıkça hata (`[AUTHENTICATION ERROR]`) fırlatmaktadır.
- **Sessiz Geçişlerin Kaldırılması:** Tablo yoksa testi erken sonlandıran `return` blokları temizlenmiştir.
- **Tespit Edilen Test Kapsama Açıkları:**
  1. `01-route-health.spec.ts:18-27` ve `63-71` listelerinde `/arena` rotası **tamamen unutulmuştur**. Ne GM ne de Oyuncu hesabı arenayı test etmemektedir.
  2. Admin alt rotaları (`/admin/users`, `/admin/characters`, `/admin/campaigns`, `/admin/items`, `/admin/logs`) sağlık taramasına dahil edilmemiştir; yalnızca `/admin` açılmaktadır.

---

# BÖLÜM 2: TESPİT EDİLEN EKSİKLER

Bu bölümde; kod tabanında yarım bırakılmış, entegre edilmemiş bileşenler, sahte (mock) veri bağımlılıkları, veritabanına bağlanmamış arayüz eylemleri ve hata yakalama boşlukları incelenmiştir.

## 2.1 Yarım Kalmış ve Entegre Edilmemiş Bileşenler (Unintegrated Components)

Kod tabanında geliştirilmiş ancak hiçbir rota, sayfa veya üst bileşen tarafından `import` edilmeyerek depoda unutulmuş **4 adet ölü bileşen** tespit edilmiştir:

| Dosya Yolu | Satır Sayısı | Bileşen Amacı | Neden Entegre Edilmedi? (Teknik Neden) |
|---|---|---|---|
| `src/components/inventory/GMItemManager.tsx` | 293 satır | Zindan Yöneticisinin oyunculara eşya dağıtması için tasarlanmış bağımsız eşya paneli. | `GMDashboard.tsx` kendi içinde basitleştirilmiş bir envanter sekmesi kurgulamış; bu 293 satırlık zengin bileşen dışarıda unutulmuştur. Eşya verme eylemi satır 74'te sadece `console.log('📦 Giving item...')` çalıştırmaktadır. |
| `src/components/gm/PlayerManager.tsx` | 266 satır | Seferdeki oyuncuları, can durumlarını, pasif algılarını ve durum etkilerini yöneten parti paneli. | `GMDashboard.tsx` kendi "Party" sekmesini yazdığı için bu bileşen atıl kalmıştır. İçinde `DEMO_PLAYERS` (Kael, Lyria, Thorne) sahte verileri yer almaktadır. |
| `src/components/gm/XPDistributor.tsx` | 215 satır | Oyunculara toplu XP paylaştırma aracı (canavar öldürme, görev tamamlama vb.). | `GMDashboard.tsx:356` kendi içinde doğrudan XP güncelleme fonksiyonu yazdığı için bu araç menülere bağlanmamıştır. Sabit sahte liste üzerinde çalışır. |
| `src/components/map/MapToken.tsx` | 38 satır | Savaş haritası için DOM/HTML tabanlı mutlak konumlandırılmış token prototipi. | `src/components/map/GameMap.tsx` tokenları DOM elemanı yerine doğrudan HTML5 `<canvas>` üzerine 60 FPS döngüsüyle çizdiği için bu bileşen terkedilmiştir. |

---

## 2.2 Stub ve Mock Bırakılmış Fonksiyonlar ve Sistemler

Uygulamanın görsel olarak tamamlanmış izlenimi veren ancak arka planda sahte bellekle çalışan bileşenleri:

1. **Yggdrasil Stat Ağacı (`src/hooks/useSkillTree.ts:49-140` ve `src/components/skill-tree/YggdrasilTree.tsx:31-36`):**  
   - `YggdrasilTree.tsx:31` satırındaki yorum durumu özetlemektedir: `// Pass activeCharacterId to useSkillTree when implemented in backend`.
   - `useSkillTree.ts` parametresiz çalışır, 24 adet `DEMO_SKILLS` dizisini belleğe yükler, XP miktarını `useState(1500)` olarak başlatır. Yetenek açıldığında veritabanındaki `character_skills` tablosuna hiçbir kayıt atılmaz. Oyuncu sayfayı yenilediğinde veya karakter değiştirdiğinde tüm ilerleme silinir.
2. **24 Slotlu Envanter Izgarası (`src/components/inventory/InventoryGrid.tsx:28-44` ve `inventoryConstants.ts:4-93`):**  
   - Envanter ızgarası `inventoryConstants.ts` içindeki 8 adet `DEMO_ITEMS` verisiyle açılmaktadır.
   - Izgarada eşyalar taşındığında, kuşanıldığında veya yer değiştirildiğinde `supabase.from('inventory_items')` sorgulanmaz veya güncellenmez. Yapılan her değişiklik sayfadan çıkıldığında kaybolur.
3. **Karakter Föyü Envanter Fallback'i (`src/components/character/CharacterSheet.tsx:117-122`):**  
   - Var olmayan `item_definitions.name` kolonu sorgulandığı için gerçek envanter asla yüklenememekte; föy her zaman satır 117'deki 3 sabit eşyayı (`Reforged Longsword`, `Shadowmail Vestment`, `Ring of Minor Warding`) göstermektedir.
4. **Sefer Masası Günlükleri (`src/pages/DashboardPage.tsx:39-64`):**  
   - Ana ekrandaki sefer akışı `session_chronicles` tablosundan beslenmek yerine `Session VIII`, `Session VII`, `Session VI` ve `Session V` başlıklı 4 adet sabit sahte kayıt dizisinden (`ChronicleLog[]`) okunmaktadır.
5. **Savaş Arenası Gladyatörleri (`src/pages/ArenaPage.tsx:26-173`):**  
   - 4v4 Savaş Arenası başlatıldığında gerçek sefer karakterleri veya yaratık tabloları yerine sabit `ARCHETYPE_ROSTER` gladyatörleri (`p-blue-0` ila `p-red-3`) yüklenmektedir.
6. **GM Atmosfer Ses Butonu (`src/components/gm/GMAtmosphereManager.tsx:507-518`):**  
   - Ortam sesi panelindeki oynatıcı butonu Web Audio API'ye bağlı değildir. Butona basıldığında yalnızca `setIsPlayingAudio(!isPlayingAudio)` çalışarak ikonu yeşile döndürmekte, hoparlörden hiçbir ses çıkmamaktadır.

---

## 2.3 UI'da Başlatılıp Veritabanına Bağlanmamış Eylemler

1. **GM Eşya ve Yetenek Verme İşlemleri (`src/components/gm/GMDashboard.tsx:397-428`):**  
   - GM panelindeki "Inventory" ve "Party" sekmelerinden oyuncuya eşya (`addItem`) veya yetenek (`addSkill`) verildiğinde, `supabase.from('inventory_items').insert()` veya `supabase.from('character_skills').insert()` çağrıları yapılmamaktadır.
   - Değişiklik yalnızca yerel `setPlayers(...)` state'ine yazılmakta; sayfa yenilendiğinde veya realtime tetiklendiğinde (`fetchLiveCharacters()`, satır 345) GM'in verdiği eşyalar kaybolmaktadır.
2. **Harita Üzerinde Token Sürükleme (`src/hooks/useMap.ts:306-317`):**  
   - Zindan yöneticisi veya oyuncu harita üzerinde bir token'ı yeni koordinatlara sürüklediğinde `updateTokenPosition` fonksiyonu sadece `setTokens` React state'ini güncellemektedir. `map_tokens` tablosuna `UPDATE` gönderilmemektedir. Haritaya geri dönüldüğünde tokenlar başlangıç noktasına sıçramaktadır.
3. **Karakter Föyünde Can, Dinlenme ve Büyü Slotu:**  
   - Karakter föyünde hasar alma, iyileşme veya dinlenme (Short/Long Rest) eylemleri veritabanına bağlanmadığı gibi kullanıcı arayüzünde de bu butonlar yer almamaktadır.

---

## 2.4 Hata Yönetimi, Error Boundary ve İlkel `alert(...)` Kullanımı

### A. Global Error Boundary Eksikliği
`src/main.tsx` ve `src/App.tsx` incelendiğinde uygulamada hiçbir React `ErrorBoundary` bileşeni bulunmamaktadır. React Flow grafında oluşabilecek bir veri bozukluğu, Canvas haritasındaki bir webgl/bağlam hatası veya çözülemeyen bir Promise tüm React sanal DOM ağacını unmount etmekte ve kullanıcıyı simsiyah/beyaz boş bir ekranda bırakmaktadır.

### B. Kod Tabanındaki 26 Adet Tarayıcı `alert(...)` Çağrısı Listesi
Kullanıcıya bildirim vermek için koyu fantezi temalı toast/modal pencereler yerine tarayıcıyı donduran yerel `alert()` çağrıları kullanılmıştır:

| Dosya Yolu | Satır Numarası | alert İçi Mesaj / Kod |
|---|---|---|
| `src/hooks/useSpellTree.ts` | 655 | `alert('Failed to unlock spell. Please try again.');` |
| `src/components/gm/GMDashboard.tsx` | 433 | `alert('Please fill in all fields');` |
| `src/components/gm/GMDashboard.tsx` | 498 | `alert('Error creating character: ' + (err as Error).message);` |
| `src/components/character/CharacterCreation.tsx` | 77 | `alert(locale === 'tr' ? 'Oturum açmadınız!' : 'Not logged in!');` |
| `src/components/character/CharacterCreation.tsx` | 81 | `alert(locale === 'tr' ? 'Hikaye yükleniyor...' : 'Story is still loading...');` |
| `src/components/character/CharacterCreation.tsx` | 109 | `alert(locale === 'tr' ? 'Aktif hikaye bulunamadı!...' : 'No active story found!...');` |
| `src/components/character/CharacterCreation.tsx` | 172 | `alert(locale === 'tr' ? `${characterName} başarıyla oluşturuldu! 🎉` : ...);` |
| `src/components/character/CharacterCreation.tsx` | 178 | `alert(locale === 'tr' ? 'Karakter oluşturulurken hata oluştu.' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 332 | `alert('Cannot perform write operations in offline mock mode.');` |
| `src/components/gm/GMSpellManager.tsx` | 359 | `alert('Failed to save tree.');` |
| `src/components/gm/GMSpellManager.tsx` | 366 | `alert('Cannot perform write operations in offline mock mode.');` |
| `src/components/gm/GMSpellManager.tsx` | 386 | `alert('Cannot perform write operations in offline mock mode.');` |
| `src/components/gm/GMSpellManager.tsx` | 414 | `alert('Failed to save assignment.');` |
| `src/components/gm/GMSpellManager.tsx` | 421 | `alert('Cannot perform write operations in offline mock mode.');` |
| `src/components/gm/GMSpellManager.tsx` | 441 | `alert('Cannot perform write operations in offline mock mode.');` |
| `src/components/gm/GMSpellManager.tsx` | 448 | `alert(locale === 'tr' ? 'Etkiler JSON formatı geçersiz.' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 491 | `alert('Failed to save spell.');` |
| `src/components/gm/GMSpellManager.tsx` | 498 | `alert('Cannot perform write operations in offline mock mode.');` |
| `src/components/gm/GMSpellManager.tsx` | 699 | `alert(locale === 'tr' ? 'Büyü durumu güncellenirken hata oluştu.' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 729 | `alert(locale === 'tr' ? 'Karakter seçilmedi.' : 'No character selected.');` |
| `src/components/gm/GMSpellManager.tsx` | 752 | `alert(locale === 'tr' ? 'Büyü durumu güncellenirken hata oluştu.' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 801 | `alert(locale === 'tr' ? 'Büyü seçilmedi.' : 'No spells selected.');` |
| `src/components/gm/GMSpellManager.tsx` | 809 | `alert(locale === 'tr' ? 'Büyüler öğretilirken bir hata oluştu.' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 820 | `alert(locale === 'tr' ? 'Tüm büyüler başarıyla öğretildi!' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 853 | `alert(locale === 'tr' ? 'Silinecek büyü bulunamadı.' : ...);` |
| `src/components/gm/GMSpellManager.tsx` | 861 | `alert(locale === 'tr' ? 'Büyüler silinirken bir hata oluştu.' : ...);` |

---

## 2.5 Dosya Yolu ve Satır Numaralarıyla Kanıtlanmış Eksik Tablosu

| Eksik / Kusur Tanımı | İlgili Dosya Yolu | Kesin Satır Referansı | Somut Kanıt / Etki |
|---|---|---|---|
| **Yggdrasil Ağacı DB Kalıcılığı Yok** | `src/hooks/useSkillTree.ts` | 49-140, 228-230 | `DEMO_SKILLS` üzerinde çalışır. `character_skills` tablosuna INSERT gitmez. |
| **Envanter Izgarası DB Kalıcılığı Yok** | `src/components/inventory/InventoryGrid.tsx` | 28-44 | `DEMO_ITEMS` ile başlar. `inventory_items` tablosuna bağlanmamıştır. |
| **Ekipman Slot Türü Doğrulaması Yok** | `src/components/inventory/InventoryGrid.tsx` | 82-87 | Slot tipi denetlenmez; 4 adet iki elli kılıç aynı anda kuşanılabilir. |
| **Sabit Taşıma Kapasitesi (Encumbrance)** | `src/components/inventory/InventoryGrid.tsx` | 332, 337 | `150 LBS` sabit yazılmıştır. D&D 5e `STR * 15 lbs` formülü uygulanmamıştır. |
| **Sabit Altın Miktarı** | `src/components/inventory/InventoryGrid.tsx` | 52 | `const gold = 1247;` sabit sayı olarak gömülmüştür. |
| **Karakter Föyü DB Kolon Hatası** | `src/components/character/CharacterSheet.tsx` | 91-97, 117-122 | `item_definitions.name` sorgulanır, PostgreSQL 42703 fırlatır, mock eşyalar basılır. |
| **Can ve Dinlenme Motoru Yok** | `src/components/character/CharacterSheet.tsx` | 181-184 | `currentHP = maxHP` sabittir. Hasar, Short/Long Rest ve Death Saves yoktur. |
| **Karakter Yaratımında reload() Kullanımı** | `src/components/character/CharacterCreation.tsx` | 175 | Başarılı kayıt sonrası `window.location.reload()` ile kaba yenileme yapılır. |
| **GM Eşya/Yetenek Atamaları DB'ye Yazılmaz** | `src/components/gm/GMDashboard.tsx` | 397-428 | `addItem`/`addSkill` yalnızca React state günceller. Sayfa yenilenince uçar. |
| **Atmosfer Ses Oynatıcı Sahte Toggle** | `src/components/gm/GMAtmosphereManager.tsx` | 509 | `setIsPlayingAudio(!isPlayingAudio)` çalışır; ses elementi veya Web Audio yoktur. |
| **Harita Token Koordinatları Kaydedilmez** | `src/hooks/useMap.ts` | 306-317 | `setTokens` güncellenir; `map_tokens` tablosuna koordinat UPDATE gitmez. |
| **Toplu Büyü Öğretmede Tek Tek RPC Çağrısı** | `src/components/gm/GMSpellManager.tsx` | 781-795 | `gm_teach_spells` yerine teker teker 10'luk döngüde `unlock_spell` çağrılır. |

---

# BÖLÜM 3: GÖZDEN KAÇIRILANLAR, HATALAR VE RİSKLER

## 3.1 Veritabanı Şeması vs TypeScript Arayüzleri vs `supabase.from(...)` Çapraz Uyuşmazlıkları

Aşağıdaki üç yollu matris, projedeki tüm 31 SQL tablosunu `src/lib/types.ts` arayüzleriyle ve `src/` altındaki gerçek Supabase sorgularıyla eşleştirmektedir:

| SQL Tablo Adı | `src/lib/types.ts` Arayüz Adı | Frontend `.from('...')` Kullanım Yerleri | Kolon ve Mantık Uyuşmazlığı Durumu |
|---|---|---|---|
| `profiles` | `Profile` (`types.ts:8`) | `AuthContext.tsx`, `useAdminUsers.ts`, `CampaignsPage.tsx`, `CharactersPage.tsx` | **Tam Eşleşme:** Kolonlar ve tipler uyumludur. |
| `campaigns` | `Campaign` (`types.ts:200`) | `CampaignContext.tsx`, `useAdminCampaigns.ts`, `CharacterCreation.tsx` | **Tam Eşleşme:** `settings` jsonb alanı uyumludur. |
| `campaign_members` | `CampaignMember` (`types.ts:208`) | `CampaignContext.tsx`, `useAdminCampaigns.ts`, `useAdminUsers.ts` | **KRİTİK CONSTRAINT UYUŞMAZLIĞI:** TypeScript tarafında `role: UserRole` ('admin' \| 'gm' \| 'player') kabul edilir. Ancak SQL kısıtlaması `CHECK (role IN ('gm', 'player'))` şeklindedir. Bir üyeye 'admin' atanırsa veritabanı hata fırlatır. |
| `class_categories` | `ClassCategory` (`types.ts:31`) | `GMDashboard.tsx:320`, `useSpellTree.ts:487` (Join üzerinden) | **Uyumlu:** Alanlar eşleşmektedir. |
| `subclass_definitions` | `SubclassDefinition` (`types.ts:40`) | `CharacterCreation.tsx:123`, `GMDashboard.tsx:320` | **Tam Eşleşme:** `base_stats` ve çift dilli alanlar uyumludur. |
| `race_tiers` | `RaceTier` (`types.ts:60`) | Frontend'de doğrudan `.from('race_tiers')` çağrısı yok. | SQL'de tohumlanmış fakat frontend doğrudan okumuyor. |
| `race_definitions` | `RaceDefinition` (`types.ts:68`) | `CharacterCreation.tsx:115`, `GMDashboard.tsx:319` | **Tam Eşleşme:** Tipler ve alanlar uyumludur. |
| `characters` | `Character` (`types.ts:81`) | `CampaignContext.tsx`, `GMDashboard.tsx`, `useAdminCharacters.ts`, `CharacterCreation.tsx` | **Eksik Alan:** SQL'deki `appearance jsonb` kolonu TypeScript `interface Character` içinde tanımlanmamıştır. |
| `character_stats` | `CharacterStat` (`types.ts:100`) | `CharacterCreation.tsx:159`, `CharacterSheet.tsx:78`, `GMDashboard.tsx:472` | **Eksik Alan:** SQL'deki `updated_at` alanı `interface CharacterStat` içinde eksiktir. |
| `skill_definitions` | `SkillDefinition` (`types.ts:109`) | `GMDashboard.tsx:296` (Join). `useSkillTree.ts` tamamen mock kullanır. | **BÜYÜK UYUŞMAZLIK:** TS'de `name`, `description`, `icon` var (SQL'de yok); SQL'de `name_tr/en`, `subclass_restriction`, `race_restriction` var (TS'de yok). |
| `character_skills` | `CharacterSkill` (`types.ts:132`) | `useAdminCharacters.ts:168`, `useAdminUsers.ts:152` | **Şema Uyumlu / Akış Kopuk:** `useSkillTree.ts` açılan becerileri bu tabloya kaydetmez. |
| `item_definitions` | `ItemDefinition` (`types.ts:153`) | `GMLootDispenser.tsx:255`, `useAdminItems.ts` | **Şema Uyumlu:** `name_tr`, `name_en` alanları doğru tanımlanmıştır. |
| `inventory_items` | `InventoryItem` (`types.ts:165`) | `CharacterSheet.tsx:87`, `GMLootDispenser.tsx`, `useAdminItems.ts` | **HATA:** `CharacterSheet.tsx:92` var olmayan `name` kolonunu ister. Ayrıca `custom_properties` kolonu `types.ts`'de eksiktir. |
| `map_state` | `MapState` (`types.ts:177`) | `useAdminCampaigns.ts:127`. `useMap.ts` artık kullanmıyor. | **TERK EDİLMİŞ TABLO ÇATIŞMASI:** Admin sefer oluştururken `map_state` tablosuna yazar, ancak harita motoru `campaign_maps` tablosunu okur. |
| `map_tokens` | `MapToken` (`types.ts:187`) | `CharacterCreation.tsx:164`, `GMDashboard.tsx:476`, `useAdminCampaigns.ts:203` | **Kalıcılık Yok:** `useMap.ts` sürükleme koordinatlarını bu tabloya kaydetmez. |
| `admin_logs` | `AdminLog` (`types.ts:276`) | `useAdminCampaigns.ts`, `useAdminCharacters.ts`, `useAdminLogs.ts` | **Tam Eşleşme:** İndeksler ve tipler uyumludur. |
| `spell_trees` | `SpellTree` (`types.ts:228`) | `GMSpellManager.tsx`, `useSpellTree.ts:356` | **Tam Eşleşme:** Çift dilli alanlar uyumludur. |
| `spell_tree_assignments` | `SpellTreeAssignment` (`types.ts:238`) | `GMSpellManager.tsx:141..427` | **Eksik Alan:** SQL'deki `created_at` alanı `interface SpellTreeAssignment` içinde yoktur. |
| `spells` | `SpellNode` (`types.ts:247`) | `GMSpellManager.tsx`, `arenaData.ts`, `useSpellTree.ts` | İsimlendirme farkı: SQL'de `spells`, TS'de `SpellNode`. Kolonlar v2 migrasyonu ile uyumludur. |
| `character_spells` | `CharacterSpell` (`types.ts:266`) | `GMSpellManager.tsx`, `useSpellTree.ts`, `arenaData.ts`, `useAdminUsers.ts` | **Tam Eşleşme:** Kolonlar ve ilişkiler uyumludur. |
| `xp_ledger` | **YOK** | Frontend'de **hiçbir dosyada çağrılmamaktadır**. | **TAMAMEN UNUTULMUŞ:** `02_schema_consistency.sql` ile oluşturulan tablo için `types.ts`'de arayüz yoktur ve frontend XP verirken bu tabloyu bypass eder. |
| `campaign_encounters` | `CampaignEncounter` (`types.ts:303`) | `GMCombatTracker.tsx:71..272` | **Tam Eşleşme:** `status`, `round`, `active_combatant_id` alanları uyumludur. |
| `encounter_combatants` | `EncounterCombatant` (`types.ts:332`) | `GMCombatTracker.tsx:108..458` | **Tam Eşleşme:** `hp_current`, `hp_max`, `conditions` alanları uyumludur. |
| `campaign_environments` | `CampaignEnvironment` (`types.ts:352`) | `GMAtmosphereManager.tsx:133..223` | **Tam Eşleşme:** `weather`, `time_of_day`, `ambient_preset` alanları uyumludur. |
| `session_chronicles` | `SessionChronicle` (`types.ts:362`) | `GMAtmosphereManager.tsx:159..324` | **GÜVENLİK SIZINTISI:** `gm_secrets` alanı yayınlanan günlüklerde oyunculara sızmaktadır. |
| `campaign_loot_chests` | `CampaignLootChest` (`types.ts:385`) | `GMLootDispenser.tsx:69..200` | **Tam Eşleşme:** `gold_amount`, `items`, `is_looted` alanları uyumludur. |
| `campaign_maps` | `CampaignMap` (`types.ts:405`) | `useMap.ts:146..544` | **Tam Eşleşme:** `movement_mode`, `fog_radius`, `revealed_areas` alanları uyumludur. |
| `map_movement_requests` | `MapMovementRequest` (`types.ts:423`) | `useMap.ts:176..364` | **Tam Eşleşme:** `from_x/y`, `target_x/y`, `status` alanları uyumludur. |
| `combat_arenas` | `CombatArena` (`types.ts:446`) | `ArenaPage.tsx:389..514` | **Tam Eşleşme:** `status`, `team_a/b_name`, `round_number` alanları uyumludur. |
| `combat_arena_participants` | `CombatArenaParticipant` (`types.ts:460`) | `ArenaPage.tsx:444..548` | **Tam Eşleşme:** `slot_index`, `current_hp/mana`, `status_effects` alanları uyumludur. |
| `combat_arena_logs` | `CombatArenaLog` (`types.ts:481`) | `ArenaPage.tsx:241..453` | **Tam Eşleşme:** `action_type`, `dice_roll`, `damage_dealt` alanları uyumludur. |

---

## 3.2 Row Level Security (RLS) Güvenlik ve Özyineleme (Recursion 42P17) Riskleri

`.agents/AGENTS.md` kuralı uyarınca RLS politikalarında roller sorgulanırken `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` gibi satır içi alt sorgular yasaklanmış, `SECURITY DEFINER` ve `SET search_path = public` nitelikli yardımcı fonksiyonlar (`public.is_admin()`, `public.is_gm()`) zorunlu kılınmıştır.

### Güvenlik Açığı 1: `07_gm_bulk_teach_spells.sql` Üzerinde Yetkisiz Büyü Silme ve Öğretme Açığı
- **Dosya ve Satır:** `supabase/migrations/07_gm_bulk_teach_spells.sql:9-48`
- **Açıklama:** `public.gm_teach_spells` ve `public.gm_forget_spells` fonksiyonları veritabanı sahibi yetkisiyle (`SECURITY DEFINER`) çalışmaktadır ve `GRANT EXECUTE ... TO authenticated, anon;` ile tüm kullanıcılara yetki verilmiştir. Ancak fonksiyon gövdesinde `public.is_gm()` kontrolü yapılmamıştır.
- **Tehdit:** Kötü niyetli herhangi bir oyuncu veya anonim kullanıcı tarayıcı konsolundan şu komutu çalıştırarak Seferdeki tüm karakterlerin büyülerini anında silebilir:
  ```js
  await supabase.rpc('gm_forget_spells', { p_character_id: 'hedef-karakter-uuid' });
  ```
- **Çözüm:** Fonksiyonların başına `IF NOT public.is_gm() THEN RAISE EXCEPTION 'Unauthorized: Only GM can manage spells'; END IF;` eklenmeli ve `anon` rolünden `EXECUTE` yetkisi geri alınmalıdır (`REVOKE`).

### Güvenlik Açığı 2: `campaign_maps` Üzerinde Aşırı İzinli Güncelleme Politikası
- **Dosya ve Satır:** `supabase/migrations/04_map_library_and_movement.sql:44-47`
- **Açıklama:**
  ```sql
  CREATE POLICY "Players update revealed areas on campaign maps" ON public.campaign_maps
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  ```
- **Tehdit:** Politika ismi "revealed areas" dese de PostgreSQL satır düzeyinde kolon kısıtlaması getirmediği için oturum açmış herhangi bir oyuncu haritanın adını, görsel URL'sini, aktiflik durumunu (`is_active: false`) veya hareket modunu (`movement_mode: 'free'`) değiştirebilmektedir.
- **Çözüm:** Güncelleme yetkisi yalnızca `public.is_gm()` rolüne verilmeli, oyuncuların sis açma eylemi kontrollü bir saklı yordam (RPC) üzerinden yürütülmelidir.

### Güvenlik Açığı 3: `combat_arena_participants` Tablosunda Savaş Manipülasyonu
- **Dosya ve Satır:** `supabase/migrations/05_combat_arena_engine.sql:81-85`
- **Açıklama:**
  ```sql
  CREATE POLICY "Players update own combatant or GMs manage" ON public.combat_arena_participants
    FOR ALL
    USING (public.is_gm() OR auth.uid() IS NOT NULL)
    WITH CHECK (public.is_gm() OR auth.uid() IS NOT NULL);
  ```
- **Tehdit:** `auth.uid() IS NOT NULL` şartı tüm giriş yapmış oyuncular için geçerlidir ve kural `FOR ALL` (SELECT, INSERT, UPDATE, DELETE) tanımlanmıştır. Bir oyuncu rakip takım gladyatörlerinin canını `current_hp: 0` yapabilir veya katılımcıyı tablodan silebilir.
- **Çözüm:** Politika güncellenerek oyuncunun yalnızca kendi karakterine ait gladyatör satırını (`character_id IN (SELECT id FROM characters WHERE profile_id = auth.uid())`) güncellemesine izin verilmelidir.

### Güvenlik Açığı 4: `session_chronicles` Günlüklerinde GM Sırlarının İfşası
- **Dosya ve Satır:** `supabase/migrations/03_new_gm_modules.sql:120-125`
- **Açıklama:** Zindan Yöneticisi günlüğü yayınladığında (`is_published = true`), oyuncuların `SELECT` sorgusu satırdaki tüm kolonları çekebilmektedir. Ancak tabloda `gm_secrets text` kolonu da yer almaktadır.
- **Tehdit:** GM'in yalnızca kendisine sakladığı gizli notlar ve kurgu sırları, oyuncunun tarayıcısına JSON olarak iletilmektedir.
- **Çözüm:** Oyuncular için `gm_secrets` kolonunu hariç tutan bir PostgreSQL Görünümü (VIEW) tanımlanmalı veya RLS politikası/RPC ile kolon filtrelenmelidir.

### Güvenlik Açığı 5: Başkası Adına Karakter Oluşturma
- **Dosya ve Satır:** `d:\DnD\admin_migration.sql:189`
- **Açıklama:** `CREATE POLICY "Insert characters" ON characters FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`
- **Tehdit:** `profile_id = auth.uid()` eşitliği zorunlu tutulmadığı için bir kullanıcı başka bir oyuncunun `profile_id` değerini göndererek onun adına karakter üretebilir.

---

## 3.3 React Flow CSS `transform` ve Performans Analizi

1. **`SpellNode.tsx:268-285` Özel Eşitlik Karşılaştırıcı (Memoization) Kusuru:**  
   - `SpellTreeGraph.tsx:110-143` satırlarında kullanıcı bir büyü dalı filtresi seçtiğinde veya bir büyüye tıkladığında, ilgisiz düğümlerin şeffaflığı `node.style.opacity = 0.15` seviyesine çekilmektedir.
   - Ancak `SpellNode.tsx:268-285` içerisindeki `areSpellNodePropsEqual` fonksiyonu yalnızca `node.data` alanlarını denetlemekte; `prev.style?.opacity === next.style?.opacity` karşılaştırmasını yapmamaktadır.
   - Sonuç olarak React Flow içindeki bileşen props eşit kabul edildiği için iç elemanlarını yeniden render etmemektedir. Dış kapsayıcı görsel olarak silikleşse de `node.data.isDimmed` senkronize olmadığından karartılmış düğümlerin üzerine gelindiğinde zengin tooltip açılmakta ve kullanıcı karartılmış büyüye tıklayabilmektedir.
2. **`YggdrasilTree.tsx:35-36` Sözde Memoization (Pseudo-Memoization):**  
   - Satır 35-36: `const memoNodes = useMemo<Node[]>(() => nodes, [nodes]);`
   - `useSkillTree` zaten içeride `useMemo` üretmektedir. Dışarıda tekrar `useMemo` yazmak gereksiz bellek tahsisinden başka bir işe yaramamaktadır.

---

## 3.4 RPG Envanter Slot Tasarımı ve D&D 5e Kuralları Kusurları

1. **Sabit Slot ve Swap Mantığı (.agents/AGENTS.md Kuralı):**  
   - `InventoryGrid.tsx:28-44` üzerinde `TOTAL_SLOTS = 24` ve `EQUIP_SLOTS = 4` sabit slot dizisi olarak yapılandırılmıştır.
   - Sürüklemede `arrayMove` yerine slot takası (`next[oldIdx] = overSlot; next[newIdx] = activeSlot;`) uygulanarak proje kuralına uyulmuştur.
2. **D&D 5e Ekipman Slot Türü Kısıtlaması Yoktur:**  
   - İlk 4 slot genel "kuşanılmış" slotu olarak ele alınmıştır. Eşya türü (`weapon`, `armor`, `ring`, `consumable`) doğrulanmamaktadır.
   - Bir oyuncu 4 kuşanma slotuna aynı anda 4 adet Çift Elli Büyük Kılıç (Greatsword) veya 4 adet Ağır Zırh sürükleyip hepsini kuşanabilmektedir. D&D 5e standartlarındaki Ana El (Main Hand), Yan El (Off Hand), Zırh (Armor) ve Takı (Amulet/Ring) kısıtlamaları bulunmamaktadır.
3. **Uyumlanma (Attunement) Mekanizması Yoktur:**  
   - `inventoryConstants.ts:91` satırında `Amulet of Fate` için `Attunement: 'Required'` yazmasına rağmen, envanterde D&D 5e'nin temel kuralı olan "En fazla 3 adet uyumlanmış büyülü eşya" mekanizması işletilmemektedir.
4. **Hardcoded Altın ve Taşıma Kapasitesi:**  
   - Altın miktarı `InventoryGrid.tsx:52` satırında `const gold = 1247;` olarak sabitlenmiştir.
   - Taşıma kapasitesi `InventoryGrid.tsx:332` satırında `150 LBS` olarak sabit yazılmıştır. D&D 5e kuralı olan `Kuvvet (STR) Skoru * 15 lbs` dinamik formülü işletilmemektedir.

---

# BÖLÜM 4: MEVCUT SİSTEMLERDE GELİŞTİRİLEBİLECEK ALANLAR

## 4.1 Mimari ve Kod Kalitesi İyileştirmeleri

1. **Ölü Kodların Temizlenmesi veya Sisteme Entegrasyonu:**  
   - Projede hiçbir yere bağlanmamış olan `GMItemManager.tsx`, `PlayerManager.tsx`, `XPDistributor.tsx` ve `MapToken.tsx` dosyaları repo temizliği kapsamında değerlendirilmeli; `PlayerManager` ve `XPDistributor` bileşenlerindeki faydalı arayüzler `GMDashboard.tsx` altına gerçek bileşen olarak dahil edilmelidir.
2. **N+1 Sorgu Optimizasyonu (`useAdminCharacters.ts:260-271`):**  
   - `bulkUpdateLevel` fonksiyonundaki `for (const id of charIds)` döngüsü kaldırılmalı, PostgreSQL tarafında tek bir `UPDATE characters SET level = level + delta WHERE id = ANY(charIds)` sorgusu veya atomik bir RPC çalıştırılmalıdır.
3. **Bellek Tüketen Sorguların Sayfalanması (`useAdminStats.ts:24`):**  
   - `supabase.from('profiles').select('role')` ile tüm kullanıcıları tarayıcı belleğine çekmek yerine PostgreSQL tarafında `GROUP BY role` ile rol dağılımı sorgulanmalı veya `count` parametresi kullanılmalıdır.

---

## 4.2 Performans İyileştirmeleri (Vite, React ve React Flow)

1. **React Flow `style.opacity` ve Etkileşim Eşitlemesi:**  
   - `SpellNode.tsx:268-285` içindeki `areSpellNodePropsEqual` fonksiyonuna `prev.style?.opacity === next.style?.opacity` eklenmeli; ayrıca şeffaflaşan düğümlerin tıklanabilirliği ve tooltip açılması CSS `pointer-events-none` ile engellenmelidir.
2. **Vite Chunking Stratejisinin İleri Düzey Ayrıştırılması:**  
   - `GMPage` paketi (143 kB ham / 28.7 kB gzip), içindeki 5 ağır alt modül (`GMCombatTracker`, `GMAtmosphereManager`, `GMLootDispenser`, `GMSpellManager`, `GMDashboard`) bağımsız `lazy()` parçalarına bölünerek GM sayfasının ilk render süresi %50 hızlandırılmalıdır.

---

## 4.3 Kullanıcı Deneyimi (UX/UI) ve Koyu Fantezi Cilalamaları

1. **Global Koyu Fantezi Toast Bildirim Sistemi (Arcane Toast):**  
   - Kod tabanındaki 26 adet tarayıcı `alert(...)` çağrısı derhal kaldırılmalı; yerine obsidyen arka planlı, altın işlemeli, runik sembollü ve otomatik kaybolan bir `<ArcaneToast />` bildirim sistemi entegre edilmelidir.
2. **Global React Error Boundary Bileşeni:**  
   - Uygulama köküne (`App.tsx`), grafik veya canvas hatalarında kullanıcıyı beyaz ekrana düşürmeyen, "SANCTUARY BREACHED - Kadim mühürler kırıldı, büyülü bağ koptu" temalı koyu fantezi hata kurtarma ekranı (`ArcaneErrorBoundary`) yerleştirilmelidir.
3. **Evrensel Zar Tepsisi (Global Dice Tray):**  
   - Yalnızca arenaya hapsedilmiş olan `DiceRollerModal.tsx`, Floating Dock ve Header üzerine yerleştirilecek bir butonla her an açılabilir global bir D&D zar tepsisine dönüştürülmelidir.

---

## 4.4 Test Kapsamı ve Test Kalitesi İyileştirme Planı

1. **`/arena` Rotasının Playwright Sağlık Taramasına Eklenmesi:**  
   - `tests/e2e/01-route-health.spec.ts:18-27` ve `63-71` listelerine `/arena` rotası eklenmeli; hem GM hem de Oyuncu hesaplarının arenayı sıfır konsol hatası ile açabildiği güvenceye alınmalıdır.
2. **Admin Alt Rotalarının Taranması:**  
   - `/admin/users`, `/admin/characters`, `/admin/campaigns`, `/admin/items` ve `/admin/logs` rotaları Playwright test senaryolarına dahil edilmelidir.

---

# BÖLÜM 5: EKLENEBİLECEK YENİLİKLER VE ÖZELLİK YOL HARİTASI

Mevcut teknoloji yığını ve koyu fantezi teması üzerine inşa edilebilecek, oyuncu ve GM deneyimini masaüstü D&D 5e seviyesine taşıyacak 5 temel inovasyon sistemi aşağıda detaylandırılmıştır:

## 5.1 Önerilen 5 Yüksek Değerli D&D 5e / RPG Mekaniği

### 1. Evrensel 3D/2D Zar Tepsisi (Universal Dice Tray) & Tıkla-At (Click-to-Roll)
- **Açıklama:** Ekranın altındaki Floating Dock ve Header üzerine entegre, d4, d6, d8, d10, d12, d20 ve d100 zarlarını barındıran kalıcı interaktif zar tepsisi.
- **Tıkla-At Mekaniği:** Karakter föyündeki herhangi bir nitelik modifikatörüne (örn. STR +3), yetenek satırına (örn. Stealth +5), zırh sınıfına veya silaha tıklandığında otomatik d20 veya hasar zarı atılmalıdır. Avantaj / Dezavantaj seçimi sunulmalı, Web Audio ile gerçekçi kemik/zar tıkırtısı çalmalıdır.
- **Canlı Masa Akışı:** Atılan zarlar Supabase Realtime ile anında Zindan Yöneticisi ekranına ve Sefer Masası kütüğüne iletilmelidir.

### 2. D&D 5e Canlı Vitals & Dinlenme (Rest & Vitals) Motoru
- **Açıklama:** Karakter föyüne tam teşekküllü D&D 5e yaşam döngüsü entegrasyonu.
- **Bileşenler:**
  - **Dinamik Can ve Geçici Can (Temp HP):** Tek tıkla hasar alma veya iyileşme girişi.
  - **Ölüm Kurtarma Zarları (Death Saving Throws):** 0 HP'ye düşüldüğünde otomatik açılan 3 başarı / 3 başarısızlık sayacı; doğal 20'de 1 HP ile ayağa kalkma, doğal 1'de 2 başarısızlık yazma kuralı.
  - **Hit Dice ve Kısa Dinlenme (Short Rest):** Sınıfa göre Hit Dice (d6, d8, d10, d12) harcayarak can doldurma.
  - **Uzun Dinlenme (Long Rest):** Tek tıkla tüm canı, harcanan büyü slotlarını ve Hit Dice'ların yarısını doldurma.
  - **Büyü Slotu Takipçisi:** Büyücü sınıfları için 1-9. seviye harcanabilir büyü slot matrisi.

### 3. Veritabanı Destekli Canlı Envanter, Ekipman Slot Kısıtlamaları ve Uyumlanma (Attunement)
- **Açıklama:** Envanter ızgarasını canlı `inventory_items` tablosuna bağlamak ve gerçek RPG donanım kurallarını işletmek.
- **Bileşenler:**
  - **Doğrulanmış Ekipman Slotları:** Ana El (Silah), Yan El (Kalkan/Silah), Gövde Zırhı, Başlık, Kolye, 2 Yüzük Yuvası, Çizme. Yalnızca türü uyuşan eşyalar kuşanılabilir.
  - **Uyumlanma (Attunement):** Maksimum 3 adet büyülü eşyaya uyumlanabilme kuralı.
  - **Dinamik Taşıma Kapasitesi:** `STR * 15 lbs` formülü; aşılması durumunda hızı düşüren aşırı yük (encumbered) uyarısı.
  - **D&D Cüzdanı:** Bakır (CP), Gümüş (SP), Altın (GP) ve Platin (PP) para birimi takibi.

### 4. Canlı Yggdrasil Stat Ağacı Kalıcılığı ve Karakter Föyüne Dinamik Etki
- **Açıklama:** Yggdrasil ağacını sahte bellek durumundan çıkarıp Supabase üzerinde `character_skills` tablosuna bağlamak.
- **Mekanik:** Ağaçta açılan yetenekler (örn. `+1 STR`, `+5 Max HP`, `Advantage on Stealth`) doğrudan karakter föyündeki ilgili istatistik satırına kalıcı bonus olarak yansımalıdır.

### 5. GM Taktiksel Muharebe & Ambiyans Orkestrasyon Paketi
- **Açıklama:** Zindan yöneticisi kontrol modüllerinin canlı masa yönetimini eksiksiz desteklemesi.
- **Bileşenler:**
  - **Canavar & NPC Kart Kütüphanesi:** Muharebe takipçisine tek tıkla Goblin, Ejderha, İskelet gibi hazır yaratık ekleme; stat blokları ve tek tıkla saldırı aksiyonları.
  - **Gerçek Prosedürel Ambiyans Sentezleyici:** `GMAtmosphereManager.tsx` içindeki sahte toggle'ı Web Audio API osilatör ve gürültü filtrelerine bağlayarak fırtına uğultusu, mağara damlaması ve han gürültüsü üretme; bu ambiyansın oyuncuların tarayıcılarında eşzamanlı çalması.
  - **Gizli GM Zarları ve Fısıltılar:** GM'in oyunculara gizli fısıltı gönderebilmesi ve oyuncuların göremediği gizli zar atabilmesi.

---

## 5.2 Önceliklendirilmiş Yol Haritası (Prioritized Roadmap)

```
[FAZ 1: ACİL DÜZELTMELER & TEMEL SAĞLAMLAŞTIRMA] (P0 / 1-2 Hafta)
  ├── 1.1 CharacterSheet DB Kolon Hatası Düzeltmesi (item_definitions.name_tr / name_en)
  ├── 1.2 07_gm_bulk_teach_spells.sql RPC Yetkilendirme Güvenlik Yaması
  ├── 1.3 04 ve 05 Numaralı Migrasyonlardaki auth.uid() IS NOT NULL Açıklarının Kapatılması
  ├── 1.4 SpellNode React.memo style.opacity Eşitlik Karşılaştırıcı Düzeltmesi
  ├── 1.5 Global ErrorBoundary Mimarisi ve 26 alert(...) Çağrısının Arcane Toast'a Dönüştürülmesi
  └── 1.6 /arena Rotasının Playwright Sağlık Testine Eklenmesi

[FAZ 2: ÇEKİRDEK RPG MEKANİKLERİ & VERİ ENTEGRASYONU] (P1 / 3-4 Hafta)
  ├── 2.1 Envanter Izgarasının Canlı Supabase inventory_items Tablosuna Bağlanması
  ├── 2.2 D&D Ekipman Slot Kısıtlamaları (Ana El, Kalkan, Zırh, Takı vb.) & Uyumlanma
  ├── 2.3 Karakter Föyü Can Puanı, Hit Dice, Dinlenme (Short/Long Rest) & Büyü Slotları
  ├── 2.4 Yggdrasil Stat Ağacının Supabase'e Bağlanması ve Karakter Föyüne Dinamik Etkisi
  ├── 2.5 GM Panelindeki Eşya/Yetenek/XP Dağıtımlarının Canlı DB Mutasyonlarına Dönüştürülmesi
  └── 2.6 Evrensel Koyu Fantezi Zar Tepsisi (Universal Dice Tray) ve Tıkla-At Entegrasyonu

[FAZ 3: İLERİ SEVİYE GM MODÜLLERİ & İMMERSİF DENEYİM] (P2 / 5-6 Hafta)
  ├── 3.1 Web Audio Tabanlı Canlı Prosedürel Ambiyans Sentezleyici (GM Atmosphere Engine)
  ├── 3.2 Savaş Haritası için Dinamik Görüş Alanı (Line of Sight Raycasting) ve Duvarlar
  ├── 3.3 GM Canavar / Yaratık Kütüphanesi ve Tek Tıkla Çoklu Hedef Saldırı Aksiyonları
  └── 3.4 Gerçek Zamanlı Masa Sohbeti, Zar Kayıtları ve GM Gizli Fısıltı Sistemi
```

---

## 5.3 Değer / Efor / Öncelik / Bağımlılık Değerlendirme Matrisi

| Özellik / İnovasyon | Değer (1-5) | Efor (1-5) | Öncelik Seviyesi | Kritik Bağımlılıklar |
|---|:---:|:---:|:---:|---|
| **`CharacterSheet` Kolon Hatası Düzeltmesi** | 5 | 1 | **P0 (Acil)** | `item_definitions` şeması |
| **Büyü RPC ve RLS Güvenlik Yaması** | 5 | 1 | **P0 (Acil)** | PostgreSQL RLS, `07_gm_bulk_teach_spells.sql` |
| **React Flow `style.opacity` Karşılaştırıcı Düzeltmesi** | 4 | 1 | **P0 (Acil)** | `SpellNode.tsx`, `SpellTreeGraph.tsx` |
| **Global ErrorBoundary & Toast Sistemi** | 5 | 2 | **P0 (Acil)** | `AppLayout.tsx`, `main.tsx` |
| **Playwright `/arena` Rota Testi Entegrasyonu** | 4 | 1 | **P0 (Acil)** | `tests/e2e/01-route-health.spec.ts` |
| **Canlı Envanter & Ekipman Slot Kısıtlamaları** | 5 | 3 | **P1 (Yüksek)** | `inventory_items` tablosu, `InventoryGrid.tsx` |
| **D&D 5e Can/Dinlenme/Slot Yaşam Döngüsü** | 5 | 3 | **P1 (Yüksek)** | `characters` tablosu migrasyonu, `CharacterSheet.tsx` |
| **Evrensel D&D Zar Tepsisi (Click-to-Roll)** | 5 | 2 | **P1 (Yüksek)** | `audio.ts`, `FloatingDock.tsx`, `Header.tsx` |
| **Yggdrasil Stat Ağacı Veritabanı Kalıcılığı** | 4 | 3 | **P1 (Yüksek)** | `character_skills` tablosu, `useSkillTree.ts` |
| **GM Eşya/Yetenek/XP Kalıcılık Entegrasyonu** | 5 | 2 | **P1 (Yüksek)** | `GMDashboard.tsx`, Supabase RLS |
| **Gerçek Web Audio Ortam Ambiyansı** | 3 | 2 | **P2 (Orta)** | `GMAtmosphereManager.tsx`, `audio.ts` |
| **GM Canavar Kütüphanesi & Karşılaşma Aksiyonları** | 4 | 3 | **P2 (Orta)** | `campaign_encounters`, `encounter_combatants` |
| **Haritada Dinamik Görüş Çizgisi (Raycasting LoS)** | 4 | 4 | **P2 (Orta)** | `GameMap.tsx`, Canvas 2D raycasting |

---

## 5.4 Canlı Veritabanı Eylem Listesi (Kullanıcı Rehberi)

Canlı Supabase projesinde ortam değişkenleri (`.env.local`) yalnızca anonim istemci anahtarını içerdiğinden, kullanıcının Supabase Kontrol Paneli -> **SQL Editor** ekranında aşağıdaki adımları sırasıyla çalıştırması gerekmektedir:

### 12 Adımlı SQL Migrasyon Çalıştırma Sırası:
1. `d:\DnD\schema.sql` (Temel 15 tablo: profiles, campaigns, characters vb.)
2. `d:\DnD\admin_migration.sql` (Rol kısıtlamaları, admin_logs, is_admin(), is_gm(), CASCADE kısıtlamaları)
3. `d:\DnD\spell_schema.sql` (spell_trees, spells, character_spells)
4. `d:\DnD\spell_tree_v2_migration.sql` (spells tablosu v2 kolon güncellemeleri)
5. `supabase/migrations/01_security_and_rls_hardening.sql` (Fonksiyonlar ve RLS sertleştirme)
6. `supabase/migrations/02_schema_consistency.sql` (label, slot_index, xp_ledger, gm_award_xp)
7. `supabase/migrations/03_new_gm_modules.sql` (encounters, combatants, environments, chronicles, loot)
8. `supabase/migrations/04_map_library_and_movement.sql` (campaign_maps, movement_requests)
9. `supabase/migrations/05_combat_arena_engine.sql` (combat_arenas, participants, logs)
10. `supabase/migrations/06_character_spells_hardening.sql` (character_spells RLS)
11. `supabase/migrations/07_gm_bulk_teach_spells.sql` (Büyü yönetim RPC'leri)
12. Tohumlama Dosyası: `d:\DnD\seed.sql` veya `final_seed_v3_part1..3.sql`

---

### Canlı Güvenlik Yaması (SQL Editor'da Doğrudan Çalıştırılacak Yama):
Aşağıdaki SQL bloğu, bu raporda tespit edilen kritik 5 güvenlik açığını ve constraint uyuşmazlığını tek seferde düzeltir:

```sql
-- ==============================================================================
-- D&D PLATFORMU ACİL GÜVENLİK VE RLS YAMASI (SECURITY PATCH)
-- ==============================================================================

-- 1. gm_teach_spells ve gm_forget_spells yetkilendirmesi (Açık 1 Düzeltmesi)
CREATE OR REPLACE FUNCTION public.gm_teach_spells(
  p_character_id uuid,
  p_spell_ids uuid[]
) RETURNS void AS $$
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters can teach spells in bulk.';
  END IF;

  IF p_character_id IS NULL OR p_spell_ids IS NULL OR array_length(p_spell_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO character_spells (character_id, spell_id, unlocked, unlocked_at)
  SELECT DISTINCT p_character_id, s_id, true, now()
  FROM unnest(p_spell_ids) AS s_id
  ON CONFLICT (character_id, spell_id)
  DO UPDATE SET unlocked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.gm_forget_spells(
  p_character_id uuid,
  p_spell_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters can remove spells.';
  END IF;

  IF p_character_id IS NULL THEN
    RETURN;
  END IF;

  IF p_spell_id IS NULL THEN
    DELETE FROM character_spells WHERE character_id = p_character_id;
  ELSE
    DELETE FROM character_spells WHERE character_id = p_character_id AND spell_id = p_spell_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.gm_teach_spells(uuid, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.gm_forget_spells(uuid, uuid) FROM anon;

-- 2. campaign_maps harita güncelleme sınırlandırması (Açık 2 Düzeltmesi)
DROP POLICY IF EXISTS "Players update revealed areas on campaign maps" ON public.campaign_maps;
CREATE POLICY "GMs manage campaign maps update" ON public.campaign_maps
  FOR UPDATE USING (public.is_gm()) WITH CHECK (public.is_gm());

-- 3. combat_arena_participants sınırlandırması (Açık 3 Düzeltmesi)
DROP POLICY IF EXISTS "Players update own combatant or GMs manage" ON public.combat_arena_participants;
CREATE POLICY "Players update own combatant or GMs manage" ON public.combat_arena_participants
  FOR ALL USING (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()))
  )
  WITH CHECK (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()))
  );

-- 4. unlock_spell search_path sabitlemesi (Search Path Hijacking Koruması)
ALTER FUNCTION public.unlock_spell(uuid, uuid, int) SET search_path = public;

-- 5. characters tablosunda başkası adına kayıt üretilmesini engelleme (Açık 5 Düzeltmesi)
DROP POLICY IF EXISTS "Insert characters" ON characters;
CREATE POLICY "Insert characters" ON characters
  FOR INSERT WITH CHECK (
    public.is_gm() OR profile_id = auth.uid()
  );

-- 6. campaign_members rol kısıtlamasına 'admin' eklenmesi (Constraint Düzeltmesi)
ALTER TABLE campaign_members DROP CONSTRAINT IF EXISTS campaign_members_role_check;
ALTER TABLE campaign_members ADD CONSTRAINT campaign_members_role_check CHECK (role IN ('admin', 'gm', 'player'));
```

---

### Canlı Ortam Değişkenleri (.env.local) Gereksinimleri
Playwright testlerinin canlı ortamda çalışabilmesi için kullanıcının `.env.local` dosyasına şu kimlik bilgilerini eklemesi gerekmektedir:
```env
# Canlı Supabase Bağlantısı
VITE_SUPABASE_URL=https://<proje-referansiniz>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-anahtariniz>

# E2E Otantik Test Hesapları (Git'e commit edilmemelidir)
E2E_GM_EMAIL=gm_test@arcane-dnd.local
E2E_GM_PASSWORD=<guclu-gm-parolasi>
E2E_PLAYER_EMAIL=player_test@arcane-dnd.local
E2E_PLAYER_PASSWORD=<guclu-oyuncu-parolasi>
```
*Not:* `gm_test` hesabı `profiles` tablosunda `role = 'gm'` veya `role = 'admin'` yetkisine sahip olmalı; `player_test` hesabı ise `role = 'player'` olarak tanımlanmalıdır.

---

## SONUÇ

Bu denetim; projenin Vite 8, React 19, Tailwind v4 ve React Flow temellerinde son derece modern, hızlı derlenen (1.58s), tip güvenli ve görsel açıdan etkileyici bir koyu fantezi zeminine sahip olduğunu doğrulamıştır. 

Ancak platformun "tam işlevsel bir D&D Sefer Masası" olarak oyunculara ve Zindan Yöneticilerine güvenle sunulabilmesi için:
1. `CharacterSheet.tsx` üzerindeki kolon uyuşmazlığı giderilmeli ve föy canlandırılmalıdır.
2. `07_gm_bulk_teach_spells.sql` ve RLS politikalarındaki kritik yetkilendirme açıkları kapatılmalıdır.
3. Yggdrasil Ağacı ve Envanter Izgarası gibi "illüzyon" katmanları gerçek Supabase veri kalıcılığına bağlanmalıdır.
4. Kod tabanında unutulan 4 ölü bileşen temizlenmeli veya sisteme entegre edilmeli; 26 adet `alert()` çağrısı yerini modern Arcane Toast bildirimlerine bırakmalıdır.

Yukarıda sunulan önceliklendirilmiş yol haritası (Faz 1, Faz 2, Faz 3), uygulamanın sonraki kilometre taşlarında kusursuz bir şekilde hayata geçirilmesi için net, somut ve doğrudan uygulanabilir bir mühendislik rehberidir.
