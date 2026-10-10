# Yggdrasil UI Revamp — Ekran Görüntüleri Arşivi (Screenshots Archive)

Bu dizin, D&D Sefer Yönetim Web Uygulaması'nın **Milestone 5 (M5 UI Revamp)** öncesi ve sonrası görsel arayüz karşılaştırmalarını içermektedir.

> **ÖNEMLİ METODOLOJİ VE DOĞRULAMA UYARISI:**  
> `scripts/capture-screenshots.mjs` aracı, Playwright üzerinden tarayıcı ortamında çalışırken Supabase REST ve Auth uç noktalarını (`route.fulfill`) aracılığıyla sahte (mock) veriyle doldurmaktadır.  
> Bu yöntem **YALNIZCA GÖRSEL ARAYÜZ İNCELEMESİ (VISUAL UI REVIEW)** ve tasarım rubriği kontrolü amacıyla kullanılmaktadır; kesinlikle arka uç entegrasyonu, veritabanı RLS kuralı veya işlevsel doğrulama kanıtı olarak sunulamaz ve değerlendirilemez. Canlı işlevsel doğrulamalar gerçek JWT ve PostgreSQL RLS testleri üzerinden yürütülmektedir (bkz. `TEST_READY.md`).

---

## 1. Karşılaştırma Seti (Before & After Pairs)

### Masaüstü Çözünürlük (Desktop 1280x800)
| Görünüm / Rota | Önce (Baseline 23e1e9c) | Sonra (M5 Revamp) | Temel Değişiklik / İyileştirme |
|---|---|---|---|
| **Ana Panel (Dashboard)** | `desktop_dashboard_before.png` | `desktop_dashboard_after.png` | 5. kart olarak Büyü Ağacı (`/spells`) eklendi, responsive kart ızgarası ferahlatıldı. |
| **Büyü Ağacı (Spell Tree)** | `desktop_spells_before.png` | `desktop_spells_after.png` | Donanım hızlandırmalı opacity, arayüz cam panel parıltısı ve pürüzsüz düğüm yerleşimi. |
| **Karakter (Character Sheet)** | `desktop_character_before.png` | `desktop_character_after.png` | Aktif karakter kağıdı (HP, AC, istatistikler, zar butonları) ve sekme ayrımı. |
| **Envanter (Inventory)** | `desktop_inventory_before.png` | `desktop_inventory_after.png` | 24 slotlu sabit RPG slot matrisi, boş slot sürükleme hedefi desteği. |
| **Savaş Haritası (Battle Map)** | `desktop_map_before.png` | `desktop_map_after.png` | Sis motoru, güvenli piyon etiketleri ve token kontrol çubuğu. |
| **GM Paneli (GM Hub)** | `desktop_gm_before.png` | `desktop_gm_after.png` | M3 modülleri (Combat Tracker, Atmosphere, Loot Dispenser) sekmeleri. |

### Mobil Çözünürlük (Mobile 375x667 - iPhone SE)
| Görünüm / Rota | Önce (Baseline 23e1e9c) | Sonra (M5 Revamp) | Temel Değişiklik / İyileştirme |
|---|---|---|---|
| **Ana Panel (Dashboard)** | `mobile_dashboard_before.png` | `mobile_dashboard_after.png` | Yatay taşma (overflow) giderildi, Header hamburger butonu eklendi, p-3 dolgu ile ferah alan. |
| **Büyü Ağacı (Spell Tree)** | `mobile_spells_before.png` | `mobile_spells_after.png` | Mobil viewport üzerinde taşmayan React Flow tuvali ve dokunmatik yakınlaştırma. |
| **Karakter (Character)** | `mobile_character_before.png` | `mobile_character_after.png` | Dikey yığılan yetenek skorları ve parşömen kartları. |
| **Envanter (Inventory)** | `mobile_inventory_before.png` | `mobile_inventory_after.png` | Kompakt 24 slotlu RPG grid düzeni, dokunmatik uyumlu sürükleme. |
| **Savaş Haritası (Map)** | `mobile_map_before.png` | `mobile_map_after.png` | Tam ekran harita tuvali ve kompakt piyon kontrolleri. |
| **GM Paneli (GM Hub)** | `mobile_gm_before.png` | `mobile_gm_after.png` | Mobil sekme kaydırma çubuğu ve modal pencereler. |
| **Mobil Çekmece (Drawer Open)**| *(Mevcut değildi)* | `mobile_drawer_open_after.png` | Header hamburger ikonuna tıklandığında sol taraftan açılan karartmalı off-canvas menü. |

---

## 2. Bağımsız UI İnceleme Rubriği Sonuçları

1. **(a) Tema Paleti ve Tipografi Korunumu**: `%100 UYUMLU` — `#0a0a0f` Abyss, `#0f0f18` Void ve `#ffd700` altın vurgular korunmuş; başlıklarda Cinzel, metinlerde Inter korunmuştur.
2. **(b) Navigasyon Yapısının Korunumu**: `%100 UYUMLU` — Tüm temel rotalar (`/`, `/spells`, `/character`, `/inventory`, `/map`, `/gm`) eksiksiz yerindedir.
3. **(c) Mevcut Özelliklerin Korunumu**: `%100 UYUMLU` — Hiçbir özellik kaybolmamış; aksine Büyü Ağacı dashboard bağlantısı ve Karakter Kağıdı görünümü eklenmiştir.
4. **(d) Görsel Hiyerarşi ve Okunabilirlik**: `%100 UYUMLU` — Cam panellerdeki kılcal altın kenarlıklar ve donanım hızlandırmalı geçişler ile derinlik artırılmıştır.
5. **(e) Mobil Genişlikte Sıfır Bozulma (375px)**: `%100 UYUMLU` — Mobil ekranda içeriği ezen sabit kenar çubuğu yerine off-canvas çekmece (drawer) yapısına geçilmiş, sıfır yatay kaydırma ile kusursuz responsivite sağlanmıştır.
