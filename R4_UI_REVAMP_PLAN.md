# R4: Kullanıcı Arayüzü Yenileme ve Tasarım Planı
## (UI Revamp Plan: Dark-Fantasy Aesthetic & Responsive Experience)

**Proje**: D&D Sefer Yönetim Web Uygulaması (React 19 + TypeScript + Vite + Tailwind CSS v4 + React Flow + Framer Motion + Supabase)  
**Tarih**: 2026-10-10  
**Durum**: Tamamlandı / Temel Referans Dokümanı  
**Yetkili Alt Ajan**: worker_m1_docs_db  
**Gözlem ve Araştırma Kaynakları**: `explorer_survey_perf_ui/handoff.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, `.agents/AGENTS.md`

---

## 1. Giriş ve Tasarım Felsefesi

Bu plan; D&D Sefer Yönetim Web Uygulaması'nın arayüzünü daha modern, akıcı, görsel hiyerarşisi net ve mobil cihazlarda kusursuz çalışan bir seviyeye yükseltmeyi hedefler. 

Tasarım revizyonunun en temel ilkesi: **Karanlık fantezi (dark-fantasy) RPG temasını ve mevcut sayfa/navigasyon omurgasını kesinlikle bozmadan korumaktır.** Hiçbir mevcut özellik kaybedilmeyecek, arka planlar aydınlatılmayacak, karanlık zindan ve kadim büyü atmosferi korunurken arayüzün okunabilirliği, etkileşim kalitesi ve mobil uyumu zirveye taşınacaktır.

---

## 2. Korunan Tasarım Unsurları ve Tasarım Belirteçleri (Design Tokens)

### 2.1 Renk Paleti (Color Tokens)
Uygulama `src/index.css` dosyasında Tailwind v4 `@theme` yapısıyla tanımlanan zengin karanlık paleti kullanmaya devam edecektir:

- **Derin Arka Planlar (Void & Abyss)**:
  - `--color-abyss`: `#0a0a0f` (Kök sayfa arka planı, zifiri karanlık)
  - `--color-void`: `#0f0f18` (Kart ve panel arka planları)
  - `--color-obsidian`: `#151520` (İç kaplar, modallar, giriş alanları)
  - `--color-shadow`: `#1a0a2e` (Mor-eflatun gölgeler ve mistik derinlik)
- **Kraliyet Altın Vurguları (Royal Gold)**:
  - `--color-gold`: `#ffd700` (Birincil butonlar, aktif düğümler, parıltılar)
  - `--color-gold-bright`: `#ffed4a` (Hover durumları, kritik vurgular)
  - `--color-gold-dim`: `#b8860b` (İkincil kenarlıklar, sönük simgeler)
- **Mistik Aksiyon Renkleri**:
  - `--color-crimson`: `#dc143c` (Can puanı, tehlike, silme aksiyonları)
  - `--color-arcane`: `#6366f1` (Büyü yuvaları, mana, mistik düğümler)
  - `--color-emerald`: `#10b981` (İyileştirme, başarı, onay bildirimleri)
  - `--color-parchment`: `#d4c5a9` (Gövde metinleri, antik parşömen hissi)

### 2.2 Tipografi (Typography)
- **Başlıklar ve Epik Vurgular**: `Cinzel` (serif, kadim Orta Çağ fantezi hissi). Sayfa başlıklarında, kart isimlerinde, büyü adlarında ve butonlarda kullanılır.
- **Sayısal Değerler, Formlar ve Gövde Metinleri**: `Inter` (sans-serif, yüksek okunabilirlik). Can puanı, zırh sınıfı, zar sonuçları ve uzun metinlerde kullanılır.

### 2.3 Cam Paneller (Glassmorphism)
- Mevcut `.glass` sınıfı (`background: rgba(255, 255, 255, 0.05)`, `backdrop-filter: blur(12px)`) korunacak; kenarlıklarına hafif altın kılcal çizgiler (`border: 1px solid rgba(255, 215, 0, 0.12)`) ve iç ışıma gölgeleri eklenerek "büyülü zırh plakası" estetiği pekiştirilecektir.

---

## 3. Tespit Edilen Kullanıcı Deneyimi Açıkları ve Çözüm Planı

### 3.1 Mobil Kenar Çubuğu Çekmecesi (Responsive Mobile Drawer Overlay)
- **Mevcut Sorun**: `Sidebar.tsx`, mobil cihazlarda (<768px) sabit 280px veya simge modunda 80px yer kaplamakta; 375px'lik bir mobil ekranda ana içeriğe neredeyse hiç yer bırakmamaktadır.
- **Çözüm Planı**:
  1. Masaüstünde (`md:block`, >=768px): Mevcut genişleyen (280px) veya simgeye küçülen (80px) kenar çubuğu davranışı korunur.
  2. Mobilde (`<768px`): Kenar çubuğu varsayılan olarak ekran dışına gizlenir (`-translate-x-full`).
  3. `Header` üzerindeki mobil hamburger butonuna tıklandığında, kenar çubuğu ekranın solundan pürüzsüzce kayarak açılan karartmalı bir **çekmece (drawer overlay)** haline gelir.
  4. Çekmece açıkken arka plandaki sayfa karartılır (`bg-black/70 backdrop-blur-sm`). Arka plana veya bir menü bağlantısına tıklandığında çekmece otomatik olarak kapanır.

### 3.2 Header Mobil Hamburger Butonu ve Düzeni
- **Mevcut Sorun**: `Header.tsx` içinde kenar çubuğunu açıp kapatacak mobil bir buton bulunmamaktadır.
- **Çözüm Planı**:
  1. `Header.tsx` sol başına yalnızca mobil ekranlarda görünen (`block md:hidden`) şık, altın çerçeveli bir hamburger butonu (`Menu` / `X` ikonu) eklenir.
  2. Aktif karakter seçici rozeti ve dil değiştirici buton mobilde taşma yapmayacak şekilde kompaktlaştırılır.

### 3.3 İçerik Dolgusu (Responsive Padding)
- **Mevcut Sorun**: `AppLayout` içindeki `<main className="p-6">` mobilde 48px yatay alan harcayarak dar ekranlarda içerik sıkışmasına yol açmaktadır.
- **Çözüm Planı**: Dolgu `p-3 sm:p-6` olarak güncellenir; böylece 375px ekranda ana içerik alanı 351px'e çıkarılarak ferahlatılır.

### 3.4 Ana Gösterge Paneli (Dashboard) Büyü Ağacı Kartı
- **Mevcut Sorun**: `DashboardPage.tsx` üzerindeki `NAV_CARDS` grid yapısında `/character`, `/stat-tree`, `/map`, `/inventory` bulunmakta ancak 3.150 büyüyü barındıran `/spells` bağlantısı bulunmamaktadır.
- **Çözüm Planı**: `NAV_CARDS` dizisine 5. kart olarak Büyü Ağacı (`Sparkles` ikonu, kehribar/altın gradyanı `from-amber-500/20 to-amber-700/5`, "Antik büyüleri ve dalları keşfedin" açıklaması) eklenir. Kart ızgarası mobilde tek sütun, tablette 2 sütun, masaüstünde responsive olarak düzenlenir.

### 3.5 Karakter Sayfası Görünüm Ayrımı (Sheet vs. Creation)
- **Mevcut Sorun**: `/character` sayfasına giren oyuncular bir karaktere sahip olsalar dahi sadece karakter yaratma sihirbazını görmektedir.
- **Çözüm Planı**: Aktif karakter varsa doğrudan tam donanımlı `CharacterSheet` (Can puanı, zırh sınıfı, yetenek skorları, kurtarma zarları, seviye atlama) görüntülenmeli; karakteri olmayanlar veya yeni karakter eklemek isteyenler için `CharacterCreation` bir sekme veya modal olarak sunulmalıdır.

### 3.6 Mikro-Etkileşimler ve Görsel Derinlik
- Donanım hızlandırmalı geçişler: Kartlarda ve butonlarda `hover:border-gold/50`, `active:scale-[0.98]`.
- Erişilebilirlik: Tüm buton ve form elemanlarına altın renkli odak halkaları (`focus-visible:ring-2 focus-visible:ring-gold/60`).
- Sayfa yükleme geçişlerinde pürüzsüz `opacity` geçişleri.

---

## 4. Ekran Genişliği ve Cihaz Test Matrisi

Uygulamanın görsel revizyonu aşağıdaki cihaz çözünürlüklerinde doğrulanacaktır:

| Hedef Cihaz | Genişlik | Beklenen Görünüm Davranışı |
|---|:---:|---|
| **Mobil (iPhone SE)** | **375px** | Sidebar gizli drawer modunda, Header hamburger menüsü aktif, p-3 dolgu, tek sütun kartlar, sıfır yatay taşma |
| **Mobil (iPhone 14 / Modern)** | **390px** | Tek sütun kartlar, kompakt karakter rozeti, pürüzsüz drawer kayması |
| **Tablet (iPad / Dikey)** | **768px** | İki sütun kartlar, daraltılmış 80px simge sidebar veya drawer geçişi |
| **Masaüstü (Laptop)** | **1280px** | 280px sabit sidebar, 3 veya 5 sütun dashboard kartları, tam ekran harita ve büyü ağacı |
| **Geniş Ekran (Desktop)** | **1920px** | Maksimum genişlik sınırlayıcısı (`max-w-7xl`), ortalanmış düzen |

---

## 5. Bağımsız UI İnceleme Rubriği (Independent UI Review Rubric)

M5 ve M6 aşamalarında gerçekleştirilecek bağımsız denetimde (Independent UI Review), masaüstü (1280px) ve mobil (375px) ekran görüntülerinin aşağıdaki 5 maddelik rubrik üzerinden incelenmesi zorunludur:

1. **(a) Tema Paleti ve Tipografi Korunumu (Theme Palette & Fonts Preserved)**:
   - Abyss, Void, Obsidian arka planları ve kraliyet altını aksanları korunmuş mu?
   - Başlıklarda Cinzel, gövdede Inter kullanılıyor mu? Aydınlık mod sızıntısı var mı?
2. **(b) Navigasyon Yapısının Korunumu (Navigation Structure Preserved)**:
   - Sidebar ve Header omurgası, rota bağlantıları yerinde mi?
3. **(c) Mevcut Özelliklerin Korunumu (No Existing Feature Lost)**:
   - Büyü Ağacı, Harita, Stat Ağacı, Envanter ve GM paneli işlevlerini eksiksiz koruyor mu?
4. **(d) Görsel Hiyerarşi ve Okunabilirlik (Visual Hierarchy & Readability Improved)**:
   - Kartlar, butonlar, sayaçlar ve form alanları belirginleşmiş, göz yormayan bir kontrast sağlanmış mı?
5. **(e) Mobil Genişlikte Sıfır Bozulma (No Layout Breakage at Mobile Width - 375px)**:
   - Kenar çubuğu içeriği ezmeden drawer olarak açılıyor mu?
   - 375px genişlikte yatay kaydırma çubuğu (horizontal overflow) çıkmadan tüm bileşenler düzgün render ediliyor mu?

---

---

## 6. Ekran Görüntüleri Arşivi ve Metodoloji Uyarısı (Screenshots & Mock Disclaimer)

Uygulamanın görsel revizyonu `scripts/capture-screenshots.mjs` otomasyon scripti ile hem baseline revizyonu (commit `23e1e9c`) hem de M5 revizyonu üzerinden masaüstü (1280x800) ve mobil (375x667) çözünürlüklerde çekilmiş ve `docs/screenshots/` altına kaydedilmiştir.

> **ÖNEMLİ METODOLOJİ UYARISI:**  
> `scripts/capture-screenshots.mjs` otomasyonu, Playwright tarayıcı oturumunda Supabase REST/Auth çağrılarını `route.fulfill` ile yakalayarak zengin görsel verilerle sayfaları render eder.  
> Bu yöntem **YALNIZCA GÖRSEL TASARIM VE RUBRİK İNCELEMESİ (VISUAL UI REVIEW)** içindir. Kesinlikle arka uç PostgreSQL RLS doğrulaması veya işlevsel test kanıtı olarak sunulamaz. Canlı ve gerçek işlevsellik `tests/e2e/` testleri ve gerçek JWT oturumları ile bağımsız olarak sınanmaktadır.

### Üretilen Önce/Sonra Ekran Görüntüsü Çiftleri
- **Masaüstü (1280x800)**:
  - `desktop_dashboard_before.png` vs `desktop_dashboard_after.png`
  - `desktop_spells_before.png` vs `desktop_spells_after.png`
  - `desktop_character_before.png` vs `desktop_character_after.png`
  - `desktop_inventory_before.png` vs `desktop_inventory_after.png`
  - `desktop_map_before.png` vs `desktop_map_after.png`
  - `desktop_gm_before.png` vs `desktop_gm_after.png`
- **Mobil (375x667)**:
  - `mobile_dashboard_before.png` vs `mobile_dashboard_after.png`
  - `mobile_spells_before.png` vs `mobile_spells_after.png`
  - `mobile_character_before.png` vs `mobile_character_after.png`
  - `mobile_inventory_before.png` vs `mobile_inventory_after.png`
  - `mobile_map_before.png` vs `mobile_map_after.png`
  - `mobile_gm_before.png` vs `mobile_gm_after.png`
  - `mobile_drawer_open_after.png` (M5 ile eklenen off-canvas çekmece)

---

## 7. Bağımsız UI İnceleme Rubriği Değerlendirmesi (Evaluation Matrix)

| Rubrik Maddesi | İncelenen Görünümler & Kanıtlar | Değerlendirme | Sonuç |
|---|---|---|:---:|
| **(a) Tema Paleti ve Tipografi Korunumu** | `#0a0a0f` (Abyss), `#0f0f18` (Void) arka planları, `#ffd700` altın kenarlıklar, `Cinzel` başlıklar ve `Inter` gövde metinleri tüm sayfalarda eksiksiz mevcuttur. Hiçbir aydınlık mod sızıntısı yoktur. | Tema renkleri ve antik karanlık fantezi atmosferi %100 sadakatle korunmuştur. | **PASS** |
| **(b) Navigasyon Yapısının Korunumu** | `Sidebar.tsx` ve `Header.tsx` omurgası, rota bağlantıları (`/`, `/spells`, `/character`, `/inventory`, `/map`, `/gm`) eksiksiz çalışmaktadır. | Sayfa mimarisi ve hiyerarşik dolaşım korunmuştur. | **PASS** |
| **(c) Mevcut Özelliklerin Korunumu** | 3.150 büyüyü kapsayan Büyü Ağacı tuvali, 24 slotlu RPG envanter ızgarası, savaş haritası sis motoru, karakter kağıdı ve GM paneli tüm kabiliyetlerini muhafaza etmiştir. Ek olarak Dashboard'a Büyü Ağacı kartı eklenmiştir. | Hiçbir mevcut özellik kaybedilmemiştir. | **PASS** |
| **(d) Görsel Hiyerarşi ve Okunabilirlik** | Cam panellerdeki (`.glass`) kılcal altın parıltılar, kart kontrastları ve donanım hızlandırmalı `hover` efektleri belirginleştirilmiştir. | Okunabilirlik ve görsel odak bariz şekilde iyileştirilmiştir. | **PASS** |
| **(e) Mobil Genişlikte Sıfır Bozulma (375px)** | Eski versiyonda ekranın %75'ini kaplayıp içeriği ezen sabit kenar çubuğu kaldırılmış; Header'a altın hamburger butonu ve sol taraftan açılan karartmalı off-canvas `drawer` entegre edilmiştir. 375px ekranda sıfır yatay taşma (overflow: 0) doğrulanmıştır. | Mobil görünüm kırılmaları tamamen giderilmiştir. | **PASS** |

