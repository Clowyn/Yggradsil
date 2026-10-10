# R2: Yeni Özellikler ve GM Kontrol Modülleri Araştırma Raporu
## (Potential Features & GM Control Modules Research Report)

**Proje**: D&D Sefer Yönetim Web Uygulaması (React 19 + TypeScript + Vite + Tailwind CSS v4 + React Flow + Framer Motion + Supabase)  
**Tarih**: 2026-10-10  
**Durum**: Tamamlandı / Temel Referans Dokümanı  
**Yetkili Alt Ajan**: worker_m1_docs_db  
**Gözlem ve Araştırma Kaynakları**: `explorer_survey_perf_ui/handoff.md`, `explorer_survey_db/handoff.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`

---

## 1. Giriş ve Araştırma Amacı

Bu rapor; D&D Sefer Yönetim Uygulaması'nın oyuncu ve Zindan Yöneticisi (Game Master - GM) deneyimini modern dijital masaüstü RYO (VTT - Virtual Tabletop) standartlarına ulaştırmak amacıyla değerlendirilen yeni özellik fırsatlarını incelemektedir.

Araştırmada her aday özellik için:
- **Kullanıcı Değeri (User Value)**: Oyuncu ve GM akışına sağladığı doğrudan katkı,
- **Geliştirme Maliyeti (Rough Cost)**: İş gücü ve karmaşıklık tahmini,
- **Teknik Bağımlılıklar (Dependencies)**: Veritabanı şeması, Supabase Realtime veya harici kütüphaneler,
- **Önceliklendirme Matrisi (Prioritization Matrix)**: Değer/maliyet analizi,
- **R5 GM Modülleri Seçimi**: Uygulamaya doğrudan eklenecek kalıcı GM kontrol modüllerinin mimari tasarımı belirlenmiştir.

---

## 2. Aday Özelliklerin Detaylı Analizi

---

### Özellik 1: Gerçek Zamanlı Savaş ve İnisiyatif Takipçisi (Combat & Initiative Tracker)
- **Kategori**: GM Yönetimi & Oyuncu Senkronizasyonu
- **Açıklama**: GM ve oyuncuların bir karşılaşma (encounter) başlattığında tur sırasını (Turn Order), raund sayacını, aktif savaşçıyı (Active Combatant), anlık can puanlarını (HP), geçici canı (Temp HP), zırh sınıflarını (AC) ve 5e uyumlu durum etkilerini (Kör, Zehirlenmiş, Sersemlemiş, Yere Serilmiş, Büyülenmiş vb.) gerçek zamanlı takip ettiği etkileşimli savaş paneli.
- **Kullanıcı Değeri**: **Kritik / Çok Yüksek (5/5)**. Masaüstü D&D oturumlarının en çok zaman alan ve karmaşıklaşan kısmı savaş yönetimidir. Otomatik inisiyatif sıralaması, tek tıkla HP hasar/şifa düzenleme ve gizli pusu canavarları (`is_hidden`) özellikleri oturum akıcılığını 3 katına çıkarır.
- **Yaklaşık Maliyet**: Orta (1.5 - 2 adam/gün).
- **Bağımlılıklar**:
  - Supabase tabloları: `campaign_encounters`, `encounter_combatants` (Bkz. Migration 03).
  - Supabase Realtime: `supabase_realtime` yayını ile tüm oyuncu ekranlarında anlık sıra değişimi.
  - Güvenlik: RLS politikaları (GM yazma/silme yetkisi, Oyuncular salt-okunur; gizli canavarlar yalnızca GM'e görünür).
- **Öncelik**: **P1 (En Yüksek Öncelik - R5 Kapsamında)**.

---

### Özellik 2: Canlı Atmosfer, Ortam Sesi & Sefer Günlüğü (Atmosphere & Session Chronicle)
- **Kategori**: Hikaye Anlatımı & İmmersiyon
- **Açıklama**: 
  1. **Atmosfer Motoru**: GM'in kampanya dünyasının hava durumunu (*Sisli, Fırtınalı, Güneşli, Kan Yağmuru, Asit Sisi, Kül Yağışı*), günün saatini (*Şafak, Öğle, Alacakaranlık, Geceyarısı, Tutulma*) ve ortam tehlike derecesini anlık değiştirmesi; arka plan ortam sesi ön ayarını (*Abyss Winds, Tavern Hearth, Dark Dungeon, Rainy Crypt*) yönetmesi.
  2. **Sefer Günlüğü (Session Chronicle)**: Oturum numarası, başlık, özet, oyun-içi tarih kaydı, oyunculara açık yayınlama seçeneği ve yalnızca GM'in görebildiği pusu/komplo notları (`gm_secrets`).
- **Kullanıcı Değeri**: **Yüksek (4.5/5)**. Uzun soluklu kampanyalarda oturum notlarının düzenli tutulması hikaye kopukluklarını engeller. Anlık hava ve ışık durumu oyuncuların rol yapma (roleplay) motivasyonunu artırır.
- **Yaklaşık Maliyet**: Düşük-Orta (1 adam/gün).
- **Bağımlılıklar**:
  - Supabase tabloları: `campaign_environments`, `session_chronicles` (Bkz. Migration 03).
  - Web Audio API veya hafif CSS görsel hava simülatörleri.
  - RLS: Oyuncular yalnızca `is_published = true` olan günlükleri ve genel atmosferi okur; `gm_secrets` sütunu yalnızca GM'e açıktır.
- **Öncelik**: **P1 (Yüksek Öncelik - R5 Kapsamında)**.

---

### Özellik 3: Ganimet Sandığı ve Kalıcı Envanter Dağıtıcı (Loot Dispenser & Inventory Manager)
- **Kategori**: GM Yönetimi & Ekonomi
- **Açıklama**: GM'in partiye tek tıkla altın ve eşya sandıkları (`campaign_loot_chests`) bırakabilmesi; partideki belirli bir oyuncunun 24-slotlu RPG envanterine doğrudan eşya aktarabilmesi.
- **Kullanıcı Değeri**: **Yüksek (4.5/5)**. Mevcut `GMDashboard.tsx` içindeki eşya verme fonksiyonunun veritabanına yazmaması (sahte state olması) açığını kökten kapatır ve oyuncunun envanterine gerçek kalıcı eşyalar düşürülmesini sağlar.
- **Yaklaşık Maliyet**: Düşük-Orta (1 adam/gün).
- **Bağımlılıklar**:
  - Supabase tabloları: `campaign_loot_chests`, `inventory_items` (`slot_index` kolonu).
  - RLS: Sandık oluşturma ve eşya atama yalnızca `public.is_gm()`.
- **Öncelik**: **P1 (Yüksek Öncelik - R5 Kapsamında)**.

---

### Özellik 4: Tam Teşekküllü Oyuncu Karakter Kağıdı (Interactive Character Sheet & Level-Up)
- **Kategori**: Oyuncu Deneyimi
- **Açıklama**: Mevcut `/character` sayfasının yalnızca karakter yaratım sihirbazına kilitli olması kusurunu gideren; aktif karakterin anlık ve maksimum canını, zırh sınıfını, hızını, pasif algısını, yetenek modifikatörlerini (+2 STR vb.), kurtarma zarlarını ve seviye atlama durumunu gösteren interaktif D&D karakter kağıdı.
- **Kullanıcı Değeri**: **Kritik (5/5)**. Karakter sayfası bir RYO uygulamasının merkezidir. Oyuncuların kendi karakter durumlarını anlık takip edebilmeleri birincil gereksinimdir.
- **Yaklaşık Maliyet**: Orta (1.5 adam/gün).
- **Bağımlılıklar**: `src/components/character/CharacterSheet.tsx`, `characters`, `character_stats`.
- **Öncelik**: **P1 (Temel Mimari İhtiyaç - M2 Kapsamında)**.

---

### Özellik 5: Karşılaşma Dengesi & Canavar Kataloğu (Encounter Balancer & Bestiary)
- **Kategori**: GM Araçları
- **Açıklama**: D&D 5e kurallarına uygun Zorluk Derecesi (Challenge Rating - CR) ve XP eşiği hesaplayıcısı. Parti seviyesine ve oyuncu sayısına göre karşılaşmanın zorluğunu (Kolay, Orta, Zor, Ölümcül) anında hesaplar ve hazır canavar stat blokları sunar.
- **Kullanıcı Değeri**: **Yüksek (4/5)**. GM'in hazırlıksız karşılaşmaları dengesiz kılmasını önler; parti ölüm riskini kontrol altında tutar.
- **Yaklaşık Maliyet**: Orta (1.5 adam/gün).
- **Bağımlılıklar**: Statik SRD canavar veri kümesi, D&D 5e XP eşik formülleri.
- **Öncelik**: **P2 (Yüksek Değerli GM Aracı)**.

---

### Özellik 6: Etkileşimli Zar Atma Sistemi (Universal Dice Roller)
- **Kategori**: Masaüstü RYO Temeli
- **Açıklama**: d4, d6, d8, d10, d12, d20, d100 zarlarını tek tıkla veya formülle (ör. 2d6 + 3) atabilen, avantaj/dezavantaj seçimi sunan, kritik başarı (Nat 20) ve kritik başarısızlık (Nat 1) efektleri olan zar motoru ve geçmiş kaydı.
- **Kullanıcı Değeri**: **Yüksek (4/5)**. Oyuncuların ve GM'in harici bir fiziksel zar veya uygulama aramadan doğrudan ekran üzerinden zar atabilmesini sağlar.
- **Yaklaşık Maliyet**: Düşük-Orta (1 adam/gün).
- **Bağımlılıklar**: Matematiksel RNG motoru, UI popover veya yan panel bileşeni.
- **Öncelik**: **P2 (Yüksek İmmersiyon - M2/M5 Kapsamında)**.

---

### Özellik 7: Karakter Verisi JSON/PDF Dışa Aktarma (Export Character)
- **Kategori**: Veri Taşınabilirliği
- **Açıklama**: Oyuncuların karakterlerini tek tıkla standart D&D formatında JSON veya yazdırılabilir PDF olarak cihazlarına indirebilmesi.
- **Kullanıcı Değeri**: **Orta (3/5)**. Oturumlar arası yedekleme ve çevrim dışı masalarda kullanım kolaylığı sağlar.
- **Yaklaşık Maliyet**: Düşük (0.5 adam/gün).
- **Bağımlılıklar**: İstemci tarafı dosya üretimi (Blob/JSON).
- **Öncelik**: **P3 (İkincil İhtiyaç)**.

---

## 3. Önceliklendirme Matrisi (Prioritization Matrix)

Aşağıdaki matris, incelenen tüm özellikleri kullanıcı değeri, geliştirme maliyeti, bağımlılıkları ve öncelik skoruna göre sıralamaktadır:

| Özellik Adı | Hedef Kitle | Kullanıcı Değeri (1-5) | Geliştirme Maliyeti | Teknik Bağımlılıklar | Öncelik Skoru | Planlanan Aşama |
|---|---|:---:|---|---|:---:|:---:|
| **Savaş & İnisiyatif Takipçisi** | GM & Oyuncular | 5.0 | Orta (1.5 gün) | Realtime, `campaign_encounters` | **9.6 / 10** | R5 Modül 1 (M3) |
| **Karakter Kağıdı (Sheet View)** | Oyuncular | 5.0 | Orta (1.5 gün) | `characters`, `character_stats` | **9.5 / 10** | M2 Düzeltmesi |
| **Ganimet Sandığı & Envanter** | GM & Oyuncular | 4.8 | Düşük-Orta (1 gün) | `campaign_loot_chests`, slot_index | **9.2 / 10** | R5 Modül 3 (M3) |
| **Atmosfer & Sefer Günlüğü** | GM & Oyuncular | 4.5 | Düşük-Orta (1 gün) | `campaign_environments`, Realtime | **9.0 / 10** | R5 Modül 2 (M3) |
| **Zar Atma Paneli (Dice Roller)** | GM & Oyuncular | 4.2 | Düşük-Orta (1 gün) | UI Modal / RNG Engine | **8.5 / 10** | M2 / M5 |
| **Karşılaşma Dengesi & Canavar** | GM | 4.0 | Orta (1.5 gün) | SRD Canavar Kataloğu | **7.8 / 10** | Gelecek Sürüm |
| **Karakter JSON/PDF Dışa Aktarma** | Oyuncular | 3.0 | Düşük (0.5 gün) | Blob File Export | **6.5 / 10** | Gelecek Sürüm |

---

## 4. R5 Kapsamında Seçilen ve Tasarlanan 3+ Yeni GM Modülü

Audit ve araştırma sonuçlarına dayanarak, R5 gereksinimini eksiksiz karşılayacak **3 yeni GM kontrol modülü** (ve ek olarak atomik XP defteri) seçilmiş ve veritabanı düzeyinde inşa edilmiştir:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SEÇİLEN YENİ GM KONTROL MODÜLLERİ                    │
├────────────────────────────────┬───────────────────────────────────────┤
│ Modül 1: Combat & Turn Tracker │ Savaş ve inisiyatif takipçisi         │
│ Modül 2: Atmosphere & Chronicle│ Canlı hava, zaman, ortam sesi ve not  │
│ Modül 3: Loot & Dispenser      │ Sandık ve kalıcı envanter dağıtıcı    │
│ Modül 4: Persistent XP Ledger  │ Atomik XP defteri ve tecrübe yönetimi │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 1. GM Savaş ve İnisiyatif Takipçisi (`GMCombatTracker.tsx`)
- **Rol & Arayüz**: GM Dashboard altında `Combat` sekmesi.
- **Kabiliyetler**:
  - Karşılaşma oluşturma, adlandırma ve durum takibi (`preparing`, `active`, `completed`).
  - Partideki karakterleri ve özel canavarları tek tıkla savaşa ekleme.
  - İnisiyatif zarı belirleme, girişim sırasına göre dinamik dizilim.
  - Anlık HP değiştirme popover'ı (+/- hasar/iyileştirme), zırh sınıfı ve geçici can takibi.
  - Durum etkileri rozetleri (Conditions).
  - Tur ve Round atlatma; aktif dövüşçünün vurgulanması.
- **Veritabanı Tabloları**: `campaign_encounters`, `encounter_combatants`.
- **Erişim Kuralı**: SELECT oyunculara açık (gizli NPC'ler hariç), INSERT/UPDATE/DELETE yalnızca `public.is_gm()`.

### 2. GM Canlı Atmosfer ve Sefer Günlüğü (`GMAtmosphereManager.tsx`)
- **Rol & Arayüz**: GM Dashboard altında `Atmosphere & Chronicles` sekmesi.
- **Kabiliyetler**:
  - Hava durumu seçimi (*Sisli, Fırtına, Güneşli, Kan Yağmuru, Kül Yağışı*).
  - Günün saati (*Şafak, Öğle, Alacakaranlık, Geceyarısı, Tutulma*).
  - Tehlike seviyesi göstergesi.
  - Oturum günlükleri oluşturma (Oturum no, başlık, özet, oyun içi tarih).
  - Yayınlama anahtarı (`is_published`) ile oyunculara görünür kılma; gizli GM sırları (`gm_secrets`) alanı.
- **Veritabanı Tabloları**: `campaign_environments`, `session_chronicles`.
- **Erişim Kuralı**: SELECT oyunculara açık (yalnızca yayınlanan günlükler), INSERT/UPDATE/DELETE yalnızca `public.is_gm()`.

### 3. GM Ganimet Sandığı ve Envanter Dağıtıcı (`GMLootDispenser.tsx`)
- **Rol & Arayüz**: GM Dashboard altında `Loot Dispenser` sekmesi.
- **Kabiliyetler**:
  - Ganimet sandığı oluşturma, altın ve eşyalar ekleme.
  - Sandık içeriğini partiye veya doğrudan seçili karakterin boş envanter yuvalarına aktarma.
  - 24-slotlu sabit RPG envanterinde boş yuvaları otomatik tespit ederek kalıcı `inventory_items` kaydı oluşturma.
- **Veritabanı Tabloları**: `campaign_loot_chests`, `inventory_items`.
- **Erişim Kuralı**: SELECT oyunculara açık, INSERT/UPDATE/DELETE yalnızca `public.is_gm()`.

---

## 5. Sonuç

Araştırılan özellikler arasında en yüksek değere sahip olan Savaş Takipçisi, Canlı Atmosfer & Sefer Günlüğü ve Ganimet Sandığı modülleri; D&D 5e standartlarına uygun olarak R5 kapsamında kodlanmak üzere mimari olarak doğrulanmış ve veritabanı şemaları `supabase/migrations/03_new_gm_modules.sql` dosyası ile hazırlanmıştır.
